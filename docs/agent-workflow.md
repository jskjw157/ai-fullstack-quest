# T3 + Amp 개발 워크플로

이 문서는 제품·기술 설계(Puck), UI·UX(AGY), 구현(Amp low), 리뷰(Amp medium)를 같은 저장소에서
충돌 없이 진행하기 위한 운영 규칙입니다. `AGENTS.md`와 함께 읽습니다.

## 1. 역할과 산출물

| 단계 | 담당 | 작업 위치 | 산출물 |
| --- | --- | --- | --- |
| 제품·기술 설계 | Puck | 설계 아티팩트, `docs/PRD.md`, ADR | PRD, 우선순위, 데이터 흐름, API 계약, 인수 조건 |
| UI·UX | AGY / Gemini 3.8 Flash / high | T3 worktree, `design/<slug>` | 화면 흐름, 컴포넌트·토큰, 반응형·상태별 명세 |
| 구현 | Amp Code low | Amp worktree, `amp/<slug>` | 작은 기능 단위 코드, 테스트, 실행 결과 |
| 검토·리뷰 | Amp Code medium | 별도 worktree, 같은 커밋 | 정확성·보안·회귀·누락 리뷰 |

- **Puck**은 코드를 직접 수정하지 않습니다. 설계 변경은 PRD/ADR/API 계약으로 넘깁니다.
- **AGY**는 UI·UX 명세와 프로토타입을 담당합니다. 제품 코드 구현은 별도 승인 없이는 하지 않습니다.
- **Amp low**는 승인된 작은 단위를 구현하고 테스트·실행 증거를 남깁니다.
- **Amp medium**은 구현과 분리된 컨텍스트에서 리뷰합니다. 리뷰 중 코드를 수정하지 않습니다.
- low 스레드의 자기 검토는 medium 리뷰가 아닙니다. 리뷰를 대체했다고 보고하지 않습니다.

### 선행 리뷰가 필요한 변경

다음은 구현 전에 **Amp medium 설계 리뷰**를 거칩니다.

- DB 스키마·마이그레이션·데이터 보존 방식
- 인증·권한·세션·비밀 관리
- AI 외부 호출(제공자, 모델, 비용 한도, 개인정보 전송 범위)
- 배포·네트워크 노출 방식 변경

리뷰 결과는 PRD/ADR 또는 스레드에 남기고, 구현 담당은 그 결정을 벗어나지 않습니다.

## 2. T3 작업 흐름

T3 Code v0.1.5가 loopback에서 실행 중이며, 프로젝트 경로는 `~/projects/ai-fullstack-quest`입니다.

### AGY UI·UX 스레드

1. T3에서 새 스레드를 만들고 프로젝트를 `AI Fullstack Quest`로 선택합니다.
2. 작업공간은 **새 worktree**(base `main`)를 선택합니다.
3. Model picker에서 `Antigravity` → `Gemini 3.8 Flash` → thinking level `high`를 선택합니다.
4. 요청에는 화면 흐름, 컴포넌트·토큰, 빈/로딩/오류/좁은 화면 상태를 명시합니다.
5. 산출물은 `docs/design/` 아래 Markdown 명세로 남기고, 구현 코드는 별도 승인 전에는 만들지 않습니다.

MCP로 스레드를 시작할 때의 model selection:

```json
{
  "provider": "antigravity",
  "instanceId": "antigravity",
  "model": "gemini-3.8-flash",
  "options": { "thinking_level": "high" }
}
```

T3 live capabilities에서 위 provider/model/option과 `constraints: []`를 확인했고, 같은 설정의
스모크 스레드가 `gemini-3.8-flash / high`라고 응답했습니다(2026-11-08). 모델 ID는
`gemini-3.8-flash`이고 `high`는 옵션입니다. 지원이 사라지거나 제약이 생기면 임의 모델로 바꾸지
말고 사용자에게 보고합니다.

### Amp 구현 스레드

```bash
cd ~/projects/ai-fullstack-quest
git fetch origin
git worktree add .worktrees/amp-<slug> -b amp/<slug> origin/main
cd .worktrees/amp-<slug>
```

- Amp 스레드는 `--mode low`로 시작합니다(현재 부트스트랩 스레드도 low).
- 한 worktree에는 한 작성자만 들어갑니다.
- `node_modules`는 Git에 포함되지 않습니다. `package.json`이 바뀌지 않았다면 main의
  `node_modules`를 심볼릭 링크해 재사용할 수 있고, 바뀌었다면 worktree에서 `npm install`합니다.
