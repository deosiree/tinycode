# Develop Plan：I-10 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T010,T027,T036,T037。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01,G-03,G-08。
- Issue/PR：未创建；前置：I-01 与 I-25 合并。

## 背景、范围与契约

- 背景：Add 工作簿和 query 词项都会请求外发授权，但授权范围、时机和复用期限不同；TUI/CLI 交互也不同。
- 包含：TUI 与 headless CLI 分别为 Add 文档内容和当前任务 query/冲突词项提供授权回调；两类授权状态独立；拒绝或无 TTY 时 fail-closed。
- 不包含：Add/Search 业务流程、通用 `permissionMode` 修改、Embedding 网络调用。
- 输入：交互端、外发用途（Add 或 task query）、数据范围摘要和用户确认；输出：仅对当前用途有效的授权结果。
- 环境：TUI/CLI 交互 mock、TTY 可注入测试；无网络。
- 文件边界：`src/tui/external-data-consent.ts`、`src/cli/external-data-consent.ts`、`src/tui/app.ts`、`src/cli/index.ts`、`tests/term-translation/add-consent.test.ts`、`tests/term-translation/query-consent.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | TUI/CLI 为需要新建索引的 Add 内容取得一次明确授权；该授权在本次 Add 之外不可复用 | Add consent scope tests |
| N-02 | TUI 任务 query 授权一次；headless TTY 显示一次确认；拒绝/无 TTY 不外发 | query consent tests |
| N-03 | Add 授权不覆盖 query，query 授权不覆盖 Add；回调不可提升通用 permissionMode | scope isolation tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 新 Add 内容和新的翻译任务 | 分别取得 Add 授权/query 授权，拒绝一项不授权另一项 |
| T-02 | 任一已授权操作结束 | 授权不可跨 Add 或跨任务复用 |
| T-03 | 用户拒绝或 stdin 非 TTY | callback 拒绝，调用方保持未完成且不发送内容 |

- 交付：两端授权适配、注入点和隔离测试。
- 验收 G-01/G-03/G-08 的授权子条件；真实 Embedding 调用由 Add/Search 上层按用途回调门控。

## 记录

- 验证/审查/合并 SHA：pending。
- 文件边界：独占 TUI/CLI 授权文件；不编辑 `src/bootstrap.ts`。
