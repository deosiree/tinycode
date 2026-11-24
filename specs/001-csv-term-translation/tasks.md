# 任务：CSV 词条英文翻译与消歧

**输入**：`specs/001-csv-term-translation/` 中的 spec、plan、research、data-model、contracts 和 quickstart。

**当前基线**：基于 `feature/csv-term-translation` 分支最新拉取代码。TinyCode 已有 skill loader、AgentTool registry、TUI/headless CLI 和 Vitest；CSV 翻译与本地记忆实现尚不存在。

**任务组织**：按 spec 用户故事追踪，并用四板斧设置交付门禁。交付失败按原因回流：材料缺失回关口 1；推理不符、超预算或证据不足回关口 2；质量不达标回关口 3；产品集成不完整回关口 4。每次修复后重跑受影响的验收。用户故事 4 排在用户故事 1 前，是因为每次翻译和 judge 都必须先检索成功的本地记忆。

**测试**：TinyCode 宪法要求行为变更具有现有风格的自动化覆盖。各故事先建立隔离测试，再实现；fixture、Mock 和本机 Qdrant 测试不访问外网。

## Phase 1：准备与依赖

**四板斧关口 1/4：场景材料与外部能力**

**目的**：固定 Node 项目所需依赖及版本，准备可供本地/CI 重复安装的依赖树。

- [ ] T001 在规划工作树先提交 `specs/001-csv-term-translation/tasks.md` 的任务清单变更；确认功能分支已包含规格与任务后，将规划工作树切到 detached HEAD，再在仓库同级 `../tinycode-worktrees/csv-term-translation` 创建独立实现 worktree 并关联 `feature/csv-term-translation`，不得重置或丢弃规划提交。

- [ ] T002 在 `package.json` 和 `package-lock.json` 中加入 `csv-parse`、`csv-stringify`、`exceljs`、`jieba-wasm`、`mem0ai` 和 `@qdrant/js-client-rest`；锁定依赖版本并确认 Node.js 22.19 ESM 安装兼容性。

---

## Phase 2：共享契约与类型

**目的**：先确定跨模块数据结构和外发授权边界，避免工具、memory 和 workflow 各自定义不兼容状态。

- [ ] T003 [P] 在 `src/term-translation/types.ts` 定义任务、CSV 行、参考术语、记忆条目/结果、来源版本、候选、冲突组、审核决定和增量条目接口；逐项对照 `data-model.md` 的 `翻译任务.输入`、`翻译任务.输出`、`翻译任务.身份`、`翻译任务.状态`、`翻译任务.批次`、`翻译任务.局部失败`、`翻译任务.幂等`、`CSV 记录.原始列映射`、`CSV 记录.数据记录序号`、`CSV 记录.词条`、`CSV 记录.comment`、`CSV 记录.词条来源`、`CSV 记录.英文翻译`、`CSV 记录.审核状态`、`CSV 记录.错误说明`、`CSV 记录.输入要求`、`CSV 记录.输出要求`、`CSV 记录.行审核状态`、`词项与参考术语.原始词面`、`词项与参考术语.comment`、`词项与参考术语.词条来源`、`词项与参考术语.使用场景`、`词项与参考术语.英文译法`、`词项与参考术语.静态术语`、`词项与参考术语.伪代码术语标记`、`词项与参考术语.备注`、`参考记忆条目与导入.稳定条目 ID`、`参考记忆条目与导入.source ID`、`参考记忆条目与导入.来源文件名`、`参考记忆条目与导入.来源 SHA-256`、`参考记忆条目与导入.sheet 名`、`参考记忆条目与导入.行号`、`参考记忆条目与导入.chunk ID`、`参考记忆条目与导入.中文词项`、`参考记忆条目与导入.英文译法`、`参考记忆条目与导入.comment/场景`、`参考记忆条目与导入.属性/备注`、`参考记忆条目与导入.Embedding 模型版本`、`参考记忆条目与导入.向量`、`参考记忆条目与导入.active-version key`、`参考记忆条目与导入.来源状态`、`参考记忆条目与导入.保留版本`、`参考记忆条目与导入.active-version 指针`、`记忆检索结果.条目`、`记忆检索结果.来源`、`记忆检索结果.相似度`、`翻译候选.记录序号`、`翻译候选.中文词项`、`翻译候选.comment`、`翻译候选.使用场景`、`翻译候选.候选英文`、`翻译候选.候选来源`、`翻译候选.占位符信息`、`翻译候选.审核状态`、`翻译候选.脚本检查结论`、`翻译候选.LLM judge 结论`、`翻译候选.失败原因`、`冲突组与人工审核事项.group ID`、`冲突组与人工审核事项.冲突类型`、`冲突组与人工审核事项.关联记录身份`、`冲突组与人工审核事项.审核记录`、`冲突组与人工审核事项.用户决定`、`增量参考条目.统计键`、`增量参考条目.中文词项`、`增量参考条目.候选英文`、`增量参考条目.comment`、`增量参考条目.翻译描述`、`增量参考条目.使用场景`、`增量参考条目.出现次数` 和 `增量参考条目.字段`。
- [ ] T004 [P] 在 `src/term-translation/consent.ts` 定义 add 单次外发授权与翻译任务级 query/冲突 embedding 授权接口；授权不得借用通用 `permissionMode`，同源同 hash 重复 add 不触发外发授权，行为遵循 `contracts/skill-workflow.md` 的 Memory add/search boundary 和 Embedding service boundary。