- 작업 후 `npm test`, `npm run build`를 실행하고 결과를 handoff에 적습니다.
- `main`에는 직접 커밋하지 않습니다.

### Amp 리뷰 스레드

```bash
git worktree add --detach .worktrees/review-<slug> <review-commit>
```

- `--mode medium`으로 별도 스레드를 시작합니다.
- 구현 컨텍스트를 물려주지 않고, PRD/ADR/API 계약과 diff만 제공합니다.
- 리뷰 결과는 문제·근거·최소 수정안 순서로 정리합니다. 리뷰어는 파일을 수정하지 않습니다.
- low는 리뷰 지적을 반영하고 같은 브랜치에 추가 커밋을 올립니다.

### 통합

1. Puck(또는 사용자)이 PRD/API 계약과의 일치를 확인합니다.
2. 테스트·빌드·UI 렌더 확인 결과를 확인합니다.
3. `main`으로 fast-forward 또는 PR merge합니다.
4. 사용한 worktree를 정리합니다: `git worktree remove .worktrees/<name>`.

## 3. 동시 편집 방지

- **main 체크아웃은 통합·실행 전용**입니다. 에이전트 편집은 worktree에서만 합니다.
- 브랜치 접두사: `design/`(AGY), `amp/`(구현), `review/`(검토 메모가 필요할 때).
- 하나의 worktree에 둘 이상의 작성자가 동시에 접근하지 않습니다.
- 병렬 작업은 서로 다른 worktree·브랜치로 격리하고, merge는 한 번에 하나씩 합니다.
- T3의 built-in worktree는 T3 데이터 디렉터리 아래에, Amp worktree는 저장소의 `.worktrees/`에
  만듭니다. 둘 다 같은 Git 저장소의 worktree이므로 파일 충돌은 없지만, 동일 브랜치를 두 곳에서
  checkout하지 않습니다.
- SQLite 데이터(`data/quest.db`)는 한 프로세스만 씁니다. 병렬 검증은
  `QUEST_DB_PATH=data/verify-<name>.db`처럼 분리합니다.

## 4. Handoff 형식

```text
브랜치/커밋:
변경 범위:
실행한 명령과 결과:
UI 확인(데스크톱/좁은 화면):
남은 결정/미검증:
```

말로만 "완료"라고 하지 않고, 명령 출력·테스트 수·스크린샷·커밋 SHA로 넘깁니다.

## 5. 지원 확인 명령

```bash
# Amp 모드
amp --help | grep -A2 -- '--mode'

# T3 provider/model/option (MCP outside-agent 경유)
# orchestrator_capabilities 도구에서 antigravity / gemini-3.8-flash /
# thinking_level=high, constraints=[] 확인

# T3 MCP 연결
amp mcp doctor t3
```

T3 v0.1.5에는 Amp native provider가 없고 Amp CLI에는 ACP 서버 모드가 없습니다. Amp 연결은
T3 MCP outside-agent 경로(`http://127.0.0.1:3773/mcp`)만 사용합니다. T3 provider 설정에 Amp를
끼워 넣는 방식은 지원되지 않으므로 시도하지 않습니다.

## 6. 현재 상태

- 부트스트랩 scaffold는 baseline 커밋 전 `main` 체크아웃에서 생성했습니다.
- T3 프로젝트 등록, AGY provider/model/option, Amp MCP 연결(66 tools)을 완료·검증했습니다.
- AGY 스모크 스레드는 `gemini-3.8-flash / high`로 응답했고 파일을 변경하지 않았습니다.
- **Amp medium 리뷰는 아직 수행하지 않았습니다.** 다음 기능 중 DB·인증·AI 외부 호출·배포
  변경이 있으면 구현 전에 medium 리뷰를 먼저 엽니다.
- T3 프로젝트 기본 모델은 아직 AGY high로 저장되어 있지 않습니다. outside-agent MCP 자격 증명이
  `approval-required`라 프로젝트 설정 변경 권한이 없으므로, T3 UI의 프로젝트 설정에서 사용자가
  `Antigravity / Gemini 3.8 Flash / high`를 기본값으로 지정해야 합니다.
