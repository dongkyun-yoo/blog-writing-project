const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * 플레이라이트 MCP 컨트롤러
 * MCP를 통한 브라우저 자동화 제어
 */
class PlaywrightMCPController {
  constructor(options = {}) {
    this.options = {
      headless: false,
      timeout: 30000,
      screenshotDir: './screenshots',
      ...options
    };
    
    this.browser = null;
    this.page = null;
    this.mcpProcess = null;
    this.isConnected = false;
  }

  /**
   * MCP 서버 연결 초기화
   */
  async initialize() {
    console.log('🎭 플레이라이트 MCP 초기화 중...');
    
    try {
      // 스크린샷 디렉토리 생성
      await this.ensureScreenshotDir();
      
      // MCP 연결 상태 확인
      await this.checkMCPConnection();
      
      console.log('✅ MCP 초기화 완료');
      return true;
    } catch (error) {
      console.error('❌ MCP 초기화 실패:', error.message);
      return false;
    }
  }

  /**
   * 스크린샷 디렉토리 확인/생성
   */
  async ensureScreenshotDir() {
    try {
      await fs.access(this.options.screenshotDir);
    } catch {
      await fs.mkdir(this.options.screenshotDir, { recursive: true });
      console.log(`📁 스크린샷 디렉토리 생성: ${this.options.screenshotDir}`);
    }
  }

  /**
   * MCP 연결 상태 확인
   */
  async checkMCPConnection() {
    // MCP 서버가 실행 중인지 확인하는 로직
    // 실제 구현에서는 MCP 클라이언트 라이브러리 사용
    console.log('🔍 MCP 서버 연결 확인 중...');
    
    // 임시로 성공으로 처리 (실제 MCP 연결 로직 필요)
    this.isConnected = true;
    return true;
  }

  /**
   * 브라우저 인스턴스 생성
   */
  async createBrowser(options = {}) {
    if (!this.isConnected) {
      throw new Error('MCP가 연결되지 않음. initialize()를 먼저 호출하세요.');
    }

    console.log('🌐 브라우저 인스턴스 생성 중...');
    
    // MCP를 통한 브라우저 생성 명령
    const browserOptions = {
      headless: this.options.headless,
      timeout: this.options.timeout,
      ...options
    };

    console.log('브라우저 옵션:', browserOptions);
    
    // 실제 MCP 명령어 실행 시뮬레이션
    this.browser = { id: 'browser-' + Date.now() };
    console.log('✅ 브라우저 생성 완료:', this.browser.id);
    
    return this.browser;
  }

  /**
   * 새 페이지 생성
   */
  async createPage() {
    if (!this.browser) {
      throw new Error('브라우저가 생성되지 않음. createBrowser()를 먼저 호출하세요.');
    }

    console.log('📄 새 페이지 생성 중...');
    
    // MCP를 통한 페이지 생성
    this.page = { 
      id: 'page-' + Date.now(),
      url: 'about:blank'
    };
    
    console.log('✅ 페이지 생성 완료:', this.page.id);
    return this.page;
  }

  /**
   * URL 접속
   */
  async goto(url) {
    if (!this.page) {
      await this.createPage();
    }

    console.log(`🔗 페이지 이동: ${url}`);
    
    // MCP 명령: 페이지 이동
    const command = {
      type: 'page.goto',
      params: {
        url: url,
        waitUntil: 'networkidle'
      }
    };

    await this.executeMCPCommand(command);
    this.page.url = url;
    
    console.log('✅ 페이지 이동 완료');
    return true;
  }

