# Develop Plan：I-21 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T009。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01,G-02,G-08。
- Issue/PR：未创建；前置：I-13、I-14、I-15 人工验收合并。

## 背景、范围与契约

- 背景：adapter 和各服务的单测不能证明来源版本、Mem0 与真实本机 Qdrant 的持久化行为共同成立。
- 包含：验证 Add/Search/软删除/恢复、进程重启持久化、项目隔离、导入中断和 fail-closed。
- 不包含：Agent tool/harness E2E、仓库全量 CI 门禁、真实模型评测或修改功能实现。
- 输入：I-13/I-14/I-15 服务；输出：可重复的跨服务记忆集成测试。
- 环境：使用隔离本机 Qdrant 测试数据。Windows 使用 Docker named volume（暂定名 `tinycode-csv-term-translation-qdrant`）；未实际运行的平台标 `not-run`。
- 文件边界：`tests/term-translation/memory.integration.test.ts`；修复实现需回到对应 owner Issue。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | Add 完整发布后可 Search，进程重启后仍能检索 | isolated Qdrant restart test |
| N-02 | 软删除后不命中；恢复指定旧版后命中且不调用 Embedding | lifecycle integration |
| N-03 | 不同 project key 的数据互不可见 | cross-project integration |
| N-04 | Qdrant 不可用或导入中断时不发布部分版本且 Search fail-closed | fault injection |
| N-05 | Windows 容器重建后 named volume 中数据仍可检索；配对备份/恢复同时还原 Qdrant volume 与来源清单 | Windows Docker evidence and restore walkthrough |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | Add 成功并重启服务 | Search 返回带来源定位的 active 版本 |
| T-02 | 两个 project key 分别 Search | 不出现跨项目记忆 |
| T-03 | 删除/恢复版本或 Add 中断 | active 过滤正确、恢复无 Embedding、失败不发布半版本 |
| T-04 | 重建 Qdrant 容器并恢复成对备份 | Windows named volume 数据持久；来源清单与向量版本指针对齐 |

- 交付：记忆集成 tests、隔离运行配置、Windows named volume 重启/配对备份恢复记录及平台验证矩阵。
- 验收 G-01/G-02/G-08；只对实际运行的平台报告验证结果，其余标 `not-run`。

## 记录

- 验证/审查/合并 SHA：pending；未验证平台标 `not-run`。
- 失败回流：定位 Add/Search/lifecycle owner Issue，修复后重跑相应模块测试和本集成套件。
