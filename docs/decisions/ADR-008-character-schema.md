# ADR-008: 캐릭터 저장 — 마스터 테이블 vs User 컬럼

- 상태: 확정
- 날짜: 2026-07
- 분류: [기획+백엔드]

## 문제(Context)
가챠로 뽑은 캐릭터를 DB에 어떻게 저장할지 결정해야 한다.

## 대안(Options)
- (a) Characters 마스터 테이블 + UserCharacter 중간 테이블
- (b) 캐릭터 속성을 Users 테이블 컬럼으로 직접 저장

## 결정(Decision)
(b) Users 직접 컬럼(rarity/outfit/hair_ci/eye_i/skin_i/style)에 저장한다.

## 근거(Rationale)
캐릭터는 에셋 파일이 아니라 속성 조합으로 절차 생성된다(조합 수천 가지) → 목록 테이블이 불가능하다. 1:1 종속이며 항상 함께 조회되므로 분리하면 조인 비용만 추가된다. 반면 선물(Gifts)은 정해진 목록에서 고르는 것이라 마스터 테이블을 유지한다. 판별 기준은 "규칙으로 생성되나(→컬럼) vs 목록에서 고르나(→테이블)"이다.

## 결과(Consequences)
- 캐릭터는 컬럼, 선물은 마스터 테이블로 분리된다.
- 정량 지표: (부하 테스트 후 실측 기입 예정)

## 표준 어휘(Translation)
procedural generation vs catalog data; 1:1 attribute embedding
