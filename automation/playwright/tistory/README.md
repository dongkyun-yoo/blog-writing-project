# 티스토리 Playwright MCP 자동화

## 🎯 개요
티스토리 블로그의 완전한 Playwright MCP 기반 자동화 시스템입니다.
OAuth API 대신 실제 브라우저를 통한 로그인과 글쓰기를 수행합니다.

## 🚀 특징
- **Kakao 계정 로그인**: 다양한 UI 변경에 대응하는 robust한 로그인
- **다중 에디터 지원**: 마크다운, 리치텍스트, iframe, textarea 모든 에디터 지원
- **스마트 요소 탐지**: 여러 선택자를 시도하여 UI 변경에 대응
- **자동 스크린샷**: 각 단계별 디버깅용 스크린샷 저장
- **2FA/캡차 대응**: 수동 개입 지원으로 추가 인증 처리

## 📋 지원 기능

### 로그인
- Kakao 계정을 통한 티스토리 로그인
- 다양한 로그인 버튼 선택자 자동 감지
- 추가 인증 (2FA, 기기 등록) 수동 대응
- 로그인 상태 쿠키 저장 및 재사용

### 글쓰기
- 제목, 본문, 태그, 카테고리 설정
- 공개/비공개/보호 설정
- 다양한 에디터 타입 자동 감지:
  - 마크다운 에디터 (CodeMirror)
  - 리치텍스트 에디터 (contenteditable)
  - iframe 에디터 (티스토리 클래식)
  - 텍스트 영역 (기본 에디터)

### 관리 기능
- 블로그 목록 조회
- 최근 글 목록 확인
- 로그인 상태 확인

## 🔧 사용 방법

### 1. 통합 자동화 실행
```bash
npm run automation
# 2. 티스토리 선택
```

### 2. 직접 스크립트 실행
```javascript
const TistoryAutomation = require('./tistory-automation');

const automation = new TistoryAutomation();

// 로그인
await automation.performLogin(page, {
  username: 'your_kakao_email',
  password: 'your_password'
});

// 글쓰기
await automation.writePost(page, {
  title: '제목',
  content: '내용',
  tags: ['태그1', '태그2'],
  category: '카테고리명',
  visibility: 'public'
});
```

## 🛠️ 에디터 지원

### 1. 마크다운 에디터
- CodeMirror 기반 에디터 지원
- 마크다운 문법 자동 입력

### 2. 리치텍스트 에디터
- contenteditable 요소 감지
- HTML 직접 입력 가능

### 3. iframe 에디터
- 티스토리 클래식 에디터
- frame 내부 요소 제어

### 4. 텍스트 영역
- 기본 textarea 에디터
- 플레인 텍스트 입력

## 🔍 디버깅

### 스크린샷 위치
```
automation/screenshots/tistory/
├── before-kakao-login-*.png
├── login-success-*.png
├── before-publish-*.png
├── publish-success-*.png
└── *-error-*.png
```

### 로그 메시지
- `📌 [tistory] 정보`: 일반 진행 상황
- `✅ [tistory] 성공`: 성공적인 작업
- `⚠️ [tistory] 경고`: 주의가 필요한 상황
- `❌ [tistory] 오류`: 오류 발생

## 🚫 제거된 기능
- OAuth API 연동 (완전 제거)
- 하이브리드 모드 (단순화)
- API 토큰 관리 (불필요)

## ⚡ 성능 최적화
- 요소 탐지 시간 단축
- 불필요한 대기 시간 제거
- 효율적인 선택자 우선순위

## 🔧 문제 해결

### 로그인 실패
1. `no-kakao-button` 스크린샷 확인
2. 페이지 로딩 시간 증가 필요
3. 선택자 업데이트 필요

### 글쓰기 실패
1. `no-write-button` 스크린샷 확인
2. 에디터 타입 확인
3. 새로운 에디터 선택자 추가

### 요소 감지 실패
1. 티스토리 UI 업데이트 확인
2. 새로운 선택자 배열에 추가
3. 타임아웃 시간 조정

## 📈 향후 개선
- [ ] 이미지 업로드 지원
- [ ] 예약 발행 기능
- [ ] 시리즈 설정 지원
- [ ] 댓글 관리 기능