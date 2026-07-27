# ADR-009: 채팅 저장 — Pub/Sub 전파만

- 상태: 확정
- 날짜: 2026-07
- 분류: [백엔드]

## 문제(Context)
전체 채팅과 쪽지(마니또)의 저장 정책을 결정해야 한다.

## 대안(Options)
- (a) 전부 DB 저장
- (b) Redis 버퍼 + 주기적 write-back
- (c) Pub/Sub 전파만(저장 안 함)

## 결정(Decision)
전체 채팅은 (c) Pub/Sub 전파만, 쪽지는 DB 직행으로 저장한다.

## 근거(Rationale)
판별식은 "유실돼도 되는가"이다. 전체 채팅은 행사 중 흘러가는 대화로 보존가치가 낮아 저장 자체를 하지 않는다(TTL 개념도 불필요 — Pub/Sub는 지나가는 방송). 쪽지는 '마음을 전하는' 핵심 기록으로 유실이 불가하므로 DB 직행한다. write-back을 쓸 경우에도 source of truth는 DB이며, Redis 유실은 허용 범위임을 명시적으로 선언하고 쓰는 것이 원칙이다.

## 결과(Consequences)
- 전체 채팅은 비영속, 쪽지는 영속으로 분리된다.
- 정량 지표: (부하 테스트 후 실측 기입 예정)

## 표준 어휘(Translation)
durability requirements drive storage; fire-and-forget pub/sub
