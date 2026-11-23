[简体中文](./ARCHITECTURE.zh-CN.md) | [English](./ARCHITECTURE.md)

# TinyCode 架构

本文介绍 TinyCode 的模块、数据流，以及最重要的边界：**哪些能力由 Pi 提供，哪些由 TinyCode 自行实现**。

```
                 TinyCode TUI  (src/tui)
                       │
                       ▼
            TinyCode Runtime  (src/agent/runtime.ts)
         ┌─────────────┼──────────────┐
         ▼             ▼              ▼
      上下文          权限           会话
    (src/context) (src/permissions) (src/session)
         │
         ▼
    Pi Agent Core  (@earendil-works/pi-agent-core)
                     │
           ┌─────────┴──────────┐
           ▼                    ▼
        模型                 工具
   (pi-ai + src/model)  (src/tools 注册表)
                               │
               ┌───────────────┼────────────────┐
               ▼               ▼                ▼
           内置工具           MCP             子代理
         (7 个工具)      (src/mcp)        (src/agents)
```

## 1. Agent Runtime

**Pi 提供：** `Agent` 类——低层 Agent Loop 的有状态封装。它管理对话记录（`state.messages`）、执行工具、发出生命周期事件，并通过 `AbortController` 支持 `abort()`。

**TinyCode 提供：** `TinyCodeRuntime`（`src/agent/runtime.ts`，约 100 行），通过以下接入点将 `Agent` 与 Harness 策略连接起来：

| 接入点 | 注入的策略 |
|---|---|
| `streamFn` | 来自模型注册表的 `Models.streamSimple`（解析认证后的流式请求） |
| `beforeToolCall` | 权限闸门——可阻止工具调用，并向模型返回原因 |
| `afterToolCall` | 工具结果截断（上下文卫生） |
| `transformContext` | 每次请求前自动压缩超长上下文 |
| `subscribe` | 持久化每条已完成的消息 |

`bootstrap.ts` 将这些能力组装成 `Harness` 对象，供 TUI 和单次 CLI 模式共同使用。

## 2. Agent Loop

循环由 Pi 的 `agentLoop` 实现：流式生成一轮 assistant 响应 → 如果包含工具调用，则根据工具的 TypeBox Schema 验证参数 → 执行我们的钩子 → 执行工具（串行或并行）→ 将结果追加到对话 → 重复上述过程，直到没有工具调用或任务被中止。若停止原因是 `length`（Token 截断），待处理的工具调用会失败，不会执行被截断的参数。

TinyCode 为循环增加的是策略，而不是控制流：TinyCode 不会重新实现“何时停止”或“如何解析工具调用”。

## 3. 工具注册表

每个工具都是 Pi 的 `AgentTool`：`{ name, description, label, parameters (TypeBox), execute }`。

`execute(toolCallId, params, signal, onUpdate)` 返回 `{ content, details }`：

- `content` 作为文本返回给模型。
- `details` 是提供给 UI 的结构化数据（退出码、diff 统计、行数等）。

`ToolRegistry`（`src/tools/registry.ts`）是一个 name→tool 映射。内置工具先注册；MCP 工具和子代理工具在启动时加入同一命名空间，因此模型看到的是统一接口。

### 七个内置工具

| 工具 | 重要行为 |
|---|---|
| `read` | 带行号；支持 `offset`/`limit` 窗口读取、二进制检测，并对 ENOENT/EISDIR 提供易懂错误 |
| `write` | 自动创建父目录；基于原内容报告 `+a -d` |
| `edit` | 精确匹配替换；0 次匹配时报错；多次匹配时除非指定 `replaceAll` 否则报错；返回 unified diff |
| `bash` | 超时 + `AbortSignal` + SIGKILL 升级；保留头尾输出（上限 100 KB） |
| `grep` | 对文本文件运行 JS 正则；支持 `include` glob 过滤和结果上限；跳过 `node_modules`/`.git`/二进制文件 |
| `find` | glob（`**` 可跨目录）；按相对路径排序 |
| `ls` | 显示类型标记与大小；目录优先 |

所有接收路径的工具都会在 I/O 前通过 `resolveWorkspacePath`（`src/tools/paths.ts`）强制执行项目边界：先解析词法路径，再对两端调用 `fs.realpathSync` 进行规范化（目标已存在时使用目标；新建文件时使用最近的现存祖先；另一端为规范化后的项目根目录）。符号链接越界（例如 `link -> /etc/hosts`）、通过符号链接目录写入、断开的符号链接都会被拒绝，并返回适合模型理解的 `Path resolves outside project directory: …` 错误；普通相对路径仍可正常使用。

