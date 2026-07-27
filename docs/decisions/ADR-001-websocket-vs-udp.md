# ADR-001: 통신 프로토콜 — WebSocket(TCP) vs UDP

- 상태: 확정
- 날짜: 2026-07
- 분류: [백엔드]

## 문제(Context)
100명 동시 접속 실시간 게임의 전송 프로토콜을 선택해야 한다.

## 대안(Options)
- (a) UDP 커스텀 프로토콜
- (b) TCP 기반 WebSocket

## 결정(Decision)
WebSocket(STOMP)을 사용한다.

## 근거(Rationale)
UDP는 20ms 단위 정확도가 생사를 가르는 FPS용이다. 본 게임은 판정 없는 느린 소셜 게임이라, 저지연보다 순서 보장·유실 없음(신뢰성)이 더 중요하다. 좌표가 100~200ms 늦어도 경험에 지장이 없으며, 지연은 클라이언트 보간으로 보완한다.

## 결과(Consequences)
- 신뢰성 있는 순서 보장 전달을 확보한다.
- 정량 지표: (부하 테스트 후 실측 기입 예정)

## 표준 어휘(Translation)
reliable ordered delivery over real-time precision
