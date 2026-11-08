# ADR-0002: T3 native 역할·모델 라우팅

- 상태: **Accepted (project-specific), 2026-11-08**
- 결정자: 사용자 승인, Puck 설계, 부트스트랩 통합 작업
- 관련: `docs/PRD.md` 3·11·14·15장, `docs/roles.md`, `docs/agent-workflow.md`

## 맥락

초기 기반은 Amp Code low 구현·medium 리뷰를 전제로 했습니다. 사용자는 이후 구현·리뷰를 T3 native
Codex/OpenCode로 바꾸고, AGY UI·UX와 Puck 설계를 유지하도록 승인했습니다. 동시에 OMO는 제외하고,
Amp를 앱 코드 구현·리뷰의 대체 실행기로 쓰지 않기로 했습니다.

T3 live capability에서 다음 선택이 실제로 제공되는 것을 확인했습니다.

- Codex `gpt-6.1-sol`, `reasoningEffort`에 `high` 포함
- OpenCode `opencode-go/deepseek-v4.1-flash`, `variant`에 `max` 포함
- Antigravity `gemini-3.8-flash`, `thinking_level`에 `high` 포함

Codex와 OpenCode는 모델·effort/variant가 실제 실행 기록에서도 확인됐습니다. AGY는 모델 기본값과
스모크 응답으로 high를 확인했지만 provider log가 option 값을 redact해 wire-level 증거는 제한적입니다.

## 결정

1. 제품·기술 설계는 Puck이 PRD/ADR/API 계약으로 담당한다.
2. UI·UX는 T3 `antigravity` / `gemini-3.8-flash` / `thinking_level=high` 세션에서 수행한다.
3. 구현은 T3 `codex` / `gpt-6.1-sol` / `reasoningEffort=high` 세션에서 수행한다.
4. 독립 리뷰는 T3 `opencode` / `opencode-go/deepseek-v4.1-flash` / `variant=max` 세션에서 수행한다.
5. 역할 간 전달은 **수동**으로 한다. T3 child task/MCP 기능은 사용할 수 있지만, 자동 역할 pipeline은
   이번 결정에 포함하지 않는다.
6. 동일 체크아웃 동시 편집을 금지하고, T3 built-in worktree에서 한 작성자만 작업한다.
7. 모델·effort/variant가 지원되지 않거나 인증·권한에 막히면 다른 값으로 조용히 대체하지 않고
   사용자에게 보고한다.
8. 프로젝트 기본 모델은 권한상 변경하지 않는다. 역할별 선택은 각 세션에서 명시하며, 필요하면
   사용자가 T3 UI에서 프로젝트 기본값을 직접 지정한다.

## 결과

- 역할 세션은 모델 선택이 명시되어야 하며, 모델명이나 프롬프트 문구만으로 effort가 적용됐다고
  간주하지 않는다.
- 프로젝트 기본 모델 하나로 세 역할을 동시에 표현할 수 없다. T3 0.1.5의 확인된 project schema는
  단일 `defaultModelSelection`을 제공하며, CLI에도 named model preset subcommand가 없다.
- T3 role sessions는 현재 `approval-required`이므로 구현·리뷰 중 승인이 필요할 수 있다.
- OpenCode Go 인증이 저장된 범위다. 다른 모델·구독은 별도 인증 확인이 필요하다.
- OMO와 Amp는 이 프로젝트의 앱 구현·리뷰 실행기가 아니다.
- 기존 medium 리뷰 결과와 P1 판단은 `docs/PRD.md` 17장에 이력으로 보존하며, 이 ADR은 그 결과를
  재검토 완료로 바꾸지 않는다.

## 이 결정이 확정하지 않는 것

- 전체 게임 구현, P1 수정, 공개 배포
- 자동 역할 routing/pipeline
- DB·인증·AI 외부 호출의 최종 설계
- 프로젝트 기본 모델의 최종값(사용자 T3 UI 결정)
- AGY의 wire-level thinking level 독립 증명
