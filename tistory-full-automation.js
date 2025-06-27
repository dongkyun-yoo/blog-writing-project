/**
 * 완전 자동화 티스토리 로그인 및 포스팅
 * Puppeteer 기반 WSL 최적화 버전
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class TistoryFullAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.credentials = {
      email: 'beastrongman@daum.net',
      password: 'King8160!'
    };
  }

  /**
   * 브라우저 초기화 및 실행
   */
  async initialize() {
    console.log('🎯 완전 자동화 티스토리 시스템 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      console.log('🚀 Puppeteer 브라우저 실행 중...');
      
      // 스크린샷 디렉토리 생성
      if (!fs.existsSync('./screenshots')) {
        fs.mkdirSync('./screenshots', { recursive: true });
      }

      this.browser = await puppeteer.launch({
        headless: false,  // 브라우저 창 보이게
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--disable-web-security',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // 사용자 에이전트 설정
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('✅ 브라우저 초기화 완료');
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
   * 단계 1: 티스토리 접속
   */
  async step1_AccessTistory() {
    console.log('\n🔗 1단계: 티스토리 접속');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      console.log('🌐 티스토리 메인 페이지 접속 중...');
      await this.page.goto('https://www.tistory.com', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.page.waitForTimeout(2000);
      await this.screenshot('01-tistory-main.png');
      
      const title = await this.page.title();
      console.log(`✅ 페이지 접속 완료: ${title}`);
      
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
    console.log('\n🔍 2단계: 로그인 버튼 찾기');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 여러 로그인 버튼 선택자 시도
      const loginSelectors = [
        'a[href*="login"]',
        '.btn-login',
        'button:contains("로그인")',
        'a:contains("로그인")',
        '[data-tiara-layer*="login"]',
        '.login-btn',
        '#login-btn'
      ];
      
      let loginFound = false;
      
      for (const selector of loginSelectors) {
        try {
          console.log(`🎯 로그인 버튼 검색 중: ${selector}`);
          
          // 선택자로 찾기
          const element = await this.page.$(selector);
          if (element) {
            console.log(`✅ 로그인 버튼 발견: ${selector}`);
            await element.click();
            loginFound = true;
            break;
          }
        } catch (error) {
          console.log(`❌ 선택자 실패: ${selector}`);
        }
      }
      
      // 텍스트로 찾기
      if (!loginFound) {
        console.log('🔍 텍스트 기반으로 로그인 버튼 찾기...');
        try {
          await this.page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a, button'));
            const loginLink = links.find(link => 
              link.textContent.includes('로그인') || 
              link.textContent.includes('Login') ||
              link.href && link.href.includes('login')
            );
            if (loginLink) {
              loginLink.click();
              return true;
            }
            return false;
          });
          loginFound = true;
          console.log('✅ 텍스트 기반 로그인 버튼 클릭');
        } catch (error) {
          console.log('❌ 텍스트 기반 검색 실패');
        }
      }
      
      if (loginFound) {
        await this.page.waitForTimeout(3000);
        await this.screenshot('02-login-page.png');
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
    console.log('\n🟡 3단계: 카카오 로그인 선택');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 카카오 로그인 버튼 찾기
      const kakaoSelectors = [
        'a[href*="kakao"]',
        'button[data-provider="kakao"]',
        '.kakao-login',
        'img[alt*="카카오"]',
        'a:contains("카카오")',
        '[data-social="kakao"]'
      ];
      
      let kakaoFound = false;
      
      for (const selector of kakaoSelectors) {
        try {
          console.log(`🎯 카카오 로그인 검색 중: ${selector}`);
          
          const element = await this.page.$(selector);
          if (element) {
            console.log(`✅ 카카오 로그인 발견: ${selector}`);
            await element.click();
            kakaoFound = true;
            break;
          }
        } catch (error) {
          console.log(`❌ 선택자 실패: ${selector}`);
        }
      }
      
      // 이미지나 텍스트로 찾기
      if (!kakaoFound) {
        console.log('🔍 카카오 관련 이미지/텍스트 찾기...');
        try {
          await this.page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('a, button, img'));
            const kakaoElement = elements.find(el => 
              (el.src && el.src.includes('kakao')) ||
              (el.href && el.href.includes('kakao')) ||
              el.textContent.includes('카카오') ||
              el.alt && el.alt.includes('카카오')
            );
            if (kakaoElement) {
              if (kakaoElement.tagName === 'IMG' && kakaoElement.closest('a')) {
                kakaoElement.closest('a').click();
              } else {
                kakaoElement.click();
              }
              return true;
            }
            return false;
          });
          kakaoFound = true;
          console.log('✅ 카카오 요소 클릭 완료');
        } catch (error) {
          console.log('❌ 카카오 요소 찾기 실패');
        }
      }
      
      if (kakaoFound) {
        await this.page.waitForTimeout(3000);
        await this.screenshot('03-kakao-login.png');
        console.log('✅ 카카오 로그인 페이지로 이동');
        return true;
      } else {
        console.log('❌ 카카오 로그인 버튼을 찾을 수 없습니다');
        await this.screenshot('error-no-kakao.png');
        return false;
      }
      
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
    console.log('\n🔐 4단계: 카카오 로그인 정보 입력');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 페이지 로딩 대기
      await this.page.waitForTimeout(3000);
      
      // 이메일 입력
      console.log('📧 이메일 입력 중...');
      const emailSelectors = ['#loginId', '#email', 'input[name="email"]', 'input[type="email"]'];
      
      let emailSuccess = false;
      for (const selector of emailSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          await this.page.click(selector);
          await this.page.type(selector, this.credentials.email, { delay: 100 });
          emailSuccess = true;
          console.log(`✅ 이메일 입력 완료: ${selector}`);
          break;
        } catch (error) {
          console.log(`❌ 이메일 선택자 실패: ${selector}`);
        }
      }
      
      if (!emailSuccess) {
        throw new Error('이메일 입력 필드를 찾을 수 없습니다');
      }
      
      // 비밀번호 입력
      console.log('🔒 비밀번호 입력 중...');
      const passwordSelectors = ['#password', 'input[name="password"]', 'input[type="password"]'];
      
      let passwordSuccess = false;
      for (const selector of passwordSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          await this.page.click(selector);
          await this.page.type(selector, this.credentials.password, { delay: 100 });
          passwordSuccess = true;
          console.log(`✅ 비밀번호 입력 완료: ${selector}`);
          break;
        } catch (error) {
          console.log(`❌ 비밀번호 선택자 실패: ${selector}`);
        }
      }
      
      if (!passwordSuccess) {
        throw new Error('비밀번호 입력 필드를 찾을 수 없습니다');
      }
      
      await this.screenshot('04-login-filled.png');
      
      // 로그인 버튼 클릭
      console.log('🚀 로그인 실행 중...');
      const loginButtonSelectors = ['.btn_login', '.btn-login', 'button[type="submit"]', 'input[type="submit"]'];
      
      let loginButtonSuccess = false;
      for (const selector of loginButtonSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          await this.page.click(selector);
          loginButtonSuccess = true;
          console.log(`✅ 로그인 버튼 클릭: ${selector}`);
          break;
        } catch (error) {
          console.log(`❌ 로그인 버튼 실패: ${selector}`);
        }
      }
      
      if (!loginButtonSuccess) {
        // Enter 키로 시도
        console.log('🔄 Enter 키로 로그인 시도...');
        await this.page.keyboard.press('Enter');
      }
      
      // 로그인 완료 대기
      await this.page.waitForTimeout(5000);
      await this.screenshot('05-login-result.png');
      
      return true;
      
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
    console.log('\n✅ 5단계: 로그인 완료 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const currentUrl = this.page.url();
      console.log(`🔗 현재 URL: ${currentUrl}`);
      
      // 로그인 성공 확인
      if (currentUrl.includes('tistory.com') && !currentUrl.includes('login')) {
        console.log('🎊 로그인 성공! 티스토리 메인으로 돌아옴');
        await this.screenshot('06-login-success.png');
        return true;
      } else if (currentUrl.includes('kauth.kakao.com')) {
        console.log('⚠️ 추가 인증이 필요할 수 있습니다 (2단계 인증 등)');
        await this.screenshot('06-additional-auth.png');
        return false;
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
    console.log('🎯 티스토리 완전 자동 로그인 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
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
      if (!results.initialize) {
        throw new Error('브라우저 초기화 실패');
      }
      
      // 2. 티스토리 접속
      results.access = await this.step1_AccessTistory();
      if (!results.access) {
        throw new Error('티스토리 접속 실패');
      }
      
      // 3. 로그인 버튼 찾기
      results.loginButton = await this.step2_FindLoginButton();
      if (!results.loginButton) {
        throw new Error('로그인 버튼 찾기 실패');
      }
      
      // 4. 카카오 로그인 선택
      results.kakaoLogin = await this.step3_SelectKakaoLogin();
      if (!results.kakaoLogin) {
        throw new Error('카카오 로그인 선택 실패');
      }
      
      // 5. 로그인 정보 입력
      results.inputCredentials = await this.step4_KakaoLoginInput();
      if (!results.inputCredentials) {
        throw new Error('로그인 정보 입력 실패');
      }
      
      // 6. 로그인 완료 확인
      results.verify = await this.step5_VerifyLogin();
      
      // 결과 출력
      console.log('\n📊 자동 로그인 결과');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ 브라우저 초기화: ${results.initialize ? '성공' : '실패'}`);
      console.log(`✅ 티스토리 접속: ${results.access ? '성공' : '실패'}`);
      console.log(`✅ 로그인 버튼: ${results.loginButton ? '성공' : '실패'}`);
      console.log(`✅ 카카오 로그인: ${results.kakaoLogin ? '성공' : '실패'}`);
      console.log(`✅ 정보 입력: ${results.inputCredentials ? '성공' : '실패'}`);
      console.log(`✅ 로그인 완료: ${results.verify ? '성공' : '실패'}`);
      
      const successCount = Object.values(results).filter(r => r).length;
      console.log(`\n🎊 전체 성공률: ${successCount}/6 (${(successCount/6*100).toFixed(1)}%)`);
      
      if (results.verify) {
        console.log('\n🎉 완전 자동 로그인 성공!');
        console.log('✅ 이제 티스토리에서 포스팅을 진행할 수 있습니다');
      } else {
        console.log('\n⚠️ 로그인이 완전히 완료되지 않았습니다');
        console.log('💡 추가 인증이나 수동 개입이 필요할 수 있습니다');
      }
      
      return { success: results.verify, results };
      
    } catch (error) {
      console.error('\n❌ 자동 로그인 실패:', error.message);
      await this.screenshot('error-final.png');
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
  const automation = new TistoryFullAutomation();
  
  try {
    const result = await automation.runFullLogin();
    
    if (result.success) {
      console.log('\n🎊 자동화 성공!');
      console.log('📸 스크린샷들을 확인하여 과정을 검토해보세요');
      
      // 브라우저 유지 여부 확인
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const keepBrowser = await new Promise(resolve => {
        readline.question('\n브라우저를 열어둘까요? (y/n): ', (answer) => {
          readline.close();
          resolve(answer.toLowerCase() === 'y');
        });
      });
      
      if (!keepBrowser) {
        await automation.cleanup();
      } else {
        console.log('🌐 브라우저를 열어두었습니다. 수동으로 닫으세요.');
      }
      
    } else {
      console.log('\n❌ 자동화 실패');
      if (result.error) {
        console.log(`오류: ${result.error}`);
      }
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise(resolve => {
        readline.question('\nEnter를 누르면 브라우저를 종료합니다...', () => {
          readline.close();
          resolve();
        });
      });
      
      await automation.cleanup();
    }
    
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

module.exports = TistoryFullAutomation;