## 4. 工具执行流程

```
模型发出 toolCall(id, name, args)
  → Schema 验证（pi-ai validateToolArguments）
  → Agent.beforeToolCall → PermissionManager.check(name, args)
        allow → 继续
        ask   → 已记住的模式？mode=auto？→ 放行
                否则 → 调用提示回调（TUI 对话框 / headless 拒绝）
        deny  → 阻止；错误 toolResult 说明原因
  → tool.execute(...)          [可中止]
  → Agent.afterToolCall → ContextManager 截断超长内容，
        完整输出保存为 artifact 文件
  → ToolResultMessage 追加到对话（+ 会话文件 + UI 事件）
```

`execute` 内抛出的错误会转成 `isError` 工具结果，模型看到的是可读句子（例如“oldText not found … copy exactly”），而不是堆栈跟踪。按设计，非零 Bash 退出码本身**不算**错误：stdout/stderr 中包含模型需要的信息。

## 5. 权限系统

权限系统由 `src/permissions` 下的三层组成：

1. **`classifier.ts`** — 将 Shell 命令按 `&&`/`;`/`|` 拆分并逐段分类：`safe`（`git status`、`npm test`、`cat` 等）、`write`（`npm install`、`mkdir`、重定向等）、`destructive`（`rm -r`/`-f`、`git reset --hard`、`git clean`、`sudo`、管道传入 Shell 等）。未知命令按 `write` 处理。
2. **`rules.ts`** — 各工具的默认规则：项目内读取 → ALLOW；任何写入和项目外读取 → ASK；bash 由分类器处理；未知工具 → ASK。
3. **`manager.ts`** — Runtime 权限闸门。判断顺序如下：

```
硬 DENY 规则（灾难性 Shell：rm -rf /、mkfs、原始磁盘写入等）
  → 无条件拒绝；自动模式和对话框都不能覆盖
ALLOW 判定 → 执行
ASK 判定   → 已记住“始终允许”模式？
             → mode === "auto"？             允许
             → 有提示回调？                   由对话框决定
             → 否则                           安全地拒绝
```

不同界面的行为语义不同：TUI 显示对话框（*允许一次 / 始终允许此模式 / 拒绝*）；headless `-p` 没有对话框，因此默认拒绝 ASK 操作。自动执行必须显式选择 `--permission-mode auto`。SIGINT 与 Ctrl+C 快捷键共用同一中断处理逻辑，因此在启用 ISIG 的终端里行为一致。

## 6. 上下文工程

`ContextManager`（`src/context`）负责两项策略：

- **逐条结果截断**（`afterToolCall`）：超过 `maxToolResultChars` 的文本保留头尾，并添加 `[… N characters truncated …]` 标记；完整输出保存到 `<dataHome>/sessions/artifacts/`。
- **预算与压缩**：Token 数量估算约为字符数除以 4（确定性、离线）。对话超过 `compactAboveTokens` 后，`transformContext` 会把较早轮次替换为一个由 LLM 生成、包裹在 `<conversation-summary>` 标签中的摘要。截断点落在 user 消息边界上，避免 assistant 轮次丢失工具结果；最近的 `keepRecentMessages` 条消息始终原样保留。`/compact` 可手动运行同一流程。压缩会保护最近的用户任务、工具调用/结果/错误和编辑内容——这些正是最后保留的消息。

## 7. 会话

每次交互式启动从第一条消息起就拥有一个会话：普通 `tinycode` 对应 `{mode:"new"}`；`--continue` 会接续当前工作目录下最近的会话（不会误接其他项目的会话）；若不存在则新建会话并显示提示；`--session <id>` 精确接续指定 ID。`/new` 会轮换 ID 并清空当前对话——Pi 的 `Agent.reset()` 会保留 systemPrompt/model/tools/hooks，因此工具调用仍可继续。

每个会话在 `<dataHome>/sessions/<id>.jsonl` 中对应一个 JSONL 文件（ID 使用 UUIDv7）：

```jsonl
{"type":"session","id":"…","cwd":"…","createdAt":"…","model":"anthropic/claude-sonnet-4","title":"fix tests"}
{"type":"message","message":{ …user… }}
{"type":"message","message":{ …assistant… }}
{"type":"message","message":{ …toolResult… }}
```

写入采用同步追加；文件创建后不会被整体截断（首次真实 prompt 会通过重写尚无重要数据的 header 行补充标题）。`attach()` 严格只读：它会将对话恢复到运行中的 `Agent`，并继续追加到同一文件，因此恢复时即使崩溃也不会毁坏历史。加载时会跳过崩溃导致的末尾不完整行。测试通过 `TINYCODE_HOME` 重定向存储目录。

