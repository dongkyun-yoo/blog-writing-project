#!/bin/bash

# GitHub 리포지토리 빠른 설정 및 푸시 스크립트

echo "🚀 GitHub 리포지토리 설정 및 푸시 시작"
echo "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "="

echo "📋 1단계: GitHub 사용자명 입력"
read -p "GitHub 사용자명을 입력하세요: " GITHUB_USERNAME

echo "📋 2단계: 리포지토리 이름 입력"
read -p "리포지토리 이름을 입력하세요 (기본값: blog-automation): " REPO_NAME
REPO_NAME=${REPO_NAME:-blog-automation}

echo "📋 3단계: 원격 리포지토리 설정"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# 기존 원격 리포지토리 제거 (있는 경우)
git remote remove origin 2>/dev/null || echo "기존 원격 리포지토리 없음"

# 새 원격 리포지토리 추가
git remote add origin $REPO_URL
echo "✅ 원격 리포지토리 설정: $REPO_URL"

echo "📋 4단계: 브랜치 설정"
git branch -M main
echo "✅ 메인 브랜치 설정 완료"

echo "📋 5단계: 최종 커밋 생성"
git add .
git commit -m "GitHub Actions 자동 포스팅 시스템 완성

🎯 완전 자동화된 티스토리 블로그 포스팅 시스템
- GitHub Actions 워크플로우 구현
- Puppeteer 기반 자동 로그인 및 포스팅
- 환경 제약 해결 및 CI/CD 최적화
- 실제 포스팅 가능한 완성된 시스템

📋 사용법:
1. GitHub Secrets에 KAKAO_EMAIL, KAKAO_PASSWORD 설정
2. Actions 탭에서 워크플로우 실행
3. 자동으로 티스토리에 포스트 발행

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" 2>/dev/null || echo "커밋할 변경사항 없음"

echo "📋 6단계: GitHub에 푸시"
echo "⚠️ GitHub 리포지토리가 미리 생성되어 있어야 합니다!"
echo "📍 리포지토리 생성: https://github.com/new"
echo ""
read -p "리포지토리를 생성했습니까? (y/N): " CONFIRM

if [[ $CONFIRM =~ ^[Yy]$ ]]; then
    echo "🚀 푸시 실행 중..."
    
    if git push -u origin main; then
        echo ""
        echo "🎉 성공! GitHub 리포지토리에 푸시 완료"
        echo "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "="
        echo ""
        echo "📋 다음 단계:"
        echo "1. 리포지토리 페이지로 이동: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
        echo "2. Settings > Secrets and variables > Actions 메뉴"
        echo "3. 다음 시크릿 추가:"
        echo "   - KAKAO_EMAIL: beastrongman@daum.net"
        echo "   - KAKAO_PASSWORD: King8160!"
        echo "4. Actions 탭에서 'Tistory Auto Posting' 워크플로우 실행"
        echo ""
        echo "🎯 자동 포스팅 준비 완료!"
        
    else
        echo "❌ 푸시 실패"
        echo "📋 수동으로 다음 명령어를 실행하세요:"
        echo "git remote add origin $REPO_URL"
        echo "git branch -M main"
        echo "git push -u origin main"
    fi
else
    echo "📋 먼저 GitHub에서 리포지토리를 생성하세요:"
    echo "🔗 https://github.com/new"
    echo "리포지토리 이름: $REPO_NAME"
    echo ""
    echo "생성 후 이 스크립트를 다시 실행하세요."
fi

echo ""
echo "📖 자세한 가이드: SETUP-GITHUB.md 파일 참조"