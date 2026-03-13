# Prisma Migration Notes

이 디렉터리는 초기 DB 생성과 후속 SQL 보강을 함께 관리한다.

## 구성
- `20260312132000_init`
  - 기본 테이블, enum, FK, 일반 체크 제약, 기본 인덱스를 생성한다.
- `20260312132100_add_reservation_overlap_guard`
  - PostgreSQL `btree_gist` extension과 예약 중복 방지 exclusion constraint를 추가한다.

## 주의
- 두 번째 migration은 Prisma schema만으로 표현되지 않는 DB 보호 로직이다.
- 예약 충돌은 서버 검증과 DB 제약을 둘 다 유지해야 한다.
