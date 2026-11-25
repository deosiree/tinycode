# Develop Plan：I-04 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T008,T013。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-02。
- Issue/PR：未创建；前置：I-01 与 I-25 合并。

## 背景、范围与契约

- 背景：Add 更新必须先完整写入新版本，再原子发布 active 指针；失败不能破坏旧状态。
- 包含：按项目保存来源 ID、内容指纹、保留版本、状态与 active-version 指针；原子文件替换。
- 不包含：Mem0 写入、Embedding 授权、Search 过滤以及用户可见的软删除/恢复决策流程。
- 输入：来源身份和版本变更；输出：可持久读回且一致的 manifest 状态。
- 环境：Node.js 文件系统、临时目录和故障注入。
- 文件边界：`src/term-translation/source-manifest.ts`、`tests/term-translation/source-manifest.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 同源同 hash 幂等；同源不同 hash 保留历史版本 | manifest 单测 |
| N-02 | 更新指针采用临时文件原子替换；中断时旧状态可读 | 故障注入 |
| N-03 | 提供原子更新 active 指针及来源状态的底层原语；不决定何时/恢复哪个版本 | 状态转换测试 |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | manifest 写入中断 | 旧版本状态完整，不发布半成品 |
| T-02 | 多版本 active 指针原子更新 | 任一来源最多一个 active 版本；业务策略由 I-15 覆盖 |

- 交付：manifest 模块、状态转换测试、持久化格式说明。
- 验收 G-02 的清单一致性子条件；用户可见生命周期行为由 I-15 验收。

## 记录

- 验证/审查/合并 SHA：pending。
- 下一节点：I-13、I-14、I-15；各自只消费本模块原子 API，不共改本文件。
