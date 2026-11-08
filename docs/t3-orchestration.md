# T3 Code 오케스트레이션 조사

- 조사일: 2026-11-08
- 대상: 이 VPS에 설치된 native T3 Code **v0.1.5**, upstream 최신 **v0.1.7**
- 범위: T3 자체의 오케스트레이션/subagent 기능, 사용자 정의 multi-provider workflow 지원 여부
- 하지 않은 것: T3 업그레이드, daemon/외부 controller 설치, 서비스 재시작, full-access 권한 확대,
  앱 구현·P1 수정·디자인 본작업·배포

## 1. 판정 요약

| 질문 | 판정 | 근거·제한 |
| --- | --- | --- |
| T3에 orchestration 계층이 있는가? | **가능 (native)** | thread/run/execution graph, subagent, approval, checkpoint, context transfer를 내부 orchestration으로 모델링 |
| T3에 child agent/subagent 기능이 있는가? | **가능 (native primitive)** | live MCP에 `delegate_task`, `task_status`, `task_cancel`; provider capability의 `canRunChildTask` |
| 다른 provider/model로 child를 띄울 수 있는가? | **가능** | Codex/OpenCode/Antigravity 모두 `canRunCrossProviderChildTask=true` |
| 사용자가 UI에서 AGY → OpenCode → Codex 순차 pipeline을 만들 수 있는가? | **미지원/미확인** | 설치된 client settings route와 T3 v0.1.5/v0.1.7 문서에 pipeline builder가 없음 |
| 단계별 산출물이 자동 전달되는가? | **부분/제한** | child 결과는 parent에 subagent result context transfer로 돌아오지만, 임의 파일/계약/조건 전달은 controller가 설계해야 함 |
| 완료·실패·재검토 조건이 자동인가? | **부분/제한** | task status와 terminal status는 제공; 자동 retry/re-review는 없음. 별도 `delegate_task` 호출 필요 |
| 승인 게이트가 있는가? | **가능** | runtime modes와 parent/child 권한 상한; child는 parent보다 넓은 권한을 받을 수 없음 |
| 파일 충돌 격리가 있는가? | **부분/가능** | worktree 격리와 `delegate_task` live schema의 `isolation`; 자동 merge는 없음 |
| 외부 controller만으로 native child delegation이 가능한가? | **부분/미검증** | MCP endpoint는 공개되지만 `delegate_task`는 active parent run을 요구한다는 문서 제약이 있음 |
| 별도 plugin이 필요한가? | **native subagent에는 불필요** | T3 provider agents receive the T3 MCP surface (provider support includes Codex/OpenCode/Antigravity; injection differs by adapter). 자동 pipeline은 parent agent prompt 또는 외부 controller가 필요 |

**핵심 구분:** T3에 “오케스트레이션 엔진과 subagent primitive”가 있는 것은 사실이다. 그러나 그것은
사용자가 설정하는 **선언적 multi-agent pipeline**과 같지 않다. 현재 프로젝트의 역할 전달은 여전히
수동이며, 자동 pipeline은 별도로 설계·구현해야 한다.

## 2. T3 내부 구조 — 엔진과 제품 기능을 혼동하지 않기

T3 공식 저장소의 `docs/orchestration-v2/`는 **목표 아키텍처**를 설명한다. 이 문서의 존재는
“사용자용 pipeline UI가 구현됐다”는 뜻이 아니다. 문서 자체도 “target architecture”이며 현재 구현의
patch plan이 아니라고 명시한다.

확인된 내부 이름과 경계:

- `OrchestratorV2`: V2 command/event processor. thread/run/execution graph의 하위 처리.
- `ThreadManagementService`: WebSocket과 MCP가 공유하는 server application boundary. thread lookup,
  send-mode, durable postcondition, wait polling, interrupt 선택을 담당.
- `OrchestratorMcpService`: 인증된 MCP ingress. `delegate_task`를 직접 provider adapter로 보내지 않고
  V2 `delegated_task.request` command로 바꾼다.
