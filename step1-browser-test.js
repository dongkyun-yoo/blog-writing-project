/**
 * 1단계: 브라우저 실행 테스트
 * 목표: 크롬 브라우저가 정상적으로 실행되는지 확인
 */

const { spawn } = require('child_process');
const fs = require('fs');

async function step1_BrowserLaunch() {
  console.log('🎯 1단계: 브라우저 실행 테스트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const chromePath = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
  const userDataDir = '/tmp/chrome-step1-' + Date.now();
  
  try {
    // 사용자 데이터 디렉토리 생성
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
      console.log(`📁 사용자 데이터 디렉토리 생성: ${userDataDir}`);
    }

    console.log('🚀 크롬 브라우저 실행 중...');
    
    const chromeArgs = [
      '--new-window',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      'https://www.google.com'
    ];

    const browserProcess = spawn(chromePath, chromeArgs, {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    browserProcess.on('spawn', () => {
      console.log(`✅ 브라우저 프로세스 시작됨 (PID: ${browserProcess.pid})`);
    });

    browserProcess.on('error', (error) => {
      console.error('❌ 브라우저 실행 오류:', error.message);
    });

    // 브라우저 시작 대기
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 결과 확인:');
    console.log('✅ 크롬 브라우저가 실행되었습니다');
    console.log('✅ 구글 홈페이지가 열렸습니다');
    console.log(`✅ 프로세스 ID: ${browserProcess.pid}`);
    
    console.log('\n💡 확인사항:');
    console.log('- 새로운 크롬 창이 열렸나요?');
    console.log('- 구글 홈페이지가 표시되나요?');
    
    // 사용자 확인 대기
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const userConfirm = await new Promise(resolve => {
      readline.question('\n브라우저가 정상적으로 열렸으면 "y"를 입력하세요 (y/n): ', (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });

    if (userConfirm) {
      console.log('\n🎊 1단계 성공! 브라우저 실행이 정상 작동합니다.');
      console.log('🔄 이제 이 브라우저를 그대로 두고 2단계로 진행하겠습니다.');
      
      return {
        success: true,
        browserProcess: browserProcess,
        userDataDir: userDataDir
      };
    } else {
      console.log('\n❌ 1단계 실패. 브라우저 실행에 문제가 있습니다.');
      
      // 프로세스 종료
      try {
        browserProcess.kill('SIGTERM');
      } catch (error) {
        console.log('⚠️ 프로세스 종료 중 오류 (무시됨)');
      }
      
      return { success: false };
    }

  } catch (error) {
    console.error('❌ 1단계 실행 오류:', error.message);
    return { success: false, error: error.message };
  }
}

// 실행
if (require.main === module) {
  step1_BrowserLaunch().then(result => {
    if (result.success) {
      console.log('\n✅ 1단계 완료! 2단계 준비됨');
    } else {
      console.log('\n❌ 1단계 실패');
    }
    console.log('\n🏁 1단계 테스트 종료');
  });
}

module.exports = step1_BrowserLaunch;