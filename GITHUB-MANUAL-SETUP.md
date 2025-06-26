# 🚀 GitHub 리포지토리 수동 생성 및 자동 포스팅 설정

## 📋 1단계: GitHub 리포지토리 생성

### 🔗 링크: https://github.com/new

### 설정값:
- **Repository name**: `tistory-auto-posting`
- **Description**: `🤖 완전 자동화된 티스토리 블로그 포스팅 시스템 - GitHub Actions 기반`
- **Visibility**: **Public** 선택 (추천)
- **Initialize**: 다음 항목들을 **체크하지 않기**
  - ❌ Add a README file
  - ❌ Add .gitignore
  - ❌ Choose a license

### 🎯 "Create repository" 버튼 클릭

---

## 📋 2단계: 코드 푸시

리포지토리 생성 후 나타나는 페이지에서 **GitHub 사용자명**을 확인하고, 다음 명령어를 실행하세요:

```bash
# GitHub 사용자명을 YOUR_USERNAME으로 변경
node create-github-repo.js push YOUR_USERNAME
```

**또는 수동으로:**

```bash
# 예시: 사용자명이 'myusername'인 경우
git remote add origin https://github.com/myusername/tistory-auto-posting.git
git branch -M main
git push -u origin main
```

---

## 📋 3단계: GitHub Secrets 설정

### 🔐 Secrets 페이지 접속:
리포지토리 > **Settings** > **Secrets and variables** > **Actions**

### 추가할 Secrets:

| Secret Name | Secret Value |
|-------------|--------------|
| `KAKAO_EMAIL` | `beastrongman@daum.net` |
| `KAKAO_PASSWORD` | `King8160!` |

### 설정 방법:
1. **"New repository secret"** 클릭
2. **Name**: `KAKAO_EMAIL`
3. **Secret**: `beastrongman@daum.net`
4. **"Add secret"** 클릭
5. 위 과정을 `KAKAO_PASSWORD`에도 반복

---

## 📋 4단계: GitHub Actions 워크플로우 실행

### 🎯 Actions 페이지 접속:
리포지토리 > **Actions** 탭

### 실행 방법:
1. **"Tistory Auto Posting"** 워크플로우 선택
2. **"Run workflow"** 버튼 클릭
3. **"Run workflow"** 다시 클릭하여 실행

---

## 📊 5단계: 실행 결과 확인

### ✅ 성공 시:
- GitHub Actions 로그에서 "✅ 자동 포스팅 완료" 메시지 확인
- 티스토리 블로그에서 발행된 포스트 확인
- 포스트 제목: "2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석"

### ❌ 실패 시:
- Actions 로그에서 오류 메시지 확인
- 로그인 정보나 선택자 문제일 가능성
- Issues 탭에서 문제 보고

---

## 🎉 완료!

모든 단계가 완료되면 **완전 자동화된 티스토리 블로그 포스팅 시스템**이 작동합니다!

### 🔄 향후 사용법:
1. Actions 탭에서 워크플로우 실행
2. 새로운 포스트 파일을 추가하고 워크플로우 수정
3. 스케줄링을 통한 정기 자동 포스팅

---

**📞 문의사항이나 오류 발생 시**: GitHub Issues 활용