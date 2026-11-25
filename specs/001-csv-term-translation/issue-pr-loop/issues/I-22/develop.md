# Develop Plan：I-22 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T053。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01..G-09。
- Issue/PR：未创建；前置：I-20 合并。

## 背景、范围与契约

- 背景：用户需按文档安装本机依赖、配置授权、运行翻译并理解可恢复状态。
- 包含：更新 `quickstart.md` 和 `README.md`，描述实际验证过的 Node/Qdrant 版本、Windows/macOS/Linux 运行方式、loopback/持久化、密钥配置、TUI/CLI 授权、Add/Search、状态与重跑。Windows 使用 named volume；说明 Qdrant volume 与 `dataHome()` 来源清单的配对备份/恢复，且只写入已实测平台的可复制命令。
- 不包含：宣称未实测平台可用、暴露秘密、真实用户 CSV 评测。
- 输入：I-20 的实际接口、I-21 持久化证据和各运行环境验证记录；输出：可复现用户指南。
- 环境：在各承诺平台执行文档命令或明确标注未验证。
- 文件边界：`specs/001-csv-term-translation/quickstart.md`、`README.md`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 文档只写已验证命令和版本；Windows named volume 与 `dataHome()` 来源清单的位置及生命周期说明准确 | 命令逐项核对 |
| N-02 | 说明 Add 外发授权与 query 授权差异、fail-closed 行为 | 对照 Contracts |
| N-03 | 说明输出路径、错误/审核状态和重跑恢复方式；备份/恢复同时覆盖向量 volume 与来源清单 | 流程人工 walkthrough |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 新环境照文档启动服务 | 已验证平台的命令可复现 |
| T-02 | Qdrant/embedding 失败 | 文档描述与实际错误/停止行为一致 |
| T-03 | 恢复备份后启动 Qdrant 与 TinyCode | active-version 指针与向量数据一致；只恢复一侧的风险已说明 |

- 交付：Quickstart、README diff、Windows named volume 配对备份/恢复说明和平台验证矩阵。
- 验收 G-09；未验证平台、命令或版本明确标注 `not-run`，不把目标平台写成已支持平台。

## 记录

- 文档审查/合并 SHA：pending。
- 外部评测预算说明须服从 Q-02；不在文档暗示用户 CSV 可作评测集。
