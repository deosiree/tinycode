# Develop Plan：I-09 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T025/Scheduler,T034/Scheduler；斜线后缀是拟拆分片段，不是正式任务编号。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-05。
- Issue/PR：未创建；前置：I-01 与 I-25 合并。

## 背景、范围与契约

- 背景：批量翻译需要固定批次上限、共享调用并发上限和上游 endpoint 限流。
- 包含：可注入候选处理器的通用调度器；批次最大 1000 条；翻译/judge 共用最多 10 路；同一 endpoint 同时最多一个请求。
- 不包含：CSV 读写、模型调用实现、批次输出恢复或 CLI/TUI 集成。
- 输入：候选集合、处理回调、endpoint key 回调；输出：有序结果与逐候选错误。
- 环境：确定性异步 mock，无网络。
- 文件边界：`src/term-translation/batching.ts`、`tests/term-translation/batching-scheduler.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 分批调度，任一批不超过 1000 条 | 1000/1001 boundary tests |
| N-02 | 所有模型工作共享全局最多 10 路；按 endpoint key 再限为 1 路 | 记录 mock 同时活动数 |
| N-03 | 单项失败记录并继续独立项，不丢失结果顺序 | failure isolation tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 输入 1001 条 | 两批处理，单批最大 1000 |
| T-02 | 多 endpoint 串并发任务 | 总并发不超 10，任一 endpoint 不超 1 |
| T-03 | 单个处理回调抛错 | 错误归属该项，后续独立项继续 |

- 交付：scheduler、并发/边界测试和调用接口说明。
- 验收 G-05 调度子条件；逐批写入由 I-17 实现。

## 记录

- 验证/审查/合并 SHA：pending。
- 下一节点：I-17；scheduler 不读取/写入文件。
