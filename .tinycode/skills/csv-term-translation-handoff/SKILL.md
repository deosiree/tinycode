---
name: csv-term-translation-handoff
description: 根据仓库内的 Spec Kit 规格和已确认决策，继续设计或实现 CSV 词条翻译功能。
---

# CSV 词条翻译续作说明

在本仓库继续设计或实现 CSV 词条英文翻译功能时，先阅读本说明及列出的规格资产。

## 事实来源

- 功能需求和用户决定：`specs/001-csv-term-translation/spec.md`
- 实施计划和架构决策：`specs/001-csv-term-translation/plan.md`
- 依赖与集成研究：`specs/001-csv-term-translation/research.md`
- 领域字段与状态规则：`specs/001-csv-term-translation/data-model.md`
- Agent 交互契约：`specs/001-csv-term-translation/contracts/skill-workflow.md`
- 验收场景：`specs/001-csv-term-translation/quickstart.md`
- 版本化术语表：`assets/glossary/常用注意要点清单.xlsx`
- 实施任务：`specs/001-csv-term-translation/tasks.md`

## 已确认的用户决策

- 每次输入一个 UTF-8 CSV，必需列为“词条”“comment”“词条来源”“英文翻译”；允许 UTF-8 BOM。
- 目标语言为英文。输出是输入文件的副本，文件名添加 `_translated`；需要维护“审核状态”和“错误说明”列。
- 读取工作簿中的“注意要点_中英”“翻译简写说明”“要注意的Comment（研发人员加）”和“翻译省略”四个 sheet。
- 中文词条使用 jieba 分词；静态术语可进入自定义词典，“伪代码术语”为“是”的动态术语不得加入。
- 先匹配完整词条，再按词级组合译文。结合 comment、来源、备注和省略规则判断，不把词条当成完整中文句子。
- 使用稠密向量相似度发现中文近义候选，阈值为 0.7（含）；所有翻译冲突均须 HITL，分数不得自动批准或更改译文。
- CSV 行状态为“无需审核”“待审核”或“已批准”；任一组成词待审时整行为待审核。增量术语表审核与 CSV 完成状态分开。
- 同一词项和 comment 在输入中出现至少 3 次且未匹配适用术语时，写入独立的增量工作簿；运行时不得修改版本化原表。
- 开发仅使用 ChatGPT/Codex；不得将开发工作交给其他模型提供方。

## Spec Kit 集成

Spec Kit 已集成到现有仓库。用户确认默认和已安装的集成为 Codex，多安装安全已启用，共享模板与 Codex 对齐。继续使用仓库内现有 `.specify` 结构和当前功能目录，不要重新初始化仓库。

## 当前续作状态

规格澄清、计划和任务拆分已完成，并已按 `feature/csv-term-translation` 分支最新拉取代码对齐。四板斧采用带回流的门禁：材料缺失回到第一关；推理不符、超预算或证据不足回到第二关；质量不达标回到第三关；产品集成不完整回到第四关。任务清单包含独立验收标准、可并行边界、固定脱敏评测样例、当前 TinyCode 模型的受控评测、跨平台本机 Qdrant 启动说明和最终交付报告。

任务清单共有 51 项：US4 为 14 项、US1 为 19 项、US2 为 6 项、US3 为 3 项，另有准备、基础契约和产品交付任务。US4 排在 US1 前，因为每次翻译和 LLM judge 都依赖成功的本地记忆检索。

功能尚未实现。下一步从仓库根目录运行 `$speckit-implement`，依据已复核的 `specs/001-csv-term-translation/tasks.md` 实施；设计输入未变化时不要重新生成任务。开发使用 ChatGPT/Codex。

## 外发边界

计划使用 OpenAI `text-embedding-3-small` 和环境变量 `OPENAI_API_KEY`。参考资料 add 授权与翻译任务 query 授权彼此独立；只在对应操作取得授权后，才发送必要的参考文本或词项查询。计划阶段没有调用模型或 Embeddings API。执行受控评测时使用版本化的脱敏样例，不使用用户 CSV，并在交付报告中记录译文审查、search/模型轨迹、token 与成本。

## 在其他机器续作

拉取功能分支及仓库资产，使用 Node.js 22.19 或更新版本，并在仓库根目录运行 `npm ci`。TinyCode 从 `.tinycode/skills` 发现本续作说明；功能决策以仓库中的规格和计划为准，不依赖个人机器路径或重建会话内容。
