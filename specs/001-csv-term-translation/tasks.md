# 任务：CSV 词条英文翻译与消歧

**输入**：`specs/001-csv-term-translation/` 中的规格与设计文档

**前置条件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/skill-workflow.md`

**组织方式**：先完成共享准备，再按用户故事优先级交付；每个用户故事先补验收测试，再实现对应行为。

## Phase 1：准备

**目的**：加入 CSV、工作簿、中文分词和 Mem0 OSS 本地记忆所需依赖。

- [ ] T001 在 `package.json` 和 `package-lock.json` 中加入 `csv-parse`、`csv-stringify`、`exceljs`、`jieba-wasm`、`mem0ai` 和 `@qdrant/js-client-rest`；固定 Mem0 SDK 与测试 Qdrant 服务版本，并验证 `infer: false`、loopback REST 连接、服务数据目录重启持久化及 metadata `in` filter。

---

## Phase 2：基础能力

**目的**：定义各模块共享的数据和任务级外发授权契约，阻塞后续用户故事。

- [ ] T002 定义 `src/term-translation/types.ts` 的任务、CSV 记录、参考术语、记忆条目与检索结果、导入来源、翻译候选、审核事项和增量条目结构；字段遵循 `data-model.md` 中的 `翻译任务.状态/批次/幂等`、`CSV记录.审核状态/错误说明`、`参考记忆条目.source id/hash/chunk/source location/model/vector`、`记忆检索结果.条目/来源/相似度`、`翻译候选.占位符信息/失败原因`、`冲突组与人工审核事项.审核记录`、`增量参考条目.字段`。
- [ ] T003 定义 `src/term-translation/consent.ts` 的授权契约，区分 add 外发新内容时的单次授权、任务级记忆 search query/冲突 Embedding 授权与通用工具权限；明确 query 只含当前词项及必要 comment/场景；同来源同内容重复 add 不请求授权。
- [ ] T004 [P] 在 `tests/term-translation/memory.test.ts` 启动隔离的 loopback Qdrant 服务并指定临时持久目录，使用确定性 embedding fixture，覆盖 Mem0 原文 add/search、重复导入幂等、同源更新只返回 active version、软删除后不命中、恢复/回滚后只命中所选版本、操作失败保留原状态、服务重启后检索、跨项目隔离、Mem0/Qdrant telemetry 禁用、未授权不外发及失败回滚。
- [ ] T005 在 `src/term-translation/mem0-adapter.ts` 实现 Mem0 OSS TypeScript SDK 适配：先设置 `MEM0_TELEMETRY=false` 再动态加载 `mem0ai/oss` 的 `Memory`；使用 `infer: false` 写入原文片段并关闭历史存储；Qdrant 通过 `http://127.0.0.1:6333` loopback REST endpoint 连接，由服务持久化 TinyCode 用户数据目录；使用按项目隔离的 collection 和稳定 `userId`；支持 metadata filter 的 search，限制返回最多 5 条。
- [ ] T006 在 `src/term-translation/source-manifest.ts` 与 `src/term-translation/memory.ts` 实现来源版本清单及 add/search/版本状态编排：解析后生成稳定 chunk 和 SHA-256 来源版本及行/sheet 定位；同内容来源先本地去重跳过，新增/变更内容需用户授权后再经 Mem0 add；完整写入新版本后原子切换 active-version key，并保留旧版本；search 通过 Mem0 metadata `in` filter 只检索未软删除来源的 active 版本；软删除标记来源状态并排除其所有版本；恢复/回滚时原子切换到用户指定的保留版本；任何失败均保留原状态且不发布半成品。
- [ ] T007 在 TUI 和 headless CLI 的 add 入口接入参考文档外发授权；仅在内容需要新建/更新 Embedding 时请求一次授权；拒绝、无 TTY 或授权回调失败时不请求 Embedding API 且不将来源标记为可用。任务级授权同时覆盖含当前词项及必要 comment/场景的记忆 search query 与冲突相似度 Embedding。
- [ ] T008 在 `src/tools/add-reference-material.ts` 实现并导出 `add_reference_material` AgentTool，并在 `src/tools/manage-reference-memory.ts` 实现 `manage_reference_memory` AgentTool，二者均在 `src/tools/index.ts` 与 `src/bootstrap.ts` 注册；add 接收用户明确提交的参考工作簿路径并计算来源指纹，仅需新建/更新外发索引时请求一次授权；管理工具支持按来源软删除、恢复或回滚到指定保留版本，不调用 Embedding API；重复内容本地跳过，工具返回来源状态和版本信息。

