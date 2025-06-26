const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const TistoryAutomation = require('./automation/playwright/tistory/tistory-automation');

async function main() {
  let browser;
  let context;
  let page;
  
  const automation = new TistoryAutomation();
  
  try {
    console.log('🚀 티스토리 자동 포스팅 시작');
    
    // 1. 포스트 내용 읽기
    const postPath = '/mnt/e/blog-writing-project/posts/2025-japan-small-city-travel-tistory.md';
    const postContent = await fs.readFile(postPath, 'utf8');
    
    // 마크다운에서 제목 추출
    const titleMatch = postContent.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : '2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석';
    
    // 태그 추출 (마지막 **태그** 부분에서)
    const tagMatch = postContent.match(/\*\*태그\*\*:\s*(.+)/);
    const tagsString = tagMatch ? tagMatch[1] : '#일본여행 #나라여행 #홋카이도여행 #소도시여행 #2025년여행계획';
    const tags = tagsString.replace(/#/g, '').split(/\s+/).filter(tag => tag.trim());
    
    const postData = {
      title: title,
      content: postContent,
      tags: tags.slice(0, 5), // 티스토리는 보통 태그 개수 제한
      category: '여행',
      visibility: 'public'
    };
    
    console.log('📄 포스트 데이터 준비 완료');
    console.log(`제목: ${postData.title}`);
    console.log(`태그: ${postData.tags.join(', ')}`);
    
    // 2. 브라우저 시작
    console.log('🌐 브라우저 시작...');
    browser = await chromium.launch({
      headless: true, // WSL 환경에서 headless로 실행
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    page = await context.newPage();
    
    // 3. 기존 쿠키 로드 시도
    const savedCookies = await automation.loadCookies();
    if (savedCookies) {
      await context.addCookies(savedCookies);
      console.log('🍪 저장된 쿠키 로드 완료');
    }
    
    // 4. 로그인 상태 확인
    console.log('🔍 로그인 상태 확인...');
    const isLoggedIn = await automation.checkLoginStatus(page);
    
    if (!isLoggedIn) {
      console.log('🔑 로그인 필요 - 로그인 진행');
      
      // 로그인 정보
      const credentials = {
        username: 'beastrongman@daum.net',
        password: 'King8160!'
      };
      
      // 로그인 수행
      const loginSuccess = await automation.performLogin(page, credentials);
      
      if (!loginSuccess) {
        throw new Error('로그인 실패');
      }
      
      // 로그인 성공 후 잠시 대기
      await page.waitForTimeout(3000);
    } else {
      console.log('✅ 이미 로그인된 상태');
    }
    
    // 5. 글쓰기 페이지로 이동
    console.log('📝 글쓰기 시작...');
    const writeResult = await automation.writePost(page, postData);
    
    if (writeResult.success) {
      console.log('🎉 포스트 발행 성공!');
      if (writeResult.url) {
        console.log(`📎 포스트 URL: ${writeResult.url}`);
      }
      
      // 최종 스크린샷
      await automation.saveScreenshot(page, 'final-success');
      
      // 성공 보고서 작성
      const report = {
        success: true,
        timestamp: new Date().toISOString(),
        postTitle: postData.title,
        postUrl: writeResult.url || 'URL 확인 필요',
        tags: postData.tags,
        message: '티스토리 포스트가 성공적으로 발행되었습니다.'
      };
      
      await fs.writeFile(
        '/mnt/e/blog-writing-project/automation/logs/tistory-post-result.json',
        JSON.stringify(report, null, 2)
      );
      
      console.log('📊 실행 결과가 저장되었습니다.');
      
    } else {
      throw new Error(writeResult.error || '포스트 발행 실패');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    if (page) {
      await automation.saveScreenshot(page, 'error-state');
    }
    
    // 오류 보고서 작성
    const errorReport = {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };
    
    await fs.mkdir('/mnt/e/blog-writing-project/automation/logs', { recursive: true });
    await fs.writeFile(
      '/mnt/e/blog-writing-project/automation/logs/tistory-post-error.json',
      JSON.stringify(errorReport, null, 2)
    );
    
    process.exit(1);
    
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔚 브라우저 종료');
    }
  }
}

// 프로그램 실행
main().catch(error => {
  console.error('💥 예상치 못한 오류:', error);
  process.exit(1);
});