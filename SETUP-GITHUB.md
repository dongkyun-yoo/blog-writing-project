# GitHub 리포지토리 설정 및 자동 포스팅 실행 가이드

## 🚀 1단계: GitHub 리포지토리 생성 및 푸시

### 방법 1: GitHub 웹사이트에서 생성
1. [GitHub.com](https://github.com) 접속 후 로그인
2. 우상단 "+" 버튼 클릭 → "New repository" 선택
3. Repository 정보 입력:
   - **Repository name**: `blog-automation` (또는 원하는 이름)
   - **Description**: `자동 블로그 포스팅 시스템`
   - **Public/Private**: 개인 선택
   - README, .gitignore, license는 체크하지 않음 (이미 있음)

4. "Create repository" 클릭

### 방법 2: 현재 디렉토리에서 바로 푸시
생성된 리포지토리 페이지에서 제공하는 명령어 사용:

```bash
# 원격 리포지토리 추가 (YOUR_USERNAME을 실제 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/blog-automation.git

# 기본 브랜치를 main으로 설정
git branch -M main

# 푸시 실행
git push -u origin main
```

## 🔐 2단계: GitHub Secrets 설정

리포지토리가 생성되면:

1. 리포지토리 페이지에서 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Secrets and variables** → **Actions** 클릭
3. **New repository secret** 클릭하여 다음 시크릿 추가:

### 필수 시크릿:
- **Name**: `KAKAO_EMAIL`
  - **Secret**: `beastrongman@daum.net`

- **Name**: `KAKAO_PASSWORD`
  - **Secret**: `King8160!`

### 선택 시크릿 (Tistory API 사용 시):
- **Name**: `TISTORY_CLIENT_ID`
  - **Secret**: Tistory API 앱의 Client ID

- **Name**: `TISTORY_CLIENT_SECRET`
  - **Secret**: Tistory API 앱의 Client Secret

## 🎯 3단계: GitHub Actions 워크플로우 실행

1. 리포지토리에서 **Actions** 탭 클릭
2. "Tistory Auto Posting" 워크플로우 찾기
3. **Run workflow** 버튼 클릭
4. 필요시 입력값 설정:
   - **Post Title**: 기본값 또는 원하는 제목 입력
5. **Run workflow** 클릭하여 실행

## 📊 4단계: 실행 결과 확인

1. Actions 탭에서 실행 중인 워크플로우 클릭
2. 실시간 로그 확인:
   - 로그인 과정
   - 포스트 작성 과정
   - 발행 완료 여부

3. 성공 시: 티스토리 블로그에서 발행된 포스트 확인
4. 실패 시: 로그에서 오류 원인 분석

## 🔧 트러블슈팅

### 로그인 실패 시:
- Secrets에 올바른 카카오 계정 정보가 설정되었는지 확인
- 2단계 인증이 활성화된 경우 앱 비밀번호 사용

### 포스트 작성 실패 시:
- 티스토리 에디터 변경 시 선택자가 달라질 수 있음
- 워크플로우 파일에서 선택자 업데이트 필요

### 권한 오류 시:
- GitHub Actions에서 해당 리포지토리에 대한 권한 확인
- Secrets 설정이 올바른지 재확인

## 🎉 성공 예상 결과

워크플로우가 성공적으로 실행되면:

1. **티스토리 블로그에 다음 포스트가 발행됨**:
   - 제목: "2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석"
   - 내용: 5,742자 분량의 완성된 여행 가이드
   - 태그: 일본여행, 나라여행, 홋카이도여행, 소도시여행, 2025년여행

2. **GitHub Actions 로그에 성공 메시지 표시**
3. **발행된 포스트 URL 기록**

---

**📝 참고**: 이 가이드대로 진행하면 완전 자동화된 블로그 포스팅이 실현됩니다!