---

## Phase 3：用户故事 1 - 翻译 CSV 中的新词条（P1，MVP）

**目标**：先从本地参考记忆检索，再从一个 UTF-8 CSV 生成保留原始数据的英文翻译副本；能分批保存和呈现未完成原因。

**独立验收**：用持久记忆 fixture 和小型 CSV 验证每条翻译与 judge 前先 search 且只注入最多 5 条结果；输出保真，伪代码术语候选执行自动核对与抽查；超过 1000 条时分批，翻译和 LLM judge 的并发总数不超过 10，已完成批次可恢复。

### 测试任务

- [ ] T009 [P] [US1] 在 `tests/term-translation/csv.test.ts` 覆盖 UTF-8/BOM、引号与多行字段、必需列校验、原列与行保真、固定输出路径、审核状态和错误说明；字段遵循 `data-model.md` 的 `CSV记录.词条/comment/词条来源/英文翻译/审核状态/错误说明`。
- [ ] T010 [P] [US1] 在 `tests/term-translation/glossary.test.ts` 覆盖参考工作簿读取、完整词条优先、静态术语自定义词典及伪代码术语不进入词典；伪代码术语属性和备注只影响命中候选，遵循 `data-model.md` 的 `词项与参考术语.伪代码术语标记/备注/comment`。
- [ ] T011 [P] [US1] 在 `tests/term-translation/translation.test.ts` 覆盖自然英文生成、只向模型提供当前词条及 search 命中的最多 5 条参考项、伪代码术语 judge 的命中备注范围，以及花括号和编号百分号占位符规则；字段遵循 `data-model.md` 的 `翻译候选.候选英文/占位符信息/失败原因`。
- [ ] T012 [P] [US1] 在 `tests/term-translation/workflow.test.ts` 覆盖每条翻译与 judge 调用前先 search、search 失败时 fail-closed、最多注入 5 条相关项、1000/1001 条批次边界、翻译与 judge 合计并发上限 10、批次落盘、批准译文重跑恢复、失败候选继续处理，以及伪代码术语脚本检查、judge、5% 抽样和抽查失败升级全批复核；规则遵循 `data-model.md` 的 `翻译任务.批次/局部失败/状态` 与 `记忆检索结果`。
- [ ] T013 [P] [US1] 在 `tests/tui.test.ts`、`tests/cli.test.ts` 和 `tests/harness.e2e.test.ts` 覆盖 TUI 启动任务时自动授权、headless 交互 TTY 单次确认、无 TTY 或拒绝时不外发，以及翻译工具注册和调用。

### 实现任务

- [ ] T014 [P] [US1] 在 `src/term-translation/csv.ts` 实现 UTF-8/BOM 校验、CSV 解析与保真、必需列检查、逐行状态和错误说明、固定命名输出及安全写入；约束引用 `data-model.md` 的 `CSV记录.词条/comment/词条来源/英文翻译/审核状态/错误说明` 与 `翻译任务.输入/输出/幂等`。
- [ ] T015 [P] [US1] 在 `src/term-translation/glossary.ts` 实现只读解析基线工作簿和 add 输入的指定工作表、完整词条和词级记忆片段及静态术语词典构建；不得由翻译流程直接读取整本工作簿；伪代码术语不得加入词典，遵循 `data-model.md` 的 `词项与参考术语.静态术语/伪代码术语标记/备注/comment`。
- [ ] T016 [US1] 在 `src/term-translation/translation.ts` 实现 jieba 分词、当前词条 search 上下文（最多 5 条）、伪代码术语命中属性与备注输入、复用 search 结果的 LLM judge 输入，以及所有译文的占位符校验；search 失败时阻止该条模型调用，遵循 `data-model.md` 的 `记忆检索结果` 和 `翻译候选.候选英文/占位符信息/失败原因`。
- [ ] T017 [US1] 在 `src/term-translation/workflow.ts` 编排最多 1000 条一批、翻译与 judge 共享并发上限 10、整批落盘、失败后继续、批准记录恢复和最终完成状态；对伪代码术语执行全量脚本检查与 judge，再按批抽样，遵循 `data-model.md` 的 `翻译任务.批次/局部失败/状态` 和 `CSV记录.审核状态/错误说明`。
- [ ] T018 [P] [US1] 在 `src/tui/external-data-consent.ts` 实现 TUI 启动翻译任务时自动允许该任务所需的记忆 search query（当前词项及必要 comment/场景）和去重词项；在 `src/cli/external-data-consent.ts` 实现 headless 交互 TTY 单次确认及无 TTY/拒绝时阻止外发。
- [ ] T019 [P] [US1] 编写 `.tinycode/skills/csv-term-translation/SKILL.md`，说明用户将受支持 XLSX 作为参考资料提交时自动 add、内容去重与外发授权、自动 search、翻译启动、任务级授权、草稿/未完成状态和固定输出文件。
- [ ] T020 [US1] 在 `src/tools/csv-term-translation.ts` 实现翻译 AgentTool 适配器，并在 `src/tools/index.ts` 导出、在 `src/bootstrap.ts` 注册和注入当前模型、`streamFn` 与授权回调。

