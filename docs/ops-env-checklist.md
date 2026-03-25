# Ops Env Checklist

운영 환경변수 준비 상태와 보안 취급 원칙을 함께 보는 문서다.

기준일: 2026-03-25

## 현재 준비 상태
- `DATABASE_URL`: 준비됨
- `SESSION_SECRET`: 준비됨
- `BLOB_READ_WRITE_TOKEN`: 준비됨
- `RESEND_API_KEY`: 준비됨
- `RESEND_FROM_EMAIL`: 미설정
- `RESERVATION_REPLY_TO_EMAIL`: 미설정
- `APP_URL`: 준비됨 (`https://reservemvp.vercel.app`)

## 필수 여부 정리
- `DATABASE_URL`: 필수
- `SESSION_SECRET`: 필수
- `BLOB_READ_WRITE_TOKEN`: 프로필 이미지 업로드를 운영에서 사용할 때 필수
- `RESEND_API_KEY`: 참여자 예약 알림 메일을 운영에서 사용할 때 필수
- `RESEND_FROM_EMAIL`: 참여자 예약 알림 메일을 운영에서 사용할 때 필수
- `RESERVATION_REPLY_TO_EMAIL`: 선택
- `APP_URL`: 메일 본문에 서비스 링크를 넣거나 운영 URL을 명확히 맞출 때 권장

## 현재 결정 상태
- 운영에서 프로필 이미지 업로드는 사용한다.
- 운영 URL은 당분간 `https://reservemvp.vercel.app`를 사용한다.
- 예약 참여자 메일 발송은 커스텀 도메인 확보 전까지 보류한다.

## 보안 취급 원칙
- 실제 값은 `.env` 또는 배포 플랫폼 secret 설정에만 저장한다.
- 실제 값은 Git 커밋, 문서, 스크린샷, 채팅 본문에 남기지 않는다.
- 로컬 값과 운영 값을 분리한다.
- `SESSION_SECRET`은 길고 예측 불가능한 랜덤 문자열을 사용한다.
- 값 유출이 의심되면 즉시 새 값으로 교체한다.

## 다음 액션
- 이미지 업로드가 운영에서 정상 동작하는지 검수
- 운영 DB migration 적용 및 프로덕션 빌드 확인
- 커스텀 도메인 확보 전까지 `RESEND_FROM_EMAIL`, `RESERVATION_REPLY_TO_EMAIL`은 비워둔다.
- 커스텀 도메인 확보 후 Resend 도메인 검증을 완료하고 메일 기능을 다시 활성화한다.
- 운영 배포 직전 secret이 배포 플랫폼에만 저장되어 있는지 다시 확인
