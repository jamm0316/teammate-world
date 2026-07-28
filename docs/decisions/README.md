# 설계 결정 기록 (ADR)

ADR(Architecture Decision Record)은 프로젝트에서 내린 주요 설계 결정을 그 배경·대안·근거와 함께 기록하는 문서다. 코드만 봐서는 "왜 이렇게 했는지"가 드러나지 않는 판단을 남겨, 나중에 합류하는 사람이나 미래의 나 자신이 결정을 재추적할 수 있게 한다. 아래 기록들은 이미 확정된 결정을 정리한 것이다.

## 분류별 목차

### [기획]
- [ADR-004: 게임 정체성 — 자유 소셜 월드 vs 진행자 주도 라이브쇼](ADR-004-game-identity.md)

### [백엔드]
- [ADR-001: 통신 프로토콜 — WebSocket(TCP) vs UDP](ADR-001-websocket-vs-udp.md)
- [ADR-002: 서버 언어 — Java/Spring vs Python vs Go](ADR-002-server-language.md)
- [ADR-003: 좌표 저장 위치 — JVM vs Redis vs MySQL](ADR-003-coordinate-storage.md)
- [ADR-007: 인증 — 익명 계정 + JWT](ADR-007-auth-anonymous-jwt.md)
- [ADR-009: 채팅 저장 — Pub/Sub 전파만](ADR-009-chat-persistence.md)
- [ADR-010: PK 설계 — 복합 PK 금지, 단일 id](ADR-010-single-column-pk.md)
- [ADR-011: 실시간 입력 전송 계약 — REST PATCH vs WS(STOMP)](ADR-011-realtime-transport-contract.md)

### [기획+백엔드]
- [ADR-005: 줄다리기 — 4팀 동시전 → 1:1 토너먼트](ADR-005-tug-of-war-1v1-tournament.md)
- [ADR-006: 계주 판정 위치 — 서버 완전 판정](ADR-006-relay-server-validation.md)
- [ADR-008: 캐릭터 저장 — 마스터 테이블 vs User 컬럼](ADR-008-character-schema.md)

## 시간순 전체 목록
1. [ADR-001: 통신 프로토콜 — WebSocket(TCP) vs UDP](ADR-001-websocket-vs-udp.md) · [백엔드]
2. [ADR-002: 서버 언어 — Java/Spring vs Python vs Go](ADR-002-server-language.md) · [백엔드]
3. [ADR-003: 좌표 저장 위치 — JVM vs Redis vs MySQL](ADR-003-coordinate-storage.md) · [백엔드]
4. [ADR-004: 게임 정체성 — 자유 소셜 월드 vs 진행자 주도 라이브쇼](ADR-004-game-identity.md) · [기획]
5. [ADR-005: 줄다리기 — 4팀 동시전 → 1:1 토너먼트](ADR-005-tug-of-war-1v1-tournament.md) · [기획+백엔드]
6. [ADR-006: 계주 판정 위치 — 서버 완전 판정](ADR-006-relay-server-validation.md) · [기획+백엔드]
7. [ADR-007: 인증 — 익명 계정 + JWT](ADR-007-auth-anonymous-jwt.md) · [백엔드]
8. [ADR-008: 캐릭터 저장 — 마스터 테이블 vs User 컬럼](ADR-008-character-schema.md) · [기획+백엔드]
9. [ADR-009: 채팅 저장 — Pub/Sub 전파만](ADR-009-chat-persistence.md) · [백엔드]
10. [ADR-010: PK 설계 — 복합 PK 금지, 단일 id](ADR-010-single-column-pk.md) · [백엔드]
11. [ADR-011: 실시간 입력 전송 계약 — REST PATCH vs WS(STOMP)](ADR-011-realtime-transport-contract.md) · [백엔드]