---

- [ ] T005 在 Git 功能分支提交准备与共享契约批次，包含 `package.json`、`package-lock.json`、`src/term-translation/types.ts` 和 `src/term-translation/consent.ts`；提交前完成依赖安装、格式和类型检查，不推送远端。

---

## Phase 3：用户故事 4 - 沉淀和检索本地参考记忆（P1）

**四板斧关口 1/4：将可信材料安全接入 Agent**

**目标**：导入仓库基线或用户明确提交的参考工作簿，在本机按项目持久化、检索和管理来源版本。

**独立验收**：使用确定性工作簿 fixture 和隔离 loopback Qdrant 服务，验证四个指定 sheet 可解析；重复 add 幂等、变更版本原子切换、重启后仍可检索、软删除来源不再命中、恢复旧版本后只命中选中版本、不同项目隔离；未授权、Qdrant/search 失败和 telemetry 请求均符合契约。

### 测试任务

- [ ] T006 [P] [US4] 在 `tests/term-translation/glossary.test.ts` 用工作簿 fixture 覆盖 `注意要点_中英`、`翻译简写说明`、`要注意的Comment（研发人员加）` 和 `翻译省略` 的读取、字段映射和缺表错误；术语字段遵循 `data-model.md` 的 `词项与参考术语.原始词面`、`词项与参考术语.英文译法`、`词项与参考术语.伪代码术语标记`、`词项与参考术语.备注`、`词项与参考术语.comment` 和 `词项与参考术语.使用场景`。
- [ ] T007 [P] [US4] 在 `tests/term-translation/mem0-adapter.test.ts` 用 mock Mem0/Qdrant client 覆盖 `infer: false` 原文 add、项目 `userId`/collection 传递、metadata filter、top-5 search、adapter 错误传播和 telemetry 禁用；记忆字段遵循 `data-model.md` 的 `参考记忆条目与导入.source ID`、`参考记忆条目与导入.来源 SHA-256`、`参考记忆条目与导入.chunk ID`、`参考记忆条目与导入.active-version key` 和 `翻译任务.局部失败`。
- [ ] T008 [P] [US4] 在 `tests/term-translation/source-manifest.test.ts` 覆盖同源同 hash 幂等、写入中断保留旧 active key、完整新版本原子切换、软删除清除 active key、恢复指定历史版本及清单文件原子写入；状态遵循 `data-model.md` 的 `参考记忆条目与导入.来源状态`、`参考记忆条目与导入.保留版本` 和 `参考记忆条目与导入.active-version 指针`。
- [ ] T009 [P] [US4] 在 `tests/term-translation/memory.test.ts` 使用临时 Qdrant 持久目录覆盖 add/search 重启、同项目隔离、软删除/恢复端到端、数据库不可用 fail-closed、导入失败不发布部分版本及 source/sheet/row 定位；结果遵循 `data-model.md` 的 `参考记忆条目与导入.来源文件名`、`参考记忆条目与导入.sheet 名`、`参考记忆条目与导入.行号`、`参考记忆条目与导入.active-version key`、`记忆检索结果.条目`、`记忆检索结果.来源` 和 `记忆检索结果.相似度`。
- [ ] T010 [P] [US4] 在 `tests/term-translation/consent.test.ts` 覆盖首次基线 add 和用户提交 add 的单次授权、同源同 hash 本地跳过、拒绝或无 TTY 时不发送参考内容、授权与 Embedding/query 任务授权互相独立；授权遵循 `contracts/skill-workflow.md` 的 Memory add/search boundary。

### 实现任务

