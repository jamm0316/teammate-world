# ADR-010: PK 설계 — 복합 PK 금지, 단일 id

- 상태: 확정
- 날짜: 2026-07
- 분류: [백엔드]

## 문제(Context)
FK 컬럼들이 PK에 함께 묶인 복합 PK가 반복 발생하고 있다.

## 대안(Options)
- (a) (id, from_id, to_id, ...) 복합 PK
- (b) 단일 id PK + FK는 일반 컬럼

## 결정(Decision)
모든 테이블의 PK는 id 단독으로 한다.

## 근거(Rationale)
id(AUTO_INCREMENT)만으로 유일성이 충족되므로, 복합 PK는 유일성에 기여 없이 제약만 추가한다. NULL 허용 컬럼(to_id)이 PK에 들어가면 모순(PK는 NULL 불가)이 되어 배정 행 INSERT 자체가 불가능하다. 참조하는 테이블이 복합키 전체를 복제해야 해서 구조가 연쇄적으로 꼬인다. FK와 PK는 별개 역할이므로 FK라고 PK에 넣을 이유가 없다. (ERD 툴의 identifying relationship 자동 설정이 원인이었음 — 툴 설정 주의.)

## 결과(Consequences)
- 모든 테이블이 단일 대리 키를 갖고, FK는 비식별 관계로 참조된다.
- 정량 지표: (부하 테스트 후 실측 기입 예정)

## 표준 어휘(Translation)
surrogate key; non-identifying relationship
