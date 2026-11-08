# 개발 역할·모델 설정

이 문서는 `ai-fullstack-quest`에서 사용자가 승인한 **현재 역할 분담**과 T3에서의 실제 사용 방법을
정리합니다. 역할은 목표 구성이며, 각 세션의 실제 provider/model/option은 T3 live capability와 실행
기록으로 확인합니다. 이 문서는 전체 게임 구현·P1 수정·공개 배포를 승인하지 않습니다.

## 1. 현재 역할

| 역할 | 실행 위치 | 정확한 선택 | 산출물 |
| --- | --- | --- | --- |
| 제품·기술 설계 | Puck (Amp 설계 아티팩트) | T3 provider 세션이 아님 | PRD, 우선순위, 데이터 흐름, API 계약, 인수 조건 |
| UI·UX | T3 native Antigravity | `antigravity` / `gemini-3.8-flash` / `thinking_level=high` | 화면 흐름, 컴포넌트·토큰, 반응형·상태별 명세 |
| 코드 구현 | T3 native Codex | `codex` / `gpt-6.1-sol` / `reasoningEffort=high` | 작은 기능 단위 코드, 테스트, 실행 결과 |
| 독립 검토·리뷰 | T3 native OpenCode | `opencode` / `opencode-go/deepseek-v4.1-flash` / `variant=max` | 정확성·보안·회귀·누락 검토 |

- **Puck**은 T3의 모델 provider가 아닙니다. 설계 변경은 PRD/ADR/API 계약으로 넘기고, 구현 세션은
  그 문서를 읽습니다.
- **AGY**의 `high`는 모델 ID가 아니라 `thinking_level` 옵션입니다.
- **Codex**의 `high`는 모델 ID가 아니라 `reasoningEffort` 옵션입니다. `gpt-6.1-sol`의 기본
  effort는 `low`이므로 high를 명시해야 합니다. `serviceTier`는 별도로 올리지 않고 기본값을
  사용합니다.
- **OpenCode**의 `max`는 모델 ID가 아니라 `variant` 옵션입니다. 선택한 모델은 OpenCode Go의
  `deepseek-v4.1-flash`이며, 별도 무료 모델 `opencode/deepseek-v4.1-flash-free`와 구분합니다.
- 이전의 Amp Code low 구현·medium 리뷰 분담은 **대체됐습니다.** Amp는 이 앱의 구현·리뷰 실행기로
  쓰지 않습니다. 과거 기록은 PRD 16~17장에 이력으로 보존합니다.

## 2. T3 role preset (문서상의 preset)

T3 0.1.5에서 확인한 project 설정 schema는 **하나의 `defaultModelSelection`**과 scripts를 제공합니다.
CLI에도 이름 붙은 모델 preset subcommand가 없습니다. 따라서 세 역할을 한 프로젝트 기본값으로 동시에
표현할 수 없고, 아래 JSON을 **스레드 생성 시 선택하는 preset**으로 사용합니다.

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

T3 UI의 model picker에서 같은 provider/model/option을 고르거나, T3 MCP의 `t3_thread_launch`에
model selection을 넘깁니다. **모델명이나 프롬프트에 `high`/`max`라고 적는 것만으로는 설정이
적용되지 않습니다.** 실행 전에 T3 capability의 option 값과 실행 후 provider metadata를 확인합니다.

## 3. 준비된 T3 세션

아래 세션은 모델·옵션 스모크를 마친 **역할 세션**입니다. `completed` 상태이며, 다음 작업은 같은
세션에 메시지를 보내거나 새 역할 세션을 만들어 시작할 수 있습니다. 스모크 세션의 worktree와 branch는
검증 이력이므로 삭제하지 않습니다.

| 역할 | T3 세션 제목 | 스모크 응답 |
| --- | --- | --- |
| UI·UX | `UI/UX role — AGY Gemini 3.8 Flash high` | `gemini-3.8-flash / high` |
| 구현 | `Implementation role — Codex GPT-6.1 Sol high` | `codex-ok` |
| 리뷰 | `Review role — OpenCode DeepSeek V4.1 Flash max` | `opencode-ok` |

