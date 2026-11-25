# TinyCode 通用 Agent 能力实战路线

## 目标

沿着 TinyCode 当前的实现学习如何构建可复用的 Agent Harness。学习重点是模型循环周围的通用能力：工具、上下文、权限、状态、扩展和评测。练习以能力和失败边界为验收对象，不把路线写成某个行业或业务流程的需求清单。

TinyCode 使用 Pi Agent Core 执行基础循环；TinyCode 自己把权限、工具结果处理、上下文压缩和会话持久化接入循环。阅读和练习时应先区分这两层，避免把依赖库的行为误认为本仓库实现。

## 学习约定

- 每次只选一个能力问题，先追踪调用链，再决定是否修改代码。
- 先找已有测试和失败边界；练习完成时为成功、拒绝、异常和取消等相关路径补充可重复的验收。
- 使用 Mock 模型、临时目录和本地 fixture 验证 Harness 行为。外部模型只用于后续比较，不作为基础练习的必要条件。
- 记录改动前后的行为、测试证据和仍未覆盖的边界。

## 路线

| 阶段 | 通用能力问题 | Zread 页面 | 建议源码与测试顺序 | 实战练习与验收 |
|---|---|---|---|---|
| 0. 建立地图 | 一个请求如何穿过 CLI、Harness、运行时并到达模型？Pi 与 TinyCode 各自负责什么？ | 概览：TinyCode 的目标、价值与核心能力；从 TUI 到 Agent Loop 的整体数据流；TinyCode 与 Pi Runtime 的职责边界 | `README.md` → `ARCHITECTURE.zh-CN.md` → `src/cli/index.ts` → `src/bootstrap.ts` → `src/agent/runtime.ts` | 画出一次用户请求的调用和事件路径；逐项标注自研模块与 Pi 提供的能力。先用现有 `tests/harness.e2e.test.ts` 跑通 Mock 主链路。 |
| 1. Agent 循环与可观测性 | 模型何时返回工具调用，工具结果如何回到下一轮，异常和中止如何结束？ | 使用确定性 Mock 模型调试 Agent 行为；流式模型响应、工具调用与循环生命周期；运行时钩子：权限、上下文、持久化与中止 | `src/agent/runtime.ts` → Pi 的 `Agent` / `AgentEvent` 接口 → `tests/harness.e2e.test.ts` | 给一个确定性 Mock 场景记录消息与工具事件顺序；覆盖工具失败后继续回答及运行中止，确认最终消息、工具结果和会话记录一致。 |
| 2. 工具契约与组合 | 怎样让不同来源的能力都以同一契约交给模型？ | 统一工具注册表与扩展点设计；七个内置编码工具的能力与返回结构；MCP stdio 服务器连接、工具适配与故障隔离 | `src/tools/registry.ts` → `src/tools/index.ts` → `src/mcp/adapter.ts` → `src/agents/tools.ts` | 为一个通用、只读的 fixture 能力定义 schema、执行器、错误返回和结构化 details；从统一注册表调用它，并检查冲突名称不会静默覆盖。 |
| 3. 环境与风险边界 | Agent 对文件和命令能做什么，路径边界和审批如何落实？ | 路径规范化、符号链接防护与工作区边界；Shell 风险分类、审批流程与硬拒绝规则；工具错误处理、超时取消与输出截断策略 | `src/tools/paths.ts` → `src/tools/bash.ts` → `src/permissions/classifier.ts` → `src/permissions/rules.ts` → `src/permissions/manager.ts` | 为路径穿越、符号链接、未知命令、写入、破坏性命令设计表驱动用例；确认硬拒绝不能被记忆规则或 auto 模式绕过，headless 缺少审批回调时会拒绝 ASK 操作。 |
| 4. 上下文预算与信息保真 | 上下文变长后，如何控制成本并保留后续决策需要的信息？ | 工具结果截断、Artifact 保存与上下文卫生；Token 预算估算与自动上下文压缩 | `src/context/tool-results.ts` → `src/context/compact.ts` → `src/context/manager.ts` → `tests/context.test.ts` | 用可重复的大型工具输出触发截断与 artifact 保存，再触发自动和手动压缩；验证最近轮次、错误信息和关键标识保留，且不可压缩时不丢消息。 |
| 5. 会话与恢复 | 进程退出、损坏尾行或用户切换会话时，状态如何恢复？ | JSONL 会话格式、追加写入与崩溃恢复；会话接续、标题生成与 Agent 对话重建 | `src/session/types.ts` → `src/session/storage.ts` → `src/session/manager.ts` → `src/cli/sessions.ts` | 在临时数据目录模拟新建、追加、恢复、切换项目及末尾不完整 JSONL；验证恢复只读加载原会话并继续追加，不串入其他工作目录的数据。 |
| 6. Skills 与 MCP 扩展 | 如何按需加载指令、接入外部工具并隔离故障？ | Skills 的发现、渐进式披露与按需加载；MCP stdio 服务器连接、工具适配与故障隔离 | `src/skills/loader.ts` → `src/skills/registry.ts` → `src/mcp/client.ts` → `src/mcp/manager.ts` → `src/mcp/adapter.ts` | 让一个本地 fixture Skill 按需加载；启动两个 mock MCP 服务，其中一个启动失败，验证另一个仍能注册和调用工具，关闭 Harness 后无遗留子进程。 |
| 7. 子代理监督 | 如何把任务拆给独立 Worker，同时限制权限、并发和生命周期？ | 只读子代理的并发管理、独立上下文与取消 | `src/agents/types.ts` → `src/agents/worker.ts` → `src/agents/manager.ts` → `src/agents/tools.ts` → `tests/subagents.test.ts` | 用确定性 Mock Worker 覆盖完成、失败、取消、重名和并发上限；验证 Worker 只拿到只读工具，不能递归创建 Worker，父 Agent 能收集结构化结果。 |
| 8. 通用能力评测 | 如何判断能力改动真的提升可靠性，而非只通过单个演示？ | 从单元测试到 Harness E2E 的测试分层与夹具设计；使用确定性 Mock 模型调试 Agent 行为 | `tests/harness.e2e.test.ts` → `tests/permissions.test.ts` → `tests/context.test.ts` → `tests/mcp.test.ts` → `tests/subagents.test.ts` | 建立小型离线场景集，分别断言任务结果、工具选择、权限决策、失败恢复和资源清理；每个场景固定输入、Mock 响应与预期 trace，并报告未测边界。 |

