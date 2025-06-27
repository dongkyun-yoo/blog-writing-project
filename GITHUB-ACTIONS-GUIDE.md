# 🚀 GitHub Actions 티스토리 자동 포스팅 실행 가이드

## 📋 준비사항 체크리스트

### ✅ 완료된 항목
- [x] 일본 여행 포스트 준비 완료 (5,742자)
- [x] GitHub Actions 워크플로우 설정 완료
- [x] 자동화 스크립트 업로드 완료

### 🔴 **즉시 실행 필요 - GitHub Secrets 설정**

**1단계: GitHub Repository Secrets 페이지 접속**
```
https://github.com/dongkyun-yoo/blog-writing-project/settings/secrets/actions
```

**2단계: 다음 Secrets 추가**
- **KAKAO_EMAIL**: `beastrongman@daum.net`
- **KAKAO_PASSWORD**: `King8160!`

## 🎯 **GitHub Actions 워크플로우 실행**

### 1단계: Actions 페이지 접속
```
https://github.com/dongkyun-yoo/blog-writing-project/actions
```

### 2단계: 워크플로우 선택
- **"Tistory Auto Posting"** 워크플로우 클릭

### 3단계: 수동 실행
1. **"Run workflow"** 버튼 클릭
2. 입력 필드에 포스트 제목 확인:
   ```
   2025년 일본 소도시 여행 전략 가이드
   ```
3. **"Run workflow"** 실행

## 📊 실행 과정 모니터링

### 예상 실행 시간
- **총 소요 시간**: 3-5분
- **단계별 시간**:
  - Node.js 설정: 30초
  - 의존성 설치: 60초
  - 브라우저 실행: 30초
  - 로그인 & 포스팅: 2-3분

### 로그 확인 방법
1. 실행 중인 워크플로우 클릭
2. "post" 작업 클릭
3. 각 단계별 로그 확인

## 🎊 성공 확인 방법

### GitHub Actions에서 확인
- ✅ **모든 단계 초록색** → 성공
- ❌ **빨간색 X** → 실패 (로그 확인 필요)

### 티스토리 블로그에서 확인
1. 티스토리 관리자 페이지 접속
2. 글 관리에서 새 포스트 확인
3. 포스트 제목: "2025년 일본 소도시 여행 전략 가이드"

## 🛠️ 문제 해결

### 자주 발생하는 오류
1. **Secrets 미설정**: GitHub Secrets 재확인
2. **로그인 실패**: 카카오 계정 정보 재확인
3. **브라우저 타임아웃**: 재실행

### 문제 발생 시 대응
1. Actions 로그에서 오류 메시지 확인
2. 필요시 Secrets 재설정
3. 워크플로우 재실행

---

## 📞 지원 정보

- **리포지토리**: https://github.com/dongkyun-yoo/blog-writing-project
- **이슈 신고**: GitHub Issues 탭 활용
- **문서**: 각종 MD 파일 참조

**🎯 다음 단계: 위 가이드에 따라 GitHub Actions를 실행하여 첫 자동 포스팅을 완료하세요!**