- [ ] T011 [P] [US4] 在 `src/term-translation/glossary.ts` 解析基线及用户提交 XLSX 的四个指定 sheet，映射术语、comment、场景、伪代码属性和备注为记忆片段，并保留原始 sheet/行定位；字段遵循 `data-model.md` 的 `参考记忆条目与导入.sheet 名`、`参考记忆条目与导入.行号`、`参考记忆条目与导入.中文词项`、`参考记忆条目与导入.英文译法` 和 `参考记忆条目与导入.属性/备注`。
- [ ] T012 [P] [US4] 在 `src/term-translation/mem0-adapter.ts` 实现 Mem0 OSS 初始化及 add/search adapter；加载 SDK 前设置 `MEM0_TELEMETRY=false`，连接 `http://127.0.0.1:6333`，使用项目 collection/stable `userId`、`infer: false` 和 active-version metadata filter，限制 search 最多 5 条；字段遵循 `data-model.md` 的 `参考记忆条目与导入.稳定条目 ID`、`参考记忆条目与导入.来源 SHA-256`、`参考记忆条目与导入.chunk ID`、`参考记忆条目与导入.active-version key`、`参考记忆条目与导入.Embedding 模型版本`、`参考记忆条目与导入.向量`、`记忆检索结果.条目`、`记忆检索结果.来源` 和 `记忆检索结果.相似度`。
- [ ] T013 [P] [US4] 在 `src/term-translation/source-manifest.ts` 实现按 project key 保存的来源清单、SHA-256 版本键、active-version 指针和临时文件原子替换；失败保留旧清单，字段遵循 `data-model.md` 的 `参考记忆条目与导入.source ID`、`参考记忆条目与导入.来源 SHA-256`、`参考记忆条目与导入.保留版本`、`参考记忆条目与导入.来源状态` 和 `参考记忆条目与导入.active-version 指针`。
- [ ] T014 [US4] 在 `src/term-translation/memory.ts` 实现基线初始化及参考资料 add：解析完成后先本地对 source/hash 去重，仅在有新内容需生成外部 embedding 时请求一次授权；完整写入所有 chunk 后才发布新 active version；字段遵循 `data-model.md` 的 `参考记忆条目与导入.chunk ID`、`参考记忆条目与导入.来源文件名`、`参考记忆条目与导入.来源 SHA-256`、`参考记忆条目与导入.来源状态` 和 `参考记忆条目与导入.active-version 指针`。
- [ ] T015 [US4] 在 `src/term-translation/memory.ts` 实现按当前项目和 active-version 清单过滤的 search，返回最多 5 条带 sheet/row 来源定位的结果；检索失败向调用方返回失败且不得回退读取整本工作簿，字段遵循 `data-model.md` 的 `记忆检索结果.条目`、`记忆检索结果.来源`、`记忆检索结果.相似度` 和 `参考记忆条目与导入.active-version key`。
- [ ] T016 [US4] 在 `src/term-translation/memory.ts` 实现按 source 软删除及恢复/回滚：软删除排除来源所有版本但保留向量；恢复原子激活指定保留版本且不调用 Embedding API；失败保留原状态，遵循 `data-model.md` 的 `参考记忆条目与导入.来源状态`、`参考记忆条目与导入.保留版本` 和 `参考记忆条目与导入.active-version 指针`。
- [ ] T017 [P] [US4] 在 `src/tools/add-reference-material.ts` 实现 `add_reference_material` AgentTool，接收用户明确提交的 XLSX 路径并调用 memory add，返回来源身份、hash、版本及导入状态；字段遵循 `data-model.md` 的 `参考记忆条目与导入.来源文件名`、`参考记忆条目与导入.来源 SHA-256`、`参考记忆条目与导入.来源状态` 和 `参考记忆条目与导入.保留版本`。
- [ ] T018 [P] [US4] 在 `src/tools/manage-reference-memory.ts` 实现 `manage_reference_memory` AgentTool，支持列出来源、软删除和恢复/回滚指定版本；禁止该工具调用外部 Embedding，操作结果遵循 `data-model.md` 的 `参考记忆条目与导入.source ID`、`参考记忆条目与导入.来源状态`、`参考记忆条目与导入.保留版本` 和 `参考记忆条目与导入.active-version 指针`。
- [ ] T019 [US4] 在 `src/tools/index.ts` 导出并在 `src/bootstrap.ts` 注册 add/manage 工具，注入 project key、TinyCode 用户数据目录、Qdrant endpoint 和外发授权回调；本机服务缺失时向用户返回 loopback 服务前置条件和可定位错误，不启用远程数据库。

**检查点**：基线和显式提交的资料都能安全 add/search；来源管理不破坏历史版本；这是翻译 MVP 的材料基础。

- [ ] T020 [US4] 审查并集成 US4 各 Agent worktree 的改动，在故事独立验收通过后将 `src/term-translation/`、`src/tools/` 和 `tests/term-translation/` 的 US4 变更 squash 为一个可回滚提交；不推送远端。

---

## Phase 4：用户故事 1 - 翻译 CSV 中的新词条（P1，MVP）

**四板斧关口 2/4：Agent 能力编排与推理**

**目标**：在每次翻译/judge 前检索本地记忆，以 jieba 和当前 Agent 模型生成自然英文，并分批持久化可恢复输出。

**独立验收**：对小型 UTF-8 CSV 验证每行先 search 后调用模型、最多注入 5 条相关资料、原始列序和行数保留、占位符正确、1001 行拆成两批、翻译与 judge 合计并发不超过 10、已完成批次可恢复且失败行标明错误。

### 测试任务

