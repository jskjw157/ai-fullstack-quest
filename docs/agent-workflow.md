# T3 native 역할 개발 워크플로

이 문서는 `ai-fullstack-quest`에서 제품·기술 설계(Puck), UI·UX(AGY), 구현(T3 Codex), 독립
리뷰(T3 OpenCode)를 같은 저장소에서 충돌 없이 진행하기 위한 운영 규칙입니다. `AGENTS.md`,
`docs/roles.md`, `docs/PRD.md`와 함께 읽습니다. **현재 역할은 T3 native provider 세션을 사용하며,
Amp Code low/medium과 OMO는 앱 구현·리뷰 실행기로 쓰지 않습니다.**

## 1. 역할과 산출물

| 단계 | 담당 | 작업 위치 | 산출물 |
| --- | --- | --- | --- |
| 제품·기술 설계 | Puck | 설계 아티팩트, `docs/PRD.md`, ADR | PRD, 우선순위, 데이터 흐름, API 계약, 인수 조건 |
| UI·UX | T3 `antigravity` / `gemini-3.8-flash` / `thinking_level=high` | T3 worktree, `design/<slug>` | 화면 흐름, 컴포넌트·토큰, 반응형·상태별 명세 |
| 구현 | T3 `codex` / `gpt-6.1-sol` / `reasoningEffort=high` | T3 worktree, `impl/<slug>` | 작은 기능 단위 코드, 테스트, 실행 결과 |
| 독립 리뷰 | T3 `opencode` / `opencode-go/deepseek-v4.1-flash` / `variant=max` | 별도 worktree/commit, `review/<slug>` | 정확성·보안·회귀·누락 리뷰 |

- **Puck**은 T3 provider가 아닙니다. 코드를 직접 수정하지 않고 PRD/ADR/API 계약으로 넘깁니다.
- **AGY**는 UI·UX 명세와 프로토타입을 담당합니다. 별도 승인 없이 제품 코드를 구현하지 않습니다.
- **Codex**는 승인된 작은 단위를 구현하고 테스트·실행 증거를 남깁니다.
- **OpenCode**는 구현과 분리된 세션에서 리뷰합니다. 리뷰 중 코드를 수정하지 않습니다.
- 구현 세션의 자기 검토는 독립 리뷰가 아닙니다. 리뷰를 대체했다고 보고하지 않습니다.

### 선행 리뷰가 필요한 변경

다음은 구현 전에 **OpenCode 독립 설계 리뷰**를 거칩니다.

- DB 스키마·마이그레이션·데이터 보존 방식
- 인증·권한·세션·비밀 관리
- AI 외부 호출(제공자, 모델, 비용 한도, 개인정보 전송 범위)
- 배포·네트워크 노출 방식 변경

리뷰 결과는 PRD/ADR 또는 스레드에 남기고, 구현 담당은 그 결정을 벗어나지 않습니다. 기존 medium
리뷰 결과는 `docs/PRD.md` 17장에 이력으로 보존합니다.

## 2. T3 역할 preset과 세션

T3 0.1.5의 확인된 project schema는 하나의 `defaultModelSelection`과 scripts를 제공하며, CLI에도
이름 붙은 모델 preset subcommand가 없습니다. 세 역할을 프로젝트 기본값 하나로 동시에 표현할 수
없으므로, 아래 JSON을 **스레드 생성 시 선택하는 preset**으로 사용합니다.

```json
{
  "ui_ux": {
    "provider": "antigravity",
    "instanceId": "antigravity",
    "model": "gemini-3.8-flash",
    "options": { "thinking_level": "high" }
  },
  "implementation": {
    "provider": "codex",
    "instanceId": "codex",
    "model": "gpt-6.1-sol",
    "options": { "reasoningEffort": "high" }
  },
  "review": {
    "provider": "opencode",
    "instanceId": "opencode",
    "model": "opencode-go/deepseek-v4.1-flash",
    "options": { "variant": "max" }
  }
}
```

### 새 역할 세션 만들기

1. T3 Connect(`app.t3.codes`)에서 이 환경의 `AI Fullstack Quest` 프로젝트를 엽니다.
2. 새 스레드에서 **새 worktree**(base `main`)를 선택합니다.
3. Model picker에서 위 provider/model/option을 정확히 선택합니다. 모델명이나 프롬프트에
   `high`/`max`라고 적는 것만으로는 option이 적용되지 않습니다.
4. 역할에 맞는 요청만 보냅니다. AGY는 구현 코드를 만들지 않고, OpenCode는 파일을 수정하지 않습니다.
5. 결과에는 커밋·변경 파일·실행 명령·테스트 결과·미검증 항목을 남깁니다.

T3 CLI의 `t3 thread start`는 `--provider`/`--model`/`--worktree`를 지원하지만 effort/variant 옵션
플래그는 확인되지 않았습니다. 옵션이 필요한 역할은 **T3 UI 또는 MCP `t3_thread_launch`**를
사용합니다. CLI로 시작할 때 옵션이 빠졌다면 그 사실을 handoff에 적습니다.

### 현재 준비된 세션

- `UI/UX role — AGY Gemini 3.8 Flash high` — `gemini-3.8-flash / high` 스모크 완료
- `Implementation role — Codex GPT-6.1 Sol high` — `codex-ok` 스모크 완료, 실제 rollout
  `model=gpt-6.1-sol`, `effort=high`