  /**
   * 요소 클릭
   */
  async click(selector, options = {}) {
    console.log(`👆 클릭: ${selector}`);
    
    const command = {
      type: 'page.click',
      params: {
        selector: selector,
        timeout: this.options.timeout,
        ...options
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * 텍스트 입력
   */
  async type(selector, text, options = {}) {
    console.log(`⌨️ 텍스트 입력: ${selector} = "${text.substring(0, 50)}..."`);
    
    const command = {
      type: 'page.type',
      params: {
        selector: selector,
        text: text,
        delay: 100,
        ...options
      }
    };

    return await this.executeMCPCommand(command);
  }

  /**
   * 대기
   */
  async waitFor(selectorOrTime) {
    if (typeof selectorOrTime === 'number') {
      console.log(`⏳ ${selectorOrTime}ms 대기`);
      return new Promise(resolve => setTimeout(resolve, selectorOrTime));
    } else {
      console.log(`🎯 요소 대기: ${selectorOrTime}`);
      
      const command = {
        type: 'page.waitForSelector',
        params: {
          selector: selectorOrTime,
          timeout: this.options.timeout
        }
      };

      return await this.executeMCPCommand(command);
    }
  }

  /**
   * 스크린샷 캡처
   */
  async screenshot(filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullPath = path.join(this.options.screenshotDir, filename || `screenshot-${timestamp}.png`);
    
    console.log(`📸 스크린샷 저장: ${fullPath}`);
    
    const command = {
      type: 'page.screenshot',
      params: {
        path: fullPath,
        fullPage: true
      }
    };

    await this.executeMCPCommand(command);
    return fullPath;
  }

  /**
   * 페이지 제목 가져오기
   */
  async getTitle() {
    const command = {
      type: 'page.title',
      params: {}
    };

    const result = await this.executeMCPCommand(command);
    return result?.title || '';
  }

  /**
   * 현재 URL 가져오기
   */
  async getCurrentUrl() {
    const command = {
      type: 'page.url',
      params: {}
    };

    const result = await this.executeMCPCommand(command);
    return result?.url || this.page?.url || '';
  }

  /**
   * MCP 명령 실행
   */
  async executeMCPCommand(command) {
    console.log(`🎭 MCP 명령 실행: ${command.type}`);
    
    // 실제 MCP 클라이언트를 통한 명령 실행
    // 현재는 시뮬레이션
    try {
      // 명령 타입별 시뮬레이션 응답
      const simulatedResponse = await this.simulateCommand(command);
      
      console.log('✅ MCP 명령 성공');
      return simulatedResponse;
    } catch (error) {
      console.error('❌ MCP 명령 실패:', error.message);
      throw error;
    }
  }

  /**
   * 명령 시뮬레이션 (개발용)
   */
  async simulateCommand(command) {
    // 실제 개발에서는 제거하고 실제 MCP 통신으로 대체
    await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션 지연
    
    switch (command.type) {
      case 'page.goto':
        return { success: true, url: command.params.url };
      case 'page.click':
        return { success: true };
      case 'page.type':
        return { success: true };
      case 'page.waitForSelector':
        return { success: true, found: true };
      case 'page.screenshot':
        return { success: true, path: command.params.path };
      case 'page.title':
        return { success: true, title: 'Sample Page Title' };
      case 'page.url':
        return { success: true, url: this.page?.url || 'about:blank' };
      default:
        return { success: true };
    }
  }

  /**
   * 사용자 개입 요청
   */
  async requestUserIntervention(message, options = {}) {
    console.log('\n🔔 사용자 개입 필요');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 ${message}`);
    
    if (options.screenshot) {
      const screenshotPath = await this.screenshot('user-intervention.png');
      console.log(`📸 현재 화면: ${screenshotPath}`);
    }
    
    console.log('\n다음 중 하나를 선택하세요:');
    console.log('1. 수동으로 처리 후 계속 (Enter)');
    console.log('2. 자동화 중단 (q)');
    console.log('3. 스크린샷 다시 보기 (s)');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('\n선택: ', (answer) => {
        readline.close();
        
        switch (answer.toLowerCase()) {
          case 'q':
            resolve({ action: 'abort' });
            break;
          case 's':
            this.screenshot('manual-check.png').then(() => {
              resolve({ action: 'continue' });
            });
            break;
          default:
            resolve({ action: 'continue' });
        }
      });
    });
  }

  /**
   * 정리 및 종료
   */
  async cleanup() {
    console.log('🧹 정리 작업 수행 중...');
    
    try {
      if (this.page) {
        console.log('📄 페이지 닫기');
        // MCP 명령: 페이지 닫기
        await this.executeMCPCommand({ type: 'page.close', params: {} });
      }
      
      if (this.browser) {
        console.log('🌐 브라우저 닫기');
        // MCP 명령: 브라우저 닫기
        await this.executeMCPCommand({ type: 'browser.close', params: {} });
      }
      
      console.log('✅ 정리 완료');
    } catch (error) {
      console.error('⚠️ 정리 중 오류:', error.message);
    }
  }
}

module.exports = PlaywrightMCPController;