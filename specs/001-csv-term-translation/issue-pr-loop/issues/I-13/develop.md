# Develop Plan：I-13 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T014,T017；Add 授权契约和适配由 I-10 提供。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01,G-08。
- Issue/PR：未创建；前置：I-02、I-03、I-04、I-10 全部人工验收合并。

## 背景、范围与契约

- 背景：用户明确提交的参考工作簿必须进入 add 流程，完整持久化后才能成为有效来源版本。
- 包含：解析输入、source/hash 幂等、Add 外发授权、Mem0 原文 add、全部 chunk 成功后切 active version；提供 `add_reference_material` adapter。
- 不包含：search、软删除/恢复、翻译 CSV 入记忆、bootstrap 注册。
- 输入：用户明确提交的受支持 XLSX、项目 key、用户数据目录、Add 授权回调；输出：source/hash/version 和导入状态。
- 环境：隔离 loopback Qdrant；Embedding 为 mock；拒绝授权不向服务发送参考内容。
- 文件边界：`src/term-translation/memory-add.ts`、`src/tools/add-reference-material.ts`、`tests/term-translation/memory-add.test.ts`；不改 `memory.ts`、`bootstrap.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 同 source/hash 先本地跳过，不触发授权或 Embedding | idempotence test |
| N-02 | 新内容发送前单次授权；拒绝/无 TTY 不发送且不报告成功 | authorization spy |
| N-03 | 新版本所有 chunk 完整写入后再原子切 active；中途失败保留旧版 | fault injection + Qdrant fixture |
| N-04 | AgentTool 返回可追踪 source/hash/version/import state | adapter test |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 重复 Add 同一文件 | 不重复写入、不再次授权 |
| T-02 | 新版本某 chunk 写入失败 | 旧 active 仍有效，新版本不可检索 |
| T-03 | Add 拒绝外发 | 未将工作簿内容送至 Mem0/Embedding |

- 交付：Add 服务、工具 adapter、集成测试和来源版本轨迹。
- 验收 G-01/G-08 Add 子条件；工具注册由 I-20 完成。

## 记录

- 验证/审查/合并 SHA：pending。
- 独占路径：新增文件；source manifest 与 adapter 由已合并依赖提供。
