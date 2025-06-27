/**
 * Chrome CDP (Chrome DevTools Protocol) 컨트롤러
 * Windows 크롬 브라우저 원격 제어
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

class ChromeCDPController {
  constructor(options = {}) {
    this.options = {
      chromePath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
      debugPort: 9222,
      userDataDir: '/tmp/chrome-cdp-' + Date.now(),
      headless: false,
      ...options
    };
    
    this.browserProcess = null;
    this.websocket = null;
    this.isConnected = false;
    this.messageId = 1;
    this.pendingMessages = new Map();
  }

  /**
   * 크롬 브라우저 실행 (CDP 활성화)
   */
  async launchChrome() {
    console.log('🚀 Windows 크롬 브라우저 실행 중 (CDP 모드)...');
    
    // 사용자 데이터 디렉토리 생성
    if (!fs.existsSync(this.options.userDataDir)) {
      fs.mkdirSync(this.options.userDataDir, { recursive: true });
      console.log(`📁 사용자 데이터 디렉토리: ${this.options.userDataDir}`);
    }

    const chromeArgs = [
      '--new-window',
      `--remote-debugging-port=${this.options.debugPort}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${this.options.userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--enable-automation',
      'about:blank'
    ];

    try {
      this.browserProcess = spawn(this.options.chromePath, chromeArgs, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.browserProcess.on('spawn', () => {
        console.log(`✅ 크롬 프로세스 시작됨 (PID: ${this.browserProcess.pid})`);
      });

      this.browserProcess.on('error', (error) => {
        console.error('❌ 크롬 실행 오류:', error.message);
      });

      this.browserProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('DevTools')) {
          console.log(`[Chrome] ${output}`);
        }
      });

      this.browserProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('DevTools') && !output.includes('GPU')) {
          console.log(`[Chrome Info] ${output}`);
        }
      });

      // 브라우저 시작 대기
      console.log('⏳ 브라우저 초기화 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`✅ 크롬 실행 완료! 디버깅 포트: ${this.options.debugPort}`);
      return true;

    } catch (error) {
      console.error('❌ 크롬 실행 실패:', error.message);
      return false;
    }
  }

  /**
   * CDP 연결 설정
   */
  async connectCDP() {
    console.log('🔗 CDP 연결 설정 중...');
    
    try {
      // 1. 브라우저 탭 목록 가져오기
      const tabs = await this.getBrowserTabs();
      if (!tabs || tabs.length === 0) {
        throw new Error('브라우저 탭을 찾을 수 없습니다');
      }

      // 2. 첫 번째 탭에 연결
      const targetTab = tabs[0];
      console.log(`📄 연결할 탭: ${targetTab.title} (${targetTab.url})`);
      
      // 3. WebSocket 연결
      const wsUrl = targetTab.webSocketDebuggerUrl;
      console.log(`🔌 WebSocket 연결: ${wsUrl}`);
      
      this.websocket = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        this.websocket.on('open', () => {
          console.log('✅ CDP WebSocket 연결 성공');
          this.isConnected = true;
          this.setupMessageHandling();
          resolve(true);
        });

        this.websocket.on('error', (error) => {
          console.error('❌ WebSocket 연결 실패:', error.message);
          reject(error);
        });

        this.websocket.on('close', () => {
          console.log('🔄 WebSocket 연결 종료');
          this.isConnected = false;
        });
      });

    } catch (error) {
      console.error('❌ CDP 연결 실패:', error.message);
      return false;
    }
  }

  /**
   * 브라우저 탭 목록 가져오기
   */
  async getBrowserTabs() {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${this.options.debugPort}/json`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const tabs = JSON.parse(data);
            console.log(`📋 발견된 탭: ${tabs.length}개`);
            tabs.forEach((tab, index) => {
              console.log(`  ${index + 1}. ${tab.title} (${tab.type})`);
            });
            resolve(tabs.filter(tab => tab.type === 'page'));
          } catch (error) {
            reject(new Error('탭 목록 파싱 실패: ' + error.message));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error('HTTP 요청 실패: ' + error.message));
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('HTTP 요청 타임아웃'));
      });
    });
  }

  /**
   * WebSocket 메시지 처리 설정
   */
  setupMessageHandling() {
    this.websocket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.id && this.pendingMessages.has(message.id)) {
          // 응답 메시지 처리
          const { resolve, reject } = this.pendingMessages.get(message.id);
          this.pendingMessages.delete(message.id);
          
          if (message.error) {
            reject(new Error(message.error.message));
          } else {
            resolve(message.result);
          }
        } else if (message.method) {
          // 이벤트 메시지 처리
          this.handleEvent(message);
        }
      } catch (error) {
        console.error('❌ 메시지 처리 오류:', error.message);
      }
    });
  }

  /**
   * CDP 이벤트 처리
   */
  handleEvent(message) {
    switch (message.method) {
      case 'Page.loadEventFired':
        console.log('📄 페이지 로드 완료');
        break;
      case 'Page.frameNavigated':
        if (message.params.frame.parentId === undefined) {
          console.log(`🔗 페이지 이동: ${message.params.frame.url}`);
        }
        break;
      case 'Runtime.consoleAPICalled':
        const args = message.params.args.map(arg => arg.value).join(' ');
        console.log(`[Browser Console] ${args}`);
        break;
      default:
        // 기타 이벤트는 무시
        break;
    }
  }

  /**
   * CDP 메시지 전송
   */
  async sendCDPMessage(method, params = {}) {
    if (!this.isConnected) {
      throw new Error('CDP가 연결되지 않았습니다');
    }

    const messageId = this.messageId++;
    const message = {
      id: messageId,
      method: method,
      params: params
    };

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(messageId, { resolve, reject });
      
      this.websocket.send(JSON.stringify(message), (error) => {
        if (error) {
          this.pendingMessages.delete(messageId);
          reject(error);
        }
      });

      // 타임아웃 설정
      setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error(`CDP 메시지 타임아웃: ${method}`));
        }
      }, 10000);
    });
  }

  /**
   * 페이지 이동
   */
  async navigateToUrl(url) {
    console.log(`🔗 페이지 이동: ${url}`);
    
    try {
      const result = await this.sendCDPMessage('Page.navigate', { url });
      console.log('✅ 페이지 이동 명령 전송 완료');
      
      // 페이지 로드 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return result;
    } catch (error) {
      console.error('❌ 페이지 이동 실패:', error.message);
      throw error;
    }
  }

  /**
   * 요소 클릭
   */
  async clickElement(selector) {
    console.log(`👆 요소 클릭: ${selector}`);
    
    try {
      // 1. 요소 찾기
      const { nodeId } = await this.sendCDPMessage('DOM.querySelector', {
        nodeId: await this.getRootNodeId(),
        selector: selector
      });

      if (!nodeId) {
        throw new Error(`요소를 찾을 수 없습니다: ${selector}`);
      }

      // 2. 요소 위치 가져오기
      const { model } = await this.sendCDPMessage('DOM.getBoxModel', { nodeId });
      const [x, y] = model.content;

      // 3. 클릭 실행
      await this.sendCDPMessage('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: x,
        y: y,
        button: 'left',
        clickCount: 1
      });

      await this.sendCDPMessage('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: x,
        y: y,
        button: 'left',
        clickCount: 1
      });

      console.log('✅ 클릭 완료');
      return true;

    } catch (error) {
      console.error('❌ 클릭 실패:', error.message);
      return false;
    }
  }

  /**
   * 텍스트 입력
   */
  async typeText(selector, text) {
    console.log(`⌨️ 텍스트 입력: ${selector} = "${text.substring(0, 50)}..."`);
    
    try {
      // 1. 요소 찾기 및 포커스
      await this.clickElement(selector);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. 기존 텍스트 선택 및 삭제
      await this.sendCDPMessage('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Control'
      });
      await this.sendCDPMessage('Input.dispatchKeyEvent', {
        type: 'char',
        text: 'a'
      });
      await this.sendCDPMessage('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Control'
      });

      // 3. 새 텍스트 입력
      for (const char of text) {
        await this.sendCDPMessage('Input.dispatchKeyEvent', {
          type: 'char',
          text: char
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('✅ 텍스트 입력 완료');
      return true;

    } catch (error) {
      console.error('❌ 텍스트 입력 실패:', error.message);
      return false;
    }
  }

  /**
   * 스크린샷 캡처
   */
  async takeScreenshot(filename) {
    console.log(`📸 스크린샷 캡처: ${filename}`);
    
    try {
      const result = await this.sendCDPMessage('Page.captureScreenshot', {
        format: 'png',
        quality: 100
      });

      const buffer = Buffer.from(result.data, 'base64');
      const filepath = `screenshots/${filename}`;
      
      fs.writeFileSync(filepath, buffer);
      console.log(`✅ 스크린샷 저장: ${filepath}`);
      
      return filepath;

    } catch (error) {
      console.error('❌ 스크린샷 실패:', error.message);
      return null;
    }
  }

  /**
   * DOM 루트 노드 ID 가져오기
   */
  async getRootNodeId() {
    const { root } = await this.sendCDPMessage('DOM.getDocument');
    return root.nodeId;
  }

  /**
   * 초기화 및 기본 설정
   */
  async initialize() {
    console.log('🎯 Chrome CDP 컨트롤러 초기화');
    
    try {
      // DOM, Page, Runtime 활성화
      await this.sendCDPMessage('DOM.enable');
      await this.sendCDPMessage('Page.enable');
      await this.sendCDPMessage('Runtime.enable');
      
      console.log('✅ CDP 도메인 활성화 완료');
      return true;

    } catch (error) {
      console.error('❌ CDP 초기화 실패:', error.message);
      return false;
    }
  }

  /**
   * 정리 및 종료
   */
  async cleanup() {
    console.log('🧹 Chrome CDP 정리 중...');
    
    try {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close();
        console.log('🔌 WebSocket 연결 종료');
      }

      if (this.browserProcess && !this.browserProcess.killed) {
        // Windows 프로세스 종료
        const { spawn } = require('child_process');
        spawn('taskkill', ['/F', '/T', '/PID', this.browserProcess.pid.toString()], {
          stdio: 'ignore'
        });
        console.log('🌐 브라우저 프로세스 종료');
      }

      // 임시 디렉토리 정리
      if (fs.existsSync(this.options.userDataDir)) {
        fs.rmSync(this.options.userDataDir, { recursive: true, force: true });
        console.log('🗑️ 임시 디렉토리 정리 완료');
      }

    } catch (error) {
      console.error('⚠️ 정리 중 오류:', error.message);
    }
  }
}

module.exports = ChromeCDPController;