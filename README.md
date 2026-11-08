# AI Fullstack Quest

개인용 AI 풀스택 학습 성장 게임입니다. 공부·퀴즈·코딩 미션을 기록하면 캐릭터의 **프론트엔드 · 백엔드 · AI · 운영** 능력치가 오릅니다.

> **현재 범위:** GitHub 공개 저장소, T3 Code + Amp 개발 작업공간, 최소 실행 가능한 프로젝트, 문서화까지입니다. 전체 게임 구현·공개 배포는 아직 승인 범위가 아닙니다.
>
> **PRD:** [docs/PRD.md](./docs/PRD.md) — Puck의 PRD v0.1 보관본. **확정 사항과 제안 기본값의 구분은 PRD 3장**을 따릅니다. 현재 scaffold의 스택은 잠정 구현이며 최종 스택 결정을 대체하지 않습니다. ([ADR-0001](./docs/decisions/0001-bootstrap-stack.md))

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
│   ├── PRD.md            # PRD v0.1 보관본 (Puck)
│   ├── agent-workflow.md # T3/Amp 역할·작업공간 규칙
│   └── decisions/        # ADR
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
| 제품·기술 설계 | Puck | PRD, 우선순위, API 계약, 인수 조건 |
| UI·UX | AGY / Gemini 3.8 Flash / high | 화면 흐름, 컴포넌트·토큰, 상태별 명세 |
| 구현 | Amp Code low | 작은 기능 단위 코드, 테스트·실행 결과 |
| 검토·리뷰 | Amp Code medium | 정확성·보안·회귀·누락 검토 |

세부 규칙과 작업공간 격리 방법은 [docs/agent-workflow.md](./docs/agent-workflow.md)를 따릅니다.

### 실제 지원 확인 (2026-11-08)

- **AGY:** T3의 `antigravity` provider가 `gemini-3.8-flash` 모델과 `thinking_level: high` 옵션을 노출합니다. T3 live capabilities에서 제약 없음(`constraints: []`)을 확인했습니다. T3 모델 ID는 `gemini-3.8-flash`이고, high는 별도 모델 ID가 아니라 옵션입니다.
- **Amp Code:** Amp CLI가 `--mode low`와 `--mode medium`을 지원합니다. 이 부트스트랩 실행 스레드는 **low**이며, medium 리뷰는 아직 수행하지 않았습니다. low 자기 검토를 medium 리뷰로 간주하지 않습니다.
- **T3–Amp:** T3 v0.1.5에는 Amp native provider가 없고 Amp CLI에도 ACP 서버 모드가 없습니다. 따라서 T3 내부 provider로 Amp를 꽂는 방식은 지원되지 않습니다. 대신 T3가 공식 지원하는 **MCP outside-agent** 경로로 연결했습니다. 자세한 내용은 아래와 [docs/agent-workflow.md](./docs/agent-workflow.md)를 참고하세요.

## T3 Code 접근

- T3 Code v0.1.5가 loopback `127.0.0.1:3773`에서 실행 중입니다.
- 프로젝트 경로(이 환경): `~/projects/ai-fullstack-quest`
- 원격 접근: **T3 Connect**가 켜져 있습니다. 서명된 <https://app.t3.codes>에서 이 환경을 선택하세요.
- 새 기기 연결이 필요하면 호스트에서 `t3 pair`를 실행해 나오는 **일회용 링크/QR**을 본인 기기에서만 사용하세요. 이 링크는 비밀번호와 같은 자격 증명이므로 채팅·문서·커밋에 붙이지 않습니다.
- T3에서 앱을 미리 보려면 프로젝트 터미널에서 `npm run dev`를 실행하고 T3 preview로 `http://127.0.0.1:5173`(개발) 또는 `http://127.0.0.1:8788`(프로덕션)을 여세요.

T3 프로젝트 등록과 AGY provider 사용 방법:

```bash
# 이 환경에서는 이미 등록되어 있습니다.
t3 project add ~/projects/ai-fullstack-quest --title "AI Fullstack Quest"
```

AGY UI/UX 스레드는 T3 UI에서 `Antigravity` provider, `Gemini 3.8 Flash` 모델, thinking level `high`를 선택해 만들거나, T3 MCP의 `t3_thread_launch`에 다음 model selection을 넘깁니다.

