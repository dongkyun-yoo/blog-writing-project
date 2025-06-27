/**
 * 크롬 브라우저 실행 테스트 (수정 버전)
 * WSL 환경 최적화
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class BrowserLauncherFixed {
  constructor() {
    this.browserProcess = null;
    this.userDataDir = '/tmp/chrome-automation-' + Date.now();
  }

  /**
   * 임시 사용자 데이터 디렉토리 생성
   */
  createUserDataDir() {
    if (!fs.existsSync(this.userDataDir)) {
      try {
        fs.mkdirSync(this.userDataDir, { recursive: true });
        console.log(`📁 사용자 데이터 디렉토리 생성: ${this.userDataDir}`);
      } catch (error) {
        console.error('❌ 디렉토리 생성 실패:', error.message);
        throw error;
      }
    }
  }

  /**
   * 크롬 브라우저 실행 (WSL 최적화)
   */
  async launchChrome(options = {}) {
    console.log('🚀 크롬 브라우저 실행 중 (WSL 최적화)...');
    
    // 사용자 데이터 디렉토리 생성
    this.createUserDataDir();
    
    const chromePath = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
    
    if (!fs.existsSync(chromePath)) {
      throw new Error('크롬 브라우저를 찾을 수 없습니다.');
    }

    const chromeArgs = [
      '--new-window',
      `--user-data-dir=${this.userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--remote-debugging-port=9222',
      '--remote-allow-origins=*',
      ...(options.url ? [options.url] : ['https://www.google.com'])
    ];

    console.log('🔧 실행 옵션:', chromeArgs.slice(0, 3).join(' ') + '...');

    try {
      this.browserProcess = spawn(chromePath, chromeArgs, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // 프로세스 이벤트 처리
      this.browserProcess.on('spawn', () => {
        console.log('✅ 브라우저 프로세스 시작됨');
      });

      this.browserProcess.on('error', (error) => {
        console.error('❌ 브라우저 실행 오류:', error.message);
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
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return {
        success: true,
        process: this.browserProcess,
        debugPort: 9222,
        userDataDir: this.userDataDir
      };

    } catch (error) {
      console.error('❌ 브라우저 실행 실패:', error.message);
      throw error;
    }
  }

  /**
   * 브라우저 상태 확인
   */
  async checkBrowserStatus(retries = 3) {
    console.log('🔍 브라우저 연결 상태 확인 중...');
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.makeHttpRequest('http://localhost:9222/json');
        
        if (response.success) {
          const tabs = JSON.parse(response.data);
          console.log(`✅ 브라우저 연결 성공! 활성 탭: ${tabs.length}개`);
          
          // 첫 번째 탭 정보 출력
          if (tabs.length > 0) {
            console.log(`📄 첫 번째 탭: ${tabs[0].title}`);
            console.log(`🔗 URL: ${tabs[0].url}`);
          }
          
          return { success: true, tabs: tabs.length, tabInfo: tabs };
        }
      } catch (error) {
        console.log(`⏳ 연결 시도 ${i + 1}/${retries} 실패, 재시도 중...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('❌ 브라우저 연결 최종 실패');
    return { success: false, error: '연결 타임아웃' };
  }

  /**
   * HTTP 요청 헬퍼
   */
  async makeHttpRequest(url) {
    const http = require('http');
    const urlParsed = require('url').parse(url);
    
    return new Promise((resolve) => {
      const req = http.get({
        hostname: urlParsed.hostname,
        port: urlParsed.port,
        path: urlParsed.path,
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ success: true, data });
        });
      });
      
      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: '요청 타임아웃' });
      });
    });
  }

  /**
   * 브라우저 종료 및 정리
   */
  async cleanup() {
    console.log('🧹 브라우저 정리 중...');
    
    if (this.browserProcess && !this.browserProcess.killed) {
      try {
        // Windows 프로세스 종료
        const { spawn } = require('child_process');
        spawn('taskkill', ['/F', '/T', '/PID', this.browserProcess.pid.toString()], {
          stdio: 'ignore'
        });
        
        console.log('✅ 브라우저 프로세스 종료');
      } catch (error) {
        console.log('⚠️ 프로세스 종료 시 오류:', error.message);
      }
    }
    
    // 임시 디렉토리 정리
    try {
      if (fs.existsSync(this.userDataDir)) {
        fs.rmSync(this.userDataDir, { recursive: true, force: true });
        console.log('🗑️ 임시 디렉토리 정리 완료');
      }
    } catch (error) {
      console.log('⚠️ 디렉토리 정리 실패:', error.message);
    }
  }
}

// 테스트 실행
async function main() {
  const launcher = new BrowserLauncherFixed();
  
  try {
    console.log('🎯 Step 1: 크롬 브라우저 실행 테스트 (수정 버전)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. 브라우저 실행
    const result = await launcher.launchChrome({
      url: 'https://www.google.com'
    });
    
    if (!result.success) {
      throw new Error('브라우저 실행 실패');
    }
    
    console.log(`✅ 브라우저 실행 완료! PID: ${result.process.pid}`);
    console.log(`📍 디버깅 포트: http://localhost:${result.debugPort}`);
    
    // 2. 연결 상태 확인
    const status = await launcher.checkBrowserStatus();
    
    if (status.success) {
      console.log('\n🎊 브라우저 제어 준비 완료!');
      console.log('💡 이제 브라우저를 자동으로 제어할 수 있습니다.');
      
      // 탭 정보 출력
      if (status.tabInfo && status.tabInfo.length > 0) {
        console.log('\n📋 현재 열린 탭:');
        status.tabInfo.forEach((tab, index) => {
          console.log(`  ${index + 1}. ${tab.title}`);
          console.log(`     ${tab.url}`);
        });
      }
    } else {
      console.log('\n⚠️ 브라우저 연결 실패, 하지만 브라우저는 실행됨');
      console.log('💡 수동으로 브라우저 창을 확인해보세요.');
    }
    
    // 3. 사용자 확인 대기
    console.log('\n🔍 브라우저 창이 열렸는지 확인해보세요!');
    console.log('Enter를 누르면 다음 단계로 진행합니다...');
    
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
    
    return { success: true, launcher };
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 실행
if (require.main === module) {
  main().then(async (result) => {
    if (result.success) {
      console.log('\n✅ 1단계 성공: 브라우저 실행 완료');
      console.log('🔄 정리 작업을 수행합니다...');
      await result.launcher.cleanup();
    }
    console.log('\n🏁 테스트 완료');
  });
}

module.exports = BrowserLauncherFixed;