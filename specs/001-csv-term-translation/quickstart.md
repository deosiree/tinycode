# Quickstart: CSV 词条翻译

本指南用于实现完成后的端到端验收。它不代表当前仓库已经实现了翻译功能。

## Prerequisites

- Node.js 22.19 或更高版本。
- 在仓库根目录执行 npm ci。
- 翻译 skill 使用当前 TinyCode Agent 模型。
- 本地参考记忆由 Mem0 OSS SDK 管理；本机 Qdrant 服务仅监听 `127.0.0.1:6333`，数据目录持久映射到 `dataHome()/memory/csv-term-translation/qdrant/storage`。Qdrant 服务需设置 `QDRANT__TELEMETRY_DISABLED=true`；Mem0 telemetry 在 SDK 加载前关闭。记忆不会进入 Git。
- 首次运行时，内置工作簿会 add 到本地记忆；首次 add 若需发送内容以建立向量索引，会先请求一次授权。额外参考工作簿同样如此；已导入的相同来源和内容再次提交时本地跳过，不请求授权或外发。
- 翻译和 LLM judge 请求前会先 search 本地记忆，只发送当前记录和最多 5 条检索命中，不发送无关 CSV 行或完整记忆库。
- 参考记忆及冲突近义词提示使用 OpenAI Embeddings API；通过环境变量设置 OPENAI_API_KEY。不要把密钥写入仓库。
- 仓库包含 assets/glossary/常用注意要点清单.xlsx 及四个指定 sheet。

## Run scenario

1. 在仓库根目录启动 TinyCode：

        npm run dev

2. 启动本机 Qdrant 服务并确认仅监听 `127.0.0.1:6333`、服务存储目录映射到 TinyCode 用户数据目录且 telemetry 已关闭。将用户自己的参考资料作为本 skill 输入时，工作流自动调用 `add_reference_material`；若该次 add 有尚未索引的内容需要发送给 Embedding 服务，先确认外发范围并授权一次。重复提交已导入的相同来源和内容时本地跳过，无需授权或外发；更新文件后新版本取代旧版本。
3. 提供一个包含词条、comment、词条来源、英文翻译列的 UTF-8 CSV 路径，并要求使用 csv-term-translation skill。首次运行会先将版本化初始工作簿 add 到本地记忆；若需发送尚未索引的内容，会先请求该次 add 的授权，完成后才进行翻译。
4. 检查 Agent 的预检结果：目标语言为英文，每条输入和每次 judge 调用都先 search，检索上下文最多 5 条且带来源定位；输入文件和参考工作簿未被修改。TUI 启动翻译任务后自动授权本次任务所需的 search query 文本（词项及必要 comment/场景）与相似度查询词 Embeddings 请求；headless `-p` 在交互式 TTY 中通过确认回调提示一次。无交互 TTY 时不得发出请求并应报告未完成。
5. 对待审核项检查字段：单词、comment、词条来源、翻译、翻译描述、使用场景、utf-8的字节长度、字符长度。
6. 对相似度达到 0.7（含）的不同中文词项确认是否为同一实体；对于相似度低于 0.7 或相同词项不同 comment 的冲突，审核拟议译文修改后再批准。
7. 检查同目录输出文件 `<原文件名>_translated.csv` 和 `<原文件名>_translated_glossary_delta.xlsx`。CSV 保留输入列序和记录顺序，并含“审核状态”“错误说明”两列；模拟失败时原因写入对应行的“错误说明”，待审或失败记录不得标记为完成。
8. 对相同输入重复运行，确认复用同一输出路径、保留已批准记录，并且原始 CSV 与参考工作簿未变化。重启 TinyCode 后搜索此前导入的额外资料，确认本地记忆仍可用；软删除一个来源后确认所有版本均不再命中，再恢复旧版本并确认只有所选版本可检索。
9. 使用包含伪代码术语的 fixture 验收翻译约束和三级检查：该术语不加入 jieba 自定义词典；翻译 prompt 和对应 judge 仅收到当前候选实际 search 命中的参考条目，未命中的伪代码术语不得进入；全部候选依次通过脚本和 judge 检查；未通过的候选保留失败原因、任务未完成且不进入抽样；每批对通过项随机抽查 `max(1, ceil(候选数 × 5%))` 条。模拟抽查发现备注不符时，确认该批全部伪代码术语候选进入 HITL 复核，复核完成前结果保持未完成。
10. 使用包含 `{}`、`{:.3f}`、`%1` 和 `%2` 的词条验收占位符保护：花括号占位符保持原文、数量及顺序；编号百分号占位符保持标识、格式及数量但可重排。模拟缺失、损坏或重复占位符，确认候选保留失败原因且任务未完成。
11. 模拟同批单个候选及一个模型批次调用失败，确认失败候选和原因写入对应行的“错误说明”，同批其他独立候选与后续批次继续处理、每批结果仍落盘，最后整体任务标记未完成。

## Deterministic checks

使用本地 fixture、loopback Qdrant 服务及其临时持久目录和模型/Embedding mock，不调用真实模型或 Embeddings API：

    npm test -- tests/term-translation
    npm run typecheck
    npm run lint
    npm run build

预期：CSV 引号/BOM/多行字段正确往返；无效 UTF-8、缺失列和缺失 sheet 不报告成功；Mem0 add 使用原文模式且不调用记忆提取 LLM；Mem0 SDK 与 Qdrant 服务 telemetry 均不产生网络请求；相同来源重复 add 不产生重复记录、更新后 search 不返回旧版、重启后仍可检索且不同项目互相隔离；add 未授权、Qdrant 不可用或 search 失败时不发送参考内容、不绕过检索继续调用模型并报告未完成；每条翻译和 judge 都能追溯到最多 5 条 search 结果；0.699 与 0.7 的阈值行为不同；花括号占位符原文、数量和顺序保持，`%1`/`%2` 标识、格式和数量保持且允许重排，校验失败阻止完成；同一冲突组汇总为一个 HITL 审核事项，所有冲突仍须人工决定；TUI 在任务启动时自动授权本任务的 search query 文本（当前词项及必要 comment/场景）与相似度判断 Embedding 请求，headless TTY 通过确认回调取得一次授权、无交互 TTY 时拒绝请求并报告未完成；1001 条输入拆成两个批次，任一批翻译与 LLM judge 模型调用合计并发不超过 10；完成批次先落盘；重跑不产生第二个输出文件，也不覆盖已批准译文；伪代码术语候选全部经过脚本和 LLM judge，未通过者记录失败原因并阻止完成、排除抽样；通过者每批随机抽查 5%（向上取整且至少 1 条），抽查发现备注不符时升级为该批全量 HITL 复核。