**检查点**：仅完成本故事时，可在持久参考记忆上运行一个 CSV 并得到可恢复的翻译副本；翻译及 judge 均可追溯至 search 结果，需要人工处理的记录仍清晰标为未完成。

---

## Phase 4：用户故事 2 - 审核实体歧义与翻译冲突（P1）

**目标**：按关联冲突组提供相似度提示和完整审核上下文；只有用户批准后才应用冲突解决译文。

**独立验收**：相同词项与 comment 的译文冲突归为一组；可能相关的不同词项按 0.7 阈值提示；每个冲突组作为单个审核事项展示其全部记录和拟议变更；未获批准的改动保持待审核。

### 测试任务

- [ ] T021 [P] [US2] 在 `tests/term-translation/workflow.test.ts` 覆盖去重词项 Embedding、0.7 阈值边界、同词不同 comment 的语境冲突、冲突组聚合、无关组不合并及用户决定前不应用拟议译文；字段遵循 `data-model.md` 的 `冲突组与人工审核事项.审核记录/拟议变更`。

### 实现任务

- [ ] T022 [US2] 在 `src/term-translation/workflow.ts` 实现冲突相似度的去重词项 Embedding 请求、余弦相似度及 0.7 提示规则；从 `OPENAI_API_KEY` 读取凭据，不发送 comment、来源或整行 CSV，授权失败或 API 不可用时保留待审状态并报告未完成。
- [ ] T023 [US2] 在 `src/term-translation/workflow.ts` 按相同词项/comment 和相关英文译法构建冲突组；每组生成一个包含全部关联记录、拟议变更及审核所需字段的事项，缺失上下文留空并标明，不得编造；字段遵循 `data-model.md` 的 `冲突组与人工审核事项.单词/comment/词条来源/翻译/翻译描述/使用场景/utf-8的字节长度/字符长度`。
- [ ] T024 [US2] 在 `src/term-translation/workflow.ts` 和 `src/term-translation/csv.ts` 应用人工批准或拒绝的决定；未批准前维持待审核，拒绝实体合并后保留待审核直到替代译文获批，并同步更新所有关联行的审核状态；状态遵循 `data-model.md` 的 `CSV记录.审核状态`。

**检查点**：所有冲突都可追溯到一个明确的人工决定；相似度不自动批准或修改译文。

---

## Phase 5：用户故事 3 - 产出高频未知词条的参考资料增量（P2）

**目标**：把达到频次门槛的未知词条整理为独立工作簿，供用户审核和手动合并。

**独立验收**：同一词项与 comment 出现至少 3 次时，增量工作簿列出候选英文、描述和场景；低于门槛时不列为高频新增术语；原始参考工作簿保持不变，增量资料待审核不阻止已完成的 CSV 标记完成。

### 测试任务

- [ ] T025 [P] [US3] 在 `tests/term-translation/glossary.test.ts` 覆盖按词项与相同 comment 计数、3 次门槛、增量工作簿字段及原参考工作簿只读；字段遵循 `data-model.md` 的 `增量参考条目.中文词项/候选英文/comment/翻译描述/使用场景/出现次数`。

### 实现任务

