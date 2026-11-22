# Research: CSV 词条英文翻译与消歧

**日期**: 2026-11-22

## 1. TinyCode 接入方式

**Decision**: 使用 TinyCode 项目级 skill 配合一个 feature AgentTool；复用现有 Agent 循环、模型配置、工具注册和权限门禁。

**Rationale**: `src/skills/registry.ts` 会从项目根目录的 `.tinycode/skills/<name>/SKILL.md` 发现技能，并只把名称和说明放入系统提示；完整说明通过 `load_skill` 延迟加载。工具在 `src/bootstrap.ts` 注册，测试使用 `tests/skills.test.ts` 和 `tests/harness.e2e.test.ts` 的既有模式。当前仓库没有 `.tinycode/`，可直接增加项目级技能。

**Alternatives considered**:
- 增加独立 Web 应用或服务：与 TinyCode 单用户本地 CLI 的现有边界不符，会引入部署和账户复杂度。
- 只让模型通过通用 `read`/`write` 工具手工编辑 CSV：无法稳定保留带引号的字段、原始列和行边界，也难以保证审核状态及幂等写入。
- 把功能接入通用 Agent runtime：影响所有项目；项目级 skill 和单一专用工具已经足够。

**Sources**: `src/skills/loader.ts`、`src/skills/registry.ts`、`src/bootstrap.ts`、`tests/skills.test.ts`、`tests/harness.e2e.test.ts`。

## 2. CSV 读写

**Decision**: 使用 `csv-parse` 和 `csv-stringify`。输入以 UTF-8 解码并显式处理 BOM；解析器负责 CSV 引号、逗号和多行字段。输出只变更 `英文翻译` 与 `审核状态` 列。

**Rationale**: 仓库目前没有 CSV 解析依赖。CSV 格式存在转义和行边界规则，结构化解析比手写逗号切分更可靠。两包采用 MIT 许可，并支持 Node 流式接口；当前 npm registry 元数据版本为 `csv-parse` 7.0.3。

**Alternatives considered**:
- 手写 CSV parser：无法简洁覆盖引号、换行和转义边界，违背正确性要求。
- `papaparse`：可用，但项目以 Node 批处理为主，`csv-parse`/`csv-stringify` 的 Node API 更直接。