- [ ] T021 [P] [US1] 在 `tests/term-translation/csv.test.ts` 覆盖 UTF-8/BOM、无效编码、引号/逗号/多行字段、必需列、原列值与行顺序保真、固定输出名、状态/错误列追加和输入不覆盖；字段遵循 `data-model.md` 的 `CSV 记录.词条`、`CSV 记录.comment`、`CSV 记录.词条来源`、`CSV 记录.英文翻译`、`CSV 记录.审核状态`、`CSV 记录.错误说明`、`翻译任务.输入`、`翻译任务.输出` 和 `翻译任务.幂等`。
- [ ] T022 [P] [US1] 在 `tests/term-translation/translation.test.ts` 覆盖完整词条优先、jieba 静态自定义词典、伪代码术语排除、comment/场景命中约束和自然英文候选上下文；字段遵循 `data-model.md` 的 `词项与参考术语.原始词面`、`词项与参考术语.comment`、`词项与参考术语.使用场景`、`词项与参考术语.伪代码术语标记`、`词项与参考术语.备注`、`翻译候选.候选英文` 和 `翻译候选.候选来源`。
- [ ] T023 [P] [US1] 在 `tests/term-translation/quality.test.ts` 覆盖花括号占位符原文/数量/顺序、编号百分号占位符标识/格式/数量、单候选脚本失败原因和失败状态；结果字段遵循 `data-model.md` 的 `翻译候选.占位符信息`、`翻译候选.脚本检查结论`、`翻译候选.失败原因` 与 `CSV 记录.错误说明`。
- [ ] T024 [P] [US1] 在 `tests/term-translation/workflow.test.ts` 覆盖每条翻译/judge 前 search、search 失败 fail-closed、最多 5 条上下文、只传当前词条命中的伪代码属性和备注，以及检索来源追溯；关系遵循 `data-model.md` 的 `记忆检索结果.条目`、`记忆检索结果.来源`、`记忆检索结果.相似度`、`翻译候选.候选来源` 和 `翻译候选.LLM judge 结论`。
- [ ] T025 [P] [US1] 在 `tests/term-translation/batching.test.ts` 覆盖 1000/1001 条批次边界、翻译与 judge 合计并发上限 10、每批结束落盘、单候选失败后继续独立候选/后续批次和中断恢复；约束遵循 `data-model.md` 的 `翻译任务.批次`、`翻译任务.局部失败` 和 `翻译任务.状态`。
- [ ] T026 [P] [US1] 在 `tests/fixtures/term-translation/evaluation-cases.json` 建立经人工审核且不含用户数据的固定评测样例，并在 `tests/term-translation/evaluation.test.ts` 覆盖静态术语、伪代码术语、相同词项不同 comment、词条片段和占位符；用 mock 验证评测输入、调用轨迹和审核/失败判据可重复，不宣称替代实际模型评测或 HITL。
- [ ] T027 [P] [US1] 在 `tests/term-translation/consent.test.ts` 覆盖 TUI 任务启动后一次性授权 search query/去重词项、headless TTY 单次确认、拒绝或无 TTY 时不发请求并保留未完成记录；边界遵循 `contracts/skill-workflow.md` 的 Embedding service boundary。

### 实现任务

