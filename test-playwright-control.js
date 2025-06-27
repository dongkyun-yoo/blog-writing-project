/**
 * Playwright를 사용한 브라우저 제어 테스트
 * 단계 2: 실제 페이지 이동 및 기본 제어
 */

const { chromium } = require('playwright');
const fs = require('fs');

class PlaywrightController {
  constructor() {
    this.browser = null;
    this.page = null;
    this.userDataDir = '/tmp/playwright-automation-' + Date.now();
  }

  /**
   * 브라우저 초기화
   */
  async initialize() {
    console.log('🎭 Playwright 브라우저 초기화 중...');
    
    try {
      // 사용자 데이터 디렉토리 생성
      if (!fs.existsSync(this.userDataDir)) {
        fs.mkdirSync(this.userDataDir, { recursive: true });
      }

      // 브라우저 실행 옵션
      const browserOptions = {
        headless: false,  // 헤드풀 모드
        userDataDir: this.userDataDir,
        args: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling'
        ]
      };

      console.log('🚀 브라우저 실행 중...');
      this.browser = await chromium.launch(browserOptions);
      
      console.log('📄 새 페이지 생성 중...');
      this.page = await this.browser.newPage();
      
      // 페이지 설정
      await this.page.setViewportSize({ width: 1280, height: 720 });
      
      console.log('✅ Playwright 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('❌ Playwright 초기화 실패:', error.message);
      return false;
    }
  }

