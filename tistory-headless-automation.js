/**
 * 헤드리스 모드 티스토리 자동화
 * WSL 환경 최적화 버전
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class TistoryHeadlessAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.credentials = {
      email: 'beastrongman@daum.net',
      password: 'King8160!'
    };
  }

  /**
   * 헤드리스 브라우저 초기화
   */
  async initialize() {
    console.log('🎯 헤드리스 모드 티스토리 자동화 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      console.log('🚀 헤드리스 브라우저 실행 중...');
      
      // 스크린샷 디렉토리 생성
      if (!fs.existsSync('./screenshots')) {
        fs.mkdirSync('./screenshots', { recursive: true });
      }

      this.browser = await puppeteer.launch({
        headless: 'new',  // 새로운 헤드리스 모드
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      
      // 뷰포트 설정
      await this.page.setViewport({ width: 1280, height: 720 });
      
      // 사용자 에이전트 설정
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('✅ 헤드리스 브라우저 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('❌ 브라우저 초기화 실패:', error.message);
      return false;
    }
  }

  /**
   * 스크린샷 저장
   */
  async screenshot(filename) {
    try {
      await this.page.screenshot({ 
        path: `./screenshots/${filename}`,
        fullPage: true 
      });
      console.log(`📸 스크린샷 저장: ${filename}`);
    } catch (error) {
      console.error('❌ 스크린샷 실패:', error.message);
    }
  }

  /**
   * 페이지 정보 출력
   */
  async logPageInfo(stepName) {
    try {
      const title = await this.page.title();
      const url = this.page.url();
      console.log(`📄 ${stepName} - 제목: ${title}`);
      console.log(`🔗 ${stepName} - URL: ${url}`);
    } catch (error) {
      console.log(`⚠️ ${stepName} - 페이지 정보 가져오기 실패`);
    }
  }

  /**
   * 단계 1: 티스토리 접속
   */
  async step1_AccessTistory() {
    console.log('\n🔗 1단계: 티스토리 접속 (헤드리스)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      console.log('🌐 티스토리 메인 페이지 접속 중...');
      
      await this.page.goto('https://www.tistory.com', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.page.waitForTimeout(2000);
      await this.screenshot('01-tistory-main.png');
      await this.logPageInfo('티스토리 접속');
      
      console.log('✅ 티스토리 접속 완료');
      return true;
      
    } catch (error) {
      console.error('❌ 티스토리 접속 실패:', error.message);
      await this.screenshot('error-tistory-access.png');
      return false;
    }
  }

  /**
   * 단계 2: 로그인 버튼 찾기 및 클릭
   */
  async step2_FindLoginButton() {
    console.log('\n🔍 2단계: 로그인 버튼 찾기 (헤드리스)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 페이지의 모든 링크 분석
      const allLinks = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.map(link => ({
          text: link.textContent.trim(),
          href: link.href,
          className: link.className
        })).filter(link => link.text.length > 0);
      });
      
      console.log('🔍 페이지의 주요 링크들:');
      allLinks.slice(0, 10).forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.text} - ${link.href}`);
      });
      
      // 로그인 관련 링크 찾기
      const loginLinks = allLinks.filter(link => 
        link.text.includes('로그인') || 
        link.text.includes('Login') ||
        link.href.includes('login')
      );
      
      console.log('\n🎯 로그인 관련 링크들:');
      loginLinks.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.text} - ${link.href}`);
      });
      
      if (loginLinks.length > 0) {
        // 첫 번째 로그인 링크 클릭
        const loginHref = loginLinks[0].href;
        console.log(`✅ 로그인 링크 발견: ${loginHref}`);
        
        await this.page.goto(loginHref, { waitUntil: 'networkidle2' });
        await this.page.waitForTimeout(3000);
        await this.screenshot('02-login-page.png');
        await this.logPageInfo('로그인 페이지');
        
        console.log('✅ 로그인 페이지로 이동 완료');
        return true;
      } else {
        console.log('❌ 로그인 버튼을 찾을 수 없습니다');
        await this.screenshot('error-no-login-button.png');
        return false;
      }
      
    } catch (error) {
      console.error('❌ 로그인 버튼 찾기 실패:', error.message);
      await this.screenshot('error-login-button.png');
      return false;
    }
  }

  /**
   * 단계 3: 카카오 로그인 선택
   */
  async step3_SelectKakaoLogin() {
    console.log('\n🟡 3단계: 카카오 로그인 선택 (헤드리스)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 페이지의 모든 요소 분석
      const allElements = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('a, button, img'));
        return elements.map(el => ({
          tagName: el.tagName,
          text: el.textContent ? el.textContent.trim() : '',
          href: el.href || '',
          src: el.src || '',
          alt: el.alt || '',
          className: el.className
        })).filter(el => 
          el.text.includes('카카오') ||
          el.href.includes('kakao') ||
          el.src.includes('kakao') ||
          el.alt.includes('카카오')
        );
      });
      
      console.log('🔍 카카오 관련 요소들:');
      allElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.tagName}: "${el.text}" - ${el.href || el.src}`);
      });
      
      if (allElements.length > 0) {
        // 카카오 로그인 링크 찾기
        const kakaoLink = allElements.find(el => el.href && el.href.includes('kakao'));
        
        if (kakaoLink) {
          console.log(`✅ 카카오 로그인 링크 발견: ${kakaoLink.href}`);
          
          await this.page.goto(kakaoLink.href, { waitUntil: 'networkidle2' });
          await this.page.waitForTimeout(3000);
          await this.screenshot('03-kakao-login.png');
          await this.logPageInfo('카카오 로그인');
          
          console.log('✅ 카카오 로그인 페이지로 이동');
          return true;
        } else {
          // 클릭 방식으로 시도
          console.log('🔄 클릭 방식으로 카카오 로그인 시도...');
          
          const clicked = await this.page.evaluate(() => {
            const kakaoElements = Array.from(document.querySelectorAll('a, button, img')).filter(el => 
              (el.textContent && el.textContent.includes('카카오')) ||
              (el.href && el.href.includes('kakao')) ||
              (el.src && el.src.includes('kakao'))
            );
            
            if (kakaoElements.length > 0) {
              const element = kakaoElements[0];
              if (element.tagName === 'IMG' && element.closest('a')) {
                element.closest('a').click();
              } else {
                element.click();
              }
              return true;
            }
            return false;
          });
          
          if (clicked) {
            await this.page.waitForTimeout(3000);
            await this.screenshot('03-kakao-login-clicked.png');
            await this.logPageInfo('카카오 로그인 클릭');
            console.log('✅ 카카오 요소 클릭 완료');
            return true;
          }
        }
      }
      
      console.log('❌ 카카오 로그인 버튼을 찾을 수 없습니다');
      await this.screenshot('error-no-kakao.png');
      return false;
      
    } catch (error) {
      console.error('❌ 카카오 로그인 선택 실패:', error.message);
      await this.screenshot('error-kakao-login.png');
      return false;
    }
  }

  /**
   * 단계 4: 카카오 로그인 정보 입력
   */
  async step4_KakaoLoginInput() {
    console.log('\n🔐 4단계: 카카오 로그인 정보 입력 (헤드리스)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 페이지 로딩 대기
      await this.page.waitForTimeout(3000);
      await this.logPageInfo('로그인 정보 입력 페이지');
      
      // 입력 필드 분석
      const inputFields = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className
        }));
      });
      
      console.log('🔍 페이지의 입력 필드들:');
      inputFields.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field.type} - ${field.name || field.id} - ${field.placeholder}`);
      });
      
      // 이메일 입력
      console.log('\n📧 이메일 입력 시도...');
      const emailSelectors = ['#loginId', '#email', 'input[name="email"]', 'input[type="email"]', 'input[type="text"]'];
      
      let emailSuccess = false;
      for (const selector of emailSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await this.page.focus(selector);
            await this.page.type(selector, this.credentials.email, { delay: 100 });
            emailSuccess = true;
            console.log(`✅ 이메일 입력 완료: ${selector}`);
            break;
          }
        } catch (error) {
          console.log(`❌ 이메일 선택자 실패: ${selector}`);
        }
      }
      
      // 비밀번호 입력
      console.log('\n🔒 비밀번호 입력 시도...');
      const passwordSelectors = ['#password', 'input[name="password"]', 'input[type="password"]'];
      
      let passwordSuccess = false;
      for (const selector of passwordSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await this.page.focus(selector);
            await this.page.type(selector, this.credentials.password, { delay: 100 });
            passwordSuccess = true;
            console.log(`✅ 비밀번호 입력 완료: ${selector}`);
            break;
          }
        } catch (error) {
          console.log(`❌ 비밀번호 선택자 실패: ${selector}`);
        }
      }
      
      await this.screenshot('04-login-filled.png');
      
      if (emailSuccess && passwordSuccess) {
        // 로그인 버튼 클릭
        console.log('\n🚀 로그인 실행...');
        const loginButtonSelectors = ['.btn_login', '.btn-login', 'button[type="submit"]', 'input[type="submit"]'];
        
        let loginButtonSuccess = false;
        for (const selector of loginButtonSelectors) {
          try {
            const element = await this.page.$(selector);
            if (element) {
              await this.page.click(selector);
              loginButtonSuccess = true;
              console.log(`✅ 로그인 버튼 클릭: ${selector}`);
              break;
            }
          } catch (error) {
            console.log(`❌ 로그인 버튼 실패: ${selector}`);
          }
        }
        
        if (!loginButtonSuccess) {
          // Enter 키로 시도
          console.log('🔄 Enter 키로 로그인 시도...');
          await this.page.keyboard.press('Enter');
        }
        
        // 로그인 결과 대기
        await this.page.waitForTimeout(5000);
        await this.screenshot('05-login-result.png');
        await this.logPageInfo('로그인 결과');
        
        return true;
      } else {
        console.log('❌ 이메일 또는 비밀번호 입력 실패');
        return false;
      }
      
    } catch (error) {
      console.error('❌ 로그인 정보 입력 실패:', error.message);
      await this.screenshot('error-login-input.png');
      return false;
    }
  }

  /**
   * 단계 5: 로그인 완료 확인
   */
  async step5_VerifyLogin() {
    console.log('\n✅ 5단계: 로그인 완료 확인 (헤드리스)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const currentUrl = this.page.url();
      const title = await this.page.title();
      
      console.log(`🔗 현재 URL: ${currentUrl}`);
      console.log(`📄 현재 제목: ${title}`);
      
      // 로그인 성공 확인
      if (currentUrl.includes('tistory.com') && !currentUrl.includes('login') && !currentUrl.includes('kauth.kakao.com')) {
        console.log('🎊 로그인 성공! 티스토리로 돌아옴');
        await this.screenshot('06-login-success.png');
        return true;
      } else if (currentUrl.includes('kauth.kakao.com')) {
        console.log('⚠️ 카카오 인증 페이지에 있습니다');
        
        // 추가 인증 확인
        const pageContent = await this.page.content();
        if (pageContent.includes('2단계') || pageContent.includes('인증')) {
          console.log('🔐 2단계 인증이 필요합니다');
          await this.screenshot('06-two-factor-auth.png');
          return false;
        } else {
          console.log('⏳ 로그인 처리 중...');
          await this.page.waitForTimeout(5000);
          return await this.step5_VerifyLogin(); // 재확인
        }
      } else {
        console.log('❌ 로그인이 완료되지 않았습니다');
        await this.screenshot('06-login-failed.png');
        return false;
      }
      
    } catch (error) {
      console.error('❌ 로그인 확인 실패:', error.message);
      return false;
    }
  }

  /**
   * 전체 자동 로그인 실행
   */
  async runFullLogin() {
    const results = {
      initialize: false,
      access: false,
      loginButton: false,
      kakaoLogin: false,
      inputCredentials: false,
      verify: false
    };
    
    try {
      // 1. 초기화
      results.initialize = await this.initialize();
      if (!results.initialize) return { success: false, results };
      
      // 2. 티스토리 접속
      results.access = await this.step1_AccessTistory();
      if (!results.access) return { success: false, results };
      
      // 3. 로그인 버튼 찾기
      results.loginButton = await this.step2_FindLoginButton();
      if (!results.loginButton) return { success: false, results };
      
      // 4. 카카오 로그인 선택
      results.kakaoLogin = await this.step3_SelectKakaoLogin();
      if (!results.kakaoLogin) return { success: false, results };
      
      // 5. 로그인 정보 입력
      results.inputCredentials = await this.step4_KakaoLoginInput();
      if (!results.inputCredentials) return { success: false, results };
      
      // 6. 로그인 완료 확인
      results.verify = await this.step5_VerifyLogin();
      
      // 결과 출력
      console.log('\n📊 헤드리스 자동 로그인 결과');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      Object.entries(results).forEach(([key, value]) => {
        console.log(`✅ ${key}: ${value ? '성공' : '실패'}`);
      });
      
      const successCount = Object.values(results).filter(r => r).length;
      console.log(`\n🎊 전체 성공률: ${successCount}/6 (${(successCount/6*100).toFixed(1)}%)`);
      
      return { success: results.verify, results };
      
    } catch (error) {
      console.error('\n❌ 자동 로그인 실패:', error.message);
      return { success: false, error: error.message, results };
    }
  }

  /**
   * 정리 및 종료
   */
  async cleanup() {
    console.log('\n🧹 브라우저 정리 중...');
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('✅ 브라우저 종료 완료');
      }
    } catch (error) {
      console.error('⚠️ 정리 중 오류:', error.message);
    }
  }
}

// 메인 실행
async function main() {
  const automation = new TistoryHeadlessAutomation();
  
  try {
    const result = await automation.runFullLogin();
    
    if (result.success) {
      console.log('\n🎊 헤드리스 자동 로그인 성공!');
      console.log('📸 스크린샷들을 확인하여 과정을 검토해보세요');
    } else {
      console.log('\n❌ 헤드리스 자동 로그인 실패');
      if (result.error) {
        console.log(`오류: ${result.error}`);
      }
    }
    
    await automation.cleanup();
    
  } catch (error) {
    console.error('\n❌ 실행 오류:', error.message);
    await automation.cleanup();
  }
  
  console.log('\n🏁 프로그램 종료');
}

// 실행
if (require.main === module) {
  main();
}

module.exports = TistoryHeadlessAutomation;