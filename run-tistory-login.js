const { firefox } = require('playwright');
const TistoryAutomation = require('./automation/playwright/tistory/tistory-automation.js');

async function runTistoryLogin() {
  let browser;
  let context;
  let page;
  
  try {
    console.log('🚀 티스토리 로그인 자동화 시작');
    
    // 브라우저 시작 (Firefox 사용)
    browser = await firefox.launch({
      headless: true,  // WSL 환경에서는 headless로 실행
      slowMo: 100
    });
    
    console.log('📱 브라우저 시작됨 (headless: true)');
    
    // 컨텍스트 및 페이지 생성
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    page = await context.newPage();
    
    // Tistory 자동화 인스턴스 생성
    const tistory = new TistoryAutomation();
    
    // 자격증명 설정
    const credentials = {
      username: 'beastrongman@daum.net',
      password: 'King8160!'
    };
    
    console.log('📧 자격증명 설정 완료');
    
    // 단계별 로그인 실행
    console.log('\n=== 단계 1: 티스토리 로그인 페이지 접속 ===');
    await page.goto('https://www.tistory.com/auth/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await tistory.saveScreenshot(page, '01-tistory-login-page');
    console.log('✅ 티스토리 로그인 페이지 접속 완료');
    
    console.log('\n=== 단계 2: 카카오 로그인 버튼 찾기 및 클릭 ===');
    const kakaoSelectors = [
      'a.btn_login.link_kakao_id',
      'a[href*="kakao"]',
      '.btn_kakao',
      'button:has-text("카카오")',
      'a:has-text("카카오로 로그인")'
    ];
    
    let kakaoLoginBtn = null;
    for (const selector of kakaoSelectors) {
      kakaoLoginBtn = await page.$(selector);
      if (kakaoLoginBtn) {
        console.log(`✅ 카카오 로그인 버튼 발견: ${selector}`);
        break;
      }
    }
    
    if (!kakaoLoginBtn) {
      await tistory.saveScreenshot(page, '02-no-kakao-button');
      throw new Error('❌ 카카오 로그인 버튼을 찾을 수 없습니다');
    }
    
    // 카카오 로그인 클릭
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      kakaoLoginBtn.click()
    ]);
    
    await page.waitForTimeout(2000);
    await tistory.saveScreenshot(page, '03-kakao-login-page');
    console.log('✅ 카카오 로그인 페이지로 이동 완료');
    
    console.log('\n=== 단계 3: 카카오 이메일 입력 ===');
    const idSelectors = [
      '#loginId--1',
      '#id_email_2',
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="아이디"]',
      'input[placeholder*="이메일"]'
    ];
    
    let idInput = null;
    for (const selector of idSelectors) {
      try {
        await page.waitForSelector(selector, { visible: true, timeout: 3000 });
        idInput = await page.$(selector);
        if (idInput) {
          console.log(`✅ 이메일 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!idInput) {
      await tistory.saveScreenshot(page, '04-no-id-field');
      throw new Error('❌ 이메일 입력 필드를 찾을 수 없습니다');
    }
    
    // 이메일 입력
    await idInput.click();
    await idInput.fill('');
    await idInput.type(credentials.username, { delay: 100 });
    await page.waitForTimeout(1000);
    console.log('✅ 이메일 입력 완료: beastrongman@daum.net');
    
    console.log('\n=== 단계 4: 카카오 비밀번호 입력 ===');
    const pwSelectors = [
      '#password--2', 
      '#id_password_3',
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="비밀번호"]'
    ];
    
    let pwInput = null;
    for (const selector of pwSelectors) {
      pwInput = await page.$(selector);
      if (pwInput) {
        console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
        break;
      }
    }
    
    if (!pwInput) {
      await tistory.saveScreenshot(page, '05-no-pw-field');
      throw new Error('❌ 비밀번호 입력 필드를 찾을 수 없습니다');
    }
    
    // 비밀번호 입력
    await pwInput.click();
    await pwInput.fill('');
    await pwInput.type(credentials.password, { delay: 100 });
    await page.waitForTimeout(1000);
    console.log('✅ 비밀번호 입력 완료');
    
    await tistory.saveScreenshot(page, '06-before-login');
    
    console.log('\n=== 단계 5: 로그인 버튼 클릭 ===');
    const loginBtnSelectors = [
      '.btn_g.highlight.submit',
      'button[type="submit"]',
      '.submit_btn',
      'button:has-text("로그인")',
      '.login_btn'
    ];
    
    let loginBtn = null;
    for (const selector of loginBtnSelectors) {
      loginBtn = await page.$(selector);
      if (loginBtn) {
        console.log(`✅ 로그인 버튼 발견: ${selector}`);
        break;
      }
    }
    
    if (!loginBtn) {
      await tistory.saveScreenshot(page, '07-no-login-button');
      throw new Error('❌ 로그인 버튼을 찾을 수 없습니다');
    }
    
    // 로그인 버튼 클릭
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      loginBtn.click()
    ]);
    
    await page.waitForTimeout(3000);
    await tistory.saveScreenshot(page, '08-after-login');
    console.log('✅ 로그인 버튼 클릭 완료');
    
    console.log('\n=== 단계 6: 로그인 상태 확인 ===');
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    // 추가 인증 페이지 확인
    if (currentUrl.includes('auth/verify') || 
        currentUrl.includes('auth/device') ||
        currentUrl.includes('captcha') ||
        currentUrl.includes('verification')) {
      
      console.log('⚠️  추가 인증이 필요합니다. 수동으로 완료해주세요.');
      await tistory.saveScreenshot(page, '09-need-verification');
      
      console.log('⏳ 수동 인증을 위해 3분간 대기합니다...');
      
      try {
        await page.waitForNavigation({ 
          waitUntil: 'networkidle',
          timeout: 180000 // 3분
        });
        console.log('✅ 수동 인증 완료');
      } catch (e) {
        console.log('⚠️  인증 시간 초과. 계속 진행합니다.');
      }
    }
    
    console.log('\n=== 단계 7: 티스토리 관리 페이지 접근 ===');
    await page.goto('https://www.tistory.com/manage', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`최종 URL: ${finalUrl}`);
    
    await tistory.saveScreenshot(page, '10-manage-page');
    
    console.log('\n=== 단계 8: 최종 로그인 상태 확인 ===');
    if (finalUrl.includes('tistory.com') && 
        !finalUrl.includes('/auth/') && 
        !finalUrl.includes('/login')) {
      
      console.log('🎉 티스토리 로그인 성공!');
      
      // 쿠키 저장
      const cookies = await context.cookies();
      await tistory.saveCookies(cookies);
      
      await tistory.saveScreenshot(page, '11-login-success');
      
      // 사용 가능한 블로그 확인
      try {
        const blogs = await tistory.getBlogs(page);
        if (blogs.length > 0) {
          console.log('\n📝 사용 가능한 블로그:');
          blogs.forEach((blog, index) => {
            console.log(`  ${index + 1}. ${blog.name} - ${blog.url}`);
          });
        }
      } catch (e) {
        console.log('ℹ️  블로그 목록 조회 실패 (정상적인 경우일 수 있음)');
      }
      
      return {
        success: true,
        message: '티스토리 로그인 성공',
        url: finalUrl,
        cookies: cookies.length
      };
      
    } else {
      throw new Error(`❌ 로그인 실패 - 현재 URL: ${finalUrl}`);
    }
    
  } catch (error) {
    console.error(`❌ 로그인 중 오류 발생: ${error.message}`);
    
    if (page) {
      try {
        const tistory = new TistoryAutomation();
        await tistory.saveScreenshot(page, '99-error');
        console.log('📸 오류 스크린샷 저장됨');
      } catch (e) {
        console.error('스크린샷 저장 실패:', e.message);
      }
    }
    
    return {
      success: false,
      error: error.message
    };
    
  } finally {
    // 브라우저는 열어둠 (수동으로 확인할 수 있도록)
    console.log('\n🔍 브라우저를 열어둡니다. 수동으로 확인 후 닫아주세요.');
    console.log('💾 모든 스크린샷은 /mnt/e/blog-writing-project/automation/screenshots/tistory/ 에 저장됩니다.');
    
    // 30초 후 자동 종료 (선택사항)
    setTimeout(async () => {
      if (browser) {
        console.log('⏰ 30초 후 브라우저 자동 종료');
        await browser.close();
      }
    }, 30000);
  }
}

// 스크립트 실행
if (require.main === module) {
  runTistoryLogin()
    .then(result => {
      console.log('\n=== 최종 결과 ===');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = runTistoryLogin;