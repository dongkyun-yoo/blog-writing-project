/**
 * 크롬 브라우저 실행 테스트
 * 단계 1: 기본 브라우저 띄우기
 */

const { spawn } = require('child_process');
const path = require('path');

class BrowserLauncher {
  constructor() {
    this.browserProcess = null;
  }

  /**
   * 시스템에서 크롬 브라우저 경로 찾기
   */
  findChromePath() {
    const possiblePaths = [
      // Windows 경로 (WSL에서 Windows 크롬 실행)
      '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
      '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      
      // Linux 경로
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      
      // macOS 경로
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];

    const fs = require('fs');
    
    for (const chromePath of possiblePaths) {
      try {
        if (fs.existsSync(chromePath)) {
          console.log(`✅ 크롬 브라우저 발견: ${chromePath}`);
          return chromePath;
        }
      } catch (error) {
        // 경로 확인 실패, 계속 진행
      }
    }
    
    console.log('❌ 크롬 브라우저를 찾을 수 없습니다.');
    return null;
  }

  /**
   * 크롬 브라우저 실행
   */
  async launchChrome(options = {}) {
    const chromePath = this.findChromePath();
    
    if (!chromePath) {
      throw new Error('크롬 브라우저를 찾을 수 없습니다.');
    }

    console.log('🚀 크롬 브라우저 실행 중...');
    
    const chromeArgs = [
      '--new-window',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=9222',
      ...(options.headless ? ['--headless'] : []),
      ...(options.url ? [options.url] : ['about:blank'])
    ];

    try {
      this.browserProcess = spawn(chromePath, chromeArgs, {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // 프로세스 출력 처리
      this.browserProcess.stdout.on('data', (data) => {
        console.log(`[Chrome] ${data.toString().trim()}`);
      });

      this.browserProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (!message.includes('DevTools') && !message.includes('GPU')) {
          console.error(`[Chrome Error] ${message}`);
        }
      });

      this.browserProcess.on('close', (code) => {
        console.log(`🔄 브라우저 프로세스 종료 (코드: ${code})`);
      });

      this.browserProcess.on('error', (error) => {
        console.error('❌ 브라우저 실행 오류:', error.message);
      });

      // 브라우저 시작 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('✅ 크롬 브라우저 실행 완료');
      console.log('📍 디버깅 포트: http://localhost:9222');
      
      return {
        success: true,
        process: this.browserProcess,
        debugPort: 9222
      };

    } catch (error) {
      console.error('❌ 브라우저 실행 실패:', error.message);
      throw error;
    }
  }

  /**
   * 브라우저 상태 확인
   */
  async checkBrowserStatus() {
    try {
      const http = require('http');
      
      return new Promise((resolve) => {
        const req = http.get('http://localhost:9222/json', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const tabs = JSON.parse(data);
              console.log(`✅ 브라우저 상태: 활성 탭 ${tabs.length}개`);
              resolve({ success: true, tabs: tabs.length });
            } catch (error) {
              resolve({ success: false, error: 'JSON 파싱 실패' });
            }
          });
        });
        
        req.on('error', (error) => {
          resolve({ success: false, error: error.message });
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          resolve({ success: false, error: '타임아웃' });
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 브라우저 종료
   */
  async closeBrowser() {
    if (this.browserProcess) {
      console.log('🔄 브라우저 종료 중...');
      this.browserProcess.kill('SIGTERM');
      
      // 강제 종료 대기
      setTimeout(() => {
        if (this.browserProcess && !this.browserProcess.killed) {
          console.log('⚠️ 강제 종료 실행');
          this.browserProcess.kill('SIGKILL');
        }
      }, 5000);
      
      this.browserProcess = null;
      console.log('✅ 브라우저 종료 완료');
    }
  }
}

// 직접 실행 시 테스트
async function main() {
  const launcher = new BrowserLauncher();
  
  try {
    console.log('🎯 Step 1: 크롬 브라우저 실행 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. 브라우저 실행
    const result = await launcher.launchChrome({
      url: 'https://www.google.com',
      headless: false
    });
    
    if (!result.success) {
      throw new Error('브라우저 실행 실패');
    }
    
    // 2. 상태 확인
    console.log('\n🔍 브라우저 상태 확인 중...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await launcher.checkBrowserStatus();
    if (status.success) {
      console.log(`✅ 브라우저 연결 성공 - 활성 탭: ${status.tabs}개`);
    } else {
      console.log(`⚠️ 브라우저 상태 확인 실패: ${status.error}`);
    }
    
    // 3. 사용자 입력 대기
    console.log('\n🎊 브라우저가 성공적으로 실행되었습니다!');
    console.log('💡 구글 페이지가 열려 있는지 확인해보세요.');
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
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
  } finally {
    // 4. 정리
    await launcher.closeBrowser();
    console.log('\n🏁 테스트 완료');
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = BrowserLauncher;