**Sources**: [csv-parse on npm](https://www.npmjs.com/package/csv-parse)、[csv-stringify on npm](https://www.npmjs.com/package/csv-stringify)。

## 3. XLSX 参考工作簿

**Decision**: 使用 MIT 许可的 `exceljs` 读取版本化参考工作簿，并生成独立增量 `.xlsx`；运行时不修改仓库内原始工作簿。

**Rationale**: 功能需要读取现有工作表并按相近结构生成术语增量。ExcelJS 当前 npm 元数据版本为 4.4.0，支持 Node 读写 xlsx。工作簿体积约 3.9 MB；ExcelJS 依赖包解包约 21.8 MB，是本方案主要新增体积。

**Workbook observations**:
- `注意要点_中英` 首行为 `中文`、`英文`、`伪代码术语`、`备注`。
- `翻译简写说明` 首行为 `序号`、`中文`、`英文`、`英文缩写`、`西语翻译`。
- `要注意的Comment（研发人员加）` 和 `翻译省略` 是说明/规则型工作表，不保证与主术语表使用相同表头布局；解析按各自工作表约定处理。
- 指定的四个工作表均存在于仓库资产 `assets/glossary/常用注意要点清单.xlsx`。

**Alternatives considered**:
- `xlsx` npm 包：当前 registry 元数据版本为 0.18.5；本功能更适合采用有明确读写 API 的 ExcelJS。
- Python `openpyxl`：可读写工作簿，但会给 TypeScript 项目增加第二套运行时和跨机器环境要求。

**Sources**: [ExcelJS on npm](https://www.npmjs.com/package/exceljs)、本仓库工作簿只读检查。

## 4. 中文分词

**Decision**: 使用 `jieba-wasm` 2.4.0，基于仓库术语表动态构建自定义词典；`伪代码术语=是` 的词项不加入自定义词典。

**Rationale**: 用户明确指定 jieba。WASM 避免原生 addon 在 Windows/macOS/Linux 上编译和 ABI 不一致的安装风险；包提供 `with_dict` 自定义词典入口，满足静态领域词组保留规则。包许可为 MIT，解包约 16.1 MB。

**Alternatives considered**:
- `@node-rs/jieba`：性能较好且提供自定义词典，但需要核实目标平台对应的预编译 native package。
- `nodejieba`：支持自定义词典，但原生编译会增加跨机器安装风险。
- 其他分词库：不符合用户已明确指定 jieba 的约束。

**Sources**: [jieba-wasm on npm](https://www.npmjs.com/package/jieba-wasm)、[jieba-wasm repository](https://github.com/fengkx/jieba-wasm)。

## 5. Embedding 与相似度

**Decision**: 使用 OpenAI Embeddings API 的 `text-embedding-3-small`，通过 Node 22 内置 `fetch` 调用 `POST /v1/embeddings`；凭据从 `OPENAI_API_KEY` 读取。只对去重后的中文词项请求 embedding，使用余弦相似度；分值 `>= 0.7` 标注为语义相近候选并交给 HITL。

**Rationale**: 用户要求稠密向量语义相似度和 0.7 阈值。TinyCode 当前 `@earendil-works/pi-ai` 提供模型推理，但仓库中没有 embedding 接口；直接 HTTP 请求避免引入额外 SDK。官方文档列出 `text-embedding-3-small`，说明新 embedding 模型具备多语言能力，默认向量长度为 1536。固定模型可以减少跨机器运行结果变化。

**Alternatives considered**:
- `@huggingface/transformers` 本地向量模型：不向第三方发送词项，但需要首次下载模型、额外磁盘/内存和本地推理依赖，运行与缓存行为更复杂。
- 将聊天模型输出当作相似度：不产生用户要求的稠密向量评分，无法直接应用 0.7 阈值。
- 复用 TinyCode 当前模型 provider 的 embedding API：当前 pi-ai 集成中没有可用的 embedding 接口，不能假设聊天模型凭据支持该 endpoint。

**External-data boundary**: embedding 请求包含中文词项，不包含 comment、词条来源、整行 CSV 或术语工作簿备注。需要网络和 API 凭据；失败时不得把冲突静默视为通过或将任务标记为完成。翻译文本仍由用户当前配置的 TinyCode 模型生成。

**Sources**: [OpenAI embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)、`package.json` 和 `src/model/registry.ts`。

## 6. 输出幂等与审核状态

**Decision**: CSV 输出名固定为输入文件名加 `_translated` 后缀，增量工作簿名固定为输入文件名加 `_translated_glossary_delta` 后缀。两者写入输出目录；写入先生成同目录临时文件，再原子替换固定目标。相同输入记录重跑时复用已批准译文和审核决定，只重算未完成记录。

**Rationale**: 固定目标路径避免重试产生重复副本；按数据记录位置及 `词条`、`comment`、`词条来源` 匹配已批准结果，避免模型重试覆盖用户决定。应用层使用 Map 分组和索引，不使用 SQL 或数据库。

**Alternatives considered**:
- 每次生成带时间戳的新文件：重试不幂等，用户难以判断权威输出。
- 先覆盖输入再恢复：失败时可能破坏源文件，与规格和宪法冲突。

## 7. 测试方式

**Decision**: 用 Vitest 覆盖 CSV 编码/保真、工作簿 sheet 选择、jieba 自定义词典、0.7 阈值、冲突状态、批准后的幂等写入和完成检查；Embedding 请求通过可控 fetch mock 验证。

**Rationale**: 关键验收行为不依赖外网或真实模型，避免 API 成本和结果非确定性。既有 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 可作为实现阶段检查。

**Sources**: `package.json`、`vitest.config.ts`、`tests/`。