## 推荐的第一轮实战

第一轮只完成阶段 0 和阶段 1，不先新增产品功能：

1. 从 `src/cli/index.ts` 追到 `bootstrapHarness` 和 `TinyCodeRuntime.prompt()`。
2. 跟读 `tests/harness.e2e.test.ts` 中 Mock 响应如何驱动真实工具调用。
3. 用纸面时序图写清 user message、assistant tool call、tool result、assistant final 各自何时产生和持久化。
4. 选择一个尚未覆盖的通用循环边界，先写离线验收，再做最小实现。
5. 记录修改影响的接口、失败行为和未覆盖场景。

## 练习范围判断

适合作为这条路线的练习：Agent 循环行为、工具 schema 和执行契约、权限裁决、上下文预算、会话恢复、扩展隔离、Worker 生命周期以及离线评测。

暂不作为主线练习：特定行业数据模型、业务审批流程、专用知识库、某一种业务文件格式的端到端自动化。它们可作为以后验证通用 Harness 的 fixture，但不应决定基础架构的能力边界。

## 完成标准

- 能从入口说明一次请求的实际调用链，并指出 Pi 与 TinyCode 的责任边界。
- 能为新增能力指出稳定契约、失败语义、权限边界和生命周期。
- 核心能力可由本地 Mock 场景重复验收，无需访问外部模型或服务。
- 改动有对应的自动化证据，并明确说明没有验证的部分。