- `OrchestratorToolkit`: orchestration MCP tool 정의.
- `ProviderSessionManager`: provider session에 T3 MCP endpoint/credential을 주입한다.
- `delegated_task.request`: child thread/run 생성 command.
- `subagent_spawn` / `subagent_result`: parent-child context transfer 관계.
- `run`, `ExecutionNode`, `subagent.started`, `subagent.completed`,
  `approval.requested`, `approval.resolved`: 실행 graph/활동 이벤트.

중요한 invariant:

- root run만 사용자-visible run을 완료한다. child/subagent 완료가 parent run을 닫지 않는다.
- child는 parent conversation history를 복사받지 않는다. `delegate_task`가 준 task prompt와 선택적
  role instruction만 받는다.
- child thread는 `subagent` lineage를 갖고 parent node를 가리킨다.
- child의 결과는 parent에 subagent result context transfer로 전달된다.
- fork, provider handoff, merge-back, subagent는 같은 lineage/context-transfer 계열이지만 서로 다른
  제품 기능이다.

출처:

- <https://github.com/pingdotgg/t3code/blob/v0.1.5/docs/orchestration-v2/README.md>
- <https://github.com/pingdotgg/t3code/blob/v0.1.5/docs/orchestration-v2/orchestrator-mcp-server.md>
- <https://github.com/pingdotgg/t3code/blob/v0.1.5/docs/orchestration-v2/thread-lineage-and-context-transfer.md>
- <https://github.com/pingdotgg/t3code/blob/v0.1.5/docs/orchestration-v2/feature-lifecycles.md>

## 3. 실제로 노출된 native primitive

### `delegate_task`

live MCP schema와 official v0.1.5 문서에서 확인한 입력:

```json
{
  "task": "child에게 줄 작업",
  "target": {
    "providerInstanceId": "opencode",
    "driverKind": "opencode",
    "model": "opencode-go/deepseek-v4.1-flash",
    "options": { "variant": "max" }
  },
  "title": "optional child title",
  "role": "implementation | research | review | design | test | general",
  "isolation": "shared | worktree",
  "mode": "async | wait",
  "timeoutMs": 600000,
  "runtimeMode": "inherit | approval-required | auto-accept-edits | auto | full-access",
  "interactionMode": "inherit | default | plan"
}
```

- `isolation`은 **설치된 live MCP schema에는 있지만 v0.1.5 official 문서의 `DelegateTaskInput`에는
  아직 표기되지 않는다.** live schema의 설명은 `worktree`: parent commit에서 별도 checkout을 만들고
  uncommitted edits는 복사하지 않는다고 한다. 이번 조사에서는 `isolation` 실행 스모크를 하지 않았다.
- `role`은 child에게 전달되는 역할 힌트이며, T3의 stage/condition DSL이 아니다.
- `mode: wait`는 child 결과를 기다리지만 timeout이 child를 취소하지 않는다. `task_status`로 이어서
  확인할 수 있다.
- child는 parent history를 받지 않으므로, 구현에 필요한 계약·파일 경로·이전 리뷰를 task prompt에
  명시해야 한다.

live `orchestrator_capabilities`에서 확인:

- Codex: `canRunChildTask=true`, `canRunCrossProviderChildTask=true`, `constraints=[]`
- OpenCode: `canRunChildTask=true`, `canRunCrossProviderChildTask=true`, `constraints=[]`
- Antigravity: `canRunChildTask=true`, `canRunCrossProviderChildTask=true`, `constraints=[]`

### Thread/context 도구

- `t3_thread_launch`: top-level thread를 만들고 workspace를 먼저 bind. `workspaceStrategy: root |
  existing_worktree | worktree`; worktree는 별도 checkout.