- [ ] T028 [P] [US1] 在 `src/term-translation/csv.ts` 实现 UTF-8/BOM 解码校验、结构化 CSV 读写、列/记录保真、行级状态/错误列及固定输出名；同目录临时文件写完后原子替换且不得覆盖输入，约束引用 `data-model.md` 的 `CSV 记录.原始列映射`、`CSV 记录.数据记录序号`、`CSV 记录.词条`、`CSV 记录.comment`、`CSV 记录.词条来源`、`CSV 记录.英文翻译`、`CSV 记录.审核状态`、`CSV 记录.错误说明`、`CSV 记录.输入要求`、`CSV 记录.输出要求`、`CSV 记录.行审核状态`、`翻译任务.输入`、`翻译任务.输出` 和 `翻译任务.幂等`。
- [ ] T029 [P] [US1] 在 `src/term-translation/translation.ts` 实现 jieba 自定义词典装载、完整词条优先匹配和词级切分；伪代码标记为“是”的词排除于词典，并只结合当前条目的 comment、场景和命中术语组织提示，字段遵循 `data-model.md` 的 `词项与参考术语.原始词面`、`词项与参考术语.英文译法`、`词项与参考术语.静态术语`、`词项与参考术语.伪代码术语标记`、`词项与参考术语.备注`、`词项与参考术语.comment`、`词项与参考术语.使用场景`、`翻译候选.记录序号`、`翻译候选.中文词项`、`翻译候选.comment`、`翻译候选.使用场景`、`翻译候选.候选英文` 和 `翻译候选.候选来源`。
- [ ] T030 [P] [US1] 在 `src/term-translation/quality.ts` 实现确定性占位符规则检查；错误时保留候选、记录逐行原因并阻止批准，规则遵循 `data-model.md` 的 `翻译候选.占位符信息`、`翻译候选.脚本检查结论`、`翻译候选.失败原因` 和 `CSV 记录.错误说明`。
- [ ] T031 [US1] 在 `src/term-translation/quality.ts` 实现当前 TinyCode 模型的 LLM judge 调用；每次 judge 前先 search 并只用该候选检索命中的参考项作为依据，特别是伪代码术语的属性/备注，不传整份工作簿，结论遵循 `data-model.md` 的 `翻译候选.LLM judge 结论`、`翻译候选.失败原因`、`记忆检索结果.条目` 和 `记忆检索结果.来源`。
- [ ] T032 [US1] 在 `src/term-translation/quality.ts` 实现伪代码术语候选按批随机抽查 `max(1, ceil(通过候选数 × 5%))`；抽查不符时把该批全部伪代码术语候选提升为待人工复核，遵循 `data-model.md` 的 `翻译候选.审核状态`、`翻译候选.脚本检查结论`、`翻译候选.LLM judge 结论` 和 `翻译候选.失败原因`。
- [ ] T033 [US1] 在 `src/term-translation/workflow.ts` 编排单条记录 search → 参考匹配/翻译 → 脚本检查 → 必要 judge，并把检索来源与模型候选关联；search 失败时禁止该条模型调用，字段遵循 `data-model.md` 的 `记忆检索结果.条目`、`记忆检索结果.来源`、`记忆检索结果.相似度`、`翻译候选.候选来源` 和 `翻译候选.审核状态`。
- [ ] T034 [US1] 在 `src/term-translation/batching.ts` 实现最多 1000 条一批的调度器，翻译和 judge 共用最多 10 路并发，每批完成即保存固定 CSV，局部失败后继续独立候选并汇总任务未完成原因；行为遵循 `data-model.md` 的 `翻译任务.批次`、`翻译任务.局部失败`、`翻译任务.状态`、`翻译任务.幂等` 和 `CSV 记录.错误说明`。
- [ ] T035 [US1] 在 `src/tools/csv-term-translation.ts` 实现 `csv_term_translation` 的 `translate` AgentTool 操作，校验用户给定路径并注入 current model、`streamFn`、memory、工作簿资产路径和任务授权 callback；接口遵循 `contracts/skill-workflow.md` 的 User input 与 Processing contract。
- [ ] T036 [P] [US1] 在 `src/tui/external-data-consent.ts` 实现 TUI 触发翻译时对本次任务 search query/相似度词项的一次性授权，并通过 `src/tui/app.ts` 接入任务级 callback；授权边界遵循 `contracts/skill-workflow.md` 的 Embedding service boundary。
- [ ] T037 [P] [US1] 在 `src/cli/external-data-consent.ts` 实现 headless 交互 TTY 单次确认及拒绝/no-TTY fail-closed，并通过 `src/cli/index.ts` 注入任务级 callback；不得以通用 `permissionMode=auto` 代替该授权，遵循 `contracts/skill-workflow.md` 的 Embedding service boundary。
- [ ] T038 [US1] 在 `src/bootstrap.ts` 注册翻译 AgentTool 并注入当前模型、memory service、仓库 glossary 资产和 TUI/CLI 授权实现；任何单条失败写入“错误说明”，任务状态遵循 `data-model.md` 的 `翻译任务.状态` 和 `翻译任务.局部失败`。
- [ ] T039 [P] [US1] 创建 `.tinycode/skills/csv-term-translation/SKILL.md`，说明如何选择 CSV、启动翻译、解释候选/失败/完成状态、按稳定 group ID 收集人工决定并调用审核操作；不要求用户重复提供仓库内参考工作簿路径。

**检查点 / MVP**：Phase 1-4 完成后即可从本地参考记忆生成可恢复 CSV；任务只在检索、译文和必要审核均完成时报告完成。之后再增加冲突辅助审核和术语增量输出。

- [ ] T040 [US1] 审查并集成 US1 各 Agent worktree 的改动，在翻译 MVP 独立验收通过后，将 `src/term-translation/`、`src/tools/csv-term-translation.ts`、`src/tui/`、`src/cli/`、`.tinycode/skills/csv-term-translation/SKILL.md` 和 `tests/term-translation/` 中的 US1 变更 squash 为一个可回滚提交；不推送远端。

---

## Phase 5：用户故事 2 - 审核实体歧义与翻译冲突（P1）

**四板斧关口 3/4：评测 Agent 质量并用 HITL 闭环调优**

**目标**：检测同译冲突，使用中文语义相似度提供可解释提示，按组征求用户决定，批准后才写入结果。

**独立验收**：覆盖 0.699 与 0.7 边界、相同词项不同 comment、无关组不合并、group ID 稳定、过期决定拒绝，以及批准的统一/不同译文能正确回写所有关联行。

### 测试任务

- [ ] T041 [P] [US2] 在 `tests/term-translation/conflicts.test.ts` 覆盖去重中文词项 embedding、余弦分数阈值、0.7（含）判定、同词不同 comment 直接进入语境审核及 API 失败保留待审；相似度规则遵循 `data-model.md` 的 `冲突组与人工审核事项.审核记录`。
- [ ] T042 [P] [US2] 在 `tests/term-translation/reviews.test.ts` 覆盖相同 comment 翻译不一致、不同词项同译分组、稳定 group ID、关联行完整性、无关组隔离、same/different entity 决定和过期 group 拒绝；字段遵循 `data-model.md` 的 `冲突组与人工审核事项.group ID`、`冲突组与人工审核事项.审核记录` 和 `冲突组与人工审核事项.用户决定`。

