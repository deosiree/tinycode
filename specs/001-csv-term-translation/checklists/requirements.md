# Specification Quality Checklist: CSV 词条英文翻译与消歧

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-22
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- User confirmed the CSV headers (`词条`, `comment`, `词条来源`), the existing `翻译简写说明` sheet, and a high-frequency threshold of at least 3 occurrences per word/comment pair in the input CSV.
- Similarity clarification: compare Chinese terms with dense-vector embeddings; scores >= 0.7 identify semantically related synonym candidates for HITL, while lower scores recommend distinct translations. Every collision remains subject to human review, and similarity never approves or changes a translation automatically.
- Clarifications confirmed: draft CSVs include candidate translations and a per-row `审核状态` column; it tracks translation review only, while the glossary delta is reviewed separately after CSV completion.
- User confirmed full-entry matching first; otherwise use jieba to segment Chinese, reuse applicable word-level translations, and compose natural English using comment/context without assuming the source is a grammatical Chinese sentence.
- User confirmed: add applicable static Chinese glossary terms to jieba's custom dictionary, but exclude terms marked `伪代码术语=是`; use their remarks, comment, and scenario to determine the contextual translation (for example, `xxx配置` may become `Platform Tool` in a column-name context).
- User confirmed row-level review aggregation: if any segmented word in a CSV row requires HITL, the whole row is `待审核`; mark it `已批准` after all related review decisions are completed and approved.
- Reference workbook is included as the versioned repository asset `assets/glossary/常用注意要点清单.xlsx`; runtime reads it relative to the repository root and does not modify it.
