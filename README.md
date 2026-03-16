# Reserv MVP

사내 회의실 예약 웹 서비스 MVP 프로젝트다.

## 기술 스택
- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`
- `Prisma`
- `PostgreSQL`
- 자체 로그인 + 서명 쿠키 세션

## 현재 구현 범위
- 로그인 / 로그아웃 / 자동 로그인
- 일간 회의실 타임라인 조회
- 빈 슬롯 기반 예약 생성
- 예약 상세 조회 / 수정 / 취소
- 내 정보 조회 / 프로필 수정 / 비밀번호 변경
- 내 예약 목록 조회

## 운영 배포
- 배포 URL: [https://reservemvp.vercel.app](https://reservemvp.vercel.app)
- 비로그인 상태에서 `/` 진입 시 로그인 화면으로 이동한다.
- 로그인된 브라우저에서는 `/`에서 메인 타임라인으로 바로 진입한다.

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
- `test@cheongnim.com` / `1234`

운영 사용자 계정 목록은 README에 공개하지 않는다.

## 현재 기본 데이터
### 회의실
- `와이낫` / `20명`
- `두잇` / `10명`
- `쏘왓` / `5명`

### 예약 데이터
- 운영 DB의 기본 seed 예약 데이터는 제거된 상태다.
- 초기 진입 시 예약은 비어 있는 상태를 기준으로 사용한다.

## 배포 전 확인
- 운영 `DATABASE_URL` 준비
- 운영 `SESSION_SECRET` 준비
- 운영 DB에 migration 적용
- 운영용 회의실 / 사용자 초기 데이터 확정
- `npm run build` 통과 확인
- review 서버 기준 수동 검수 완료

## 주요 문서
- [요구사항](./docs/requirements.md)
- [개발 명세](./docs/spec.md)
- [중요 변경 로그](./docs/change-log.md)