```json
{
  "provider": "antigravity",
  "instanceId": "antigravity",
  "model": "gemini-3.8-flash",
  "options": { "thinking_level": "high" }
}
```

## Amp 연결

Amp는 **T3 MCP 서버에 outside agent로 연결**되어 있습니다.

- T3 MCP URL: `http://127.0.0.1:3773/mcp` (loopback + OAuth)
- Amp 사용자 설정의 `amp.mcpServers.t3` (mode `600`, 저장소 밖)
- MCP OAuth 자격 증명 파일 (mode `600`, 저장소 밖, TTL 30일)
- 부여 범위: `orchestration:read`, `orchestration:operate` / 접근 수준 `approval-required`
- 확인: `amp mcp doctor t3` → `connected (66 tools)`

이 연결로 Amp는 T3의 프로젝트·스레드를 조회하고, T3 스레드를 시작·전송·대기할 수 있습니다. **Amp가 T3의 native provider가 되었다는 뜻은 아닙니다.** T3 화면에서 Amp를 모델로 선택하는 기능은 이 버전에 없습니다.

30일 후 MCP 자격 증명이 만료되면 같은 OAuth 절차(클라이언트 등록 → pairing code 승인 → 토큰 교환)를 다시 수행하고 Amp 사용자 설정의 `Authorization` 헤더를 갱신해야 합니다. 토큰 값은 채팅에 출력하지 않습니다.

## 동시 편집 방지

- `main` 체크아웃은 **통합 전용**입니다. 에이전트는 직접 편집하지 않습니다.
- T3 스레드는 T3의 built-in worktree(`workspaceStrategy: worktree`)를 사용합니다.
- Amp 스레드는 `.worktrees/amp-<slug>`에 별도 worktree를 만들고 `amp/<slug>` 브랜치에서 작업합니다.
- 하나의 worktree에는 한 번에 한 작성자만 들어갑니다. 리뷰는 같은 커밋을 읽기 전용으로 검토합니다.
- `data/quest.db`는 단일 프로세스가 쓰는 로컬 데이터입니다. 실험 시 `QUEST_DB_PATH`를 분리하세요.
- 상세 절차: [docs/agent-workflow.md](./docs/agent-workflow.md)

## 검증 기록 (2026-11-08)

- `npm test` → **29 tests passed** (domain·API·store)
- `npm run build` → TypeScript 검사 + Vite 프로덕션 빌드 성공
- 실제 서버(`127.0.0.1:8788`)에서 health/state/activity/validation/404 확인
- Playwright headless로 데스크톱·390px 모바일 렌더링 확인, 퀘스트 완료 클릭 시 100 → 125 XP, 콘솔 오류 0, 가로 overflow 없음
- T3 `orchestrator_capabilities`에서 `antigravity` / `gemini-3.8-flash` / `thinking_level=high`, `constraints: []` 확인
- T3 프로젝트 등록 확인 (`t3_project_list`: `AI Fullstack Quest`)
- AGY 스모크 스레드 완료: 위 model selection으로 실행해 `gemini-3.8-flash / high` 응답을 받음 (T3 worktree, 파일 변경 없음)
- `amp mcp doctor t3` → 66 tools connected, `amp tools list`에서도 `mcp__t3__` 도구 66개 확인
- **미검증/미수행:** T3 native Amp provider(지원 없음), AGY high의 긴 UI/UX 작업, medium 리뷰, 전체 게임 MVP

## 남은 결정

- PRD 10장의 최종 백엔드·DB 선택 (Spring Boot/Kotlin vs 경량 TypeScript) — ADR 갱신
- DB 구조·인증·AI 외부 호출 설계의 **medium 사전 리뷰**
- T3 프로젝트 기본 모델을 AGY high로 지정하려면 T3 UI의 프로젝트 설정에서 선택해야 함. MCP outside-agent 자격 증명은 `approval-required`라 프로젝트 설정 변경 권한이 없어 자동 설정하지 않았음
- AGY UI/UX 명세 범위와 산출물 위치
- PRD 6장 경험치 수치와 초기 콘텐츠(개념 6·퀴즈 12·미션 3) 확정
- 제품 내부 AI 코치 도입 시점·제공자·비용 한도
