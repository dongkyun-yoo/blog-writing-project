# 블로그 자동화 시스템

## 🎯 목표
각 블로그 플랫폼별 로그인, 글쓰기, 검수, 배포를 자동화하는 시스템

## 📁 디렉토리 구조
```
automation/
├── auth/          # 인증 토큰 및 자격증명 저장
├── login/         # 플랫폼별 로그인 모듈
│   └── tistory/   # 티스토리 로그인 및 API
├── sessions/      # 세션 관리
└── config/        # 설정 파일
```

## 🔧 티스토리 설정 가이드

### 1. 티스토리 앱 등록
1. [티스토리 오픈API](https://www.tistory.com/guide/api/manage/register) 접속
2. 새 앱 등록:
   - 서비스명: 블로그 자동화 시스템
   - 설명: 블로그 글쓰기 자동화
   - 서비스 URL: http://localhost:3000
   - CallBack: http://localhost:3000/callback
3. 등록 후 Client ID와 Secret Key 복사

### 2. 환경 변수 설정
`.env` 파일 생성:
```env
TISTORY_CLIENT_ID=발급받은_클라이언트_ID
TISTORY_CLIENT_SECRET=발급받은_시크릿_키
TISTORY_REDIRECT_URI=http://localhost:3000/callback
TISTORY_BLOG_NAME=내블로그이름
```

### 3. 의존성 설치
```bash
npm install axios express open dotenv form-data
```

### 4. 로그인 실행
```bash
node automation/login/tistory/login-tistory.js
```

## 📊 티스토리 API 사용 예제

```javascript
const { TistoryAuth, TistoryAPI } = require('./automation/login/tistory/login-tistory');

// 인증
const auth = new TistoryAuth(config);
const token = await auth.ensureAuthenticated();

// API 사용
const api = new TistoryAPI(token, blogName);

// 글 작성
await api.writePost({
  title: '제목',
  content: '내용',
  category: '0',
  tags: ['태그1', '태그2'],
  visibility: '3' // 공개
});
```

## 🔐 보안 주의사항
- `.env` 파일은 절대 Git에 커밋하지 마세요
- 토큰은 `automation/auth/` 폴더에 안전하게 저장됩니다
- 정기적으로 앱 비밀번호를 변경하세요

## 📝 지원 기능
- ✅ OAuth 2.0 인증
- ✅ 토큰 자동 저장/불러오기
- ✅ 블로그 정보 조회
- ✅ 카테고리 관리
- ✅ 게시글 CRUD
- ✅ 파일 업로드
- ✅ 댓글 관리

## 🚀 구현 현황

### ✅ 완료된 플랫폼
1. **티스토리**
   - OAuth API 지원 (권장)
   - Playwright 브라우저 자동화 (대체)
   - 하이브리드 모드 (자동 전환)

2. **네이버 블로그**
   - Playwright 브라우저 자동화
   - 캡차/2FA 수동 대응
   - 스마트에디터 ONE 지원

### 🔧 사용 방법

#### 티스토리 (통합)
```bash
npm run tistory
```

#### 브라우저 자동화 (모든 플랫폼)
```bash
npm run automation
```

### 📋 다음 단계
- [ ] Velog 브라우저 자동화
- [ ] Medium 브라우저 자동화
- [ ] 워드프레스 브라우저 자동화
- [ ] 일괄 업로드 시스템
- [ ] 예약 발행 기능