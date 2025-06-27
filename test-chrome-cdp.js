/**
 * Chrome CDP 테스트 실행기
 * Windows 크롬 + CDP 제어 테스트
 */

const ChromeCDPController = require('./chrome-cdp-controller');

class ChromeCDPTester {
  constructor() {
    this.controller = new ChromeCDPController();
  }

  /**
   * 기본 연결 테스트
   */
  async testBasicConnection() {
    console.log('\n🔗 기본 CDP 연결 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 크롬 브라우저 실행
      const launchSuccess = await this.controller.launchChrome();
      if (!launchSuccess) {
        throw new Error('크롬 실행 실패');
      }

      // 2. CDP 연결
      const connectSuccess = await this.controller.connectCDP();
      if (!connectSuccess) {
        throw new Error('CDP 연결 실패');
      }

      // 3. CDP 초기화
      const initSuccess = await this.controller.initialize();
      if (!initSuccess) {
        throw new Error('CDP 초기화 실패');
      }

      console.log('✅ 기본 연결 테스트 성공');
      return true;

    } catch (error) {
      console.error('❌ 기본 연결 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 페이지 네비게이션 테스트
   */
  async testNavigation() {
    console.log('\n🔗 페이지 네비게이션 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 구글 홈페이지 이동
      console.log('1️⃣ 구글 홈페이지 접속...');
      await this.controller.navigateToUrl('https://www.google.com');
      
      // 2. 스크린샷 캡처
      await this.controller.takeScreenshot('google-home-cdp.png');
      
      // 3. 티스토리 접속
      console.log('\n2️⃣ 티스토리 접속...');
      await this.controller.navigateToUrl('https://www.tistory.com');
      
      // 4. 스크린샷 캡처
      await this.controller.takeScreenshot('tistory-main-cdp.png');
      
      console.log('✅ 네비게이션 테스트 성공');
      return true;

    } catch (error) {
      console.error('❌ 네비게이션 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 요소 상호작용 테스트
   */
  async testInteraction() {
    console.log('\n🖱️ 요소 상호작용 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 구글 홈페이지로 이동
      await this.controller.navigateToUrl('https://www.google.com');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. 검색창 클릭 및 텍스트 입력 시도
      console.log('1️⃣ 검색창 상호작용 테스트...');
      
      const searchSelectors = [
        'textarea[name="q"]',
        'input[name="q"]',
        '[role="combobox"]',
        'textarea[role="combobox"]'
      ];
      
      let interactionSuccess = false;
      for (const selector of searchSelectors) {
        try {
          console.log(`🎯 시도: ${selector}`);
          await this.controller.typeText(selector, '티스토리 블로그 자동화');
          interactionSuccess = true;
          console.log(`✅ 성공: ${selector}`);
          break;
        } catch (error) {
          console.log(`❌ 실패: ${selector} - ${error.message}`);
        }
      }
      
      if (interactionSuccess) {
        // 3. 스크린샷 캡처
        await this.controller.takeScreenshot('google-search-input.png');
        console.log('✅ 상호작용 테스트 성공');
      } else {
        console.log('⚠️ 상호작용 테스트 부분 실패 - 스크린샷만 저장');
        await this.controller.takeScreenshot('interaction-failed.png');
      }
      
      return interactionSuccess;

    } catch (error) {
      console.error('❌ 상호작용 테스트 실패:', error.message);
      await this.controller.takeScreenshot('interaction-error.png');
      return false;
    }
  }

  /**
   * 티스토리 접속 상세 테스트
   */
  async testTistoryAccess() {
    console.log('\n🏠 티스토리 접속 상세 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 티스토리 메인 페이지 접속
      console.log('1️⃣ 티스토리 메인 페이지 접속...');
      await this.controller.navigateToUrl('https://www.tistory.com');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. 현재 페이지 스크린샷
      await this.controller.takeScreenshot('tistory-main-detail.png');
      
      // 3. 로그인 버튼 찾기 시도
      console.log('\n2️⃣ 로그인 버튼 검색...');
      const loginSelectors = [
        'a[href*="login"]',
        '.btn-login',
        '[data-tiara-layer*="login"]',
        'button:contains("로그인")',
        'a:contains("로그인")'
      ];
      
      let loginFound = false;
      for (const selector of loginSelectors) {
        try {
          await this.controller.clickElement(selector);
          console.log(`✅ 로그인 버튼 발견 및 클릭: ${selector}`);
          loginFound = true;
          
          // 로그인 페이지로 이동 대기
          await new Promise(resolve => setTimeout(resolve, 3000));
          await this.controller.takeScreenshot('login-page.png');
          break;
        } catch (error) {
          console.log(`❌ 로그인 버튼 시도 실패: ${selector}`);
        }
      }
      
      if (!loginFound) {
        console.log('⚠️ 로그인 버튼을 찾을 수 없음');
      }
      
      console.log('✅ 티스토리 접속 테스트 완료');
      return true;

    } catch (error) {
      console.error('❌ 티스토리 접속 테스트 실패:', error.message);
      await this.controller.takeScreenshot('tistory-error.png');
      return false;
    }
  }

  /**
   * 전체 테스트 실행
   */
  async runFullTest() {
    console.log('🎯 Chrome CDP 제어 테스트 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const results = {
      connection: false,
      navigation: false,
      interaction: false,
      tistory: false
    };
    
    try {
      // 1. 기본 연결 테스트
      results.connection = await this.testBasicConnection();
      if (!results.connection) {
        throw new Error('기본 연결 실패로 테스트 중단');
      }

      // 2. 네비게이션 테스트
      results.navigation = await this.testNavigation();

      // 3. 상호작용 테스트
      results.interaction = await this.testInteraction();

      // 4. 티스토리 접속 테스트
      results.tistory = await this.testTistoryAccess();

      // 결과 출력
      console.log('\n📊 테스트 결과 요약');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ 기본 연결: ${results.connection ? '성공' : '실패'}`);
      console.log(`✅ 페이지 이동: ${results.navigation ? '성공' : '실패'}`);
      console.log(`✅ 요소 상호작용: ${results.interaction ? '성공' : '실패'}`);
      console.log(`✅ 티스토리 접속: ${results.tistory ? '성공' : '실패'}`);
      
      const successCount = Object.values(results).filter(r => r).length;
      console.log(`\n🎊 전체 성공률: ${successCount}/4 (${(successCount/4*100).toFixed(1)}%)`);
      
      if (successCount >= 3) {
        console.log('🚀 CDP 제어가 정상 작동합니다! 다음 단계로 진행 가능합니다.');
      } else {
        console.log('⚠️ 일부 기능에 문제가 있습니다. 문제를 해결해야 합니다.');
      }

      // 사용자 확인 대기
      console.log('\n💡 브라우저 창을 확인하고 스크린샷들을 확인해보세요!');
      console.log('📸 스크린샷 위치: screenshots/ 폴더');
      console.log('\nEnter를 누르면 브라우저를 종료합니다...');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise(resolve => {
        readline.question('', () => {
          readline.close();
          resolve();
        });
      });
      
      return { success: successCount >= 3, results };

    } catch (error) {
      console.error('\n❌ 전체 테스트 실패:', error.message);
      return { success: false, error: error.message, results };
    } finally {
      await this.controller.cleanup();
    }
  }
}

// 메인 실행
async function main() {
  const tester = new ChromeCDPTester();
  
  try {
    const result = await tester.runFullTest();
    
    if (result.success) {
      console.log('\n✅ Chrome CDP 테스트 성공!');
      console.log('🎯 다음 단계: 티스토리 자동 로그인 구현');
    } else {
      console.log('\n❌ Chrome CDP 테스트 실패');
      if (result.error) {
        console.log(`오류: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ 실행 오류:', error.message);
  }
  
  console.log('\n🏁 테스트 완료');
}

// 실행
if (require.main === module) {
  main();
}

module.exports = ChromeCDPTester;