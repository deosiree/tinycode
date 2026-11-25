import { describe, expect, it, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { fauxAssistantMessage, fauxToolCall } from "@earendil-works/pi-ai";
import { bootstrapHarness, type Harness } from "../src/bootstrap.js";
import type { PermissionRequestView, PromptOutcome } from "../src/permissions/manager.js";

/**
 * End-to-end harness test — the heart of the suite.
 *
 * A fixture project contains a deliberately broken add() (returns a - b).
 * The scripted mock model drives the REAL agent loop through:
 *   bash (run failing test) → read → edit → bash (run passing test) → final
 *
 * This exercises Pi Agent Runtime + TinyCode tools + permissions + context +
 * session persistence as one integrated system.
 */

let workdir: string;

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "tc-e2e-"));
  // Copy the broken fixture into a scratch dir so tests never mutate the repo.
  fs.copyFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/broken-project/add.js"),
    path.join(workdir, "add.js"),
  );
  fs.writeFileSync(
    path.join(workdir, "add.test.js"),
    [
      "import assert from 'node:assert';",
      "import { add } from './add.js';",
      "assert.equal(add(1,2),3);",
      "console.log('all tests passed');",
    ].join("\n"),
  );
  process.env.TINYCODE_HOME = path.join(workdir, ".tinycode-home");
});

const harnesses: Harness[] = [];
afterAll(async () => {
  await Promise.all(harnesses.map((h) => h.shutdown()));
});

/**
 * 创建指定权限模式的 mock Harness，并登记到统一清理列表。
 * @param permissionMode 本次运行使用的权限模式
 * @returns 已启动且使用 mock 模型的 Harness
 */
async function createMockHarness(permissionMode: "ask" | "auto"): Promise<Harness> {
  const harness = await bootstrapHarness({
    projectRoot: workdir,
    config: { permissionMode },
    mock: true,
  });
  harnesses.push(harness);
  return harness;
}

/**
 * 从 Agent 对话中提取模型发出的工具调用和工具结果。
 * @param harness 当前运行中的 Harness
 * @returns 按对话顺序排列的工具调用与工具结果
 */
function getToolTrace(harness: Harness) {
  const messages = harness.runtime.agent.state.messages;
  const calls = messages.flatMap((message) =>
    message.role === "assistant" ? message.content.filter((part) => part.type === "toolCall") : [],
  );
  const results = messages.filter((message) => message.role === "toolResult");
  return { calls, results };
}

function script(): AssistantMessage[] {
  return [
    fauxAssistantMessage([fauxToolCall("bash", { command: "node add.test.js" })]),
    fauxAssistantMessage([fauxToolCall("read", { path: "add.js" })]),
    fauxAssistantMessage([
      fauxToolCall("edit", { path: "add.js", oldText: "return a - b;", newText: "return a + b;" }),
    ]),
    fauxAssistantMessage([fauxToolCall("bash", { command: "node add.test.js" })]),
    fauxAssistantMessage("Fixed! add() now returns a + b and all tests pass."),
  ];
}

