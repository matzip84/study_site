# Study Site (Node.js + React + MySQL)

## 1) 구조
- `client`: React + Vite 프론트엔드
- `server`: Node.js(Express) API + MySQL 저장

## 2) MySQL 준비
원격 DB 정보는 이미 `server/.env`에 반영되어 있습니다.
- Host: `116.46.108.155`
- Port: `3306`
- User: `yun`
- Database: `study_site`

서버 시작 시 `consultations` 테이블이 없으면 자동 생성하고, 테이블이 비어 있으면 샘플 데이터 3건을 자동으로 넣습니다.
수동으로 넣으려면 `server/sql/seed.sql`을 실행하면 됩니다.

## 3) 패키지 설치
루트에서:

```bash
npm run install:all
```

## 4) 실행
터미널 1:

```bash
npm run dev:server
```

터미널 2:

```bash
npm run dev:client
```

- 프론트: `http://localhost:5173`
- 서버: `http://localhost:4000`
- 헬스체크: `http://localhost:4000/api/health`

## 5) 주요 API
- `GET /api/site-content`: 랜딩 콘텐츠 조회
- `POST /api/consultations`: 상담 신청 저장
- `GET /api/consultations`: 최근 상담 신청 50건 조회

요청 예시:

```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "goal": "2개월 내 목표 점수 80",
  "availableTime": "평일 저녁"
}
```
