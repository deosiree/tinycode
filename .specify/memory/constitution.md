<!--
Sync Impact Report
Version change: unresolved scaffold -> 1.0.0 (initial ratification)
Modified principles: Added all five core principles
Added sections: Technical Constraints; Development Workflow
Removed sections: None
Follow-up TODOs: None
Deferred intent: Define the vocabulary translation agent in a feature spec, including
  term sources, target languages, outputs, spreadsheet sheets, entity disambiguation,
  and human review points.
-->
# TinyCode Constitution

## Core Principles

### I. Simplicity and Readability
Implement the smallest complete design that fits the existing project. MUST avoid
unnecessary abstraction, duplicated normalization layers, defensive branches for
impossible states, and changes that drift beyond the stated goal. MUST preserve the
project's readable, compact module boundaries.

### II. Explicit Contracts and Idempotent Effects
Inputs, outputs, ownership boundaries, and side effects MUST be explicit. Operations
that may be retried MUST be idempotent or define an explicit deduplication key and
retry behavior. When SQL-backed features compose related entities, MUST fetch and
combine them in the application layer; SQL joins are not permitted.

### III. Correctness at Boundaries
MUST express constraints through TypeScript types and validate untrusted input at
system boundaries. Prefer existing types and validation points over broad defensive
programming or generic normalization helpers. Agent actions that cannot be resolved
from explicit rules MUST be surfaced for human review rather than silently guessed.

### IV. Chinese Code Documentation
Every new or modified function MUST have Chinese JSDoc describing its responsibility
and documenting each parameter and return value. Important non-obvious logic MUST
have a concise Chinese line comment explaining the reasoning. Comments MUST clarify
intent rather than repeat the code.

### V. Verifiable Behavior
Behavior changes MUST have focused automated coverage using the repository's existing
test style. Tests for core behavior SHOULD be deterministic and runnable without
network access. Completion MUST be checked against the feature's stated acceptance
criteria and relevant project checks.

## Technical Constraints

The project uses TypeScript, ESM, and Node.js 22.19 or later. MUST prefer the existing
Pi runtime and project dependencies before introducing another framework or runtime.
Feature specifications MUST define material inputs, outputs, external references,
and human approval points before implementation when those affect correctness.

## Development Workflow

Work MUST remain traceable to an approved feature specification and its acceptance
criteria. Planning and implementation artifacts MUST use repository conventions.
Human review is required for unresolved business ambiguity or decisions that change
user-visible data. Before completion, review the diff and report verification results
and any unmet acceptance criteria.

## Governance

This constitution governs project design and implementation decisions. A feature
specification MAY add stricter requirements, but MUST NOT weaken these principles
without an explicit constitution amendment. Amendments require a documented rationale,
a semantic-version update, and review of affected specifications and implementation
artifacts. Changes MUST be checked against this constitution during planning and review.

**Version**: 1.0.0 | **Ratified**: 2026-11-22 | **Last Amended**: 2026-11-22
