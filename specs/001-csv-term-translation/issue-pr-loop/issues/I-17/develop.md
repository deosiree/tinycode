# Develop Plan：I-17 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T025/Runner,T034/Runner；斜线后缀是拟拆分片段，不是正式任务编号。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-04,G-05。
- Issue/PR：未创建；前置：I-05、I-09、I-16 人工验收合并。

## 背景、范围与契约

- 背景：单记录 workflow 需被应用到整份 CSV，并在每个批次完成后可恢复。
- 包含：输入校验后调用 batch scheduler 处理行级 workflow；每批完成将固定输出 CSV 原子写盘；重跑时保护相同输入记录已批准结果。
- 不包含：scheduler 算法、逐行翻译逻辑、冲突审核应用或增量 XLSX 集成。
- 输入：CSV 路径、批次 scheduler、行级 workflow；输出：固定输出路径、逐行状态/错误和任务完成状态。
- 环境：临时目录、fixture、模型与 memory mock。
- 文件边界：`src/term-translation/translation-runner.ts`、`tests/term-translation/translation-runner.test.ts`；从 scheduler 验收中拆出的 runner 用例只归本 Issue。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 分批上限/并发行为委托 I-09；每批结束后才开始下一批并先落盘 | runner event trace |
| N-02 | 同输入路径、行序及词条/comment/source 未变时保留已批准译文 | rerun idempotency test |
| N-03 | 单候选或一批失败保留逐行原因并继续独立候选/后续批次 | injected failure tests |
| N-04 | 任有待审核、空译文或错误时整体明确未完成 | completion-state tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 超过 1000 行 | 每批不超限，完成批次已写入固定输出 |
| T-02 | 输入同一记录重跑 | 已批准结果不被重置，未完成项可重试 |
| T-03 | 输出写盘失败 | 输入保持不变，任务报告未完成 |

- 交付：CSV runner、恢复/错误测试、运行结果契约。
- 验收 G-04/G-05；入口注册由 I-20 完成。

## 记录

- 验证/审查/合并 SHA：pending。
- 文件边界：只改 `translation-runner.ts`；不得把逻辑加回 scheduler 或行级 `workflow.ts`。