describe("agent harness E2E (mock model → real tools)", () => {
  it("runs read → edit → bash → final and leaves the fixture fixed", async () => {
    const harness = await bootstrapHarness({
      projectRoot: workdir,
      config: { permissionMode: "auto" },
      mock: true,
      session: { mode: "new" },
    });
    harnesses.push(harness);
    harness.models.mockHandle!.setResponses(script());

    await harness.runtime.prompt("Fix the failing test in this project.");

    const messages = harness.runtime.agent.state.messages;
    const toolCalls = messages.flatMap((m) =>
      m.role === "assistant" ? m.content.filter((c) => c.type === "toolCall") : [],
    );
    expect(toolCalls.map((c) => c.name)).toEqual(["bash", "read", "edit", "bash"]);

    const results = messages.filter((m) => m.role === "toolResult");
    expect(results).toHaveLength(4);

    // First bash run failed (nonzero exit surfaced in content); second passed.
    const firstRun = results[0]!;
    expect(firstRun.isError).toBe(false);
    const firstOutput = firstRun.content.map((c) => ("text" in c ? c.text : "")).join("");
    expect(firstOutput).toContain("✗ exit 1");
    expect(firstOutput).toContain("AssertionError");

    const secondRun = results[3]!;
    expect(secondRun.isError).toBe(false);
    expect(secondRun.content.map((c) => ("text" in c ? c.text : "")).join("")).toContain("all tests passed");

    // Edit reported a real diff.
    const editResult = results[2]!;
    expect(JSON.stringify(editResult.details)).toContain('"additions":1');

    // Fixture is actually fixed on disk.
    expect(fs.readFileSync(path.join(workdir, "add.js"), "utf8")).toContain("return a + b;");
    expect(fs.readFileSync(path.join(workdir, "add.js"), "utf8")).not.toContain("a - b");

    // Session persisted the full transcript.
    expect(harness.session).toBeDefined();
    const sessionId = harness.session!.id!;
    const loaded = harness.session!.load(sessionId)!;
    expect(loaded.messages.length).toBe(messages.length);
  }, 60000);

  it("does not create a file when ASK has no permission prompt", async () => {
    const target = path.join(workdir, "denied-empty.txt");
    const harness = await createMockHarness("ask");
    expect(harness.permissions.mode).toBe("ask");
    expect(fs.existsSync(target)).toBe(false);
    harness.models.mockHandle!.setResponses([
      fauxAssistantMessage([fauxToolCall("write", { path: "denied-empty.txt", content: "" })]),
      fauxAssistantMessage("I could not write the file because permission was denied."),
    ]);

    await harness.runtime.prompt("Create an empty file named denied-empty.txt.");

    const trace = getToolTrace(harness);
    expect(trace.calls.map((call) => call.name)).toEqual(["write"]);
    expect(trace.results).toHaveLength(1);
    expect(trace.results[0]!.isError).toBe(true);
    expect(JSON.stringify(trace.results[0]!.content)).toMatch(/no permission prompt available/);
    expect(fs.existsSync(target)).toBe(false);
  }, 30000);

  it("creates and overwrites empty files after ASK approval", async () => {
    const newTarget = path.join(workdir, "approved-empty.txt");
    const existingTarget = path.join(workdir, "existing-approved-empty.txt");
    fs.writeFileSync(existingTarget, "old content", "utf8");
    const requestTargets = new Map([
      ["write approved-empty.txt", newTarget],
      ["write existing-approved-empty.txt", existingTarget],
    ]);
    const harness = await createMockHarness("ask");
    const requests: PermissionRequestView[] = [];
    const existedAtRequests: boolean[] = [];

    /**
     * 记录写入审批请求，并允许本次操作一次。
     * @param request 当前工具的权限申请内容
     * @returns 本次审批选择
     */
    async function approveOnce(request: PermissionRequestView): Promise<PromptOutcome> {
      requests.push(request);
      const target = requestTargets.get(request.title);
      existedAtRequests.push(target ? fs.existsSync(target) : false);
      return "once";
    }

    harness.permissions.setPrompt(approveOnce);
    expect(harness.permissions.mode).toBe("ask");
    expect(fs.existsSync(newTarget)).toBe(false);
    expect(fs.readFileSync(existingTarget, "utf8")).toBe("old content");
    harness.models.mockHandle!.setResponses([
      fauxAssistantMessage([fauxToolCall("write", { path: "approved-empty.txt", content: "" })]),
      fauxAssistantMessage([
        fauxToolCall("write", { path: "existing-approved-empty.txt", content: "" }),
      ]),
      fauxAssistantMessage("Both files now have empty content."),
    ]);

    await harness.runtime.prompt("Create approved-empty.txt and clear existing-approved-empty.txt.");

    const trace = getToolTrace(harness);
    expect(requests).toHaveLength(2);
    expect(requests.map((request) => request.title)).toEqual([
      "write approved-empty.txt",
      "write existing-approved-empty.txt",
    ]);
    expect(requests.every((request) => request.reason === "write modifies project files")).toBe(true);
    expect(existedAtRequests).toEqual([false, true]);
    expect(trace.calls.map((call) => call.name)).toEqual(["write", "write"]);
    expect(trace.results).toHaveLength(2);
    expect(trace.results.every((result) => !result.isError)).toBe(true);
    expect(trace.results[0]!.details).toMatchObject({ created: true, bytes: 0 });
    expect(trace.results[1]!.details).toMatchObject({ created: false, bytes: 0 });
    expect(fs.existsSync(newTarget)).toBe(true);
    expect(fs.readFileSync(newTarget, "utf8")).toBe("");
    expect(fs.existsSync(existingTarget)).toBe(true);
    expect(fs.readFileSync(existingTarget, "utf8")).toBe("");
  }, 30000);

  it("auto mode overwrites an existing file with empty content without prompting", async () => {
    const target = path.join(workdir, "existing-empty.txt");
    fs.writeFileSync(target, "old content", "utf8");
    const harness = await createMockHarness("auto");
    let promptCalls = 0;

    /**
     * 记录意外出现的权限对话框调用。
     * @param _request 当前工具的权限申请内容
     * @returns 拒绝结果，仅作为未被调用时的观察点
     */
    async function recordUnexpectedPrompt(_request: PermissionRequestView): Promise<PromptOutcome> {
      promptCalls += 1;
      return "deny";
    }

    harness.permissions.setPrompt(recordUnexpectedPrompt);
    expect(harness.permissions.mode).toBe("auto");
    harness.models.mockHandle!.setResponses([
      fauxAssistantMessage([fauxToolCall("write", { path: "existing-empty.txt", content: "" })]),
      fauxAssistantMessage("The file is now empty."),
    ]);

    await harness.runtime.prompt("Replace the contents of existing-empty.txt with an empty file.");

    const trace = getToolTrace(harness);
    expect(promptCalls).toBe(0);
    expect(trace.calls.map((call) => call.name)).toEqual(["write"]);
    expect(trace.results).toHaveLength(1);
    expect(trace.results[0]!.isError).toBe(false);
    expect(trace.results[0]!.details).toMatchObject({ created: false, bytes: 0 });
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target, "utf8")).toBe("");
  }, 30000);

  it("returns write tool failures to the model instead of reporting success", async () => {
    const target = path.join(workdir, "directory-target");
    fs.mkdirSync(target);
    const harness = await createMockHarness("auto");
    harness.models.mockHandle!.setResponses([
      fauxAssistantMessage([fauxToolCall("write", { path: "directory-target", content: "" })]),
      fauxAssistantMessage("The write failed because the target is a directory."),
    ]);

    await harness.runtime.prompt("Write an empty file at directory-target.");

    const trace = getToolTrace(harness);
    expect(trace.calls.map((call) => call.name)).toEqual(["write"]);
    expect(trace.results).toHaveLength(1);
    expect(trace.results[0]!.isError).toBe(true);
    expect(JSON.stringify(trace.results[0]!.content)).toContain("Failed to write");
    expect(fs.statSync(target).isDirectory()).toBe(true);
    expect(fs.readdirSync(target)).toEqual([]);
  }, 30000);

  it("resumes a saved session with full history in a fresh harness", async () => {
    const first = await bootstrapHarness({
      projectRoot: workdir,
      config: { permissionMode: "auto" },
      mock: true,
      session: { mode: "new" },
    });
    harnesses.push(first);
    first.models.mockHandle!.setResponses([
      fauxAssistantMessage([fauxToolCall("write", { path: "note.txt", content: "remember me" })]),
      fauxAssistantMessage("Stored a note."),
    ]);
    await first.runtime.prompt("store a note");
    const sessionId = first.session!.id!;
    const countAfterFirst = first.runtime.agent.state.messages.length;
    await first.shutdown();

    const second = await bootstrapHarness({
      projectRoot: workdir,
      config: { permissionMode: "auto" },
      mock: true,
      session: { mode: "attach", id: sessionId },
    });
    harnesses.push(second);
    second.models.mockHandle!.setResponses([fauxAssistantMessage("The note says: remember me")]);
    await second.runtime.prompt("what does the note say?");

    expect(second.runtime.agent.state.messages.length).toBeGreaterThan(countAfterFirst);
    const userTexts = second.runtime.agent.state.messages
      .filter((m) => "role" in m && m.role === "user")
      .map((m) => JSON.stringify("content" in m ? m.content : ""));
    expect(userTexts.some((text) => text.includes("what does the note say?"))).toBe(true);

    // The resumed transcript still contains the original write.
    expect(
      JSON.stringify(second.runtime.agent.state.messages),
    ).toContain("remember me");
  }, 60000);
});