### 实现任务

- [ ] T043 [US2] 在 `src/term-translation/conflicts.ts` 实现对去重中文词项调用 `text-embedding-3-small`、余弦相似度和 0.7 阈值建议；请求仅发送中文词项并复用当前任务授权，embedding 失败保留冲突待审，遵循 `contracts/skill-workflow.md` 的 Embedding service boundary。
- [ ] T044 [US2] 在 `src/term-translation/conflicts.ts` 构建仅含相关记录的冲突组并生成稳定 group ID；每组携带全部 HITL 字段，缺少描述/场景时留空并标注上下文缺失，group ID 以冲突类型和排序后的关联记录身份生成，字段遵循 `data-model.md` 的 `冲突组与人工审核事项.group ID`、`冲突组与人工审核事项.冲突类型`、`冲突组与人工审核事项.关联记录身份`、`冲突组与人工审核事项.审核记录`、`冲突组与人工审核事项.单词`、`冲突组与人工审核事项.comment`、`冲突组与人工审核事项.词条来源`、`冲突组与人工审核事项.翻译`、`冲突组与人工审核事项.翻译描述`、`冲突组与人工审核事项.使用场景`、`冲突组与人工审核事项.utf-8的字节长度` 和 `冲突组与人工审核事项.字符长度`。
- [ ] T045 [US2] 在 `src/term-translation/workflow.ts` 实现审核决定应用：重新校验 group ID 和源记录身份仍匹配待审状态，same entity 采用用户批准的统一译文，different entities 为每条记录采用经用户批准的不同译文，之后才更新相关行状态；状态遵循 `data-model.md` 的 `冲突组与人工审核事项.用户决定`、`CSV 记录.英文翻译` 和 `CSV 记录.审核状态`。
- [ ] T046 [US2] 在 `src/tools/csv-term-translation.ts` 为 `csv_term_translation` 增加 `apply_reviews` 操作，接收 group ID、用户决定及逐行批准译文；拒绝不完整、过期或输入已变化的决定，并返回仍待审事项，接口遵循 `contracts/skill-workflow.md` 的 Review interaction contract。

**检查点**：相似度只排序和提示；所有冲突均等待明确用户决定；已批准决定能跨进程重跑保留。

- [ ] T047 [US2] 审查并集成 US2 Agent worktree 的改动，在冲突分组与审核回合验收通过后，将 `src/term-translation/conflicts.ts`、`src/term-translation/workflow.ts`、`src/tools/csv-term-translation.ts` 和对应测试 squash 为一个可回滚提交；不推送远端。

---

## Phase 6：用户故事 3 - 产出高频未知词条参考增量（P2）

**四板斧关口 4/4：将评测结论和材料改进做成可交付产品**

**目标**：把未知高频词输出为独立可审核工作簿，不污染原始参考资料或 CSV 完成判定。

**独立验收**：同一词项与相同 comment 出现 3 次（含）才进入增量文件；低频候选不进入；原工作簿只读；增量资料待审不阻止 CSV 已完成状态。

### 测试任务

- [ ] T048 [P] [US3] 在 `tests/term-translation/glossary.test.ts` 覆盖按词项/comment 统计、2/3 次门槛、增量工作簿字段、重复输出路径更新及原参考工作簿不变；字段遵循 `data-model.md` 的 `增量参考条目.统计键`、`增量参考条目.中文词项`、`增量参考条目.comment`、`增量参考条目.候选英文`、`增量参考条目.翻译描述`、`增量参考条目.使用场景` 和 `增量参考条目.出现次数`。

### 实现任务

- [ ] T049 [US3] 在 `src/term-translation/glossary.ts` 统计未知词项并生成 `<原文件名>_translated_glossary_delta.xlsx`，按参考工作簿适用结构写入达到门槛的候选；不得修改仓库内基线或来源工作簿，字段遵循 `data-model.md` 的 `增量参考条目.统计键`、`增量参考条目.出现次数` 和 `增量参考条目.字段`。
- [ ] T050 [US3] 在 `src/term-translation/workflow.ts` 接入增量工作簿输出，并确保增量资料审核与 CSV 审核状态分离；任务完成状态遵循 `data-model.md` 的 `翻译任务.输出` 和 `翻译任务.状态`。

- [ ] T051 [US3] 审查并集成 US3 Agent worktree 的改动，在增量工作簿验收通过后，将 `src/term-translation/glossary.ts`、`src/term-translation/workflow.ts` 和对应测试 squash 为一个可回滚提交；不推送远端。

---

## Phase 7：产品集成与交付报告

**目的**：按四板斧检查点完成端到端集成、恢复说明和其他机器可复现的运行文档。

