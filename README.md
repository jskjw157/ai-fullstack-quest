# AI Fullstack Quest

개인용 AI 풀스택 학습 성장 게임입니다. 공부·퀴즈·코딩 미션을 기록하면 캐릭터의 **프론트엔드 · 백엔드 · AI · 운영** 능력치가 오릅니다.

> **현재 범위:** GitHub 공개 저장소, T3 native 역할 작업공간, 최소 실행 가능한 프로젝트, 문서화까지입니다. 전체 게임 구현·공개 배포·기존 P1 수정은 아직 승인 범위가 아닙니다.
>
> **PRD:** [docs/PRD.md](./docs/PRD.md) — Puck의 PRD v0.1 보관본(artifact revision 7). **확정 사항과 제안 기본값의 구분은 PRD 3장**을 따릅니다. 현재 scaffold의 스택은 잠정 구현이며 최종 스택 결정을 대체하지 않습니다. ([ADR-0001](./docs/decisions/0001-bootstrap-stack.md))
>
> **역할·모델:** [docs/roles.md](./docs/roles.md) — AGY UI·UX, T3 OpenCode 구현, T3 Codex 리뷰의 정확한 provider/model/option과 검증 근거. 역할 교체 결정은 [ADR-0003](./docs/decisions/0003-role-swap.md)입니다.
>
> **T3 오케스트레이션:** [docs/t3-orchestration.md](./docs/t3-orchestration.md) — native subagent primitive와 사용자 정의 multi-provider pipeline 지원 범위를 구분한 조사.

- 저장소: <https://github.com/jskjw157/ai-fullstack-quest> (public)
- 작업 경로(이 환경): `~/projects/ai-fullstack-quest`
- T3 프로젝트: `AI Fullstack Quest` (T3 Code v0.1.5, loopback `127.0.0.1:3773`)
- 앱 기본 주소: `http://127.0.0.1:8788` (loopback 전용)

## 지금 동작하는 것

- 캐릭터 대시보드: 4개 능력치, 능력치별 레벨·XP, 캐릭터 레벨, 연속 기록일
- 초기 퀘스트 6개: 버튼 한 번으로 활동 기록
- 직접 기록: 학습 / 퀴즈(정답·오답) / 미션(난이도 1~5)
- SQLite 영속 저장, `Asia/Seoul` 기준 날짜·연속일 계산
- 입력 검증과 JSON 오류 응답
- 단위·API 테스트 29개, 프로덕션 빌드, 반응형 UI

### PRD 제안과 현재 scaffold의 차이 (자동 변경하지 않음)

- **능력치:** 현재 scaffold는 원 요청의 4개(프론트엔드·백엔드·AI·운영)를 구현했습니다. PRD 3장의 제안 기본값은 5개(설계·검증 추가)이며, 다섯 번째 능력치는 아직 구현하지 않았습니다. 확정 전에는 코드를 바꾸지 않습니다.
- **경험치:** scaffold는 학습 10 / 퀴즈 정답 15·오답 4 / 미션 `20 + 난이도 × 5`를 사용합니다. PRD 6장의 제안값(5 / 10 / 30 / 5)과 다르며, 밸런싱은 미확정입니다.
- **콘텐츠:** scaffold는 시작 퀘스트 6개입니다. PRD 7장의 제안 최소량은 개념 6개·고정 퀴즈 12개·코딩 미션 3개입니다.
- **스택:** scaffold는 React + TypeScript + Vite, Hono + `node:sqlite`의 잠정 구현입니다. PRD 10장은 최종 백엔드·DB를 미결로 두었으며, 이 scaffold가 그 결정을 대체하지 않습니다.

## 빠른 시작

Node.js 22.5 이상이 필요합니다. 이 환경에는 Node 26이 설치되어 있습니다.

```bash
cd ~/projects/ai-fullstack-quest
export PATH="$HOME/.local/bin:$PATH"

npm install
npm run dev
# 웹:   http://127.0.0.1:5173
# API:  http://127.0.0.1:8788

# 프로덕션 빌드 + 실행
npm run build
npm start
# http://127.0.0.1:8788 에서 dist와 API를 함께 제공
```

