# ADR-011: 실시간 입력 전송 계약 — REST PATCH vs WS(STOMP)

- 상태: 확정
- 날짜: 2026-07
- 분류: [백엔드]

## 문제(Context)
프론트 POC를 백엔드 연동으로 전환하면서, 연타·좌표 등 실시간 입력을 어떤 프로토콜·어떤 배칭 정책으로 서버에 전달할지 결정해야 한다. 초기 안은 "틱마다 REST PATCH 호출"이었다.

## 대안(Options)
- (a) REST PATCH 폴링 — 틱마다 누적값을 PATCH, 상태는 GET 폴링
- (b) WS(STOMP) 단일 채널 — 입력은 publish, 상태는 서버 틱 broadcast

## 결정(Decision)
실시간 경로는 전부 WS(STOMP)로 통일하고, REST는 비실시간 경로(계정·쪽지·공지 등록·결과 조회)에만 쓴다. 경로별 계약은 아래로 고정한다.

| 경로 | 전송 | 배칭 | 서버 처리 |
|---|---|---|---|
| 좌표 이동 | WS publish `/app/world/move` | 초당 최대 5회 (ADR-003) | JVM 메모리 저장, 틱 스냅샷 broadcast |
| 줄다리기 연타 | WS publish `/app/tug/tap` | 0.5s 창 `{count}` 배칭 (ADR-005) | 창당 상한 clamp → 팀 LongAdder 누적 |
| 계주 주자 탭 | WS publish `/app/relay/step` | **배칭 금지, 매 탭** | L/R 교대·최소 간격 완전 판정 (ADR-006) |
| 계주 응원 | WS publish `/app/relay/cheer` | 0.5s 창 `{count}` 배칭 | clamp → 팀 게이지(지수 감쇠) 확정 |
| 공지 | REST POST `/api/notices` | — | role 검증 후 `/topic/notice` broadcast |

동시성은 "여러 스레드가 누적(LongAdder) / 게임 루프 단일 스레드가 `sumThenReset()` 소비" 구조로 확보한다. 틱은 트래픽 절감 장치일 뿐 동시성 해법이 아니다.

## 근거(Rationale)
① REST PATCH는 푸시가 불가해 나머지 참가자가 GET 폴링해야 하고, 배칭으로 줄인 트래픽을 폴링이 도로 키운다. ② 연타 누적은 재시도 시 중복 가산되어 PATCH 의미론과 어긋난다 — WS는 ADR-001의 순서 보장 위에서 이 문제가 없다. ③ 0.5s마다 HTTP 핸드셰이크·헤더 비용이 정수 하나인 페이로드보다 크다. ④ 계주 주자 탭만 배칭에서 제외하는 이유: 배칭하면 L/R 순서 정보가 소실되어 ADR-006의 완전 판정이 불가하고, 동시 주자가 최대 4명이라 매 탭 전송 부담이 없다.

## 결과(Consequences)
- 클라 배치 카운트는 신뢰하지 않고 서버가 창당 상한으로 clamp한다(치팅 방어).
- 클라의 물리·판정 시뮬레이션은 제거되고, 로컬 계산은 broadcast 사이를 메우는 보간/즉각 피드백용으로만 남는다(ADR-001).
- 프론트 코드의 연동 지점은 `[MX]` 주석으로 표기했다 (`grep -rn "\[MX\]" frontend/`).
- 정량 지표: (부하 테스트 후 실측 기입 예정)

## 표준 어휘(Translation)
transport contract per traffic profile; batching for volume, per-event for ordering