- [ ] T026 [US3] 在 `src/term-translation/glossary.ts` 实现未知词项与相同 comment 的频次统计，并生成 `<原文件名>_translated_glossary_delta.xlsx`；只输出达到 3 次门槛的候选，不修改版本化参考工作簿，字段遵循 `data-model.md` 的 `增量参考条目.中文词项/候选英文/comment/翻译描述/使用场景/出现次数`。
- [ ] T027 [US3] 在 `src/term-translation/workflow.ts` 接入增量工作簿生成，并确保增量资料待人工审核不会改变 CSV 译文完成状态；输出遵循 `data-model.md` 的 `翻译任务.输出/状态`。

**检查点**：增量资料可单独审核和合并；CSV 与原始参考工作簿的边界保持明确。

---

## Phase 6：收尾与跨故事验收

- [ ] T028 更新 `specs/001-csv-term-translation/quickstart.md`，使 add/search、本地持久化、来源幂等、外发授权、输出路径、任务级授权、审核状态和失败恢复描述与实现一致。
- [ ] T029 按 `package.json` 验证 `npm test`、`npm run typecheck`、`npm run lint` 和 `npm run build`；覆盖 `tests/term-translation/` 与 `tests/harness.e2e.test.ts` 中的功能验收，并修复发现的问题。

---

## 依赖与执行顺序

### 阶段依赖

- 准备阶段完成后进入基础能力阶段；基础能力完成后才能开始用户故事。
- 本地记忆基础能力（T004-T008）和基线工作簿 add 必须在 US1 开始翻译前完成；US1 每条翻译/judge 都依赖 search。
- 用户故事 1 是 MVP，用户故事 2 和 3 均依赖用户故事 1 产生的翻译候选及固定输出。
- 用户故事 2 和 3 可在用户故事 1 完成后并行实现；整合到 `workflow.ts` 的改动需协调提交顺序。
- 收尾验收依赖计划纳入交付的用户故事实现完成。

### 用户故事依赖

- **US1（P1）**：依赖准备和基础能力；提供独立 CSV 翻译、持久化及未完成状态。
- **US2（P1）**：依赖 US1 的候选与任务授权契约；实现冲突分析、分组审核和决定应用。
- **US3（P2）**：依赖 US1 的候选和参考匹配；实现高频未知词增量输出。
- **T004-T008**：共享持久记忆基础能力，作为 US1/US2/US3 的前置依赖；按用户明确提交资料执行 add，不自动吸收未审核译文。

### 可并行工作

- 基础类型 `src/term-translation/types.ts` 与授权契约 `src/term-translation/consent.ts` 可并行定义。
- US1 的 CSV、glossary、translation、workflow、TUI/CLI 授权测试可先并行编写；各模块测试稳定后，再并行实现不同文件中的 CSV、参考工作簿和授权适配器。
- US1 完成后，US2 冲突测试与 US3 增量测试可并行准备；US2 与 US3 共用 `workflow.ts` 的部分应串行整合。

## 实施策略

### 先交付 MVP（持久记忆基础能力 + US1）

1. 完成依赖、共享类型和授权契约。
2. 完成 T004-T008，使基线和用户提交资料可授权 add、持久保存并 search。
3. 完成 US1 的测试与实现，确保每条 CSV 记录先 search，再翻译、审核、分批保存和失败恢复闭环。
4. 验收记忆持久化和 US1 独立场景；检索未完成时任务必须保持未完成。
5. 再交付 US2 冲突审核和 US3 参考资料增量。

### 增量交付顺序

1. 准备与基础能力：类型、依赖和任务授权契约就绪。
2. 持久记忆：交付可恢复、可幂等更新的 add/search 和初始工作簿导入。
3. US1：交付基于记忆检索的可恢复翻译 CSV MVP。
4. US2：增加按组人工审核和实体歧义处理。
5. US3：增加高频未知词的独立参考资料增量。
6. 执行跨故事验收与 quickstart 对齐。

## 备注

- 每项任务使用 `- [ ] T编号 [P?] [US编号?] 描述与文件路径` 格式；`[P]` 仅用于无未完成依赖且改动文件可并行的任务。
- `data-model.md` 是字段约束的唯一依据；任务中的实体字段引用用于定位规范，不复制约束正文。
- 本任务清单尚未执行；实施前仍须由用户审核计划和任务拆分。
