# ADR-0001: 부트스트랩 스택 (잠정)

- 상태: **Proposed / Provisional** (역할 라우팅은 ADR-0003에서 갱신)
- 날짜: 2026-11-08
- 결정자: 부트스트랩 실행 스레드(역사적 Amp low), 사용자 검토 대기
- 관련: `docs/PRD.md` 10장, 14장 1단계, `docs/decisions/0002-role-routing.md`,
  `docs/decisions/0003-role-swap.md`

## 맥락

PRD v0.1은 프론트엔드를 React·TypeScript로 우선 검토하되, 백엔드는 사용자의 Spring 경험과 VPS
자원, 기존 기반을 보고 Spring Boot·Kotlin과 경량 TypeScript 서버 중에서 결정하라고 남겨 두었습니다.
DB 선택도 확정하지 않았습니다.

현재 승인 범위는 전체 게임이 아니라 **개발 기반**입니다. 목표는 T3 native 작업공간에서 바로 실행·테스트·
배포 연습을 시작할 수 있는 최소 수직 기반을 만드는 것입니다.

## 결정

부트스트랩은 다음으로 구성합니다.

- 프론트엔드: React 19 + TypeScript 7 + Vite 8
- 백엔드: Hono 4 + `@hono/node-server` (Node 26)
- 데이터: `node:sqlite`의 `DatabaseSync`, 파일 `data/quest.db`
- 테스트: Vitest 5
- 실행: API/프로덕션 `127.0.0.1:8788`, 개발 웹 `127.0.0.1:5173`
- 배포 형태: 단일 Node 프로세스가 API와 `dist/` 정적 파일을 함께 제공

## 이유

1. **VPS 자원:** 네이티브 모듈·별도 DB 서버 없이 단일 프로세스로 실행되어 메모리·디스크 부담이 작습니다.
2. **학습 흐름:** React/TypeScript와 HTTP API, SQL, 테스트를 한 저장소에서 end-to-end로 연습할 수 있습니다.
3. **검증 용이성:** Hono의 `app.request()`와 in-memory SQLite로 API·도메인 테스트가 빠릅니다.
4. **PRD와의 충돌 없음:** PRD가 React/TypeScript를 우선 검토하고 백엔드를 미결로 둔 상태이므로,
   잠정 구현으로 선택해도 최종 결정을 선점하지 않습니다.
5. **기존 서비스 보존:** 8787은 기존 로컬 서비스가 사용 중이므로 8788을 사용합니다.

## 이 결정이 확정하지 않는 것

- 최종 백엔드: Spring Boot/Kotlin이 학습 목표·취업 목표에 더 맞다면 교체할 수 있습니다.
- 최종 DB: SQLite는 단일 사용자 MVP에 적합하지만, 인증·다중 기기·백업 요구가 커지면 PostgreSQL 등을 검토합니다.
- 인증 방식, 세션·권한 모델
- 제품 내 AI 제공자·모델·비용 한도
- 공개 배포 방식과 도메인

이 항목들은 구현 전에 **독립 설계 리뷰(현재 T3 Codex; 역할 라우팅은 ADR-0003)**를 거치고,
결정되면 이 ADR을 대체하는 새 ADR을 남깁니다.

## 결과

- Node.js 22.5 이상이 필요합니다(`node:sqlite`).
- SQLite는 단일 프로세스 쓰기를 전제로 합니다. 여러 서버가 같은 파일을 동시에 쓰지 않습니다.
- `data/`와 `dist/`는 Git에서 제외합니다.
- 스키마 변경은 마이그레이션 없이 시작했으므로, 실제 데이터가 쌓이기 전에 마이그레이션 전략을
  독립 설계 리뷰에서 정해야 합니다.

## 역할 이력

최초 bootstrap은 Amp Code low 구현·medium 리뷰를 전제로 했다. 이후 사용자가 T3 native Codex 구현과
OpenCode 리뷰로 전환했고, 그다음 모델·effort를 유지한 채 OpenCode 구현·Codex 리뷰로 역할을
교체했다. 현재 역할·모델 선택은 ADR-0003과 `docs/roles.md`에 기록했으며, ADR-0002는 교체 전 이력이다.
기존 medium 리뷰 결과는 `docs/PRD.md` 17장에 이력으로 보존하며, 이 ADR은 그 결과를 재검토 완료로
바꾸지 않는다.
