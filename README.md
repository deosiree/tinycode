<div align="center">

# TinyCode

[简体中文](./README.md) | [English](./README.en.md)

**一个精简但完整的编码 Agent Harness——用可读的方式理解编码 Agent 如何真正工作。**

[![CI](https://github.com/helsome/tinycode/actions/workflows/ci.yml/badge.svg)](https://github.com/helsome/tinycode/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.19-brightgreen)](./package.json)
[![Tests](https://img.shields.io/badge/tests-115%20passing-success)](./tests)

基于 [Pi](https://github.com/earendil-works/pi) 构建 · TypeScript · ESM · 约 6k 行代码，每一行都值得阅读。

</div>

---

大多数编码 Agent 都是完整产品：数十万行代码，闭源或结构庞杂，难以整体理解。TinyCode 则正好相反——这是一个**可以在一个下午读完的完整 Agent Harness**，包含生产级 Agent 所需的各个子系统：

```
模型 + Agent 循环 + 工具 + 权限 + 会话
+ 上下文工程 + Skills + MCP + 子代理 + TUI
```

它可以针对真实任务调用真实 LLM Provider；同时，它构建在 [Pi](https://github.com/earendil-works/pi) Runtime（`pi-agent-core`、`pi-ai`、`pi-tui`）之上，因此代码并非只搭了个样子。循环会流式运行，工具会实际执行，会话会持久化。

## 演示

```text
$ tinycode
┌──────────────────────────────────────────────────────────┐
│ TinyCode v1.0 — 基于 Pi 构建的精简编码 Agent             │
│                                                          │
│ ❯ 你                                                     │
│   为什么测试失败？                                         │
│                                                          │
│ ● bash npm test                                          │
│   ✗ exit 1 · 2.4s                                        │
│                                                          │
│ ● edit src/math.ts                                       │
│   ✓ +1 -1                                                │
│   - return a - b                                         │
│   + return a + b                                         │
│                                                          │
│ ● bash npm test                                          │
│   ✓ exit 0 · 1.9s                                        │
│                                                          │
│ 已修复：add() 原本做的是减法。测试通过。                  │
├──────────────────────────────────────────────────────────┤
│ ◐ 正在思考…                                               │
│ > _                                                      │
│ ● 就绪 · anthropic/claude-sonnet-4 tinycode · ctx ~12k   │
└──────────────────────────────────────────────────────────┘
```

## 横向比较

TinyCode 不以功能数量和生产级 Agent 产品竞争，而以**易于理解**见长。如果你一直想知道，从输入提示到执行 `rm -rf` 之间发生了什么，这张表就是为你准备的。

| 项目 | 语言 | 源码 | 定位 | 适合作为第一个 Agent 来阅读？ |
|---|---|---|---|---|
| **TinyCode** | TypeScript | MIT | 完整的学习型 Harness | ✅ 约 6k 行，README 与 ARCHITECTURE 提供引导阅读 |
| Claude Code | TypeScript* | ✗ 专有 | 生产级 Agent 产品 | ✗ |
| OpenAI Codex CLI | Rust | 开源 | 生产级 Agent CLI | ⚠️ 规模较大 |
| OpenCode | TS + Go | 开源 | 多进程 Agent IDE/CLI | ⚠️ 涉及多进程 |
| Gemini CLI | TypeScript | Apache-2.0 | 生产级 Agent CLI | ⚠️ 规模较大 |
| Aider | Python | Apache-2.0 | AI 结对编程（以 Git 为中心） | ⚠️ 架构方向不同 |
| pi coding-agent | TypeScript | 开源 | 基于 Pi 的全功能 Agent + SDK | ✅ 适合作为 TinyCode 之后的进阶阅读 |
| MiniCode | TypeScript | 开源 | 教育用途的轻量 Agent | ✅ 理念相近 |

<sub>* Claude Code 以压缩形式发布，其内部实现只能从行为推断。</sub>

**TinyCode 相比多数教程的独特之处：** 带真实审批对话框的权限控制、可恢复的 JSONL 会话、上下文压缩、渐进式披露 Skills、实时 MCP 集成、受监督的只读子代理——这些能力全部接入流式 TUI，并通过脚本化模型离线测试。

## 快速开始

```bash
git clone https://github.com/helsome/tinycode.git
cd tinycode && npm install && npm run build
```

```bash
npm run dev                                  # 启动全屏终端 Agent
ANTHROPIC_API_KEY=sk-… npm run dev           # 例如使用 Anthropic；密钥只从环境变量读取
TINYCODE_MODEL=mock npm run dev              # 离线运行：脚本化 mock 模型，零配置
tinycode -p "describe this project"         # 单次运行模式（默认只读）
tinycode -p "refactor x" --permission-mode auto   # 显式启用无人值守写入
```

> **还没有 API Key？** TinyCode 仍然可以启动：它会以 MOCK 模式运行，并在界面内显示设置面板和明确步骤（导出密钥 → 重启），无需预先配置。

> **非交互模式的安全性：** `-p` 以无交互方式运行，没有审批对话框。因此 ASK 级操作默认会被**拒绝**，除非显式传入 `--permission-mode auto`（或设置 `TINYCODE_PERMISSION_MODE=auto`）。只读命令仍可正常运行。

支持的 Provider 包括 Anthropic、OpenAI、Groq、DeepSeek、Mistral、OpenRouter、Google，以及 [Pi 支持的更多 Provider](https://github.com/earendil-works/pi)。

## 功能

- **7 个内置工具** — `read`（分段读取、带行号）、`write`、`edit`（精确匹配并展示 diff）、`bash`（超时、取消、输出截断）、`grep`、`find`、`ls`；另有 `load_skill` 和四个子代理工具，共用一个注册表。
- **流式 TUI** — 实时显示生成内容；工具调用显示为 `● bash npm test → ✓ exit 0 · 2.4s`；编辑会显示 `+12 -3` 形式的 diff。
- **权限控制** — 项目内读取默认放行；写入、安装和危险 shell 命令会显示审批对话框（*允许一次 / 始终允许此模式 / 拒绝*）。启发式分类器会区分 `npm test`、`rm -rf` 和 `curl … | sh`。
- **会话** — 每次交互启动都会创建活动会话（以追加方式写入 `~/.tinycode/sessions` 下的 JSONL）。可用 `--continue`（只恢复当前目录的最近会话）、`--session <id>` 或 `/resume` 恢复；随时可用 `/new` 开始新会话。
- **上下文工程** — 超长工具结果保留头尾并将完整输出存为 artifact；超过 token 预算后，较早轮次会压缩为 `<conversation-summary>`，最近消息保持原样。
- **项目记忆** — 仓库根目录下的 `TINY.md` 会加入系统提示词（同时兼容 `AGENTS.md`/`CLAUDE.md`）。
- **Skills** — Skill 文件位于 `.tinycode/skills/<name>/SKILL.md`；提示词只包含名称和描述，正文按需通过 `load_skill` 加载。
- **MCP** — 启动时连接 `.tinycode/config.json` 中配置的 stdio 服务器；其工具会并入同一个注册表。单个服务器故障不会导致应用退出。
- **子代理** — 最多 3 个只读 Worker，各自拥有独立上下文并可取消；提供 `spawn_agent` / `wait_agent` / `list_agents` / `close_agent`。
- **斜杠命令** — `/help /new /clear /resume /sessions /model /skills /mcp /agents /compact /status /exit`。

## 配置

`.tinycode/config.json`（所有键均可省略）：

```json
{
  "provider": "openrouter",
  "model": "anthropic/claude-haiku-4.5",
  "maxOutputTokens": 16384,
  "permissionMode": "ask",
  "context": { "compactAboveTokens": 80000, "keepRecentMessages": 12 },
  "mcpServers": {
    "example": { "command": "node", "args": ["server.js"] }
  }
}
```

环境变量：Provider API Key、`TINYCODE_MODEL=provider/model`（或 `mock`）、`TINYCODE_PERMISSION_MODE=ask|auto`、`TINYCODE_HOME`（测试使用的数据目录重定向）。

## 安全说明

TinyCode 的权限系统是**审批层 + 工作区路径守卫，不是操作系统沙箱**：

- 文件工具通过感知符号链接的路径规范化强制执行项目边界（对两端调用 `realpath`），因此 `link -> /etc/hosts` 不能被用于越界。
- Shell 命令会经过风险分类器和相同的审批流程，但不会被限制在工作区内；获批的 `bash` 调用可以执行当前用户 shell 有权执行的任何操作。
- 运行真正不可信的代码或任务，需要外部沙箱（容器、虚拟机）。
- **API Key 只从环境变量读取。** `.gitignore` 已排除 `.env*`、`*.key`、`*.pem` 和 `.tinycode/*.local.json`；如果 `.tinycode/config.json`（该文件设计为可提交）中出现疑似密钥的字段，启动时会显示醒目警告。

## 文档

| 文档 | 内容 |
|---|---|
| [ARCHITECTURE.zh-CN.md](./ARCHITECTURE.zh-CN.md) | 中文架构图：模块、数据流，以及 Pi 与 TinyCode 各自提供的能力 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 英文架构说明：模块、数据流，以及 Pi 与 TinyCode 的职责边界 |
| `src/agent/runtime.ts` | 建议从这里开始：Pi `Agent` 如何接入 TinyCode 策略（约 100 行） |
| `tests/harness.e2e.test.ts` | 将整个流程串起来的可执行场景 |

## 测试

完全离线，无需 API Key：

```bash
npm test            # 单元、集成、Harness E2E、TUI、CLI 冒烟测试
npm run typecheck   # 严格 TypeScript 类型检查
npm run lint        # ESLint
npm run build       # tsc → dist/
```

旗舰测试通过确定性的 mock 模型驱动真实 Agent Loop，依次执行 **bash → read → edit → bash → final**，修复一个刻意设置为错误的 fixture 项目，并断言其测试通过且会话文件完整。MCP 集成测试会启动真正的 stdio 服务器进程。CI 在 Node 22 和 Node 24 上运行同一组门禁。

## 参与贡献

欢迎提交 Issue 和 PR。新代码的标准与项目现有原则一致：模块小、边界明确，测试无需联网即可运行。如果一项功能需要 300 行以上才能解释清楚，它或许应该放在更底层的模块中。

## 致谢

- Earendil 开发的 [Pi](https://github.com/earendil-works/pi) —— Runtime 基础，也是现代编码 Agent 最值得参考的实现之一。
- [MiniCode](https://github.com/LiuMengxuan04/MiniCode) —— “通过构建 Harness 来学习”的灵感来源。

## 许可证

[MIT](./LICENSE)
