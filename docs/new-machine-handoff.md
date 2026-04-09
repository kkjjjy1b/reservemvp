# New Machine Handoff

다른 컴퓨터에서 이 프로젝트를 이어서 작업할 때 보는 문서다.

## 1. 무엇을 옮겨야 하는가

필수:
- `project-root` Git 저장소
- `project-root/.env`

권장:
- 상위 폴더의 `.codex/agents`
- 상위 폴더의 `agents`

이유:
- `project-root`는 실제 앱 코드와 문서가 있는 배포 단위 저장소다.
- `.env`에는 로컬 실행과 검증에 필요한 비밀값이 들어 있다.
- `.codex/agents`와 `agents`에는 Master / front / backend / designer / qa 운영 규칙이 들어 있다.

## 2. `.env` 옮기는 방법

절대 하지 말 것:
- `.env`를 Git에 커밋
- 메신저 본문에 secret 값 붙여넣기
- 스크린샷으로 공유

권장 방법 A: 비밀번호 관리자
1. 현재 컴퓨터에서 `.env` 내용을 1Password, Bitwarden 같은 비밀 저장소에 넣는다.
2. 새 컴퓨터에서 로그인 후 값을 꺼낸다.
3. 새 컴퓨터의 `project-root/.env`에 그대로 넣는다.

권장 방법 B: 암호화된 파일 전송
1. 현재 컴퓨터에서 `.env`를 암호화된 zip 또는 암호화된 노트로 보낸다.
2. 새 컴퓨터에서 복호화한다.
3. `project-root/.env`로 저장한다.

권장 방법 C: 같은 네트워크 또는 SSH 기반 직접 복사
1. 새 컴퓨터에서 저장소를 clone 한다.
2. 안전한 채널로 기존 컴퓨터의 `.env`를 새 컴퓨터로 복사한다.
3. 경로는 반드시 `project-root/.env`로 맞춘다.

예시:
```bash
scp old-machine:/path/to/project-root/.env /path/to/new/project-root/.env
```

## 3. 에이전트 설정 옮기는 방법

아래 폴더를 새 컴퓨터 작업 루트에도 같이 복사한다.

- `.codex/agents`
- `agents`

권장 복사 대상:
- `.codex/agents/README.md`
- `.codex/agents/front.toml`
- `.codex/agents/backend.toml`
- `.codex/agents/designer.toml`
- `.codex/agents/qa.toml`
- `agents/README.md`
- `agents/session-master-prompt.md`
- `agents/pm-agent.md`
- `agents/builder-agent.md`
- `agents/reviewer-agent.md`
- `agents/designer-agent.md`

주의:
- 현재 `.codex/agents` 안에는 `front.toml` 계열과 `reserv-front.toml` 계열이 함께 있을 수 있다.
- 새 컴퓨터에서는 우선 `front.toml`, `backend.toml`, `designer.toml`, `qa.toml`만 기준으로 쓰는 것을 권장한다.
- 중복 정의는 나중에 정리해도 되지만, 바로 작업할 때는 기준 파일을 하나로 고정하는 편이 안전하다.

## 4. 새 컴퓨터 세팅 순서

1. `project-root` 저장소 clone
2. `project-root/.env` 복원
3. 상위 폴더에 `.codex/agents`와 `agents` 복사
4. Node / npm 준비
5. 의존성 설치
6. Prisma generate / deploy
7. build 또는 dev 실행

예시:
```bash
cd /path/to/project-root
npm install
npm run prisma:generate
npm run prisma:deploy
npm run build
```

## 5. 새 컴퓨터에서 먼저 읽을 문서

순서:
1. `docs/context-primer.md`
2. `docs/push-journal.md`
3. `docs/change-log.md`
4. `docs/deployment-handoff.md`
5. `docs/ops-env-checklist.md`

## 6. Codex 시작 프롬프트

아래 프롬프트를 새 컴퓨터의 첫 Codex 세션에 그대로 넣으면 된다.

```text
이 프로젝트는 사내 회의실 예약 MVP다.
먼저 project-root/docs/context-primer.md, project-root/docs/push-journal.md, project-root/docs/change-log.md를 읽고 현재 상태를 파악해라.
이 쓰레드는 Master 쓰레드로 동작한다.
.codex/agents의 front.toml, backend.toml, designer.toml, qa.toml을 기준으로 서브에이전트를 운영해라.
현재 우선 병목은 build 재현성과 QA 검증이다.
문서 기준과 현재 구현이 다르면 둘을 분리해서 설명해라.
```

## 7. 현재 주의사항

- `project-root`가 실제 앱 Git 저장소다.
- 운영 관련 secret은 `.env` 또는 배포 플랫폼 secret에만 둔다.
- 메일 발송은 `RESEND_FROM_EMAIL` 미설정 상태라 현재 보류다.
- 최근 확인 기준으로 로컬 build 병목은 `@vercel/blob` 설치 상태 불일치였다.
