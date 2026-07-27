# ADR-002: 서버 언어 — Java/Spring vs Python vs Go

- 상태: 확정
- 날짜: 2026-07
- 분류: [백엔드]

## 문제(Context)
게임 서버의 언어/프레임워크를 선택해야 한다.

## 대안(Options)
- (a) Python(FastAPI)
- (b) Go 전용 게임서버
- (c) Java 17 + Spring Boot

## 결정(Decision)
Java 17 + Spring Boot 단일 서버를 사용한다.

## 근거(Rationale)
① 리드의 실무 스택과 일치하여 학습 효율이 높고 실시간 개념에 에너지를 집중할 수 있다. ② 동시성 학습에 유리하다(ConcurrentHashMap, AtomicInteger, 가상 스레드). ③ 판정 연산이 없는 게임이라 Go 게임서버 분리가 불필요하다 — 선행 사례 '이터널 스노우맨'은 물리 판정형이라 Go를 썼으나 요구사항이 다르다. ④ Python은 GIL로 동시성 학습에 불리하다.

## 결과(Consequences)
- 단일 서버 구조로 운영/학습 부담을 줄인다.
- 정량 지표: (부하 테스트 후 실측 기입 예정)

## 표준 어휘(Translation)
tech stack alignment with team expertise; no dedicated game server needed
