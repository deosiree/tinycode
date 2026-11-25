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

**Decision**: 使用 `csv-parse` 和 `csv-stringify`。输入以 UTF-8 解码并显式处理 BOM；解析器负责 CSV 引号、逗号和多行字段。输出更新 `英文翻译`，并写入逐行 `审核状态` 与 `错误说明`。

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

**Decision**: 使用 `jieba-wasm` 2.4.0，基于仓库术语表动态构建自定义词典；`伪代码术语=是` 的词项不加入自定义词典。翻译 prompt 和对应的 LLM judge 均按当前候选筛选实际命中的参考条目，只注入相关条目及其属性、备注，不注入整份术语表；翻译模型用其生成译文，judge 用其核对译文。

**Rationale**: 用户明确指定 jieba。WASM 避免原生 addon 在 Windows/macOS/Linux 上编译和 ABI 不一致的安装风险；包提供 `with_dict` 自定义词典入口，满足静态领域词组保留规则。包许可为 MIT，解包约 16.1 MB。

**Alternatives considered**:
- `@node-rs/jieba`：性能较好且提供自定义词典，但需要核实目标平台对应的预编译 native package。
- `nodejieba`：支持自定义词典，但原生编译会增加跨机器安装风险。
- 其他分词库：不符合用户已明确指定 jieba 的约束。

