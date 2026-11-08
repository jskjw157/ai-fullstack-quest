# AGENTS.md

This file is the shared instruction set for every agent working in this repository, whether the
session starts in T3 Code or a T3 native role session. Read it before changing code.

## Project

AI Fullstack Quest is a personal learning RPG. Study, quiz, and coding-mission records raise four
character stats: frontend, backend, AI, and ops. The approved scope right now is the development
foundation: public GitHub repository, T3 native role workspace, a minimal runnable app, and
documentation. It is not approval for the full game, a public deployment, or P1 fixes.

- PRD: `docs/PRD.md` (Puck, v0.1, artifact revision 5). Only section 3 "사용자와 합의한 사항" is
  confirmed; proposed defaults and numbers need a decision before implementation.
- Roles and exact T3 model selections: `docs/roles.md`. Role routing decision: ADR-0002.
- Stack: React + TypeScript + Vite, Hono, `node:sqlite`. This is a provisional bootstrap, recorded
  in `docs/decisions/0001-bootstrap-stack.md`. Do not replace it automatically because the PRD
  leaves the final backend/DB open.
- Workflow: `docs/agent-workflow.md`.

## Commands

```bash
export PATH="$HOME/.local/bin:$PATH"
npm install
npm test                 # Vitest: domain, API, store
npm run build            # tsc --noEmit && vite build
npm run dev              # API :8788 + Vite :5173
npm start                # production: NODE_ENV=production, serves dist on :8788
```

Port 8787 is reserved by an existing local service. Keep this app on `127.0.0.1` and use 8788 or
another free loopback port. Never expose the app on a public interface.

## Approved role split

| Stage | Owner | Output |
| --- | --- | --- |
| Product and technical design | Puck (artifact/PRD; not a T3 provider) | PRD, priorities, data flow, API contract, acceptance criteria |
| UI/UX | T3 `antigravity` / `gemini-3.8-flash` / `thinking_level=high` | user flows, components, tokens, responsive and state specs |
| Implementation | T3 `codex` / `gpt-6.1-sol` / `reasoningEffort=high` | small code changes with tests and execution evidence |
| Independent review | T3 `opencode` / `opencode-go/deepseek-v4.1-flash` / `variant=max` | correctness, security, regression, missing requirements |

Rules:

1. Keep implementation and review in separate sessions. A self-review is not an independent review.
   Never report that a review happened when only the implementer checked the change.
2. DB schema, authentication, and external AI calls need an independent OpenCode review **before**
   implementation.
3. The model ID and the effort/variant are separate settings. Verify both against live T3
   capabilities and the actual run metadata. Do not infer effort from a model label or a prompt.
4. If a model, option, credential, or permission is unavailable, stop and report the exact blocker.
   Do not silently substitute another model/provider or lower an effort.
5. Every handoff includes the role/session, provider/model/option, worktree/branch, base commit,
   changed files, commands run, actual results, and unresolved decisions. "Done" without evidence is
   not a handoff.
6. This project does not use OMO. Amp is not the implementation or review executor; the historical
   Amp MCP outside-agent connection is workspace tooling only.

## Session handoff

The current handoff between roles is **manual**. Puck's design, AGY's UI/UX spec, the implementation
commit, and the review result are passed by the user or the current agent as links/files to the next
role session. T3 exposes child-task and cross-provider child-task capability, and MCP can create or
message threads, but no automatic design → UI/UX → implementation → review pipeline is configured.
Do not claim that creating a T3 session makes the handoff automatic.

## Verified provider support (2026-11-08)

- T3 `antigravity` exposes `gemini-3.8-flash` with `thinking_level` values low/medium/high, default
  high, and no provider constraints in live `orchestrator_capabilities`. A smoke thread selected
  high and replied `gemini-3.8-flash / high`. The provider log redacts option values, so this is
  capability + selection + model-default evidence, not independent wire-level proof.
- T3 `codex` exposes `gpt-6.1-sol` with `reasoningEffort` low/medium/high/xhigh/max/ultra and
  `serviceTier` default/priority, no provider constraints. The smoke thread replied `codex-ok`; its
  actual rollout `turn_context` recorded `payload.model=gpt-6.1-sol` and `payload.effort=high`.
