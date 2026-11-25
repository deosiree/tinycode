# Develop Plan：I-18 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T042/Review,T045；`T042/Review` 是拟拆分片段，非正式任务编号。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-06。
- Issue/PR：未创建；前置：I-05、I-11、I-16 人工验收合并。

## 背景、范围与契约

- 背景：冲突组需要明确的用户决定；过期或关联输入已变化时不能错误回写。
- 包含：校验 group ID、输入记录身份及 pending 状态；应用 same/different entity 决定及用户批准译文；只更新关联行和审核状态。
- 不包含：冲突识别/相似度、UI 交互、CSV codec 和 AgentTool/bootstrap 注册。
- 输入：持久化 CSV 路径、当前冲突组、用户决定/逐行译文；输出：更新的候选结果及仍待审事项。
- 环境：文件 fixture 与冲突组 mock；不调用模型/Embedding。
- 文件边界：`src/term-translation/review-decisions.ts`、`tests/term-translation/review-decisions.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 重新校验 group ID、源记录身份和待审状态 | stale-input tests |
| N-02 | same entity 使用已明确批准的统一译文；different entities 使用每行批准译文 | decision tests |
| N-03 | 拒绝、不完整或过期决定不改变输出；完整批准只更新关联行 | atomic write tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | group ID 过期或 CSV 输入变化 | 拒绝决定并保留待审状态 |
| T-02 | 用户批准同一实体 | 所有关联行更新为批准的译文与状态 |
| T-03 | 用户拒绝同一实体 | 提示不同候选并保持待审直至明确批准 |

- 交付：审核应用服务、过期状态测试、写回证据。
- 验收 G-06；冲突 group 由 I-11 生成，工具接入由 I-20 完成。

## 记录

- 验证/审查/合并 SHA：pending。
- 任务重排：从原 `workflow.ts` 中独立出审核决定模块，避免和 I-16 争用文件。