- `create_threads`: 1~20개의 ordinary top-level thread. subagent lineage는 없다. batch 생성용.
- `t3_thread_send`: `auto | queue | steer | restart`; target mode는 caller보다 넓을 수 없다.
- `t3_thread_wait` / `t3_thread_interrupt`: run 대기/중단.
- `t3_thread_transfer`: fork/merge-back context transfer. 같은 project의 related thread로 context를
  옮길 수 있지만, 산출물 파일을 자동 merge하는 기능은 아니다.
- `t3_pending_request`: pending user question을 list/read/respond. approval은 이 도구로 승인할 수
  없다.
- `t3_workflow_stop` / `t3_background_wait`: Claude workflow/background 전용 제어. multi-provider
  pipeline builder가 아니다.
- `schedule_task`: interval/fixed-time/webhook으로 prompt를 실행하는 scheduler. 반복 작업을 자동
  시작할 수 있지만, 역할 순차 pipeline/artifact 전달 기능은 아니다.

### 설치본 상태 DB 관찰

현재 T3 데이터 디렉터리의 상태 DB를 read-only로 열어 table/row count만 확인했다(개인 메시지 내용은
읽지 않음).

- `orchestration_v2_projection_subagents`: **0 rows**
- `orchestration_v2_projection_context_transfers`: **0 rows**
- `scheduled_tasks`: **0 rows**
- `orchestration_events`에서 `subagent`, `delegate`, `workflow`, `pipeline`을 포함하는 event type:
  **없음**
- `orchestration_v2_thread_launch_workflows`(내부 launch transaction): **0 rows**

이는 현재 이 T3 인스턴스에 **구성된 child task/pipeline/scheduled automation이 없다**는 관측이다.
T3 제품에 해당 기능이 없다는 증거가 아니며, 기능 자체는 tool schema/docs로 별도 확인했다.

## 4. 사용자 정의 multi-provider pipeline 지원 분석

### 가능한 것

- parent T3 agent가 `delegate_task`를 **명시적으로** 호출해 OpenCode 구현 child를 만들고,
  `task_status`/`wait`로 결과를 받은 뒤, Codex 리뷰 child를 다시 호출하는 식의 **imperative workflow**는
  구성할 수 있다.
- 각 child는 provider/model/options를 독립 선택할 수 있고, role/isolation/runtime mode를 지정할 수
  있다.
- parent/child lineage와 context transfer, child thread 읽기, `t3_thread_transfer`가 있다.
- T3 UI에서 새 스레드의 model picker에 여러 모델을 shift-click해 같은 prompt를 병렬
  스레드/worktree로 시작할 수 있다. 이는 **여러 독립 세션**이지, 한 모델의 산출물을 다음 모델로
  넘기는 순차 pipeline이 아니다.
- child는 parent와 별도 worktree를 사용할 수 있어 동시 편집 충돌을 줄일 수 있다.
- T3는 child approval/status를 parent에 노출하는 기능을 제공한다. 단, **설치된 v0.1.5와 최신
  v0.1.7의 UI 차이**가 있다. v0.1.7 release highlight에는 “Child approvals: Respond to delegated
  child approvals directly from the parent conversation”가 포함되지만, v0.1.5에서 동일 UX를
  검증하지 않았다.

### 자동이 아닌 것

- **고정된 stage 순서** AGY UI → OpenCode 구현 → Codex 리뷰를 선언하는 UI/settings가 없다.
- **stage별 완료 조건**을 선언하는 기능이 없다. `task_status`가 terminal status를 알려줄 뿐,
  “리뷰에서 P1이 있으면 구현으로 돌아간다” 같은 조건은 parent/controller가 판단해야 한다.
- **자동 artifact 전달**이 없다. child 결과 summary/context transfer와 thread read가 전부이며,
  디자인 명세·diff·테스트 결과를 stage 사이에 자동으로 매핑하지 않는다.
- **자동 re-review**가 없다. official 문서는 독립 리뷰 라운드마다 원래 brief, 이전 findings,
  responses, unresolved objections를 담아 **새 `delegate_task`**를 호출하라고 한다.
