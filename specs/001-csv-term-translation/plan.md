# Implementation Plan: CSV 词条英文翻译与消歧

**Branch**: `feature/csv-term-translation` | **Date**: 2026-11-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-csv-term-translation/spec.md`

## Summary

在 TinyCode 中提供项目级词条翻译 skill，并通过一组小型 TypeScript 模块完成 CSV/XLSX 读写、jieba 分词、参考术语匹配、相似度检查和结果落盘。翻译调用当前 TinyCode 配置的模型，每批最多 1000 条词条，翻译与 LLM judge 的模型调用合计并发上限为 10；每批完成后写入固定 CSV 副本。中文词项的近义词提示使用 OpenAI Embeddings API 的 `text-embedding-3-small`，相似度达到 0.7（含）时进入 HITL。参考工作簿只读，高频未知词生成独立增量工作簿。

翻译模型可自动接收词条、comment、词条来源及匹配到的术语说明，不逐次确认；不发送无关 CSV 行或无关工作簿内容。TUI 启动翻译任务时自动授权该任务全部去重词项的 Embeddings API 请求，无需确认，且授权范围不扩展到其他任务；headless 在交互式 TTY 中通过 CLI 确认回调取得一次授权，无交互 TTY 时拒绝外发并报告未完成。授权行为独立于通用工具 `permissionMode=auto` 和记忆授权，不按 API 请求重复打断用户。翻译冲突按冲突组呈现为单个 HITL 审核事项，汇总所有相关记录和拟议变更。Embedding 请求使用环境变量 `OPENAI_API_KEY`，不在仓库中保存凭据。

标记为“伪代码术语”的参考项不进入 jieba 自定义词典；翻译调用及对应的 LLM judge 仅收到当前候选实际命中的参考条目和相关属性、备注，不把整份词典或无关条目作为通用约束。所有相关候选依次接受全量脚本检查和全量 LLM judge 检查；未通过者保留失败草稿及原因、不进入抽样，但系统继续处理同批独立候选和后续批次，最终任务保持未完成。每批通过前两层的候选随机抽查 5%（向上取整且至少 1 条）；抽查发现违反参考备注的候选时，该批所有伪代码术语候选升级为 HITL 全批复核。

## Technical Context

**Language/Version**: TypeScript 5.8、ESM、Node.js 22.19 或更高版本。

**Primary Dependencies**: 复用 `@earendil-works/pi-agent-core` 和 `@earendil-works/pi-ai`；新增 `csv-parse`、`csv-stringify`、`exceljs`、`jieba-wasm`。Embedding 使用 Node 22 内置 `fetch` 调用 OpenAI API，不新增 SDK。

**Storage**: 本地 UTF-8 CSV、仓库版本化 XLSX、翻译输出 CSV（含逐行审核状态和错误说明）及增量 XLSX；不使用数据库。

**Testing**: Vitest；模型和 Embedding HTTP 请求使用 mock，文件和工作簿使用确定性 fixture，不依赖网络；覆盖每批 1000 条边界、翻译与 judge 模型调用合计并发上限 10、批次落盘、TUI 自动任务级授权、headless 确认/无 TTY 拒绝、冲突组审核聚合，以及伪代码术语候选的全量脚本检查、全量 LLM judge、按批随机抽查和抽查失败后的全批复核。

所有英文译文还需执行占位符脚本检查：花括号占位符保持原文、数量和原序；编号百分号占位符保持标识、格式和数量但允许重排。校验失败记录原因并阻止任务完成。

**Target Platform**: 支持 Node.js 22.19+ 的 Windows、macOS 和 Linux。

**Project Type**: TinyCode 项目级 skill 加 TypeScript AgentTool/文件处理模块。

**Performance Goals**: 单用户批处理，无在线服务 SLA。每批最多 1000 条词条，同时进行的翻译与 LLM judge 模型请求合计不超过 10 个；完成一批后先持久化结果。Embedding 按请求去重词项，仅在候选译文冲突组内比较向量；不建立数据库或执行 SQL 连表。

**Constraints**: 每次处理一个 CSV；每批最多 1000 条且翻译与 LLM judge 模型调用合计并发上限为 10；批次完成后写入固定输出；接受 UTF-8 BOM，拒绝无效 UTF-8；固定英文为目标语言；只读仓库内参考工作簿；任何翻译冲突都进入人工审核并按冲突组汇总；Embedding API 凭据仅从环境变量读取，TUI 使用任务级自动授权，headless 需显式任务级确认。

**Scale/Scope**: 处理用户指定的单个词条 CSV；每批最多 1000 条，超过时拆批；词条长度由上游导入的数据类型限制，本功能不另设长度上限。工作流通过 bootstrap 注入的当前 model 和 streamFn 发起翻译与 LLM judge 调用，同一时刻的模型调用合计最多 10 路，不为每条记录创建子 Agent。TUI 自动授予当前任务的 Embeddings 外发权限；headless 由 `-p` 的交互式 TTY 确认回调处理，无 TTY 时拒绝外发并报告未完成。HITL 按关联冲突组汇总，不逐条重复询问。不引入服务端、账户系统或数据库。

## Constitution Check

**前置门禁**（Phase 0 前）：

| 原则 | 结果 | 设计依据 |
|---|---|---|
| I. 简洁与可读 | PASS | 复用 TinyCode skill 和 AgentTool 接入；不新增服务或通用框架。 |
| II. 明确契约与幂等副作用 | PASS | 输入、固定输出路径、只读参考资产和审核状态明确；相同记录复用已有已批准结果，输出通过临时文件原子替换。 |
| III. 边界正确性 | PASS | 在读写边界检查 UTF-8、CSV 列与工作簿 sheet；未知语义和冲突由 HITL 决策。 |
| IV. 中文代码文档 | PASS | 新增或修改函数均提供中文 JSDoc；复杂规则附中文行注释。 |
| V. 可验证行为 | PASS | Vitest 覆盖确定性文件逻辑与 mock embedding；不要求测试访问网络。 |

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
    └── consent.ts
    tests/term-translation/
    ├── csv.test.ts
    ├── glossary.test.ts
    ├── translation.test.ts
    └── workflow.test.ts

**Structure Decision**: 依据 TinyCode 自身按能力组织 `src/*` 的架构，而不是照搬 Craft Agents 的 `apps/`/`packages/` 工作区结构。词条翻译规则和数据处理集中在新增的 `src/term-translation/` 子系统，与现有 `src/mcp/`、`src/session/` 等能力目录同级；AgentTool 适配器放在现有 `src/tools/`，由 `src/bootstrap.ts` 注册并注入当前 model、streamFn 和任务级授权回调。TUI 与命令行的授权交互分别放在现有 `src/tui/` 和 `src/cli/`。项目技能说明由 `.tinycode/skills/csv-term-translation/SKILL.md` 提供，会话续作记录保存在 `.tinycode/skills/csv-term-translation-handoff/SKILL.md`。工作流按每批 1000 条处理，翻译与 LLM judge 模型调用共享并发上限 10，完成一批后保存结果；不创建子 Agent。伪代码术语约束由翻译流程传入匹配属性和备注，并由 `workflow.ts` 编排脚本检查、LLM judge、批内随机 HITL 抽查及抽查失败后的整批复核。参考资产沿用 `assets/glossary/`；不修改通用 Agent runtime、通用权限策略或 session 格式。

## Constitution Check (Post-Design)

| 原则 | 结果 | 复核 |
|---|---|---|
| I. 简洁与可读 | PASS | 模块按 CSV、参考表、翻译判定、流程与工具适配分组；简单函数不单独抽象。 |
| II. 明确契约与幂等副作用 | PASS | skill-workflow 契约定义输入、输出、重跑和 HITL；原始文件与参考工作簿保持只读。 |
| III. 边界正确性 | PASS | 输入校验集中在边界；相似度不绕过 HITL；API 失败不得标记任务完成。 |
| IV. 中文代码文档 | PASS | 作为实现验收门槛写入 quickstart 和后续 tasks。 |
| V. 可验证行为 | PASS | 关键分支均可用本地 fixture 和 mock fetch 确定性验证。 |

## Complexity Tracking

无宪法原则例外；不需要复杂度豁免。
