# Reserv MVP

사내 회의실 예약 웹 서비스 MVP 프로젝트다.

## 기술 스택
- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`
- `Prisma`
- `PostgreSQL`
- 자체 로그인 + `HTTP-only` 쿠키 세션

## 현재 구현 범위
- 로그인 / 로그아웃 / 자동 로그인
- 일간 회의실 타임라인 조회
- 빈 슬롯 기반 예약 생성
- 예약 상세 조회 / 수정 / 취소
- 내 정보 조회 / 프로필 수정 / 비밀번호 변경
- 내 예약 목록 조회

## 로컬 실행
1. `.env.example`을 참고해 `.env`를 준비한다.
2. 로컬 `Node.js`가 없다면 `.tools/node/bin` 경로의 `node`, `npm`을 사용한다.
3. 의존성을 설치한다.
4. Prisma Client를 생성한다.
5. DB migration을 적용한다.
6. 개발 서버를 실행한다.

```bash
export PATH="/Users/jaydenkim/Desktop/Codex/reservMVP/project-root/.tools/node/bin:$PATH"
cd /Users/jaydenkim/Desktop/Codex/reservMVP/project-root
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

## 권장 작업 방식
- 수정 중 확인: `npm run dev`
- 사용자 검수: `npm run review`
- dev 캐시 복구: `npm run dev:clean`
- review 서버 재기동: `npm run review:clean`

`next dev`는 HMR/webpack 캐시 문제로 청크 오류가 날 수 있다. 화면 검수는 `build + start` 기반의 review 서버(`http://127.0.0.1:3002`)로 확인하는 편이 더 안정적이다.

## 테스트 계정
- `user-a@company.com` / `Welcome123!`
- `user-b@company.com` / `Welcome123!`
- `user-c@company.com` / `Welcome123!`
- `user-d@company.com` / `Welcome123!`

## 현재 기본 데이터
### 회의실
- `와이낫` / `20명`
- `두잇` / `10명`
- `쏘왓` / `5명`

### 사용자 표시 이름
- `김민지`
- `박준호`
- `이서연`
- `최도윤`

## 배포 전 확인
- 운영 `DATABASE_URL` 준비
- 운영 DB에 migration 적용
- 운영용 회의실 / 사용자 초기 데이터 확정
- `npm run build` 통과 확인
- review 서버 기준 수동 검수 완료

## 주요 문서
- [요구사항](./docs/requirements.md)
- [개발 명세](./docs/spec.md)
- [중요 변경 로그](./docs/change-log.md)
