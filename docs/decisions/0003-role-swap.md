# ADR-0003: OpenCode 구현·Codex 리뷰 역할 교체

- 상태: **Accepted (project-specific), 2026-11-08**
- 결정자: 사용자 요청, Puck PRD revision 7, 부트스트랩 통합 작업
- 관련: `docs/PRD.md` 3·11·14·15·19·20장, `docs/roles.md`, `docs/agent-workflow.md`,
  `docs/t3-orchestration.md`, ADR-0002

## 맥락

PRD revision 7에서 사용자가 Codex와 OpenCode의 **역할만 교체**하도록 요청했습니다.

- 유지: Puck 제품·기술 설계, AGY `antigravity/gemini-3.8-flash/thinking_level=high` UI·UX
- 유지: OpenCode `opencode-go/deepseek-v4.1-flash/variant=max`
- 유지: Codex `gpt-6.1-sol/reasoningEffort=high`

새 역할은 OpenCode 구현, Codex 독립 리뷰입니다. 모델·effort/variant·인증·권한은 변경하지
않습니다. 기존 T3 스모크 세션과 medium 리뷰 결과는 이력으로 보존해야 합니다.

동시에 T3 자체 오케스트레이션 기능이 사용자 정의 multi-provider pipeline을 지원하는지 조사했습니다.
T3에는 native orchestration/subagent primitive가 있지만, 설치된 v0.1.5와 최신 v0.1.7 문서 범위에서
사용자가 설정하는 AGY → OpenCode → Codex pipeline UI는 확인되지 않았습니다.

## 결정

1. **구현:** T3 `opencode` / `opencode-go/deepseek-v4.1-flash` / `variant=max`.
2. **독립 리뷰:** T3 `codex` / `gpt-6.1-sol` / `reasoningEffort=high`.
3. AGY UI·UX와 Puck 설계 역할은 유지한다.
4. 기존 T3 스모크 스레드의 **제목만** 현재 역할로 바꾼다. 모델/option·세션 ID·과거 메시지는
   보존한다. 새 T3 스레드를 만들지 않는다.
5. 저장소 문서의 역할 표·프리셋·handoff·프롬프트 템플릿을 현재 역할로 바꾼다.
6. 기존 Codex 구현·OpenCode 리뷰와 Amp low/medium은 이력으로만 남긴다.
7. T3 native orchestration primitive(`delegate_task` 등)는 **조사·문서화만** 한다. 현재 프로젝트에
   자동 pipeline/daemon/외부 controller를 설치하지 않는다.
8. 프로젝트 기본 모델·인증·전역 권한은 변경하지 않는다.

## 결과

- 역할 세션 제목: `Implementation role — OpenCode DeepSeek V4.1 Flash max`,
  `Review role — Codex GPT-6.1 Sol high`. AGY 세션은 그대로다.
- `t3_thread_configure` readback으로 모델/option이 유지됨을 확인했다. 세션은 모두
  `approval-required`다.
- 실제 구현·리뷰 작업은 아직 시작하지 않았다. 기존 `codex-ok`/`opencode-ok`는 역할 작업이 아니라
  capability 스모크다.
- T3 native subagent/orchestration은 **부분 가능**이지만, 고정된 stage·artifact 자동 전달·자동
  재검토·자동 merge는 native UI 기능이 아니다. 상세는 `docs/t3-orchestration.md`.
- 이전 medium 리뷰의 P1/R1·R2 판단은 `docs/PRD.md` 17장에 이력으로 보존한다.

## 이 결정이 확정하지 않는 것

- 전체 게임 구현, P1 수정, 디자인 본작업, 공개 배포
- 자동 multi-provider pipeline/daemon/controller 구축
- T3 프로젝트 기본 모델의 최종값
- installed v0.1.5에서 직접 child approval/worktree isolation을 실행하는 UX
- T3 v0.1.7 업그레이드