- `Review role — OpenCode DeepSeek V4.1 Flash max` — `opencode-ok` 스모크 완료, 실제 OpenCode
  session `providerID=opencode-go`, `variant=max`

세션은 `completed` 상태이며 다음 작업을 같은 세션에 보내거나 새 역할 세션을 만들 수 있습니다.
스모크 worktree/branch는 검증 이력이므로 삭제하지 않습니다. 실제 작업은 새 worktree에서 시작하는
편이 안전합니다.

### 프로젝트 기본 모델

`t3_project_read`의 `defaultModelSelection`은 현재 `null`입니다. MCP outside-agent 권한으로
프로젝트 설정을 바꾸려 하면 `full-access` 호출 스레드/클라이언트가 필요하다는 오류가 납니다.
프로젝트 기본 모델을 원하면 사용자가 T3 UI의 프로젝트 설정에서 직접 지정해야 합니다. 역할 세션은
각자 명시 선택을 사용하므로 기본값이 없어도 실행할 수 있습니다.

## 3. 작업 흐름

1. **설계:** Puck이 PRD/ADR/API 계약을 갱신합니다. 확정 사항과 제안 기본값을 구분합니다.
2. **UI·UX:** AGY가 `docs/design/`에 화면 흐름·컴포넌트·토큰·상태 명세를 남깁니다. 구현 코드는
   만들지 않습니다.
3. **구현:** Codex가 승인된 작은 단위를 구현하고 `npm test`, `npm run build` 결과를 남깁니다.
4. **리뷰:** OpenCode가 구현 커밋과 계약을 읽고 문제·근거·최소 수정안을 정리합니다. 리뷰어는
   파일을 수정하지 않습니다.
5. **통합:** Puck/사용자가 계약 일치와 테스트 결과를 확인한 뒤 `main`에 merge합니다. 한 번에 하나의
   변경만 통합합니다.

### 전달은 수동

현재 역할 간 전달은 **수동**입니다. 사용자 또는 현재 에이전트가 PRD/디자인 명세/커밋 SHA/리뷰
결과를 다음 세션에 링크나 파일로 넘깁니다. T3는 child task·cross-provider child task capability와
MCP thread 생성·전송을 제공하지만, 이 프로젝트에 자동 역할 pipeline은 설정되어 있지 않습니다.
**세션을 만들 수 있다는 것과 자동 handoff가 된다는 것을 구분합니다.**

## 4. 동시 편집 방지

- `main` 체크아웃은 통합·실행 전용입니다. 역할 편집은 T3 worktree에서만 합니다.
- 하나의 worktree에는 한 명의 작성자만 들어갑니다. 리뷰는 같은 커밋을 읽기 전용으로 검토합니다.
- 같은 브랜치를 두 worktree에서 동시에 checkout하지 않습니다.
- 브랜치 접두사: `design/`(AGY), `impl/`(Codex), `review/`(OpenCode).
- 병렬 작업은 서로 다른 worktree·브랜치로 격리하고, merge는 한 번에 하나씩 합니다.
- SQLite 데이터(`data/quest.db`)는 한 프로세스만 씁니다. 병렬 검증은
  `QUEST_DB_PATH=data/verify-<name>.db`처럼 분리합니다.

## 5. Handoff 형식

```text
역할/세션:
provider/model/option (실제 선택):
worktree/branch/base commit:
변경 범위:
실행한 명령과 결과:
UI 확인(해당 시):
미검증/제한:
다음 역할에 넘길 결정:
```

말로만 “완료”라고 하지 않고, 명령 출력·테스트 수·스크린샷·커밋 SHA·실제 실행 metadata로 넘깁니다.

## 6. 지원 확인과 실행 증거

```bash
# T3 provider/model/option: MCP orchestrator_capabilities 또는 T3 UI
# Codex: gpt-6.1-sol / reasoningEffort=high
# OpenCode: opencode-go/deepseek-v4.1-flash / variant=max
# Antigravity: gemini-3.8-flash / thinking_level=high
```

- Codex는 실제 rollout의 `turn_context`에서 `payload.model`과 `payload.effort`를 확인합니다.
- OpenCode는 session DB의 `session_v2.model`과 assistant message model의 `providerID`, model,
  `variant`를 확인합니다.
- AGY는 capability의 `thinking_level` 현재값/기본값과 스모크 응답을 확인합니다. provider log가
  option 값을 redact하는 경우 wire-level proof로 과장하지 않습니다.
- T3 역할 세션은 현재 `approval-required` runtime mode입니다. 파일 수정·명령 실행에 승인이 필요할
  수 있으며, 무인 실행 권한은 별도 결정입니다.
- OpenCode는 OpenCode Go 인증을 사용합니다. 다른 모델·구독은 별도 인증 확인이 필요합니다.

## 7. 현재 상태와 이력

- 초기 bootstrap의 Amp Code low/medium 분담은 **대체됐습니다.** Amp MCP outside-agent 연결 기록은
  남아 있지만 앱 구현·리뷰 실행기가 아닙니다.
- medium 독립 리뷰 결과와 P1 두 건은 `docs/PRD.md` 17장에 이력으로 보존합니다. 이번 역할 설정은
  그 P1 수정이나 재리뷰를 수행하지 않았습니다.
- OMO는 T3 native OpenCode 2.2.5에서 기능 통합이 불가해 제외했습니다. 조사 상세는 PRD 18장에
  이력으로 보존합니다.
- 전체 게임 구현·공개 배포·디자인 산출물 작성은 이 workflow 정비의 승인 범위가 아닙니다.