`npm start`는 `NODE_ENV=production`으로 `dist/`를 정적 제공합니다.

### 환경 변수

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `PORT` | `8788` | API/프로덕션 서버 포트. **8787은 기존 로컬 서비스가 사용 중이므로 피합니다.** |
| `HOST` | `127.0.0.1` | 외부 노출을 피하기 위해 loopback 유지 |
| `QUEST_DB_PATH` | `data/quest.db` | SQLite 파일 경로 (`data/`는 Git 제외) |
| `QUEST_TIMEZONE` | `Asia/Seoul` | 날짜 경계·연속일 계산 시간대 |

> 개인 학습 데이터가 들어가는 `data/`와 빌드 산출물 `dist/`는 `.gitignore`에 포함되어 있습니다. 공개 저장소에는 코드와 문서만 올라갑니다.

## 구조

```text
.
├── shared/game.ts        # 도메인 타입·보상·레벨·연속일·입력 검증
├── server/
│   ├── index.ts          # Node 진입점, SQLite 연결, 정적 파일 제공
│   ├── app.ts            # Hono API 라우트
│   └── store.ts          # 활동 저장·캐릭터 상태 집계
├── src/
│   ├── App.tsx           # 캐릭터 시트·퀘스트·기록 UI
│   ├── api.ts            # fetch 클라이언트
│   └── styles.css        # 다크 RPG 테마, 반응형
├── tests/                # Vitest 단위·API·저장소 테스트
├── docs/
│   ├── PRD.md            # PRD v0.1 보관본 (Puck, artifact revision 7)
│   ├── roles.md          # 역할별 T3 provider/model/option·검증·handoff·프롬프트
│   ├── agent-workflow.md # T3 native 역할·작업공간 규칙
│   ├── t3-orchestration.md # T3 orchestration/subagent·pipeline 조사
│   └── decisions/        # ADR-0001 스택, ADR-0002 이전 역할, ADR-0003 역할 교체
└── AGENTS.md             # 에이전트 공통 규칙
```

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api/health` | 상태 확인 |
| `GET` | `/api/state` | 캐릭터·능력치·연속일·최근 활동·퀘스트 |
| `GET` | `/api/quests` | 초기 퀘스트 목록 |
| `POST` | `/api/activities` | 활동 기록. `{ type, stat, title, correct?, difficulty? }` |

보상 초안(코드에 반영된 잠정값): 학습 10 XP, 퀴즈 정답 15 XP / 오답 4 XP, 미션 `20 + 난이도 × 5` XP. PRD 6장의 제안 수치와 다르므로, 최종 밸런싱은 PRD 확정 후 조정합니다.

## 개발 역할 분담

| 단계 | 담당 | 산출물 |
| --- | --- | --- |
| 제품·기술 설계 | Puck (T3 provider 아님) | PRD, 우선순위, API 계약, 인수 조건 |
| UI·UX | T3 Antigravity / `gemini-3.8-flash` / `thinking_level=high` | 화면 흐름, 컴포넌트·토큰, 상태별 명세 |
| 구현 | T3 OpenCode / `opencode-go/deepseek-v4.1-flash` / `variant=max` | 작은 기능 단위 코드, 테스트·실행 결과 |
| 독립 검토·리뷰 | T3 Codex / `gpt-6.1-sol` / `reasoningEffort=high` | 정확성·보안·회귀·누락 검토 |

세부 규칙, 역할 세션 제목, 정확한 model selection JSON, 역할 프롬프트와 handoff 방법은
[docs/roles.md](./docs/roles.md)와 [docs/agent-workflow.md](./docs/agent-workflow.md)를 따릅니다.
역할 간 전달은 현재 **수동**이며, 이 프로젝트의 자동 역할 pipeline은 설정되어 있지 않습니다. T3
native subagent primitive와 그 지원 범위는 [docs/t3-orchestration.md](./docs/t3-orchestration.md)에
구분해 기록했습니다.

### 실제 지원 확인 (2026-11-08)

- **AGY:** T3 `antigravity`가 `gemini-3.8-flash`와 `thinking_level` low/medium/high(기본 high)를
  노출하며 `constraints: []`입니다. high 선택 스모크가 `gemini-3.8-flash / high`로 응답했습니다.
  provider log가 option 값을 redact해 wire-level 증명은 아니므로, capability+선택+기본값 근거로
  기록합니다.
- **OpenCode:** T3 `opencode`가 `opencode-go/deepseek-v4.1-flash`와 `variant` low/high/max를
  노출하며 `constraints: []`입니다. 스모크는 `opencode-ok`로 응답했고, OpenCode session DB의
  `session_v2.model`과 assistant message에 `providerID=opencode-go`, `variant=max`가 기록됐습니다.
  무료 `opencode/deepseek-v4.1-flash-free`와는 다른 모델 ID입니다. 스모크는 파일을 수정하지 않아
  구현 쓰기 권한은 아직 미검증입니다.
- **Codex:** T3 `codex`가 `gpt-6.1-sol`과 `reasoningEffort` low~ultra를 노출하며
  `constraints: []`입니다. 스모크는 `codex-ok`로 응답했고, 실제 rollout `turn_context`에
  `payload.model=gpt-6.1-sol`, `payload.effort=high`가 기록됐습니다. 스모크는 read-only/untrusted로
  리뷰 동작을 검증한 것은 아닙니다.
- **프로젝트 기본 모델:** `defaultModelSelection`은 `null`입니다. MCP outside-agent 권한으로
  변경하면 full-access 호출 스레드/클라이언트가 필요하다는 오류가 납니다. 역할 세션은 각자 명시
  선택을 사용하며, 기본값이 필요하면 사용자가 T3 UI에서 지정해야 합니다.
- **T3 오케스트레이션:** Codex/OpenCode/Antigravity 모두 live capability에서
  `canRunChildTask=true`, `canRunCrossProviderChildTask=true`입니다. T3에는 `delegate_task`,
  task status/cancel, lineage/context transfer가 있지만, **AGY → OpenCode → Codex를 설정만으로
  자동 실행하는 pipeline UI는 확인되지 않았습니다.** native primitive와 자동 pipeline은 다릅니다.
  메뉴·도구·버전 차이는 [docs/t3-orchestration.md](./docs/t3-orchestration.md)에 정리했습니다.
- **Amp/OMO:** T3 0.1.5에는 Amp native provider가 없고, Amp MCP outside-agent 연결은 앱 구현·리뷰
  실행기가 아닙니다. OMO는 T3 native OpenCode 2.2.5에서 기능 통합이 불가해 제외했습니다. 자세한
  조사는 PRD 18장에 이력으로 있습니다.

## T3 Code 접근

- T3 Code v0.1.5가 loopback `127.0.0.1:3773`에서 실행 중입니다.
- 프로젝트 경로(이 환경): `~/projects/ai-fullstack-quest`
- 원격 접근: **T3 Connect**가 켜져 있습니다. 서명된 <https://app.t3.codes>에서 이 환경을 선택하세요.
- 역할 세션 제목: `UI/UX role — AGY Gemini 3.8 Flash high`,
  `Implementation role — OpenCode DeepSeek V4.1 Flash max`,
  `Review role — Codex GPT-6.1 Sol high`. 상세 preset은 [docs/roles.md](./docs/roles.md).
- 새 기기 연결이 필요하면 호스트에서 `t3 pair`를 실행해 나오는 **일회용 링크/QR**을 본인 기기에서만 사용하세요. 이 링크는 비밀번호와 같은 자격 증명이므로 채팅·문서·커밋에 붙이지 않습니다.
- T3에서 앱을 미리 보려면 프로젝트 터미널에서 `npm run dev`를 실행하고 T3 preview로 `http://127.0.0.1:5173`(개발) 또는 `http://127.0.0.1:8788`(프로덕션)을 여세요.

