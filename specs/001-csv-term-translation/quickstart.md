# Quickstart: CSV 词条翻译

本指南用于实现完成后的端到端验收。它不代表当前仓库已经实现了翻译功能。

## Prerequisites

- Node.js 22.19 或更高版本。
- 在仓库根目录执行 npm ci。
- 翻译 skill 使用当前 TinyCode Agent 模型。
- 近义词提示使用 OpenAI Embeddings API；运行前通过环境变量设置 OPENAI_API_KEY。不要把密钥写入仓库。
- 仓库包含 assets/glossary/常用注意要点清单.xlsx 及四个指定 sheet。

## Run scenario

1. 在仓库根目录启动 TinyCode：

        npm run dev

2. 提供一个包含词条、comment、词条来源、英文翻译列的 UTF-8 CSV 路径，并要求使用 csv-term-translation skill。
3. 检查 Agent 的预检结果：目标语言为英文，参考工作簿路径为仓库内版本化资产，输入文件未被修改。
4. 对待审核项检查字段：单词、comment、词条来源、翻译、翻译描述、使用场景、utf-8的字节长度、字符长度。
5. 对相似度达到 0.7（含）的不同中文词项确认是否为同一实体；对于相似度低于 0.7 或相同词项不同 comment 的冲突，审核拟议译文修改后再批准。
6. 检查同目录输出文件 `<原文件名>_translated.csv` 和 `<原文件名>_translated_glossary_delta.xlsx`。CSV 的列序和记录顺序与输入相同；待审记录不得标记为完成。
7. 对相同输入重复运行，确认复用同一输出路径、保留已批准记录，并且原始 CSV 与参考工作簿未变化。

## Deterministic checks

使用本地 fixture 和 mock fetch，不调用真实 Embeddings API：

    npm test -- tests/term-translation
    npm run typecheck
    npm run lint
    npm run build

预期：CSV 引号/BOM/多行字段正确往返；无效 UTF-8、缺失列和缺失 sheet 不报告成功；0.699 与 0.7 的阈值行为不同；所有冲突均保留 HITL；重跑不产生第二个输出文件，也不覆盖已批准译文。
