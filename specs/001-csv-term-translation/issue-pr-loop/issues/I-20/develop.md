# Develop Plan：I-20 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T019,T035,T038,T039,T046。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01..G-09。
- Issue/PR：未创建；前置：I-13、I-15、I-17、I-18、I-19 人工验收合并。

## 背景、范围与契约

- 背景：完成的核心服务需要成为 TinyCode 可发现、可操作的功能，并为用户展示正确审核状态。
- 包含：实现翻译/审核 `csv_term_translation` Tool adapter；统一导出；在 bootstrap 注册翻译、Add、Manage 工具；建立项目 Skill 的使用说明。
- 不包含：底层 service 实现、模型/记忆算法、通用权限策略或 session 格式修改。
- 输入：已合并服务和工具 adapter；输出：TinyCode 用户可发现的能力入口。
- 环境：现有 AgentTool registry、TUI/headless harness；所有外部服务用 mock。
- 文件边界：`src/tools/csv-term-translation.ts`、`src/tools/index.ts`、`src/bootstrap.ts`、`.tinycode/skills/csv-term-translation/SKILL.md`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 用户可传 CSV 执行翻译并查看完成/待审/失败状态 | tool registration harness |
| N-02 | 用户可用稳定 group ID 提交审核决定；未获明确决定不得回写批准 | review tool test |
| N-03 | Add/Manage/Translate 操作注册并注入项目 key、数据目录和授权回调 | bootstrap test |
| N-04 | Skill 准确描述用户输入、状态和恢复流程，不要求重复提供内置参考文件路径 | Skill review |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | Agent 查找项目能力 | 工具名称、输入 schema 与操作说明可见 |
| T-02 | memory 服务或 Search 不可用 | 工具返回可定位失败，workflow 不绕过 Search |
| T-03 | 用户未提供审核决定 | 冲突候选保持待审 |

- 交付：tool adapter、注册、项目 Skill、harness 测试和接口示例。
- 验收 G-01..G-09 的产品入口子条件；E2E 全链路由 I-21 验收。

## 记录

- 验证/审查/合并 SHA：pending。
- 文件所有权：共享 `bootstrap.ts` 只由本 Issue 修改；前置 adapter owner 不得改注册文件。