**Sources**: [jieba-wasm on npm](https://www.npmjs.com/package/jieba-wasm)、[jieba-wasm repository](https://github.com/fengkx/jieba-wasm)。

## 5. Embedding 与相似度

**Decision**: 使用 OpenAI Embeddings API 的 `text-embedding-3-small`，通过 Node 22 内置 `fetch` 调用 `POST /v1/embeddings`；凭据从 `OPENAI_API_KEY` 读取。记忆 search query 使用当前词项及必要 comment/场景，冲突相似度只使用去重中文词项；TUI 启动翻译任务时自动授权本次任务所需的全部 query 文本，headless 通过 `-p` 的交互式 TTY 确认一次。每次 add 若需要外发尚未索引的参考文档内容，则在发送前对该次操作另行取得一次明确授权；同来源、同内容已索引时本地幂等跳过，不请求授权或外发。内置基线首次 add 同样遵循该规则。使用余弦相似度，分值 `>= 0.7` 标注为语义相近候选并交给 HITL。

**Rationale**: 用户要求稠密向量语义相似度和 0.7 阈值。TinyCode 当前 `@earendil-works/pi-ai` 提供模型推理，但仓库中没有 embedding 接口；直接 HTTP 请求避免引入额外 SDK。官方文档列出 `text-embedding-3-small`，说明新 embedding 模型具备多语言能力，默认向量长度为 1536。固定模型可以减少跨机器运行结果变化。

**Alternatives considered**:
- `@huggingface/transformers` 本地向量模型：不向第三方发送词项，但需要首次下载模型、额外磁盘/内存和本地推理依赖，运行与缓存行为更复杂。
- 将聊天模型输出当作相似度：不产生用户要求的稠密向量评分，无法直接应用 0.7 阈值。
- 复用 TinyCode 当前模型 provider 的 embedding API：当前 pi-ai 集成中没有可用的 embedding 接口，不能假设聊天模型凭据支持该 endpoint。

**External-data boundary**: 翻译请求可接收当前词条、comment、词条来源及本地 search 返回的最多 5 条相关术语，不接收整份工作簿、整份记忆库或无关 CSV 行。每次 add 只在存在需新建或更新索引、且需外发的内容时，于发送前对该次操作授权一次；相同来源和内容已索引时直接本地跳过，不授权、不外发。记忆 search 只发送当前词项及必要 comment/场景，冲突比较只发送本次任务所需的去重中文词项；TUI 沿用任务级自动授权，headless 通过交互式 TTY 确认一次。授权拒绝或 API 失败时不得静默跳过索引/检索或将任务标记为完成。

**Sources**: [OpenAI embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)、`package.json` 和 `src/model/registry.ts`。

## 6. 输出幂等与审核状态

**Decision**: CSV 输出名固定为输入文件名加 `_translated` 后缀，增量工作簿名固定为输入文件名加 `_translated_glossary_delta` 后缀。翻译 CSV 包含逐行“审核状态”和“错误说明”；两者写入输出目录；写入先生成同目录临时文件，再原子替换固定目标。相同输入记录重跑时复用已批准译文和审核决定，只重算未完成记录并更新错误说明。

**Rationale**: 固定目标路径避免重试产生重复副本；按数据记录位置及 `词条`、`comment`、`词条来源` 匹配已批准结果，避免模型重试覆盖用户决定。翻译输出与长期参考记忆职责分离，用户提交的参考资料按独立来源身份写入本地向量数据库。

**Alternatives considered**:
- 每次生成带时间戳的新文件：重试不幂等，用户难以判断权威输出。
- 先覆盖输入再恢复：失败时可能破坏源文件，与规格和宪法冲突。

## 7. 测试方式

**Decision**: 用 Vitest 覆盖 CSV 编码/保真、工作簿 sheet 选择、jieba 自定义词典、0.7 阈值、占位符完整性/顺序、按组聚合的 HITL、冲突状态、批准后的幂等写入和完成检查；模型与 Embedding 请求通过 mock 验证；另覆盖 1000 条批次边界、翻译与 LLM judge 模型调用合计并发上限 10、批次完成后的结果持久化、单候选失败后的继续处理、TUI 自动任务级授权、headless 单次授权及无交互 TTY 时拒绝外发。伪代码术语覆盖率检查应验证全量脚本与 LLM judge；未通过候选保留失败原因、排除在随机抽查之外并阻止整体完成；通过候选按批 5% 向上取整且至少 1 条随机抽查，抽查失败后升级为该批全量 HITL 复核。

**Rationale**: 关键验收行为不依赖外网或真实模型，避免 API 成本和结果非确定性。既有 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 可作为实现阶段检查。

**Sources**: `package.json`、`vitest.config.ts`、`tests/`。

## 8. 本地向量记忆

**Decision**: 使用 Mem0 OSS TypeScript SDK（`mem0ai/oss`）提供通用记忆 add/search，连接仅绑定 loopback 的本机 Qdrant 服务。通过 `url: http://127.0.0.1:6333` 使用 Qdrant REST API。Windows 上 Qdrant storage 使用 Docker named volume，暂定名称为 `tinycode-csv-term-translation-qdrant`；项目级来源清单保存在 `dataHome()/memory/csv-term-translation/projects/<project-key>/source-manifest.json`。Qdrant 向量数据与来源清单分处两种本机存储，备份和恢复必须作为同一数据集配对处理。macOS/Linux 暂保留 `dataHome()/memory/csv-term-translation/qdrant/storage` 挂载方案，但须逐平台验证后才能声明支持。使用 SDK 的 `infer: false` 写入解析后的术语片段，不把术语资料交给记忆提取 LLM 改写；所有 add/search 使用稳定项目标识作为 `userId`，并使用项目专属 collection 隔离。记忆片段携带来源 ID、来源 SHA-256、sheet/行定位、chunk ID、Embedding 模型版本和 active-version key。Mem0/Qdrant 负责向量存储、Embedding 和语义检索；TinyCode 适配层只负责工作簿解析、授权、来源幂等和版本清单。

来源清单保存在 TinyCode 用户数据目录。相同来源和 SHA-256 重复 add 时不调用 Mem0，不外发；更新时先将新版本片段写入带新 active-version key 的记录，全部成功后原子更新清单，旧版本继续保留以便回滚。search 从清单读取当前有效 key 集合，通过 Mem0 元数据过滤限制检索范围，再最多返回 5 条结果。更新中断时新 key 尚未发布，不会进入检索；旧版本继续有效。用户可按来源软删除并从 search 排除其全部版本，也可选择保留版本恢复/回滚为 active；这些操作仅原子更新本地来源清单，不物理删除向量。每条翻译和 LLM judge 调用前都使用当前词条及 comment 执行 search，并附来源定位。数据库初始化、search 或 add 失败时，不得绕过记忆继续调用模型。待翻译 CSV 和未审核机器译文不会自动进入长期记忆。

**Rationale**: 用户希望 agent 能通过持续 add/search 累积参考资料，同时不把通用记忆引擎的存储、Embedding 和语义检索重复造一遍。Mem0 OSS 提供应用内 SDK，但其 TypeScript Qdrant provider 依赖 `@qdrant/js-client-rest`；Mem0 provider 虽接受 `path` 并把它传给 client，Qdrant REST client 并不支持嵌入式存储路径，所以不能据此承诺免服务的本机持久化。Qdrant 官方对 Windows Docker/WSL 主机目录挂载有数据风险提示，因此用户选择 Windows 使用 Docker named volume；来源清单继续放在 `dataHome()`，备份/恢复时需停止写入并配对处理两处数据。macOS/Linux 的既有 `dataHome()` 挂载方式仍需目标平台验证。只监听 loopback 的本机 Qdrant 服务保留本机数据边界，并继续复用 Mem0 add/search。Mem0 SDK telemetry 默认开启，须在动态导入 SDK 前设置 `MEM0_TELEMETRY=false`；Qdrant 服务 telemetry 也须通过 `QDRANT__TELEMETRY_DISABLED=true` 关闭。

**适配约束**:
- 固定并验证 `mem0ai`、`@qdrant/js-client-rest` 和本机 Qdrant 服务版本；确认 Windows named volume 的 loopback REST 连接、容器重建后持久性及向量数据/来源清单配对备份恢复；macOS/Linux 只在实测 loopback REST 与 `dataHome()` 持久化后记录为已验证。各平台均验证 `infer: false`、top-k 和元数据 `in` filter 行为。
- add 使用原文模式，并将稳定项目标识通过顶层 `userId` 传入；来源版本等字段放 metadata。不要只在 filters 中传 entity ID。
- Mem0 只接收 add 文档经授权后生成 Embedding 所需的文本；不启用提取 LLM、托管 Mem0 API 或远程向量数据库。加载 SDK 前关闭 Mem0 telemetry，本机 Qdrant 服务关闭 telemetry，并验证运行中无未声明的遥测请求。
- 来源版本由 TinyCode 清单控制；search 必须在向模型提供结果前套用 active-version 过滤并截断为 5 条。
- 软删除与版本恢复由来源清单状态及 active-version 指针控制；不得物理清除保留向量，且操作失败时必须保留原有检索状态。

**Alternatives considered**:
- 自建 LanceDB add/search 层：虽可直接控制记录和过滤，但会重复实现 Embedding、向量检索、provider 配置及其错误处理；保留为 Mem0 OSS 不满足持久化/过滤契约时的备选，不作为当前首选。
- Mem0 托管平台或远程 Mem0/Qdrant 服务：与本功能的本机数据驻留和不增加远程服务依赖要求不符。
- Mem0 TypeScript Qdrant provider 的嵌入式 `path` 模式：provider 将 `path` 传给 REST client，而 REST client 不支持本地嵌入式存储；采用 loopback Qdrant 服务满足本地持久化要求。
- 仅将 Embedding JSON 写入文件：不具备成熟的向量检索能力。

**Sources**: [Mem0 OSS Node SDK Quickstart](https://docs.mem0.ai/open-source/node-quickstart)、[Mem0 OSS configuration](https://docs.mem0.ai/open-source/configuration)、[Mem0 Qdrant provider source](https://github.com/mem0ai/mem0/blob/main/mem0-ts/src/oss/src/vector_stores/qdrant.ts)、[Qdrant JavaScript REST client](https://github.com/qdrant/qdrant-js)、[Qdrant local quickstart](https://qdrant.tech/documentation/quickstart/)、[Qdrant security](https://qdrant.tech/documentation/security/)、[Qdrant usage statistics](https://qdrant.tech/documentation/guides/usage-statistics/)、[Qdrant common errors](https://qdrant.tech/documentation/common-errors/)、[Docker volumes](https://docs.docker.com/engine/storage/volumes/)、[Mem0 OSS telemetry source](https://github.com/mem0ai/mem0/blob/main/mem0-ts/src/oss/src/utils/telemetry.ts)、[Mem0 add memory](https://docs.mem0.ai/core-concepts/memory-operations/add)、[Mem0 OSS metadata filtering](https://docs.mem0.ai/open-source/features/metadata-filtering)。