T3 프로젝트 등록과 역할별 provider 사용 방법:

```bash
# 이 환경에서는 이미 등록되어 있습니다.
t3 project add ~/projects/ai-fullstack-quest --title "AI Fullstack Quest"
```

역할 세션은 T3 UI의 model picker에서 provider/model/option을 정확히 선택해 만들거나, T3 MCP의
`t3_thread_launch`에 model selection을 넘깁니다. 세 역할의 JSON preset과 세션 제목은
[docs/roles.md](./docs/roles.md)에 있습니다. AGY UI/UX 예시는 다음과 같습니다.

```json
{
  "provider": "antigravity",
  "instanceId": "antigravity",
  "model": "gemini-3.8-flash",
  "options": { "thinking_level": "high" }
}
```

## 부록: Amp MCP outside-agent 연결 (역사)

Amp는 초기 bootstrap에서 **T3 MCP 서버에 outside agent로 연결**했습니다. 이 연결은 현재 역할의
앱 구현·리뷰 실행기가 아니며, T3 native provider도 아닙니다.

- T3 MCP URL: `http://127.0.0.1:3773/mcp` (loopback + OAuth)
- Amp 사용자 설정의 `amp.mcpServers.t3` (저장소 밖)
- MCP OAuth 자격 증명 (저장소 밖, 값·만료 정보는 문서에 기록하지 않음)
- 접근 수준: `approval-required`
- 확인: `amp mcp doctor t3` → `connected (66 tools)`

