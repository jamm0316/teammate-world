# ADR-007: 인증 — 익명 계정 + JWT

- 상태: 확정
- 날짜: 2026-07
- 분류: [백엔드]

## 문제(Context)
일회성 행사에서 재방문 유저를 같은 캐릭터로 복원하는 방법이 필요하다.

## 대안(Options)
- (a) 회원가입 + 비밀번호
- (b) 단말 식별번호
- (c) 익명 계정 + 자동 발급 JWT

## 결정(Decision)
익명 계정 + HttpOnly 쿠키 JWT를 사용한다.

## 근거(Rationale)
회원가입은 행사장에서 100명이 폼을 작성하는 마찰이 크다(과함). 웹은 안정적인 단말 고유 ID를 얻을 수 없다(네이티브 앱 사고방식). "이 캐릭터로 입장하기" 시점에 user를 생성하고 서명된 JWT를 발급해 재방문 시 복원한다. HttpOnly로 XSS를 방어하고 서명으로 위조를 방지한다. 쿠키 삭제 시 복구 불가는 하루짜리 행사에서 수용 가능한 손실이다.

## 결과(Consequences)
- 마찰 없는 입장과 재방문 복원을 확보한다.
- 정량 지표: (부하 테스트 후 실측 기입 예정)

## 표준 어휘(Translation)
guest/anonymous authentication; signed token in HttpOnly cookie
