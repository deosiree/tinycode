# Implementation Plan: CSV 词条英文翻译与消歧

**Branch**: `001-csv-term-translation` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-csv-term-translation/spec.md`

## Summary

在 TinyCode 中提供项目级词条翻译 skill，并通过一组小型 TypeScript 模块完成 CSV/XLSX 读写、jieba 分词、参考术语匹配、相似度检查和结果落盘。翻译仍由当前 TinyCode Agent 模型生成；中文词项的近义词提示使用 OpenAI Embeddings API 的 `text-embedding-3-small`，相似度达到 0.7（含）时进入 HITL。输出始终写回确定名称的 CSV 副本；参考工作簿只读，高频未知词生成独立增量工作簿。

Embedding 请求只包含去重后的中文词项；请求使用环境变量 `OPENAI_API_KEY`，不在仓库中保存凭据。该选择需要联网且会将这些中文词项发送至 OpenAI；本规划期间未发起 API 请求。

## Technical Context

**Language/Version**: TypeScript 5.8、ESM、Node.js 22.19 或更高版本。

**Primary Dependencies**: 复用 `@earendil-works/pi-agent-core` 和 `@earendil-works/pi-ai`；新增 `csv-parse`、`csv-stringify`、`exceljs`、`jieba-wasm`。Embedding 使用 Node 22 内置 `fetch` 调用 OpenAI API，不新增 SDK。

**Storage**: 本地 UTF-8 CSV、仓库版本化 XLSX、输出 CSV 和增量 XLSX；不使用数据库。

**Testing**: Vitest；Embedding HTTP 请求用 mock fetch，文件和工作簿使用确定性 fixture，不依赖网络。

**Target Platform**: 支持 Node.js 22.19+ 的 Windows、macOS 和 Linux。

**Project Type**: TinyCode 项目级 skill 加 TypeScript AgentTool/文件处理模块。

**Performance Goals**: 单用户批处理，无在线服务 SLA。按词项去重后批量请求 embedding，仅在候选译文冲突组内比较向量；不建立数据库或执行 SQL 连表。

**Constraints**: 每次处理一个 CSV；接受 UTF-8 BOM，拒绝无效 UTF-8；固定英文为目标语言；只读仓库内参考工作簿；CSV 输出名确定；任何翻译冲突都进入人工审核；Embedding API 凭据仅从环境变量读取。

**Scale/Scope**: 处理用户指定的单个词条 CSV；规格未限定最大行数。输入来自词条抽取结果，模型交互按当前 Agent 上下文工作；不引入服务端、账户系统或数据库。

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
    src/term-translation/
    ├── types.ts                 # CSV 行、术语、候选与审核状态
    ├── csv.ts                   # UTF-8 CSV 解析、字段校验与副本写入
    ├── glossary.ts              # 指定 XLSX sheet 读取与应用层索引
    ├── translation.ts           # jieba 分词、术语候选与 embedding 相似度
    ├── workflow.ts              # 单次翻译流程、HITL 汇总与完成检查
    └── tool.ts                  # TinyCode AgentTool 适配
    src/bootstrap.ts             # 注册词条翻译工具
    assets/glossary/常用注意要点清单.xlsx
    tests/term-translation/
    ├── csv.test.ts
    ├── glossary.test.ts
    ├── translation.test.ts
    └── workflow.test.ts

**Structure Decision**: 复用仓库现有的 TinyCode 项目级技能发现机制，产品技能说明由 `.tinycode/skills/csv-term-translation/SKILL.md` 提供；当前会话续作记录保存在 `.tinycode/skills/csv-term-translation-handoff/SKILL.md`。文件操作与确定性业务规则集中在 `src/term-translation/`，通过单个 AgentTool 进入现有 Agent 循环。参考资产沿用已入库的 `assets/glossary/`。不修改通用 Agent runtime、权限策略或 session 格式。

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