T3 접근은 T3 Connect의 `app.t3.codes`에서 이 환경의 `AI Fullstack Quest` 프로젝트를 여는 방식입니다.
프로젝트 경로는 `~/projects/ai-fullstack-quest`입니다. T3 화면의 스레드 목록에서 위 제목을 찾습니다.

### 새 역할 세션을 만들 때

1. T3에서 `AI Fullstack Quest` 프로젝트를 엽니다.
2. 새 스레드에서 **새 worktree**(base `main`)를 선택합니다.
3. 위 preset의 provider/model/option을 정확히 선택합니다.
4. 역할에 맞는 요청만 보냅니다. UI·UX는 구현 코드를 만들지 않고, 리뷰는 파일을 수정하지 않습니다.
5. 결과에는 커밋·변경 파일·실행 명령·테스트 결과·미검증 항목을 남깁니다.

T3 CLI의 `t3 thread start`는 `--provider`/`--model`/`--worktree`를 지원하지만 effort/variant 옵션
플래그는 확인되지 않았습니다. 옵션이 필요한 역할은 **T3 UI 또는 MCP launch**를 사용하고, CLI로
시작할 때는 옵션이 빠졌음을 인지해야 합니다.

## 4. 실제 검증 결과

### Codex 구현 역할 — 확인

- T3 live capability: `codex` / `gpt-6.1-sol`, `reasoningEffort` 값
  `low, medium, high, xhigh, max, ultra`, `serviceTier` 값 `default, priority`, `constraints: []`.
- T3 스모크 스레드가 `codex-ok`로 응답했고 thread metadata의 model은 `gpt-6.1-sol`이었습니다.
- 실제 Codex rollout의 `turn_context`에서 `payload.model=gpt-6.1-sol`,
  `payload.effort=high`를 확인했습니다. 이는 요청값과 실행 기록이 일치한다는 근거입니다.
- 같은 `turn_context`에 `approval_policy=untrusted`, `sandbox_policy=read-only`가 기록됐습니다.
  스모크는 파일을 수정하지 않았으므로 구현 쓰기 권한은 검증되지 않았습니다. 실제 구현은 T3의
  `approval-required` 승인과 필요 시 권한 조정을 거쳐야 합니다.
- 스모크 worktree는 파일 변경 없이 clean이었습니다.

### OpenCode 리뷰 역할 — 확인

- T3 live capability: `opencode` / `opencode-go/deepseek-v4.1-flash`, `variant` 값
  `low, high, max`, `constraints: []`.
- T3 스모크 스레드가 `opencode-ok`로 응답했고 thread metadata의 model은
  `opencode-go/deepseek-v4.1-flash`였습니다.
- OpenCode session DB의 `session_v2.model`과 assistant message model이 모두
  `{"id":"deepseek-v4.1-flash","providerID":"opencode-go","variant":"max"}`였고, assistant
  메시지에 reasoning token이 기록됐습니다. 이는 variant=max가 실제 세션에 전달됐다는 근거입니다.
- 저장된 T3 OpenCode 인증은 OpenCode Go만 확인됐습니다. 다른 구독·무료 모델을 자동으로 쓴다고
  가정하지 않습니다.

### AGY UI·UX 역할 — 부분 확인

- T3 live capability: `antigravity` / `gemini-3.8-flash`, `thinking_level` 값
  `low, medium, high`, 기본값 `high`, `constraints: []`.
- T3 스모크 스레드가 `gemini-3.8-flash / high`로 응답했고, T3 캐시의 모델 option 현재값도
  `high`였습니다.
- T3 provider 로그는 요청 option 값을 redact해 **wire-level thinking_level을 독립적으로
  확인하지 못했습니다.** 따라서 “모델 기본값 high + high 선택 + 스모크 응답”까지 확인했고,
  “T3가 high를 명시적으로 전송했다”는 별도 증명은 없습니다. 이 한계를 AGY high 적용 완료로
  과장하지 않습니다.

