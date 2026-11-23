# Implementation Plan: CSV 词条英文翻译与消歧

**Branch**: `feature/csv-term-translation` | **Date**: 2026-11-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-csv-term-translation/spec.md`

## Summary

在 TinyCode 中提供项目级词条翻译 skill，通过小型 TypeScript 适配模块完成 CSV/XLSX 读写、jieba 分词、参考资料导入、任务编排和结果落盘；通用记忆 add/search 由 Mem0 OSS TypeScript SDK 提供，底层连接仅监听 loopback 的本机 Qdrant 服务，服务数据目录持久保存在 TinyCode 用户数据目录。项目工作簿首次导入本地记忆；用户作为参考资料提交的支持格式工作簿进入 add 阶段，按来源和内容指纹幂等更新。每条翻译及 LLM judge 请求前都从本地记忆 search，最多注入 5 条相关片段。翻译调用当前 TinyCode 配置的模型，每批最多 1000 条词条，翻译与 LLM judge 的模型调用合计并发上限为 10；每批完成后写入固定 CSV 副本。中文词项的近义词提示使用 OpenAI Embeddings API 的 `text-embedding-3-small`，相似度达到 0.7（含）时进入 HITL。参考工作簿只读，高频未知词生成独立增量工作簿。

翻译模型可自动接收词条、comment、词条来源及匹配到的术语说明，不逐次确认；不发送无关 CSV 行或无关工作簿内容。TUI 启动翻译任务时自动授权本任务所需的记忆 search query（当前词项及必要 comment/场景）和冲突相似度去重词项 Embedding 请求；headless 在交互式 TTY 中通过 CLI 确认回调取得一次授权，无交互 TTY 时拒绝外发并报告未完成。授权行为独立于通用工具 `permissionMode=auto` 和记忆 add 授权，不按 API 请求重复打断用户。翻译冲突按冲突组呈现为单个 HITL 审核事项，汇总所有相关记录和拟议变更。Embedding 请求使用环境变量 `OPENAI_API_KEY`，不在仓库中保存凭据。

参考来源支持按来源软删除和恢复到指定保留版本；历史向量留在本地，search 只命中未软删除来源的 active version。

标记为“伪代码术语”的参考项不进入 jieba 自定义词典；翻译调用及对应的 LLM judge 仅收到当前候选实际命中的参考条目和相关属性、备注，不把整份词典或无关条目作为通用约束。所有相关候选依次接受全量脚本检查和全量 LLM judge 检查；未通过者保留失败草稿及原因、不进入抽样，但系统继续处理同批独立候选和后续批次，最终任务保持未完成。每批通过前两层的候选随机抽查 5%（向上取整且至少 1 条）；抽查发现违反参考备注的候选时，该批所有伪代码术语候选升级为 HITL 全批复核。

## Technical Context

**Language/Version**: TypeScript 5.8、ESM、Node.js 22.19 或更高版本。

**Primary Dependencies**: 复用 `@earendil-works/pi-agent-core` 和 `@earendil-works/pi-ai`；新增 `csv-parse`、`csv-stringify`、`exceljs`、`jieba-wasm`、`mem0ai` 和其 Qdrant provider 所需的 `@qdrant/js-client-rest`。本机 Qdrant 服务是运行时前置条件；Mem0 TypeScript SDK 通过 REST 连接 loopback endpoint。记忆 Embedding 由 Mem0 OSS 配置的 provider 处理；冲突相似度仍使用 Node 22 内置 `fetch` 调用 OpenAI Embeddings API。

**Storage**: 本地 UTF-8 CSV、仓库版本化 XLSX、翻译输出 CSV（含逐行审核状态和错误说明）、增量 XLSX，以及位于 TinyCode 用户数据目录的 Qdrant 服务持久数据和按项目隔离的来源版本清单。各项目使用独立 collection 和稳定 `userId`；记忆数据不进入项目版本控制，各机器从随项目版本化工作簿初始化相同基线，用户提交的额外参考资料保持本机私有。

**Testing**: Vitest；翻译模型和 Embedding 请求使用 mock，文件和工作簿使用确定性 fixture；记忆集成测试在 loopback 启动隔离的 Qdrant 服务并使用临时持久目录，不访问外网。覆盖 Mem0 add/search 适配、来源指纹幂等导入、active-version 切换、软删除后检索排除、恢复/回滚旧版本、进程重启后检索、跨项目隔离、Mem0/Qdrant telemetry 关闭、外发授权及失败门禁，并覆盖每批 1000 条边界、翻译与 judge 模型调用合计并发上限 10、批次落盘、冲突组审核聚合，以及伪代码术语候选的全量脚本检查、全量 LLM judge、按批随机抽查和抽查失败后的全批复核。

所有英文译文还需执行占位符脚本检查：花括号占位符保持原文、数量和原序；编号百分号占位符保持标识、格式和数量但允许重排。校验失败记录原因并阻止任务完成。

**Target Platform**: 支持 Node.js 22.19+ 的 Windows、macOS 和 Linux。

**Project Type**: TinyCode 项目级 skill 加 TypeScript AgentTool/文件处理模块。

**Performance Goals**: 单用户批处理，无在线服务 SLA。每批最多 1000 条词条，同时进行的翻译与 LLM judge 模型请求合计不超过 10 个；完成一批后先持久化结果。参考文档仅在内容新增或更新时重新嵌入；每条输入使用有上限的本地 top-5 search。候选冲突所需 Embedding 按请求去重词项。

**Constraints**: 每次处理一个 CSV；每批最多 1000 条且翻译与 LLM judge 模型调用合计并发上限为 10；批次完成后写入固定输出；接受 UTF-8 BOM，拒绝无效 UTF-8；固定英文为目标语言；参考文件只读，所有翻译和 judge 请求必须先搜索本地记忆；Mem0 add 使用原文模式，不启用记忆提取 LLM；本机 Qdrant 服务仅监听 `127.0.0.1`，服务数据目录位于 TinyCode 用户数据目录；Qdrant 服务遥测和 Mem0 SDK 遥测均须禁用；每次 add 仅在需要向外部 Embedding 服务发送尚未索引的新内容或更新内容时，于发送前单独确认一次；相同来源和内容本地跳过，不请求授权或外发；记忆 search 查询文本（当前词项及必要 comment/场景）和冲突相似度 Embedding 沿用 TUI 自动任务级授权、headless 显式任务级确认；Embedding API 凭据仅从环境变量读取；任何翻译冲突都进入人工审核并按冲突组汇总。

**Scale/Scope**: 处理用户指定的单个词条 CSV；每批最多 1000 条，超过时拆批；词条长度由上游导入的数据类型限制，本功能不另设长度上限。工作流通过 bootstrap 注入的当前 model 和 streamFn 发起翻译与 LLM judge 调用，同一时刻的模型调用合计最多 10 路，不为每条记录创建子 Agent。参考文档 add 支持当前术语工作簿格式的 XLSX；用户将文件作为参考资料提交时由工作流自动执行 add 和内容去重，无需另行发出 add 命令；add 外发授权与本次任务的 search/相似度查询授权分开。TUI 对本次任务自动授权查询和相似度 Embedding；headless 由 `-p` 的交互式 TTY 确认回调处理，无 TTY 时拒绝外发并报告未完成。HITL 按关联冲突组汇总，不逐条重复询问。记忆引擎使用 Mem0 OSS SDK 和本机 Qdrant 服务；不使用 Mem0 托管平台或远程向量数据库。

## Constitution Check

**前置门禁**（Phase 0 前）：

| 原则 | 结果 | 设计依据 |
|---|---|---|
| I. 简洁与可读 | PASS | 复用 TinyCode skill 和 AgentTool 接入，并采用成熟的 Mem0 OSS add/search 能力；不自建通用记忆引擎。 |
| II. 明确契约与幂等副作用 | PASS | 输入、固定输出路径、只读参考资产、记忆来源指纹和审核状态明确；重复 add 幂等，source-version 写入后通过 active 指针切换，CSV 输出通过临时文件原子替换。 |
| III. 边界正确性 | PASS | 在读写边界检查 UTF-8、CSV 列与工作簿 sheet；未知语义和冲突由 HITL 决策。 |
| IV. 中文代码文档 | PASS | 新增或修改函数均提供中文 JSDoc；复杂规则附中文行注释。 |
| V. 可验证行为 | PASS | Vitest 覆盖确定性文件逻辑、loopback Qdrant 服务 fixture 和 mock embedding；测试不访问外网。 |

## Project Structure

### Documentation (this feature)

    specs/001-csv-term-translation/
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── quickstart.md
    ├── contracts/
    │   └── skill-workflow.md
    ├── checklists/
    │   └── requirements.md
    └── tasks.md                 # 由 $speckit-tasks 生成，不由本命令创建

### Source Code (repository root)

    .tinycode/skills/csv-term-translation/SKILL.md
    .tinycode/skills/csv-term-translation-handoff/SKILL.md
    assets/glossary/常用注意要点清单.xlsx
    src/tools/csv-term-translation.ts  # AgentTool 适配器
    src/tools/add-reference-material.ts # 明确提交的参考资料 add
    src/tools/manage-reference-memory.ts # 来源软删除与版本恢复/回滚
    src/tools/index.ts                # 导出翻译工具
    src/bootstrap.ts                  # 注册工具并注入运行时依赖
    src/tui/external-data-consent.ts  # 交互界面的任务级授权
    src/cli/external-data-consent.ts  # 命令行的单次确认
    src/term-translation/
    ├── types.ts
    ├── csv.ts
    ├── glossary.ts
    ├── translation.ts
    ├── workflow.ts
    ├── memory.ts
    ├── mem0-adapter.ts
    ├── source-manifest.ts
    └── consent.ts
    tests/term-translation/
    ├── csv.test.ts
    ├── glossary.test.ts
    ├── translation.test.ts
    ├── workflow.test.ts
    └── memory.test.ts

**Structure Decision**: 依据 TinyCode 自身按能力组织 `src/*` 的架构，而不是照搬 Craft Agents 的 `apps/`/`packages/` 工作区结构。词条翻译规则和数据处理集中在新增的 `src/term-translation/` 子系统；`glossary.ts` 负责解析参考工作簿，`memory.ts` 编排本功能的导入授权和记忆操作，`mem0-adapter.ts` 将结构化术语片段映射到 Mem0 OSS SDK 的原文 add/search，`source-manifest.ts` 维护来源指纹及 active-version 清单。Mem0 的 Qdrant provider 通过 `@qdrant/js-client-rest` 连接 `http://127.0.0.1:6333`；TypeScript REST client 不支持嵌入式 `path` 模式，因此本机 Qdrant 服务负责将数据持久化到 `dataHome()/memory/csv-term-translation/qdrant/storage`，每个项目使用独立 collection 和稳定 `userId`。Qdrant 与 Mem0 telemetry 均须关闭。写入版本先完成后再原子切换来源清单，search 以清单中的 active version 元数据过滤结果。Mem0 SDK 负责 add/search、Embedding 和语义检索；TinyCode 适配层负责工作簿解析、授权、来源幂等和版本清单。`src/tools/add-reference-material.ts` 提供参考资料 add 工具，并在参考文档提交到翻译工作流时自动调用；翻译工具与导入工具均由 `src/bootstrap.ts` 注册并注入授权回调。本机 Qdrant 服务是运行时前置条件，必须绑定 loopback 并使用用户数据目录持久化；TinyCode 在服务不可用时 fail closed，不启动托管或远程数据库。TUI 与命令行的授权交互分别放在现有 `src/tui/` 和 `src/cli/`。项目技能说明由 `.tinycode/skills/csv-term-translation/SKILL.md` 提供，会话续作记录保存在 `.tinycode/skills/csv-term-translation-handoff/SKILL.md`。工作流按每批 1000 条处理，翻译与 LLM judge 模型调用共享并发上限 10，完成一批后保存结果；不创建子 Agent。每条翻译与 judge 调用都先 search，最多注入 5 条相关记录；伪代码术语约束只来自当前候选实际检索到的匹配属性和备注。参考资产沿用 `assets/glossary/`；不修改通用 Agent runtime、通用权限策略或 session 格式。
**Memory Lifecycle Decision**: `source-manifest.ts` 除来源指纹和 active-version 指针外，还记录保留版本与软删除状态。`src/tools/manage-reference-memory.ts` 暴露 `manage_reference_memory`，提供按来源软删除及恢复/回滚到指定版本；软删除来源的所有版本都从 search 过滤，历史向量保留在本机以便回滚，操作只更新本地来源清单，不调用 Embedding API。

## Constitution Check (Post-Design)

| 原则 | 结果 | 复核 |
|---|---|---|
| I. 简洁与可读 | PASS | 模块按 CSV、参考表、翻译判定、流程与工具适配分组；简单函数不单独抽象。 |
| II. 明确契约与幂等副作用 | PASS | skill-workflow 契约定义输入、输出、add/search、重跑、HITL、软删除和版本恢复；原始文件只读，记忆 upsert 按来源和内容指纹幂等，active-version 可原子切换和回滚。 |
| III. 边界正确性 | PASS | 输入校验集中在边界；相似度不绕过 HITL；API 失败不得标记任务完成。 |
| IV. 中文代码文档 | PASS | 作为实现验收门槛写入 quickstart 和后续 tasks。 |
| V. 可验证行为 | PASS | 关键分支均可用隔离 loopback Qdrant 服务、临时持久目录和 mock 模型/Embedding 确定性验证。 |

## Complexity Tracking

无宪法原则例外；不需要复杂度豁免。