이 연결로 Amp는 T3의 프로젝트·스레드를 조회하고 스레드를 시작·전송·대기할 수 있습니다. **Amp가
T3의 native provider가 되었다는 뜻은 아닙니다.** T3 화면에서 Amp를 모델로 선택하는 기능은 이
버전에 없습니다. 현재 구현·리뷰 역할은 OpenCode/Codex이며, Amp를 그 실행기로 사용하지 않습니다.

자격 증명이 만료되면 같은 OAuth 절차를 다시 수행해야 하지만, 토큰 값은 채팅·문서·커밋에 출력하지
않습니다.

## 동시 편집 방지

- `main` 체크아웃은 **통합 전용**입니다. 역할 작업은 T3의 built-in worktree에서 합니다.
- T3 역할 스레드는 `design/`, `impl/`, `review/` 브랜치 접두사를 사용합니다.
- 하나의 worktree에는 한 번에 한 작성자만 들어갑니다. 리뷰는 같은 커밋을 읽기 전용으로 검토합니다.
- 같은 브랜치를 두 worktree에서 동시에 checkout하지 않습니다. 구현과 리뷰가 같은 체크아웃을
  동시에 편집하지 않습니다.
- 스모크 세션의 worktree/branch는 검증 이력으로 보존하고, 실제 작업은 새 worktree에서 시작합니다.
- `data/quest.db`는 단일 프로세스가 쓰는 로컬 데이터입니다. 실험 시 `QUEST_DB_PATH`를 분리하세요.
- 상세 절차: [docs/agent-workflow.md](./docs/agent-workflow.md)

## 검증 기록 (2026-11-08)

### 기반 앱 (기존 bootstrap, 코드 변경 없음)

- `npm test` → **29 tests passed** (domain·API·store)
- `npm run build` → TypeScript 검사 + Vite 프로덕션 빌드 성공
- 실제 서버(`127.0.0.1:8788`)에서 health/state/activity/validation/404 확인
- Playwright headless로 데스크톱·390px 모바일 렌더링 확인, 퀘스트 완료 클릭 시 100 → 125 XP,
  콘솔 오류 0, 가로 overflow 없음
- T3 프로젝트 등록 확인 (`AI Fullstack Quest`)

### 역할·모델 설정

- T3 `orchestrator_capabilities`에서 다음을 확인:
  - `codex` / `gpt-6.1-sol`, `reasoningEffort` low~ultra, `constraints: []`
  - `opencode` / `opencode-go/deepseek-v4.1-flash`, `variant` low/high/max, `constraints: []`
  - `antigravity` / `gemini-3.8-flash`, `thinking_level` low/medium/high(기본 high),
    `constraints: []`
