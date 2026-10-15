# Application profile audit — Veyl

Date: 2026-10-15. Workspace: /Users/theomichels/App/veyl. Branch: codex/application-profile.

## User objective
Create a factual French application profile covering technical stack, architecture, unit tests and global interface principles (not brand art direction), reusable for comparing other apps and later planning migrations. User selected a common foundation with variants by usage. Document evidence, gaps and unknowns; do not implement or migrate anything. This is a documentation-only audit, not an application-code task; no task-active marker or full app QA cycle.

## Shared constraints
Read ./AGENTS.md and this handoff directory first. Never read or reveal secret values from .env files. Do not call external APIs, run seeds, migrations, remote DB operations or diagnostic scripts with potential side effects. You are not alone in this workspace: preserve existing edits and other agents' documents. Only write the report assigned to you, no application edits. Findings must distinguish source inspection from runtime confirmation, and include repository paths with line numbers. Write in French. Communicate substantive findings through the assigned file.

## Scopes
- architecture-audit: inspect src/lib, src/app/api, src/app/settings/actions.ts, src/app/page.tsx, prisma, prisma.config.ts, vercel.json and relevant dependencies. Write architecture-audit.md only. Explain data flows, storage, integrations, access control, validation, operational concerns and variation candidates. Do not print secrets.
- quality-audit: inspect package manifests/lockfile, test scripts, TS/lint/build/CI/harness config and repo metadata as needed. Write quality-audit.md only. Determine actual test automation, declared vs locked dependencies, quality gates, reproducibility and evidence gaps. Do not run scripts that call network or databases. A read-only local typecheck may be run with incremental disabled, recording the result and limits.
- Lead: inspect UI structure and design principles, synthesize docs/application-profile.md and docs/application-profile.template.md.

## Success
Reports are concise and specific enough for a comparable profile, supported by file:line references. Absence claims describe inspected scope. Separate confirmed, declared, proposed and unknown. No inference of deployed infrastructure or production health from repository alone.
