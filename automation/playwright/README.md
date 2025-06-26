# Playwright MCP 브라우저 자동화

## 🎭 개요
API가 제공되지 않는 블로그 플랫폼들을 위한 브라우저 자동화 시스템입니다.
Playwright MCP를 통해 실제 브라우저를 제어하여 로그인과 글쓰기를 자동화합니다.

## 🚀 특징
- **실제 브라우저 제어**: 사람처럼 동작하여 봇 감지 우회
- **세션 유지**: 쿠키 저장으로 재로그인 최소화
- **보안 인증 대응**: 캡차, 2FA 등 수동 개입 지원
- **스크린샷**: 각 단계별 스크린샷 자동 저장
- **암호화**: 로그인 정보 안전하게 암호화 저장

## 📁 구조
```
playwright/
├── base-automation.js      # 공통 자동화 기능
├── playwright-runner.js    # 실행 인터페이스
├── naver/                  # 네이버 블로그
│   └── naver-automation.js
├── velog/                  # Velog
│   └── velog-automation.js
├── medium/                 # Medium
│   └── medium-automation.js
└── wordpress/              # 워드프레스
    └── wordpress-automation.js
```

## 🔧 사용 방법

### 1. MCP Playwright 설정
MCP Playwright 서버가 실행 중이어야 합니다.

### 2. 환경 변수 설정
`.env` 파일:
```env
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### 3. 실행
```bash
node automation/playwright/playwright-runner.js
```

또는 package.json 스크립트:
```bash
npm run automation
```

### 4. 메뉴 선택
1. 플랫폼 선택 (네이버, Velog, Medium, 워드프레스)
2. 작업 선택 (로그인, 글쓰기, 임시저장 확인)
3. 필요한 정보 입력

## 🔐 보안 주의사항
- 로그인 정보는 AES-256-GCM으로 암호화되어 저장됩니다
- `automation/sessions/` 폴더는 git에서 제외됩니다
- 스크린샷에 민감한 정보가 포함될 수 있으니 주의하세요

## 📸 스크린샷
모든 스크린샷은 `automation/screenshots/[platform]/` 폴더에 저장됩니다.

## 🤖 각 플랫폼별 특징

### 네이버 블로그
- 스마트에디터 ONE 지원
- 카테고리, 태그 자동 설정
- 공개/비공개 설정
- 보안 문자 수동 입력 대기

### Velog
- 마크다운 에디터 지원
- 시리즈 설정
- URL 슬러그 자동 생성

### Medium
- 드래프트 자동 저장
- 퍼블리케이션 선택
- 태그 자동 완성

### 워드프레스
- 블록 에디터 (Gutenberg) 지원
- 카테고리/태그 관리
- 예약 발행 지원

## 🛠️ 문제 해결

### 로그인 실패
1. 스크린샷 확인 (`automation/screenshots/`)
2. 보안 문자나 2차 인증 필요 여부 확인
3. 쿠키 삭제 후 재시도

### 글쓰기 실패
1. 에디터 로딩 시간 증가
2. 셀렉터 업데이트 필요 확인
3. 플랫폼 UI 변경 확인

## 📝 확장 가능성
- 예약 발행 기능
- 대량 업로드
- 통계 수집
- 댓글 관리