- **자동 merge/PR 생성/충돌 해결**이 없다. worktree isolation은 별도 checkout만 만든다.
- **사용자 승인을 대신하는 기능**이 없다. child approval/question은 사용자에게 가야 하며, MCP
  `t3_pending_request`로 approval을 승인할 수 없다.

## 5. UI와 설정 경로

### 실제로 확인한 설치본 경로

설치된 client bundle의 settings route 목록과 화면 문자열에서 확인:

- `Settings → Providers` — provider/model 활성화. 프로젝트별 provider on/off override 가능.
- `Settings → Threads` — new thread permissions/thread behavior.
- `Settings → Projects` — 프로젝트 설정과 기본 모델.
- `Settings → Scheduled tasks` (`/settings/scheduled-tasks`) — 반복/웹훅 prompt 실행.
- `Settings → Environments` / `Sharing & access` — MCP outside-agent URL/권한.
- `Settings → Labs` — linked environments(다른 머신의 agent 연결) 등.
- Thread details card — `Lineage`(fork/subagent 관계), `Automations`(scheduled tasks 링크).
- 설치된 client의 settings route는 `/settings/providers`, `/settings/threads`, `/settings/projects`,
  `/settings/scheduled-tasks`, `/settings/connections`, `/settings/labs` 등이며
  `/settings/orchestration`·`/settings/workflows`는 없다.
- Web/desktop 공식 v0.1.5 문서 — **Agents** view에서 delegated subagent 작업을 따라감. 설치된
  client source에도 `Subagent`, `Open parent thread`, `Lineage` 관련 UI 문자열이 있다. 다만 이번
  조사에서 실제 브라우저로 메뉴를 클릭해 확인하지는 않았고, 문서+client source 근거다.

**없는 경로:** 설치된 client의 settings route 목록에 `Orchestration`, `Workflows`, `Pipelines`
설정 페이지가 없다. official v0.1.5/v0.1.7 user docs에도 사용자 정의 multi-agent pipeline 문서가
없다. `docs/orchestration-v2/`는 내부 target architecture 문서다.

### 사용자가 실제로 할 수 있는 일

1. **현재 역할 작업:** `Implementation role — OpenCode...`와 `Review role — Codex...` 세션을 열고
   `docs/roles.md`의 역할 프롬프트를 보낸다. 전달은 수동이다.
2. **native subagent 구경:** parent T3 thread에서 agent가 `delegate_task`를 호출하면, web/desktop의
   **Agents**/thread details **Lineage**에서 child를 따라갈 수 있다. child thread에는 직접 메시지를
   보내지 말고 parent에 메시지를 보낸다(공식 v0.1.5 문서).
3. **실험적 순차 workflow:** parent T3 agent에게 “OpenCode child를 만들고, 결과를 읽고, Codex child로
   리뷰하라”는 prompt를 주는 방식. 이것은 native pipeline 설정이 아니라 **agent가 imperative tool을
   호출하는 custom workflow**다. production P1/게임 구현에는 아직 사용하지 않는다.
4. **외부 controller:** T3 MCP endpoint를 OAuth로 연결한 외부 agent/script가 `t3_thread_launch`,
   `t3_thread_send`, `t3_thread_wait`를 호출할 수 있다. `delegate_task`는 문서상 active parent run이
   필요하므로, 외부 controller가 child delegation까지 하려면 parent thread/provider session 경계를
   먼저 설계해야 한다. 이번에 controller/daemon은 설치·구축하지 않았다.

## 6. 설치 버전과 최신 버전

- 설치: **T3 Code v0.1.5**, 2026-10-29 release. native systemd, loopback listener, 기존 데이터 보존.
- 최신(조사 시점): **v0.1.7**, 2026-11-04 release.
- v0.1.7 release의 관련 highlight:
  - Child approvals — parent conversation에서 delegated child approval 응답.
  - One-time schedules — 특정 시각 1회 실행.
  - Shareable thread links, usage filters, model switch history.
