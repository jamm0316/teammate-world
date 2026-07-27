# ADR-003: 좌표 저장 위치 — JVM vs Redis vs MySQL

- 상태: 확정
- 날짜: 2026-07
- 분류: [백엔드]

## 문제(Context)
초당 5회씩 갱신되는 100명의 좌표를 어디에 저장할지 결정해야 한다.

## 대안(Options)
- (a) MySQL
- (b) Redis
- (c) JVM 메모리(ConcurrentHashMap)

## 결정(Decision)
서버 1대는 JVM 메모리에 저장하고, 2대 이상 확장 시 Redis를 도입한다.

## 근거(Rationale)
판별식은 "1시간 뒤에도 가치 있나 + 초당 몇 번 갱신되나"이다. 좌표는 수명 1초 미만, 초당 약 500회 쓰기 → 영속 저장은 보존가치 없는 데이터에 디스크 I/O·트랜잭션 비용을 치르는 미스매치다. Redis 도입은 속도가 아니라 서버 간 상태 공유가 목적이며, 100명 규모엔 1대로 충분하나 수평 확장 학습을 위해 의도적으로 2대+Redis까지 진행한다.

## 결과(Consequences)
- 정량 지표: 밀집 시나리오 추정 100명×99×5회/s×40B ≈ 2MB/s(1Gbps NIC의 2%) — (부하 테스트 후 실측 기입 예정)

## 표준 어휘(Translation)
in-memory ephemeral state; Redis for horizontal scaling, not speed
