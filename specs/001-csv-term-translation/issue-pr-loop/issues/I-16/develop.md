# Develop Plan：I-16 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T024,T033。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-03,G-06,G-08。
- Issue/PR：未创建；前置：I-06、I-07、I-08、I-14 人工验收合并。

## 背景、范围与契约

- 背景：行级翻译必须严格串起检索、候选生成和核对，确保每次模型调用有命中依据。
- 包含：单记录 search → 完整术语匹配/分词 → 翻译 → 占位符规则 → 必要 LLM judge；将 search 来源关联到候选。
- 不包含：CSV 文件读写、批次调度、冲突组应用和用户入口注册。
- 输入：单条 CSV 记录、Search service、模型/judge 回调、授权结果；输出：候选、来源轨迹、审核/失败状态。
- 环境：mock memory/model/embedding；无真实 API。
- 文件边界：`src/term-translation/workflow.ts`、`tests/term-translation/workflow.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 翻译模型调用前必须成功 Search；judge 调用前也先 Search | ordered spy assertions |
| N-02 | Search 失败时不调用该步骤模型；不读取整本工作簿兜底 | fail-closed test |
| N-03 | 每个请求最多收到 5 条当前词条相关结果，候选带来源定位 | context/provenance tests |
| N-04 | 规则失败或语义不明写为失败/待审状态，不假报完成 | state transition tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | memory.search 拒绝或抛错 | translation/judge 均不被调用 |
| T-02 | search 成功后翻译/judge | 调用轨迹顺序可验证，来源附着候选 |
| T-03 | 当前条目未命中伪代码术语 | 无关备注不进入 prompt |

- 交付：单记录 workflow、调用顺序测试和可审计 trace。
- 验收 G-03/G-06/G-08 的行级子条件。

## 记录

- 验证/审查/合并 SHA：pending。
- 文件所有权：独占 `workflow.ts`；审核决定与批次 runner 使用各自独立模块。
