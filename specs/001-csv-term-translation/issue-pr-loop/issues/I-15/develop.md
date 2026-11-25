# Develop Plan：I-15 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T016,T018。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-02。
- Issue/PR：未创建；前置：I-04 人工验收合并。

## 背景、范围与契约

- 背景：用户需要撤销某来源并在新规则效果不佳时恢复旧版本。
- 包含：按 source 软删除全部可检索版本；恢复用户选定的保留版本；原子更新 manifest 状态和 active 指针；提供 manage 工具 adapter。
- 不包含：物理删除向量、重新 Embedding、Add、Search 算法和 bootstrap 注册。
- 输入：项目 key、source ID、目标保留版本；输出：状态变化和可追踪版本清单。
- 环境：临时 manifest 和 Qdrant fixture；断言 lifecycle 调用不请求 Embedding。
- 文件边界：`src/term-translation/memory-lifecycle.ts`、`src/tools/manage-reference-memory.ts`、`tests/term-translation/memory-lifecycle.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 软删除后来源所有版本均被 Search 排除，历史向量保留 | lifecycle + search integration |
| N-02 | 恢复指定版本后仅该版本 active，重启后状态一致 | restart persistence test |
| N-03 | 恢复不调用 Embedding；状态写入失败保留原可检索版本 | embedding spy + fault injection |
| N-04 | 管理工具暴露列出/删除/恢复行为和结果 | tool adapter tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 删除存在多历史版本的来源 | 所有版本从结果排除但本地保留 |
| T-02 | 从软删除恢复旧版本 | 仅旧版本 active，无 Embedding 请求 |
| T-03 | 清单切换失败 | 原状态与 Search 结果保持一致 |

- 交付：生命周期服务、manage tool adapter、集成测试。
- 验收 G-02；工具 bootstrap 注册由 I-20 完成。

## 记录

- 验证/审查/合并 SHA：pending。
- 任务重排：从共用 `memory.ts` 拆出独占 `memory-lifecycle.ts` 和生命周期测试文件。