### 프로젝트 기본 모델 — 차단

- `t3_project_read` 결과 `defaultModelSelection`은 `null`입니다.
- `t3_project_update`로 기본 모델을 바꾸려 하면 다음 권한 오류가 납니다:
  `Changing projects or environment settings needs a live full-access/default calling thread or a
  full-access client.`
- 이는 **역할 세션의 모델 선택과 별개**입니다. 역할 세션은 위처럼 명시적으로 선택했지만, 프로젝트
  기본값은 사용자가 T3 UI의 프로젝트 설정에서 지정해야 합니다. 권한을 우회하거나 full-access
  credential을 새로 만들지 않았습니다.

## 5. 작업 전달: 수동 vs 자동

**현재 역할 간 전달은 수동입니다.**

- Puck의 설계 → AGY/Codex 세션: 사용자가 PRD/ADR/API 계약 링크나 요약을 다음 세션에 전달합니다.
- UI·UX → 구현: 사용자가 디자인 명세 경로와 승인 범위를 구현 세션에 전달합니다.
- 구현 → 리뷰: 구현 세션이 커밋 SHA·변경 범위·테스트 결과를 남기고, 사용자가 리뷰 세션에 그
  커밋을 지정합니다.
- 리뷰 → 구현: 리뷰 결과를 사용자가 구현 세션에 전달합니다.

T3는 Codex/OpenCode/Antigravity에 child task·cross-provider child task capability를 노출하고,
MCP로 스레드를 생성·전송할 수 있습니다. 그러나 **이 프로젝트에 역할 순서를 자동 실행하는 pipeline은
설정하지 않았습니다.** T3 UI에서 세션을 만들 수 있다는 사실과 세션 간 자동 handoff는 다릅니다.
자동 routing을 도입하려면 별도 설계·권한·실패 처리 결정이 필요합니다.

## 6. 동시 편집 규칙

- `main` 체크아웃은 통합·실행 전용입니다. 역할 작업은 T3의 built-in worktree에서 합니다.
- 한 worktree에는 한 작성자만 들어갑니다. 리뷰어는 같은 커밋을 **읽기 전용**으로 검토합니다.
- 구현 세션과 리뷰 세션은 같은 체크아웃을 동시에 편집하지 않습니다.
- 역할별 branch prefix는 `design/`, `impl/`, `review/`를 사용하고, merge는 한 번에 하나씩 합니다.
- SQLite 검증은 `QUEST_DB_PATH`로 파일을 분리하고, 같은 DB 파일을 두 프로세스에 열지 않습니다.

## 7. 인증·권한·제한

- T3 역할 세션은 현재 `approval-required` runtime mode입니다. 파일 수정·명령 실행에는 사용자의
  승인이 필요할 수 있습니다. 무인 실행이 필요하면 별도 권한 결정을 먼저 합니다.
- OpenCode는 OpenCode Go 인증을 사용합니다. Codex·AGY는 이미 연결된 인증을 사용하며, 이번 작업에서
  인증·구독·모델 기본값을 변경하지 않았습니다.
- 모델·effort/variant가 제공되지 않거나 인증·권한에 막히면 **다른 모델로 조용히 대체하지 않고**
  정확한 제한과 필요한 사용자 조치를 보고합니다.
- OMO는 이 프로젝트에서 사용하지 않습니다. T3 native OpenCode 2.2.5의 OMO 호환성 조사 결과는
  PRD 18장에 이력으로 남아 있습니다.
- Amp는 T3 MCP outside-agent 연결 기록이 있지만, 현재 앱 구현·리뷰의 실행기가 아닙니다.

## 8. 다음 역할 작업의 handoff 형식

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

구현 세션은 테스트와 빌드 결과를, 리뷰 세션은 문제·근거·최소 수정안을, AGY는 화면 흐름·상태·토큰
명세를 남깁니다. 말로만 “완료”라고 하지 않습니다.