- v0.1.7 official orchestration docs도 `delegate_task`/thread tools/context transfer를 설명하며,
  **사용자 정의 pipeline builder를 추가했다는 근거는 없다.**
- 따라서 “최신 버전이면 자동 multi-provider pipeline이 생긴다”고 가정하지 않는다. 업그레이드는
  별도 승인·서비스 영향 검토가 필요하며 이번에 하지 않았다.

출처:

- <https://github.com/pingdotgg/t3code/releases/tag/v0.1.5>
- <https://github.com/pingdotgg/t3code/releases/tag/v0.1.7>
- <https://github.com/pingdotgg/t3code/blob/v0.1.7/docs/orchestration-v2/orchestrator-mcp-server.md>
- <https://github.com/pingdotgg/t3code/blob/v0.1.5/docs/user/thread-sidebar.md> (Agents/Lineage/subagent UI)
- <https://github.com/pingdotgg/t3code/blob/v0.1.5/docs/user/project-settings.md> (Scheduled tasks/webhooks)
- <https://github.com/pingdotgg/t3code/blob/v0.1.5/docs/user/permission-modes.md> (approval modes)
- <https://github.com/pingdotgg/t3code/blob/v0.1.5/docs/user/outside-agents.md> (MCP outside-agent path)

## 7. 승인·충돌·실패 처리의 실제 범위

### 승인

- T3 permission mode: Supervised, Auto-accept edits, Auto, Full access. 현재 역할 세션은
  `approval-required`(Supervised)다.
- child runtime mode는 parent보다 넓을 수 없다. parent가 approval-required이면 child도 그보다
  넓은 full-access를 받을 수 없다.
- child의 pending question은 parent로 알림이 가고, approval은 도구로 대신 승인할 수 없다.
- v0.1.7의 “child approvals from parent conversation”은 유용한 개선이지만 installed v0.1.5에서
  동일하게 동작한다고 검증하지 않았다.

### 파일 충돌

- T3 thread/worktree는 별도 checkout을 만들 수 있다.
- `delegate_task isolation=worktree`는 live schema에 있으나 official v0.1.5 문서에는 아직 없고,
  실행 스모크도 하지 않았다.
- worktree isolation은 **자동 merge하지 않는다.** child가 만든 변경은 commit/PR/명시적 merge가
  필요하다.
- `isolation=shared`는 parent checkout을 공유하므로 동시 편집 위험이 있다. 현재 프로젝트는
  한 worktree 한 writer 원칙을 유지한다.

### 완료/실패/재검토

- `task_status`는 status, `workState`, terminal status, summary, pending question/approval을
  제공한다.
- parent가 child completion을 받아도 parent run은 child 완료만으로 끝나지 않는다(root completion
  invariant).
- 자동 재시도/재리뷰/에스컬레이션은 없다. controller가 상태를 읽고 다음 `delegate_task`를 결정해야
  한다. official 문서도 독립 리뷰 라운드마다 새 task를 만들라고 안내한다.

## 8. 결론

- **T3에 오케스트레이션 기능은 있다.** native orchestration layer와 cross-provider child task
  primitive가 실제로 노출되어 있다.
- **하지만 “AGY UI → OpenCode 구현 → Codex 리뷰”를 T3 설정만으로 자동 실행하는 pipeline은
  설치본 v0.1.5와 최신 v0.1.7 문서 범위에서 확인되지 않았다.** 현재 프로젝트의 자동 pipeline은
  여전히 없다.
- 자동화하려면 (a) parent T3 agent가 `delegate_task`를 순차 호출하는 prompt/workflow를 설계하거나,
  (b) T3 MCP를 호출하는 외부 controller를 별도로 구축해야 한다. 둘 다 승인 게이트, artifact 전달,
  실패/재검토, worktree merge 정책을 추가로 설계해야 한다.
- 이번 조사는 읽기 전용 capability/schema/docs/client route 확인이며, 새 T3 child task 실행이나
  controller 설치, T3 업그레이드, full-access 확대를 하지 않았다.