## 8. Skills

Skill 文件格式为 `.tinycode/skills/<name>/SKILL.md`（用户级目录 `~/.tinycode/skills` 也可放置）：

```markdown
---
name: code-review
description: Review code changes for correctness and maintainability.
---
# instructions…
```

采用渐进式披露：系统提示词只收到 `name: description` 行。当某个 Skill 与任务匹配时，模型会调用 `load_skill(name)`，完整内容再作为普通工具结果返回——只有在实际使用时才占用上下文 Token。

## 9. MCP

`mcpServers` 条目通过 `@modelcontextprotocol/sdk` 的 `StdioClientTransport` 启动 stdio 服务器。启动时并行连接所有服务器并设置初始化超时；失败的服务器会记录状态，不会导致应用崩溃。每个服务器的工具都会适配成普通 `AgentTool`（底层调用 `callTool`，JSON Schema 原样传递——pi-ai 也能验证普通 JSON Schema）。工具名冲突时命名为 `<server>_<tool>`。`/mcp` 显示状态、工具数量和错误；关闭时会正常关闭传输连接，避免子进程泄漏。

## 10. 多 Agent

`SubAgentManager` 创建**只读 Worker**：每个 Worker 都是独立的 Pi `Agent` 实例，有自己的对话记录、`AbortController` 和只读工具子集（`read`/`grep`/`find`/`ls`，可选安全 MCP 工具），并使用固定的 Worker 系统提示词。硬性规则避免形成 Agent 群：最多同时运行 3 个 Worker，Worker 本身不拥有子代理工具。根 Agent 通过 `spawn_agent` / `list_agents` / `wait_agent`（收集最终 assistant 消息作为结构化报告）/ `close_agent`（中止）协调 Worker。状态栏显示 `SUB-AGENTS n/3 RUNNING`。

## 11. TUI

TUI 由 pi-tui 组件构建，没有手工绘制 ANSI 界面：

```
TuiAltScreen（备用屏幕缓冲区、差分渲染）
└── VStack 布局根节点
    ├── ScrollView(transcriptContainer)   follow:"end"，主要区域
    └── VStack
        ├── LoaderHost        “◐ thinking…” / 正在运行的工具数
        ├── Editor            多行输入、历史、斜杠命令补全
        └── StatusBar         ● ready · model cwd · ctx ~Nk · 子代理 · 会话
```

应用订阅 `AgentEvent`，并将事件映射到组件：
`message_update` → 实时流式文本（在 `message_end` 时定稿为 Markdown）；
`tool_execution_start/end` → `● bash npm test` 与 `✓ exit 0 · 2.4s` 行及 diff 预览；
错误 → 红色信息行。权限请求会打开居中的覆盖层对话框（SelectList）。

快捷键：`Enter` 提交 · `Ctrl+C` 中止生成；空闲时按两次退出 · `Esc` 中止 · `Ctrl+D` 退出 · 方向键滚动/浏览历史。有一条实践经验：**组件状态变化后必须显式调用 `tui.requestRender()`**，否则仅靠输入事件触发重绘时，定时器更新不会显示出来。

## 12. 模型配置

`ModelRegistry` 包装 pi-ai 的 `builtinModels()`（包含所有支持的 Provider，认证从环境变量解析）。模型选择优先级：CLI `--model provider/id` > `TINYCODE_MODEL` > `.tinycode/config.json` > 第一个已配置认证信息的 Provider。`TINYCODE_MODEL=mock` 会注册 Pi 的脚本化 `fauxProvider`，因此整个 Agent Loop（包括测试与 `-p` 冒烟）都能在零联网条件下运行。缺少凭据时会给出可操作的说明，而不是崩溃。

---

## 能力来源汇总

| 能力 | 来源 |
|---|---|
| Agent Loop、工具分发、流式事件、中止 | Pi agent-core |
| Provider 目录、环境变量认证、请求流式传输、Schema 验证 | Pi ai |
| 终端渲染器、编辑器、滚动视图、覆盖层、选择列表 | Pi tui |
| 全部 7 个编码工具及其注册表 | TinyCode |
| 权限分类器、规则、闸门与对话框 | TinyCode |
| JSONL 会话、恢复、标题 | TinyCode |
| 截断、预算、压缩 | TinyCode |
| 系统提示词、TINY.md 记忆 | TinyCode |
| Skill 发现/加载、渐进式披露 | TinyCode |
| MCP 客户端生命周期与适配器 | TinyCode（基于官方 MCP SDK） |
| 子代理监督 | TinyCode |
| TUI 组合、斜杠命令、CLI、配置 | TinyCode |
