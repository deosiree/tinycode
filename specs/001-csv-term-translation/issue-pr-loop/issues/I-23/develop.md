# Develop Plan：I-23 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T054。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01..G-09。
- Issue/PR：未创建；前置：I-20 合并。

## 背景、范围与契约

- 背景：架构文档须反映新能力真实落点，避免维护者误以为改变通用 Agent runtime。
- 包含：描述 term-translation 模块、Mem0/Qdrant 本地边界、Add/Search/Lifecycle、tool/skill 注册路径、Search-before-model、HITL 和错误回流。
- 不包含：未验证运行时细节、修改实现代码或复制全部 PRD。
- 输入：合并后的源码、契约和实际验证证据；输出：准确架构说明。
- 环境：源码符号/路径核对；Markdown diff 审查。
- 文件边界：`ARCHITECTURE.md`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 图示实际入口和记忆 add/search/生命周期调用边界 | 对照源码注册点 |
| N-02 | 明确本机 Qdrant、项目隔离、telemetry 及外发授权边界；说明 Windows named volume 与 `dataHome()` 来源清单的配对备份，及其他平台的验证状态 | 对照 Research/Contracts/I-21 验证记录 |
| N-03 | 保持通用 runtime 既有架构描述正确 | 全文变更审查 |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 维护者按图定位翻译入口 | 文件路径和依赖关系与源码一致 |
| T-02 | 查阅服务不可用/外发处理 | 文档不声称存在未实现的回退或远程服务 |

- 交付：更新后的架构文档及源码对照说明。
- 验收 G-09；只记录实现和验证已证明的边界。

## 记录

- 文档审查/合并 SHA：pending。
- 独占路径：只改 `ARCHITECTURE.md`，可与 I-21/I-22 在隔离 worktree 并行。
