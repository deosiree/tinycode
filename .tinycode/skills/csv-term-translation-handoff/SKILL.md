---
name: csv-term-translation-handoff
description: Resume the CSV term translation agent from the checked-in Spec Kit plan and session decisions.
---

# CSV Term Translation Handoff

Use this skill when continuing design or implementation of the CSV term translation feature in this repository.

## Source of truth

- Feature requirements and user decisions: specs/001-csv-term-translation/spec.md
- Implementation plan and architecture decisions: specs/001-csv-term-translation/plan.md
- Dependency and integration research: specs/001-csv-term-translation/research.md
- Domain fields and state rules: specs/001-csv-term-translation/data-model.md
- Agent interaction contract: specs/001-csv-term-translation/contracts/skill-workflow.md
- Validation scenarios: specs/001-csv-term-translation/quickstart.md
- Versioned glossary: assets/glossary/常用注意要点清单.xlsx

## Confirmed user decisions

- Input is one UTF-8 CSV with columns 词条, comment, 词条来源, 英文翻译. UTF-8 BOM is accepted.
- Target language is English. Output is a copy named with the _translated suffix; add or update 审核状态.
- Read these workbook sheets: 注意要点_中英、翻译简写说明、要注意的Comment（研发人员加）、翻译省略.
- Use jieba for Chinese segmentation. Add applicable static glossary terms to its custom dictionary; exclude terms whose 伪代码术语 value is 是.
- Match complete terms before composing translations from segmented terms. Use comments, source context, remarks, and omission rules; do not assume a term is a grammatical Chinese sentence.
- Find semantically similar Chinese synonym candidates with dense-vector embeddings and a 0.7 inclusive threshold. Every translation collision still requires HITL; similarity never approves a translation or changes it automatically.
- Keep CSV row state as 无需审核, 待审核, or 已批准. A pending segment makes its whole row 待审核. Glossary delta review is separate from CSV completion.
- Unknown word/comment pairs appearing at least three times go to a separate glossary delta workbook. Never modify the versioned source workbook at runtime.
- Use ChatGPT/Codex for development. Do not delegate development to another model provider.

## Project setup provenance

Spec Kit was integrated into this existing repository; the user reported integration status OK, Codex as the default and installed integration, multi-install safety enabled, and shared templates aligned to Codex. Continue using the checked-in .specify structure and active feature; do not reinitialize the repository.

## Current handoff state

Spec clarification and Phase 0/Phase 1 planning artifacts are complete. The feature is not implemented yet. The next workflow command is $speckit-tasks from the repository root; review the generated task list before running $speckit-implement.

The planned embedding provider is OpenAI text-embedding-3-small through the Embeddings API, with OPENAI_API_KEY. This sends deduplicated Chinese terms outside the local machine. No API call was made while planning; revisit this provider and its data boundary with the user before the first live embedding request.

## Continuing on another machine

Pull the feature branch and all checked-in assets. Use Node.js 22.19 or newer and run npm ci from the repository root. The TinyCode skill registry discovers this handoff from .tinycode/skills; feature decisions do not depend on a personal filesystem path. Continue from the checked-in spec and plan rather than reconstructing this conversation.
