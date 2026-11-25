# Develop Plan：I-25 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T002。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01,G-08。
- Issue/PR：未创建；前置：PG-0 批准 Goal 和 Issue 图。

## 背景、范围与契约

- 背景：实现工作需要可复现的 Node.js 依赖安装基线。
- 包含：为 Spec 指定的 CSV、XLSX、中文分词、Mem0 OSS 和 Qdrant client 依赖选定兼容版本并更新 manifest/lockfile。
- 不包含：领域类型、外发授权、Qdrant 服务部署方式或业务实现。
- 输入：已批准的 Spec/Plan 与当前 Node.js 22.19 ESM 项目约束；输出：锁定的依赖图。
- 环境：干净安装验证；不启动真实 Qdrant、不调用模型/Embedding。
- 文件边界：`package.json`、`package-lock.json`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 为 `csv-parse`、`csv-stringify`、`exceljs`、`jieba-wasm`、`mem0ai`、`@qdrant/js-client-rest` 锁定兼容版本 | package manifest review |
| N-02 | 从干净依赖状态安装成功，lockfile 与 manifest 一致 | Node.js 22.19 clean install |
| N-03 | 检查依赖许可和 Node ESM 解析兼容性；不借此改动业务设计 | install/metadata inspection |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 清除本地依赖后按 lockfile 安装 | 安装成功且不产生 lockfile 漂移 |
| T-02 | 在 Node.js 22.19 ESM 下解析依赖入口 | 指定包可导入，无 CommonJS/exports 冲突 |

- 交付：`package.json`、`package-lock.json`、安装命令和结果。
- 验收 G-01/G-08 的运行依赖基础条件；不代表 Qdrant 数据持久化已验收。

## 记录

- 安装/审查/合并 SHA：pending。
- 依赖基线与 I-01 共享契约文件互斥，PG-0 后可并行处理。
