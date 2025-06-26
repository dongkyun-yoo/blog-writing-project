require('dotenv').config();
const { chromium } = require('playwright');

async function testTistoryLogin() {
  const browser = await chromium.launch({ 
    headless: true,  // WSL 환경에서는 headless 모드 사용
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📌 티스토리 로그인 시작...');
    
    // 티스토리 로그인 페이지로 이동
    await page.goto('https://www.tistory.com/auth/login', { 
      waitUntil: 'networkidle' 
    });
    
    console.log('✅ 로그인 페이지 로드 완료');
    
    // 카카오 로그인 버튼 찾기
    await page.waitForTimeout(2000);
    
    const kakaoBtn = await page.locator('a.btn_login.link_kakao_id').first();
    
    if (await kakaoBtn.isVisible()) {
      console.log('✅ 카카오 로그인 버튼 발견');
      
      // 카카오 로그인 클릭
      await kakaoBtn.click();
      
      // 카카오 로그인 페이지 대기
      await page.waitForTimeout(3000);
      
      // 이메일 입력
      const emailInput = await page.locator('#loginId--1, #id_email_2, input[name="email"]').first();
      await emailInput.fill(process.env.KAKAO_EMAIL);
      console.log('✅ 이메일 입력 완료');
      
      // 비밀번호 입력
      const passwordInput = await page.locator('#password--2, #id_password_3, input[name="password"]').first();
      await passwordInput.fill(process.env.KAKAO_PASSWORD);
      console.log('✅ 비밀번호 입력 완료');
      
      // 로그인 버튼 클릭
      const loginBtn = await page.locator('button[type="submit"], .btn_g.highlight').first();
      await loginBtn.click();
      
      console.log('⏳ 로그인 처리 중...');
      
      // 로그인 후 리다이렉트 대기
      await page.waitForTimeout(5000);
      
      // 현재 URL 확인
      const currentUrl = page.url();
      console.log(`📍 현재 URL: ${currentUrl}`);
      
      if (currentUrl.includes('tistory.com') && !currentUrl.includes('login')) {
        console.log('✅ 티스토리 로그인 성공!');
      } else {
        console.log('⚠️ 추가 인증이 필요할 수 있습니다.');
      }
      
    } else {
      console.log('❌ 카카오 로그인 버튼을 찾을 수 없습니다.');
    }
    
    // 세션 저장을 위해 잠시 대기
    console.log('💾 세션 저장을 위해 10초 대기...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 로그인 중 오류 발생:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 브라우저 종료');
  }
}

// 실행
testTistoryLogin().catch(console.error);