- T3 `opencode` exposes `opencode-go/deepseek-v4.1-flash` with `variant` low/high/max, no provider
  constraints. The smoke thread replied `opencode-ok`; its OpenCode session and assistant message
  recorded `providerID=opencode-go`, model `deepseek-v4.1-flash`, `variant=max`, with reasoning
  tokens. `opencode/deepseek-v4.1-flash-free` is a different model ID; do not conflate them.
- The T3 project's `defaultModelSelection` is `null`. An update attempt was denied:
  `Changing projects or environment settings needs a live full-access/default calling thread or a
  full-access client.` The user must set a project default in the T3 UI if they want one. Role
  sessions carry their own explicit selections.
- T3 0.1.5 CLI `thread start` accepts `--provider`, `--model`, and `--worktree`, but no effort or
  variant flag. Use the T3 UI or an MCP `t3_thread_launch` with model selection for those options.
  No named multi-model preset feature was found in the project schema or CLI.
- T3 v0.1.5 has no Amp native provider. Amp connects only through T3's MCP outside-agent bridge and
  is not an app implementation/review executor. Do not describe Amp as a T3 provider or add an
  unsupported driver.
- T3 native OpenCode 2.2.5 does not support OMO features. See PRD section 18; OMO is excluded.

Re-check these facts when the environment changes. The live capability output and actual run
metadata, not this file, are the source of truth.

## Workspace isolation

- The `main` checkout at `~/projects/ai-fullstack-quest` is for integration and running the app,
  not for agent edits.
- T3 role threads use T3's built-in worktree strategy (`workspaceStrategy: worktree`, base `main`).
  Use `design/`, `impl/`, and `review/` branch prefixes.
- One writer per worktree. A reviewer reads the same commit without editing it. Do not check out the
  same branch in two worktrees and do not let implementation and review edit one checkout at once.
- Historical T3 smoke worktrees and branches are preserved as evidence. Create a fresh role worktree
  for real work rather than mixing a new task into a smoke checkout.
- Amp worktrees may exist from the earlier bootstrap, but Amp is not used for app implementation or
  review now. Do not add `amp/<slug>` app branches to the current role flow.
- Keep experimental databases separate with `QUEST_DB_PATH`; do not point two running servers at the
  same SQLite file.

## Code conventions

- TypeScript strict mode, ESM, explicit `.ts` import extensions.
- Domain rules, rewards, levels, streaks, and validation live in `shared/game.ts`, not in React
  components or route handlers.
- API errors are JSON `{ error, message }`; validate at the boundary and keep SQL parameterized.
- Add tests for behavior that callers rely on: reward calculation, level/streak boundaries, XP
  accumulation, input rejection. Do not add one test per trivial function.
- Keep the UI accessible: labels, keyboard operation, visible focus, progressbar semantics, and
  non-color status cues.

## Security and operations

- The GitHub repository is public; the running service and personal data are not. Keep the server
  bound to `127.0.0.1`.
- Never commit `.env`, tokens, pairing links, MCP credentials, database files, logs, or personal
  learning data. `data/` and `dist/` are ignored.
- Do not print secret values in chat, docs, tests, or command output.
- Preserve existing Hermes/OpenClaw/BrowserOS/T3 and other local services. Do not restart, upgrade,
  or clean up unrelated services or packages.
- Check memory and disk before heavy work. The host is shared and has limited headroom.
- T3 pairing links and Amp MCP credentials are one-time or expiring secrets. Do not paste them into
  the repository or a public message.

## Handoff checklist

- [ ] Role/session and actual provider/model/option named
- [ ] Branch/worktree and base commit named
- [ ] Scope limited to the requested change
- [ ] `npm test` and `npm run build` results included
- [ ] UI change inspected in a real render (desktop and narrow viewport) when applicable
- [ ] No secrets or personal data in the diff
- [ ] Runtime mode/approvals and unverified claims stated explicitly
