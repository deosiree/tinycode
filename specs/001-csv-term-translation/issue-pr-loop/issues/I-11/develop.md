# Develop Plan：I-11 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T041,T042/Conflict,T043,T044；`T042/Conflict` 是拟拆分片段，非正式任务编号。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-06。
- Issue/PR：未创建；前置：I-01 与 I-25 合并。

## 背景、范围与契约

- 背景：相同英文译法可能隐藏实体或语境冲突，需把不确定性变成可审阅事项。
- 包含：去重中文词项 embedding/余弦相似度建议、0.7 阈值、相同词项异 comment 冲突检测、稳定 group ID 和相关记录聚合。
- 不包含：应用用户决定、批准译文写回和冲突自动消解。
- 输入：候选及记录身份、query 授权回调和 embedding 回调；输出：冲突组与相似度证据。
- 环境：Embedding mock，无真实 API；相似度及分组使用固定样例。
- 文件边界：`src/term-translation/conflicts.ts`、`tests/term-translation/conflicts.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 不同中文词项才做语义近似提示；同词不同 comment 进入语境冲突 | rule tests |
| N-02 | 相似度 `>= 0.7` 提示可能近义；相似度不自动决定实体 | 0.699/0.7 tests |
| N-03 | group 只聚合相关记录，ID 对同一候选集合稳定 | grouping tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 相似度 0.699 / 0.700 | 建议分别采用不同译法 / 可能近义并人工判断 |
| T-02 | embedding 失败 | 保留待审，不自动批准或静默忽略 |
| T-03 | 两个无关冲突 | 产生独立 group ID 和审核事项 |

- 交付：冲突发现/分组模块、mock 测试及审核数据结构。
- 验收 G-06 冲突识别子条件；审核决定由 I-18 应用。

## 记录

- 验证/审查/合并 SHA：pending。
- 后续 owner：I-18 消费冲突组，不改本 Issue 的分组算法文件。
