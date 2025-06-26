const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runTistoryLoginPuppeteer() {
  let browser;
  let page;
  
  try {
    console.log('🚀 티스토리 로그인 자동화 시작 (Puppeteer 사용)');
    
    // 스크린샷 디렉토리 생성
    const screenshotDir = '/mnt/e/blog-writing-project/automation/screenshots/tistory';
    await fs.mkdir(screenshotDir, { recursive: true });
    
    // 브라우저 시작
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    console.log('📱 Puppeteer 브라우저 시작됨');
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // User Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('\n=== 단계 1: 티스토리 로그인 페이지 접속 ===');
    await page.goto('https://www.tistory.com/auth/login', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // 스크린샷 저장
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-tistory-login-page.png'),
      fullPage: true 
    });
    console.log('✅ 티스토리 로그인 페이지 접속 완료');
    
    console.log('\n=== 단계 2: 카카오 로그인 버튼 찾기 및 클릭 ===');
    
    // 페이지 HTML 확인
    const pageContent = await page.content();
    console.log('페이지 로딩 확인...');
    
    // 카카오 로그인 버튼 찾기
    const kakaoSelectors = [
      'a.btn_login.link_kakao_id',
      'a[href*="kakao"]',
      '.btn_kakao',
      'a:contains("카카오")',
      'a[title*="카카오"]'
    ];
    
    let kakaoLoginBtn = null;
    let usedSelector = null;
    
    for (const selector of kakaoSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        kakaoLoginBtn = await page.$(selector);
        if (kakaoLoginBtn) {
          usedSelector = selector;
          console.log(`✅ 카카오 로그인 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!kakaoLoginBtn) {
      // 모든 링크 확인
      const allLinks = await page.$$eval('a', links => 
        links.map(link => ({
          href: link.href,
          text: link.textContent?.trim(),
          className: link.className
        }))
      );
      console.log('페이지의 모든 링크:', allLinks);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '02-no-kakao-button.png'),
        fullPage: true 
      });
      throw new Error('❌ 카카오 로그인 버튼을 찾을 수 없습니다');
    }
    
    // 카카오 로그인 클릭
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      kakaoLoginBtn.click()
    ]);
    
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-kakao-login-page.png'),
      fullPage: true 
    });
    console.log('✅ 카카오 로그인 페이지로 이동 완료');
    
    console.log('\n=== 단계 3: 카카오 이메일 입력 ===');
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    // 카카오 로그인 페이지 확인
    if (!currentUrl.includes('kauth.kakao.com')) {
      console.log('⚠️  카카오 로그인 페이지가 아닙니다. 페이지 내용을 확인합니다.');
      const title = await page.title();
      console.log(`페이지 제목: ${title}`);
    }
    
    // 이메일 입력 필드 찾기
    const idSelectors = [
      '#loginId--1',
      '#id_email_2', 
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="아이디"]',
      'input[placeholder*="이메일"]',
      'input[name="loginId"]'
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
      // 모든 input 필드 확인
      const allInputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className
        }))
      );
      console.log('페이지의 모든 입력 필드:', allInputs);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-no-id-field.png'),
        fullPage: true 
      });
      throw new Error('❌ 이메일 입력 필드를 찾을 수 없습니다');
    }
    
    // 이메일 입력
    await idInput.click();
    await page.evaluate(() => document.activeElement?.select?.()); // 기존 내용 선택
    await idInput.type('beastrongman@daum.net', { delay: 100 });
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
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-no-pw-field.png'),
        fullPage: true 
      });
      throw new Error('❌ 비밀번호 입력 필드를 찾을 수 없습니다');
    }
    
    // 비밀번호 입력
    await pwInput.click();
    await page.evaluate(() => document.activeElement?.select?.()); // 기존 내용 선택
    await pwInput.type('King8160!', { delay: 100 });
    await page.waitForTimeout(1000);
    console.log('✅ 비밀번호 입력 완료');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-before-login.png'),
      fullPage: true 
    });
    
    console.log('\n=== 단계 5: 로그인 버튼 클릭 ===');
    const loginBtnSelectors = [
      '.btn_g.highlight.submit',
      'button[type="submit"]',
      '.submit_btn',
      'button[class*="login"]',
      '.login_btn',
      '.btn-login',
      'input[type="submit"]'
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
      // 모든 버튼과 submit 요소 확인
      const allButtons = await page.$$eval('button, input[type="submit"]', buttons => 
        buttons.map(btn => ({
          type: btn.type,
          className: btn.className,
          textContent: btn.textContent?.trim(),
          value: btn.value
        }))
      );
      console.log('페이지의 모든 버튼:', allButtons);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '07-no-login-button.png'),
        fullPage: true 
      });
      throw new Error('❌ 로그인 버튼을 찾을 수 없습니다');
    }
    
    // 로그인 버튼 클릭
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      loginBtn.click()
    ]);
    
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '08-after-login.png'),
      fullPage: true 
    });
    console.log('✅ 로그인 버튼 클릭 완료');
    
    console.log('\n=== 단계 6: 로그인 상태 확인 ===');
    const afterLoginUrl = page.url();
    console.log(`로그인 후 URL: ${afterLoginUrl}`);
    
    // 추가 인증 페이지 확인
    if (afterLoginUrl.includes('auth/verify') || 
        afterLoginUrl.includes('auth/device') ||
        afterLoginUrl.includes('captcha') ||
        afterLoginUrl.includes('verification')) {
      
      console.log('⚠️  추가 인증이 필요합니다.');
      await page.screenshot({ 
        path: path.join(screenshotDir, '09-need-verification.png'),
        fullPage: true 
      });
      
      console.log('⏳ 추가 인증을 위해 1분간 대기합니다...');
      await page.waitForTimeout(60000);
    }
    
    console.log('\n=== 단계 7: 티스토리 관리 페이지 접근 ===');
    try {
      await page.goto('https://www.tistory.com/manage', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log(`최종 URL: ${finalUrl}`);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '10-manage-page.png'),
        fullPage: true 
      });
      
      console.log('\n=== 단계 8: 최종 로그인 상태 확인 ===');
      if (finalUrl.includes('tistory.com') && 
          !finalUrl.includes('/auth/') && 
          !finalUrl.includes('/login')) {
        
        console.log('🎉 티스토리 로그인 성공!');
        
        // 쿠키 저장
        const cookies = await page.cookies();
        const cookiePath = '/mnt/e/blog-writing-project/automation/sessions/tistory-cookies.json';
        await fs.mkdir(path.dirname(cookiePath), { recursive: true });
        await fs.writeFile(cookiePath, JSON.stringify(cookies, null, 2));
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '11-login-success.png'),
          fullPage: true 
        });
        
        // 페이지 제목 확인
        const pageTitle = await page.title();
        console.log(`관리 페이지 제목: ${pageTitle}`);
        
        return {
          success: true,
          message: '티스토리 로그인 성공',
          url: finalUrl,
          cookies: cookies.length,
          title: pageTitle
        };
        
      } else {
        throw new Error(`❌ 관리 페이지 접근 실패 - 현재 URL: ${finalUrl}`);
      }
      
    } catch (navError) {
      console.log(`관리 페이지 접근 중 오류: ${navError.message}`);
      
      // 현재 상태 확인
      const currentPageUrl = page.url();
      const currentTitle = await page.title();
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '10-current-state.png'),
        fullPage: true 
      });
      
      console.log(`현재 페이지: ${currentPageUrl}`);
      console.log(`현재 제목: ${currentTitle}`);
      
      // 로그인은 성공했지만 관리 페이지 접근에 문제가 있을 수 있음
      if (currentPageUrl.includes('tistory.com') && 
          !currentPageUrl.includes('/auth/') && 
          !currentPageUrl.includes('/login')) {
        
        return {
          success: true,
          message: '로그인 성공, 관리 페이지 접근은 수동 확인 필요',
          url: currentPageUrl,
          title: currentTitle,
          note: '관리 페이지 직접 접근에 실패했지만 로그인 상태는 유효해 보입니다.'
        };
      } else {
        throw navError;
      }
    }
    
  } catch (error) {
    console.error(`❌ 로그인 중 오류 발생: ${error.message}`);
    
    if (page) {
      try {
        await page.screenshot({ 
          path: path.join('/mnt/e/blog-writing-project/automation/screenshots/tistory', '99-error.png'),
          fullPage: true 
        });
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
    if (browser) {
      await browser.close();
      console.log('🔚 브라우저 종료');
    }
    console.log('💾 모든 스크린샷은 /mnt/e/blog-writing-project/automation/screenshots/tistory/ 에 저장되었습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  runTistoryLoginPuppeteer()
    .then(result => {
      console.log('\n=== 최종 결과 ===');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = runTistoryLoginPuppeteer;