**交付门禁**：四轴证据均满足且端到端验收通过后才能交付；失败时按本文件“交付失败回流”回到责任关口修复并重跑相关验收。

- [ ] T052 [P] 在 `tests/harness.e2e.test.ts` 增加 mock Agent 场景，串起 skill 发现、记忆 search、翻译工具、冲突审核回合、批准写入及增量输出；不得调用真实翻译或 Embedding API。
- [ ] T053 [P] 更新 `specs/001-csv-term-translation/quickstart.md` 和 `README.md`，列明 Node 版本、经过验证并锁定的 Qdrant 服务版本、Windows/macOS/Linux 可复制的 loopback 启动命令与用户数据目录持久化配置、API key 环境变量、TUI/headless 授权差异、四种输出状态和重跑恢复步骤；说明如何分别授权并运行脱敏固定评测样例、记录译文审查和 token/成本，禁止用用户 CSV 做评测。
- [ ] T054 [P] 更新 `ARCHITECTURE.md`，记录 term-translation 模块、Mem0/Qdrant 本地边界、skill/AgentTool 注册路径、search-before-model 和质量/HITL 阶段；保持既有 TinyCode 通用 runtime 架构说明准确。
- [ ] T055 按 `package.json` 运行 `npm test`、`npm run typecheck`、`npm run lint` 和 `npm run build`；检查所有新增/修改函数均含中文职责 JSDoc、`@param` 和 `@returns`，并核对 `quickstart.md` 端到端预期、Mem0 telemetry 关闭、无未声明网络请求及 Windows/macOS/Linux 的 loopback Qdrant 运行前置条件。
- [ ] T056 使用隔离本地记忆和 `tests/fixtures/term-translation/evaluation-cases.json`，按契约分别取得参考资料 add 与任务 query 授权后，通过 TinyCode 当前配置模型跑一次受控评测；逐条判定最终译文与术语适用性，确认固定术语、占位符、search→模型→检查轨迹和 HITL 路由全部符合预期，并记录 token/成本及失败样例到 `specs/001-csv-term-translation/delivery-report.md`；不使用用户 CSV，任一硬规则失败或人工判定不通过时按回流规则修复并重跑。
- [ ] T057 在 `specs/001-csv-term-translation/delivery-report.md` 汇总四轴交付结论、关键设计/实施决策、自动化验收与受控模型评测证据、未解决问题及后续 Action；结论须引用可复核的测试或运行结果，不用会话叙述替代证据。

- [ ] T058 在 `../tinycode-worktrees/csv-term-translation` 完成最终集成批次提交，纳入 `tests/harness.e2e.test.ts`、`specs/001-csv-term-translation/quickstart.md`、`README.md`、`ARCHITECTURE.md` 和交付报告；核对工作树及各 Agent 分支均无未集成改动，清理临时 Agent worktree，保留实现 worktree；不推送远端。

---

## 依赖与执行顺序

### 阶段依赖

- Phase 1 无依赖；Phase 2 依赖 Phase 1；Phase 3-7 依赖共享类型和授权契约。
- 用户故事 4 必须先于用户故事 1：每条翻译和 judge 都依赖可用本地记忆 search。
- 用户故事 2 和用户故事 3 都依赖用户故事 1；由于两者都会修改 `src/term-translation/workflow.ts`，按 US2 后 US3 的顺序实现并分别执行 T047、T051 批次提交。
- Phase 7 依赖所有纳入交付范围的用户故事。

### 用户故事依赖

- **US4（P1）**：依赖 Phase 1-2；提供本地参考资料 add/search 和来源生命周期。
- **US1（P1）**：依赖 US4；提供可恢复翻译 MVP。
- **US2（P1）**：依赖 US1；增加冲突分组、人工决定及批准落盘。
- **US3（P2）**：依赖 US1；增加未知词增量工作簿。

### Agent worktree 与集成规则

- T001 建立唯一的实现主 worktree 和 `feature/csv-term-translation` 功能分支。主控负责依赖与共享契约、集成、验收和 T005/T020/T040/T047/T051/T058 批次提交。
- 每个并行 Agent 使用独立 worktree 和临时分支，均从最近一次已集成的功能分支提交点创建；只领取下方明确分配的任务和文件。Agent 完成后提交到自己的临时分支，由主控审查差异并在故事门禁通过后 squash 集成，禁止多个 Agent 同时编辑同一文件或直接推送。
- 每轮最多并行处理无依赖且文件不重叠的任务。一个文件在同一轮只有一个负责人；跨故事复用的 `glossary.ts`、`workflow.ts`、`csv-term-translation.ts` 和 `glossary.test.ts` 按依赖顺序由单一负责人接续。
- 此处多 Agent 指开发期的子代理委派和代码 worktree；计划中的运行时工作流仍遵守每条 CSV 记录不创建子 Agent 的约束。

### 交付失败回流