  /**
   * 기본 페이지 이동 테스트
   */
  async testBasicNavigation() {
    console.log('\n🔗 기본 페이지 이동 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 구글 홈페이지 접속
      console.log('1️⃣ 구글 홈페이지 접속 중...');
      await this.page.goto('https://www.google.com', { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(2000);
      
      const title = await this.page.title();
      console.log(`✅ 페이지 제목: ${title}`);
      
      // 2. 스크린샷 저장
      await this.page.screenshot({ path: 'screenshots/google-home.png', fullPage: true });
      console.log('📸 스크린샷 저장: screenshots/google-home.png');
      
      // 3. 검색어 입력 테스트
      console.log('\n2️⃣ 검색어 입력 테스트...');
      const searchInput = 'textarea[name="q"]';
      await this.page.waitForSelector(searchInput);
      await this.page.fill(searchInput, '티스토리 블로그');
      console.log('✅ 검색어 입력 완료: "티스토리 블로그"');
      
      // 4. 검색 실행
      console.log('\n3️⃣ 검색 실행...');
      await this.page.keyboard.press('Enter');
      await this.page.waitForURL('**/search?*');
      await this.page.waitForTimeout(3000);
      
      const searchTitle = await this.page.title();
      console.log(`✅ 검색 결과 페이지: ${searchTitle}`);
      
      // 5. 검색 결과 스크린샷
      await this.page.screenshot({ path: 'screenshots/search-results.png', fullPage: true });
      console.log('📸 검색 결과 스크린샷 저장');
      
      return true;
      
    } catch (error) {
      console.error('❌ 페이지 이동 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 티스토리 접속 테스트
   */
  async testTistoryAccess() {
    console.log('\n🏠 티스토리 접속 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 티스토리 메인 페이지 접속
      console.log('1️⃣ 티스토리 메인 페이지 접속...');
      await this.page.goto('https://www.tistory.com', { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(3000);
      
      const title = await this.page.title();
      console.log(`✅ 티스토리 페이지 제목: ${title}`);
      
      // 2. 로그인 버튼 찾기
      console.log('\n2️⃣ 로그인 버튼 확인...');
      const loginSelectors = [
        'a[href*="login"]',
        '.btn-login',
        'text=로그인',
        '[data-tiara-layer="pc_main_login"]'
      ];
      
      let loginButton = null;
      for (const selector of loginSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          loginButton = selector;
          console.log(`✅ 로그인 버튼 발견: ${selector}`);
          break;
        } catch (error) {
          console.log(`❌ 선택자 실패: ${selector}`);
        }
      }
      
      if (!loginButton) {
        console.log('⚠️ 로그인 버튼을 찾을 수 없습니다. 페이지 구조 확인 필요');
      }
      
      // 3. 페이지 구조 분석
      console.log('\n3️⃣ 페이지 구조 분석...');
      const allLinks = await this.page.$$eval('a', links => 
        links.map(link => ({
          text: link.textContent?.trim(),
          href: link.href
        })).filter(link => link.text && link.text.length > 0)
      );
      
      console.log('🔍 페이지의 주요 링크들:');
      allLinks.slice(0, 10).forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.text} (${link.href})`);
      });
      
      // 4. 스크린샷 저장
      await this.page.screenshot({ path: 'screenshots/tistory-main.png', fullPage: true });
      console.log('📸 티스토리 메인 페이지 스크린샷 저장');
      
      return true;
      
    } catch (error) {
      console.error('❌ 티스토리 접속 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 브라우저 상호작용 테스트
   */
  async testInteraction() {
    console.log('\n🖱️ 브라우저 상호작용 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 새 탭 열기
      console.log('1️⃣ 새 탭 열기...');
      const newPage = await this.browser.newPage();
      await newPage.goto('https://playwright.dev');
      await newPage.waitForTimeout(2000);
      
      const playwrightTitle = await newPage.title();
      console.log(`✅ 새 탭 제목: ${playwrightTitle}`);
      
      // 2. 탭 간 전환
      console.log('\n2️⃣ 탭 간 전환 테스트...');
      const pages = this.browser.contexts()[0].pages();
      console.log(`📄 현재 열린 탭 수: ${pages.length}개`);
      
      // 3. 스크롤 테스트
      console.log('\n3️⃣ 스크롤 테스트...');
      await newPage.evaluate(() => window.scrollTo(0, 500));
      await newPage.waitForTimeout(1000);
      await newPage.evaluate(() => window.scrollTo(0, 0));
      console.log('✅ 스크롤 테스트 완료');
      
      // 4. 새 탭 닫기
      await newPage.close();
      console.log('✅ 새 탭 닫기 완료');
      
      return true;
      
    } catch (error) {
      console.error('❌ 상호작용 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * 정리 및 종료
   */
  async cleanup() {
    console.log('\n🧹 브라우저 정리 중...');
    
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
        console.log('📄 페이지 닫기 완료');
      }
      
      if (this.browser) {
        await this.browser.close();
        console.log('🌐 브라우저 닫기 완료');
      }
      
      // 임시 디렉토리 정리
      if (fs.existsSync(this.userDataDir)) {
        fs.rmSync(this.userDataDir, { recursive: true, force: true });
        console.log('🗑️ 임시 디렉토리 정리 완료');
      }
      
    } catch (error) {
      console.error('⚠️ 정리 중 오류:', error.message);
    }
  }
}

// 메인 테스트 실행
async function main() {
  const controller = new PlaywrightController();
  
  try {
    console.log('🎯 Step 2: Playwright 브라우저 제어 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. 초기화
    const initSuccess = await controller.initialize();
    if (!initSuccess) {
      throw new Error('Playwright 초기화 실패');
    }
    
    // 2. 기본 네비게이션 테스트
    const navSuccess = await controller.testBasicNavigation();
    if (!navSuccess) {
      throw new Error('기본 네비게이션 테스트 실패');
    }
    
    // 3. 티스토리 접속 테스트
    const tistorySuccess = await controller.testTistoryAccess();
    if (!tistorySuccess) {
      throw new Error('티스토리 접속 테스트 실패');
    }
    
    // 4. 상호작용 테스트
    const interactionSuccess = await controller.testInteraction();
    if (!interactionSuccess) {
      throw new Error('상호작용 테스트 실패');
    }
    
    console.log('\n🎊 모든 테스트 성공!');
    console.log('✅ Playwright를 통한 브라우저 제어가 정상 작동합니다.');
    console.log('📸 스크린샷이 screenshots/ 폴더에 저장되었습니다.');
    
    // 사용자 확인 대기
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
    
    return { success: true };
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    return { success: false, error: error.message };
  } finally {
    await controller.cleanup();
  }
}

// 실행
if (require.main === module) {
  main().then((result) => {
    if (result.success) {
      console.log('\n✅ 2단계 성공: Playwright 브라우저 제어 완료');
      console.log('🎯 다음 단계: 티스토리 자동 로그인 테스트');
    } else {
      console.log('\n❌ 2단계 실패:', result.error);
    }
    console.log('\n🏁 테스트 완료');
  });
}

module.exports = PlaywrightController;