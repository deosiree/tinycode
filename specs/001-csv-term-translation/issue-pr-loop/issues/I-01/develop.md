# Develop Plan：I-01 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T003,T004。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01..G-09。
- GitHub Issue/PR：未创建；分支/工作树：用户批准后建立；前置：PG-0 Goal/设计获批。

## 背景、范围与契约

- 背景：各并行模块需共享稳定的领域类型和授权边界。
- 包含：定义共享类型；定义 Add 与 query Embedding 授权接口。
- 不包含：任何记忆/翻译业务流程、UI 或服务注册。
- 输入：Spec、Data Model、Research、Contracts；输出：共享类型和授权契约。
- 环境：Node.js 22.19+、ESM；依赖由 I-25 提供。此契约不决定 Qdrant 存储方式。
- 文件边界：`src/term-translation/types.ts`、`src/term-translation/consent.ts`；依赖由 I-25 提供，不改其它模块。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 类型覆盖数据实体；Add 授权与 query 授权可区分且由调用方注入 | 类型检查及契约单测 |
| N-02 | 与 Spec/Data Model/Contract 字段逐项对照；冻结接口版本供后续波次引用 | 主控逐项 diff 审查 |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 类型和授权契约 | 类型检查通过；两种外发授权不可混用 |

- 交付：共享类型、授权契约、验证命令与 commit SHA。
- 节点完成后核对 G-01..G-09 的契约边界；接口有偏差时先同步本图与下游计划。

## 记录

- 验证：待运行；人工审查：pending；合并 SHA：pending。
- 下一节点：I-02..I-12（I-01 与 I-25 均合并后分批并行）。
