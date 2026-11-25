# Develop Plan：I-08 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T031,T032。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-03,G-06。
- Issue/PR：未创建；前置：I-01 与 I-25 合并。

## 背景、范围与契约

- 背景：部分候选需要当前 TinyCode 模型 judge；伪代码术语还需逐批抽查并在失败时升级人工审核。
- 包含：接受当前候选及其 search 命中结果调用 judge；伪代码候选全量检查后对通过者按规则抽样；抽样失败要求该批全量 HITL。
- 不包含：发起记忆 Search、翻译候选生成、冲突实体相似度和批准决定。
- 输入：候选、该候选来源与检索到的规则、模型调用回调；输出：judge 结论、抽查集合和待审升级状态。
- 环境：Vitest mock；禁止真实模型请求。
- 文件边界：`src/term-translation/llm-quality.ts`、`tests/term-translation/llm-quality.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | judge 只收到当前候选实际命中的参考规则和备注 | prompt-input spy |
| N-02 | 先收集全量脚本/judge 通过项，再按批随机抽查 5%，向上取整且至少 1 条 | 固定随机源边界测试 |
| N-03 | 抽查失败时将该批全部伪代码候选升级 HITL；失败项不自动批准 | batch-state tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 一批 1 个通过候选 | 抽查 1 项 |
| T-02 | 一批无通过候选 | 不执行抽查，保留失败状态 |
| T-03 | judge/抽查失败 | 记录原因并保持任务未完成 |

- 交付：judge/抽查模块、模型 mock 测试、调用输入证据。
- 验收 G-03/G-06 质量子条件；每次 judge 前置 Search 由 I-16 保证。

## 记录

- 验证/审查/合并 SHA：pending。
- 接口约束：消费 search 结果，不自行读取工作簿或完整记忆。
