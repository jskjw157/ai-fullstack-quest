# AGENTS.md

This file is the shared instruction set for every agent working in this repository, whether the
session starts in T3 Code or in Amp. Read it before changing code.

## Project

AI Fullstack Quest is a personal learning RPG. Study, quiz, and coding-mission records raise four
character stats: frontend, backend, AI, and ops. The approved scope right now is the development
foundation: public GitHub repository, T3/Amp workspace, a minimal runnable app, and documentation.
It is not approval for the full game or a public deployment.

- PRD: `docs/PRD.md` (Puck, v0.1). Only section 3 "사용자와 합의한 사항" is confirmed; proposed
  defaults and numbers need a decision before implementation.
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
| Product and technical design | Puck | PRD, priorities, data flow, API contract, acceptance criteria |
| UI/UX | AGY / Gemini 3.8 Flash / high | user flows, components, tokens, responsive and state specs |
| Implementation | Amp Code low | small code changes with tests and execution evidence |
| Final review | Amp Code medium | correctness, security, regression, missing requirements |

Rules:

1. Keep implementation and review in separate contexts. A low thread must not claim that a medium
   review happened. A low self-review is not a medium review.
2. DB schema, authentication, and external AI calls need a medium review **before** implementation.
3. If low cannot solve the same problem after two focused attempts, escalate only that problem to a
   medium review.
4. AGY's model, effort, and T3 provider must be checked against the live environment. If a provider
   or model is unsupported, stop and report it. Do not silently substitute another model.
5. Every handoff includes the branch, changed files, commands run, actual results, and unresolved
   decisions. "Done" without evidence is not a handoff.

## Verified provider support (2026-11-08)

- T3 `antigravity` provider exposes model `gemini-3.8-flash` with option
  `thinking_level: high` (values low/medium/high, default high), with no provider constraints in
  live `orchestrator_capabilities`. The high setting is an option, not a separate model ID. A smoke
  thread with that selection completed and replied `gemini-3.8-flash / high` on 2026-11-08.
- Amp CLI supports `--mode low` and `--mode medium`.
- T3 v0.1.5 has no Amp native provider, and Amp CLI has no ACP server mode. Amp connects through
  T3's official MCP outside-agent bridge (`http://127.0.0.1:3773/mcp`). Do not describe Amp as a
  T3 provider or add an unsupported driver.

Re-check these facts when the environment changes. The live capability output, not this file, is
the source of truth.

## Workspace isolation

- The `main` checkout at `~/projects/ai-fullstack-quest` is for integration and running the app,
  not for agent edits.
- T3 threads use T3's built-in worktree strategy (`workspaceStrategy: worktree`, base `main`).
- Amp threads use `git worktree add .worktrees/amp-<slug> -b amp/<slug> main` and work only inside
  that worktree.
- One writer per worktree. A reviewer reads the same commit without editing it.
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

- [ ] Branch/worktree and base commit named
- [ ] Scope limited to the requested change
- [ ] `npm test` and `npm run build` results included
- [ ] UI change inspected in a real render (desktop and narrow viewport) when applicable
- [ ] No secrets or personal data in the diff
- [ ] Remaining decisions and unverified claims stated explicitly
