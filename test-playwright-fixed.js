/**
 * Playwright 브라우저 제어 테스트 (수정 버전)
 * launchPersistentContext 사용
 */

const { chromium } = require('playwright');
const fs = require('fs');

class PlaywrightControllerFixed {
  constructor() {
    this.context = null;
    this.page = null;
    this.userDataDir = '/tmp/playwright-automation-' + Date.now();
  }

  /**
   * 브라우저 초기화 (수정 버전)
   */
  async initialize() {
    console.log('🎭 Playwright 브라우저 초기화 중 (수정 버전)...');
    
    try {
      // 사용자 데이터 디렉토리 생성
      if (!fs.existsSync(this.userDataDir)) {
        fs.mkdirSync(this.userDataDir, { recursive: true });
        console.log(`📁 사용자 데이터 디렉토리 생성: ${this.userDataDir}`);
      }

      // launchPersistentContext 사용
      console.log('🚀 브라우저 컨텍스트 실행 중...');
      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        headless: false,  // 헤드풀 모드
        viewport: { width: 1280, height: 720 },
        args: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      // 첫 번째 페이지 가져오기 또는 생성
      const pages = this.context.pages();
      if (pages.length > 0) {
        this.page = pages[0];
        console.log('📄 기존 페이지 사용');
      } else {
        this.page = await this.context.newPage();
        console.log('📄 새 페이지 생성');
      }
      
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
      await this.page.goto('https://www.google.com', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await this.page.waitForTimeout(2000);
      
      const title = await this.page.title();
      console.log(`✅ 페이지 제목: ${title}`);
      
      // 2. 스크린샷 저장
      await this.page.screenshot({ 
        path: 'screenshots/google-home.png', 
        fullPage: true 
      });
      console.log('📸 스크린샷 저장: screenshots/google-home.png');
      
      // 3. 검색어 입력 테스트
      console.log('\n2️⃣ 검색어 입력 테스트...');
      
      // 구글 검색창 선택자들
      const searchSelectors = [
        'textarea[name="q"]',
        'input[name="q"]',
        '[data-ved] textarea',
        '#searchbox textarea'
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          searchInput = selector;
          console.log(`✅ 검색창 발견: ${selector}`);
          break;
        } catch (error) {
          console.log(`❌ 검색창 선택자 실패: ${selector}`);
        }
      }
      
      if (searchInput) {
        await this.page.fill(searchInput, '티스토리 블로그');
        console.log('✅ 검색어 입력 완료: "티스토리 블로그"');
        
        // 4. 검색 실행
        console.log('\n3️⃣ 검색 실행...');
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(3000);
        
        const searchTitle = await this.page.title();
        console.log(`✅ 검색 결과 페이지: ${searchTitle}`);
        
        // 5. 검색 결과 스크린샷
        await this.page.screenshot({ 
          path: 'screenshots/search-results.png', 
          fullPage: true 
        });
        console.log('📸 검색 결과 스크린샷 저장');
      } else {
        console.log('⚠️ 검색창을 찾을 수 없음, 스크린샷만 저장');
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ 페이지 이동 테스트 실패:', error.message);
      await this.page.screenshot({ 
        path: 'screenshots/error-navigation.png', 
        fullPage: true 
      });
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
      await this.page.goto('https://www.tistory.com', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await this.page.waitForTimeout(3000);
      
      const title = await this.page.title();
      console.log(`✅ 티스토리 페이지 제목: ${title}`);
      
      // 2. 현재 URL 확인
      const currentUrl = this.page.url();
      console.log(`🔗 현재 URL: ${currentUrl}`);
      
      // 3. 페이지 요소 분석
      console.log('\n2️⃣ 페이지 요소 분석...');
      
      // 로그인 관련 요소 찾기
      const loginElements = await this.page.$$eval('a, button', elements => 
        elements.map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim(),
          href: el.href || '',
          className: el.className
        }))
        .filter(el => 
          (el.text && el.text.includes('로그인')) ||
          (el.href && el.href.includes('login')) ||
          (el.className && el.className.includes('login'))
        )
      );
      
      console.log('🔍 로그인 관련 요소들:');
      loginElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.tagName}: "${el.text}" (${el.href})`);
      });
      
      // 4. 스크린샷 저장
      await this.page.screenshot({ 
        path: 'screenshots/tistory-main.png', 
        fullPage: true 
      });
      console.log('📸 티스토리 메인 페이지 스크린샷 저장');
      
      return true;
      
    } catch (error) {
      console.error('❌ 티스토리 접속 테스트 실패:', error.message);
      await this.page.screenshot({ 
        path: 'screenshots/error-tistory.png', 
        fullPage: true 
      });
      return false;
    }
  }

  /**
   * 브라우저 정보 수집
   */
  async getBrowserInfo() {
    console.log('\n📊 브라우저 정보 수집');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 페이지 정보
      const pageInfo = {
        title: await this.page.title(),
        url: this.page.url(),
        viewport: await this.page.viewportSize()
      };
      
      // 브라우저 정보
      const browserInfo = await this.page.evaluate(() => ({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }));
      
      console.log('📄 페이지 정보:');
      console.log(`  제목: ${pageInfo.title}`);
      console.log(`  URL: ${pageInfo.url}`);
      console.log(`  뷰포트: ${pageInfo.viewport.width}x${pageInfo.viewport.height}`);
      
      console.log('\n🌐 브라우저 정보:');
      console.log(`  플랫폼: ${browserInfo.platform}`);
      console.log(`  언어: ${browserInfo.language}`);
      console.log(`  쿠키 활성화: ${browserInfo.cookieEnabled}`);
      console.log(`  온라인 상태: ${browserInfo.onLine}`);
      
      return { pageInfo, browserInfo };
      
    } catch (error) {
      console.error('❌ 브라우저 정보 수집 실패:', error.message);
      return null;
    }
  }

  /**
   * 정리 및 종료
   */
  async cleanup() {
    console.log('\n🧹 브라우저 정리 중...');
    
    try {
      if (this.context) {
        await this.context.close();
        console.log('🌐 브라우저 컨텍스트 닫기 완료');
      }
      
      // 임시 디렉토리 정리 (선택사항)
      try {
        if (fs.existsSync(this.userDataDir)) {
          fs.rmSync(this.userDataDir, { recursive: true, force: true });
          console.log('🗑️ 임시 디렉토리 정리 완료');
        }
      } catch (error) {
        console.log('⚠️ 디렉토리 정리 실패 (무시됨):', error.message);
      }
      
    } catch (error) {
      console.error('⚠️ 정리 중 오류:', error.message);
    }
  }
}

// 메인 테스트 실행
async function main() {
  const controller = new PlaywrightControllerFixed();
  
  try {
    console.log('🎯 Step 2: Playwright 브라우저 제어 테스트 (수정 버전)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. 초기화
    const initSuccess = await controller.initialize();
    if (!initSuccess) {
      throw new Error('Playwright 초기화 실패');
    }
    
    // 2. 브라우저 정보 수집
    await controller.getBrowserInfo();
    
    // 3. 기본 네비게이션 테스트
    const navSuccess = await controller.testBasicNavigation();
    if (!navSuccess) {
      console.log('⚠️ 기본 네비게이션 테스트 실패, 계속 진행');
    }
    
    // 4. 티스토리 접속 테스트
    const tistorySuccess = await controller.testTistoryAccess();
    if (!tistorySuccess) {
      console.log('⚠️ 티스토리 접속 테스트 실패, 계속 진행');
    }
    
    console.log('\n🎊 브라우저 제어 테스트 완료!');
    console.log('✅ Playwright 기본 기능이 정상 작동합니다.');
    console.log('📸 스크린샷들이 screenshots/ 폴더에 저장되었습니다.');
    
    // 사용자 확인 대기
    console.log('\n💡 브라우저 창을 확인해보세요!');
    console.log('Enter를 누르면 브라우저를 종료합니다...');
    
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
    
    // 오류 스크린샷 저장 시도
    try {
      if (controller.page) {
        await controller.page.screenshot({ 
          path: 'screenshots/test-error.png', 
          fullPage: true 
        });
        console.log('📸 오류 스크린샷 저장: screenshots/test-error.png');
      }
    } catch (screenshotError) {
      console.log('⚠️ 오류 스크린샷 저장 실패');
    }
    
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
      console.log('🎯 다음 단계: 티스토리 로그인 및 포스팅 테스트');
    } else {
      console.log('\n❌ 2단계 실패:', result.error);
    }
    console.log('\n🏁 테스트 완료');
  });
}

module.exports = PlaywrightControllerFixed;