- OpenCode 스모크: `Implementation role — OpenCode DeepSeek V4.1 Flash max`가 `opencode-ok`로
  응답. OpenCode session/assistant metadata에 `providerID=opencode-go`, model
  `deepseek-v4.1-flash`, `variant=max`, reasoning token 기록. 스모크는 파일을 수정하지 않아 구현
  쓰기 권한은 미검증.
- Codex 스모크: `Review role — Codex GPT-6.1 Sol high`가 `codex-ok`로 응답. 실제 rollout
  `turn_context`에 `payload.model=gpt-6.1-sol`, `payload.effort=high`. 같은 기록의
  `approval_policy=untrusted`, `sandbox_policy=read-only` 때문에 파일 쓰기·리뷰 동작은 미검증.
- AGY 스모크: `UI/UX role — AGY Gemini 3.8 Flash high`가 `gemini-3.8-flash / high`로 응답. live
  capability 기본값 high와 캐시 현재값 high를 확인했으나, provider log가 option 값을 redact해
  wire-level 증명은 없음.
- 역할 세션 제목은 기존 스모크 스레드에서 **제목만** 변경했고, 모델/option·세션 ID·과거 메시지는
  보존. `t3_thread_configure` readback으로 세 모델 선택을 재확인.
- T3 프로젝트 `defaultModelSelection`은 `null`; MCP outside-agent의 변경 시도는 full-access 호출
  스레드/클라이언트가 필요하다는 오류로 거부됨. 역할 세션은 각자 명시 선택을 사용.
- 역할 세션은 T3 `approval-required` runtime mode이며, 파일 수정·명령 실행에 승인이 필요할 수 있음.
- T3 오케스트레이션: live capability에서 세 provider 모두 child/cross-provider child task 가능,
  `constraints: []`. `delegate_task`/thread lineage primitive는 확인했지만, 자동 AGY → OpenCode →
  Codex pipeline UI는 설치본 v0.1.5 또는 최신 v0.1.7 문서에서 확인되지 않음. child task 실행
  스모크·controller/daemon 설치·업그레이드는 하지 않음. 상세: [docs/t3-orchestration.md](./docs/t3-orchestration.md).

### 리뷰·범위

- medium 독립 리뷰 결과는 **이전에 완료**되어 PRD 17장에 이력으로 보존. 이번 역할 설정에서 P1
  수정이나 재리뷰를 실행하지 않았음.
- **미검증/미수행:** T3 native Amp provider(지원 없음), OMO 기능 통합(불가), AGY high의 wire-level
  증명, OpenCode 구현 쓰기/Codex 리뷰 동작, T3 child task의 end-to-end 실행·child approval/worktree
  isolation UX, AGY의 긴 UI/UX 산출물, 전체 게임 MVP, P1 수정, 공개 배포.

## 남은 결정

- PRD 10장의 최종 백엔드·DB 선택 (Spring Boot/Kotlin vs 경량 TypeScript) — ADR 갱신
- DB 구조·인증·AI 외부 호출 설계의 **Codex 사전 리뷰**
- T3 프로젝트 기본 모델을 지정할지 여부. 역할 세션은 각자 명시 선택을 사용하므로 기본값은 필수가
  아니며, 지정하려면 사용자가 T3 UI에서 선택해야 함. MCP outside-agent 권한으로는 변경 불가
- 역할 세션 간 자동 전달을 도입할지 여부(현재는 수동). T3 native subagent primitive를 parent
  agent prompt로 쓸지, 외부 controller/script를 별도 구축할지 결정 — 이번엔 설치·구축하지 않음
- AGY UI/UX 명세 범위와 산출물 위치
- OpenCode 구현 모델은 현재 OpenCode Go 인증의 `opencode-go/deepseek-v4.1-flash`를 선택함. 무료
  `opencode/deepseek-v4.1-flash-free`를 의도했다면 별도 확인 필요
- 기존 P1 두 건의 수정 및 Codex 독립 재리뷰 승인
- T3 v0.1.7 업그레이드 여부(이번엔 하지 않음; child approvals/one-time schedules 등 차이)
- PRD 6장 경험치 수치와 초기 콘텐츠(개념 6·퀴즈 12·미션 3) 확정
- 제품 내부 AI 코치 도입 시점·제공자·비용 한도