- **缺材料或来源不可信**：返回 US4，补齐场景、参考资料映射、来源版本或授权边界，再重跑记忆导入验收。
- **推理路径不符合契约、超预算或缺少调用证据**：返回 US1，检查 search、提示上下文、judge、批次和调用轨迹，再重跑翻译独立验收。
- **译文质量不达标或冲突判定证据不足**：返回 US1/US2，补充回归样例、检查规则或 HITL 交互，再重跑失败样例及冲突组验收。
- **工具、skill、CLI/TUI 或跨平台安装无法交付**：返回 Phase 7 对应集成项；若根因属于材料、推理或评测，则回到责任关口，不以文档声明替代行为验收。
- **全部门禁通过**：完成 T057，交付 Report、方案、Action 与 Eval 证据；存在阻塞失败时不得标记交付完成。

### 可并行任务

- US4：T006-T010 的测试文件可并行；T011-T013 分别维护 `glossary.ts`、`mem0-adapter.ts`、`source-manifest.ts`，在共享类型和测试契约确定后可并行；T014-T016 由同一 Agent 顺序维护 `memory.ts`；T017/T018 在 memory API 稳定后可并行；T019 由主控集成。
- US1：T021-T027 的测试文件可并行；T028-T030 可由不同 Agent 分别负责 CSV、翻译与质量模块；T031/T032 顺序交给质量模块负责人；T033/T034 由同一 Agent 协调 workflow 与批次；T036/T037 的 TUI/CLI 授权和 T039 项目 skill 可在契约确定后并行；T035/T038 由主控完成工具与 bootstrap 集成。
- US2：T041/T042 的测试文件可并行；T043/T044 由同一 Agent 顺序维护 `conflicts.ts`；T045/T046 由同一 Agent 顺序完成 workflow 审核与工具适配。
- US3：T048 先完成测试；T049/T050 共用跨故事文件，交给同一 Agent 顺序实现。
- Phase 7：T052/T053/T054 分别维护端到端测试、quickstart/README、架构文档，可并行；T055 等实现合并后统一验收，T056 依赖自动化验收与模型配置，T057 依赖 T055/T056 证据，最后执行 T058。

### 多 Agent 执行示例

- US4 测试波：Agent A 在独立 worktree 处理 T006/T010，Agent B 处理 T007/T009，Agent C 处理 T008；全部测试先建立并确认失败。实现波再由不同 Agent 分别处理 T011、T012、T013；依赖合并后由单一 Agent 顺序处理 T014-T016，再并行处理 T017/T018，主控完成 T019。
- US1 测试波：最多三个 Agent 按不同文件分配 T021-T027，全部测试先建立并确认失败。实现波中 Agent A 处理 T028，Agent B 处理 T029，Agent C 顺序处理 T030-T032；下一波由单一 Agent 处理 T033/T034，其他 Agent 并行处理 T036、T037、T039，主控完成 T035/T038。
- US2：Agent A 在独立 worktree 处理 T041，Agent B 处理 T042；测试契约稳定后由同一 Agent 顺序完成 T043/T044/T045/T046，避免共享 workflow 和工具文件发生并发冲突。
- US3：Agent A 在独立 worktree 先完成 T048，再顺序完成 T049/T050；不得与 US1/US2 尚未集成的 `glossary.ts` 或 `workflow.ts` 改动并行。
- Phase 7：Agent A 处理 T052，Agent B 处理 T053，Agent C 处理 T054；主控集成后执行 T055-T057 并提交 T058。

## 实施策略

### MVP 范围

1. 完成 Phase 1-3，确保材料、来源授权和本地记忆可复核。
2. 完成 Phase 4，交付先 search、再生成并可恢复输出的英文翻译闭环；用固定样例验证结果和关键调用轨迹。
3. MVP 门禁失败时按原因回到关口 1、2 或 3 修复；通过后再增加 US2 的冲突审核和 US3 的术语增量。

### 四板斧交付顺序

1. **场景材料与外部能力**：明确问题和可信资料，验证参考工作簿结构、Mem0/Qdrant、外发范围与授权。
2. **Agent 编排与推理**：按可追溯轨迹验证检索、词项识别、翻译、judge 调用、批处理和结果恢复；推理不符、预算超限或证据不足时回到本关。
3. **评测与调优**：运行固定回归样例、脚本校验、LLM judge、按批抽查和冲突组 HITL；质量不达标时修改规则/提示并重跑评测。
4. **全栈产品交付**：完成 AgentTool、项目 skill、TUI/headless 授权、来源管理、输出文件和跨平台 quickstart；只有四轴门禁全部通过才生成交付报告。

## 任务格式校验规则

- 每个任务必须严格使用 `- [ ] T编号 [P?] [US编号?] 描述与精确文件路径`；Setup/Foundational/Polish 不加 Story 标签。
- `[P]` 仅用于文件不同且没有待完成依赖的任务；测试任务先于对应实现任务。
- 实现数据模型字段约束时，任务需引用 `data-model.md` 的准确 `实体.字段`，不复制另一份字段规则。
- 每项任务只处理一个可验收的模块/行为边界；跨模块编排只在 workflow 集成任务中连接已完成组件。
