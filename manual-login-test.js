require('dotenv').config();
const puppeteer = require('puppeteer');

async function testTistoryLogin() {
  try {
    console.log('📌 Puppeteer로 티스토리 로그인 테스트...');
    
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ 브라우저 시작됨');
    
    // 티스토리 로그인 페이지로 이동
    await page.goto('https://www.tistory.com/auth/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('✅ 로그인 페이지 로드 완료');
    
    // 페이지 스크린샷 (디버깅용)
    await page.screenshot({ path: './screenshots/tistory-login-page.png' });
    console.log('📸 스크린샷 저장: tistory-login-page.png');
    
    // 카카오 로그인 버튼 찾기
    await page.waitForTimeout(2000);
    
    const kakaoBtn = await page.$('a.btn_login.link_kakao_id');
    
    if (kakaoBtn) {
      console.log('✅ 카카오 로그인 버튼 발견');
      
      // 카카오 로그인 클릭
      await kakaoBtn.click();
      console.log('🖱️ 카카오 로그인 버튼 클릭');
      
      // 새 페이지 대기
      await page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      console.log('✅ 카카오 로그인 페이지로 이동');
      
      // 스크린샷
      await page.screenshot({ path: './screenshots/kakao-login-page.png' });
      console.log('📸 스크린샷 저장: kakao-login-page.png');
      
      // 이메일 입력 필드 찾기
      const emailSelectors = [
        '#loginId--1',
        '#id_email_2', 
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="아이디"]'
      ];
      
      let emailInput = null;
      for (const selector of emailSelectors) {
        emailInput = await page.$(selector);
        if (emailInput) {
          console.log(`✅ 이메일 입력 필드 발견: ${selector}`);
          break;
        }
      }
      
      if (emailInput) {
        await emailInput.type(process.env.KAKAO_EMAIL);
        console.log('✅ 이메일 입력 완료');
        
        // 비밀번호 입력 필드 찾기
        const passwordSelectors = [
          '#password--2',
          '#id_password_3',
          'input[name="password"]',
          'input[type="password"]'
        ];
        
        let passwordInput = null;
        for (const selector of passwordSelectors) {
          passwordInput = await page.$(selector);
          if (passwordInput) {
            console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
            break;
          }
        }
        
        if (passwordInput) {
          await passwordInput.type(process.env.KAKAO_PASSWORD);
          console.log('✅ 비밀번호 입력 완료');
          
          // 로그인 버튼 클릭
          const loginBtn = await page.$('button[type="submit"], .btn_g.highlight, .submit');
          if (loginBtn) {
            await loginBtn.click();
            console.log('🖱️ 로그인 버튼 클릭');
            
            // 로그인 처리 대기
            await page.waitForTimeout(5000);
            
            const currentUrl = page.url();
            console.log(`📍 현재 URL: ${currentUrl}`);
            
            // 최종 스크린샷
            await page.screenshot({ path: './screenshots/after-login.png' });
            console.log('📸 로그인 후 스크린샷 저장: after-login.png');
            
            if (currentUrl.includes('tistory.com') && !currentUrl.includes('login')) {
              console.log('🎉 티스토리 로그인 성공!');
            } else {
              console.log('⚠️ 추가 인증이 필요하거나 로그인 실패');
            }
          }
        }
      }
      
    } else {
      console.log('❌ 카카오 로그인 버튼을 찾을 수 없습니다.');
    }
    
    await browser.close();
    console.log('🔚 브라우저 종료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 실행
testTistoryLogin();