/**
 * Chrome CDP 테스트 (수정 버전)
 * WSL 환경 최적화
 */

const ChromeCDPController = require('./chrome-cdp-controller');

class ChromeCDPTesterFixed {
  constructor() {
    this.controller = new ChromeCDPController({
      debugPort: 9222
    });
  }

  /**
   * 단계별 진단 테스트
   */
  async diagnosticTest() {
    console.log('🔍 단계별 진단 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 크롬 프로세스 실행 테스트
      console.log('1️⃣ 크롬 프로세스 실행 테스트...');
      const launchSuccess = await this.controller.launchChrome();
      
      if (!launchSuccess) {
        throw new Error('크롬 실행 실패');
      }
      
      console.log('✅ 크롬 프로세스 실행 성공');
      
      // 2. 디버깅 포트 대기
      console.log('\n2️⃣ 디버깅 포트 활성화 대기...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 3. HTTP 엔드포인트 직접 테스트
      console.log('\n3️⃣ HTTP 엔드포인트 직접 테스트...');
      const httpTest = await this.testHttpEndpoint();
      
      if (!httpTest.success) {
        console.log('❌ HTTP 엔드포인트 접근 실패');
        console.log('💡 브라우저는 실행되었지만 디버깅 포트 접근 불가');
        console.log('🔧 WSL에서 Windows 크롬의 로컬 포트 접근 제약');
        
        // 4. 대안 방법 안내
        await this.showAlternativeApproach();
        return false;
      }
      
      console.log('✅ HTTP 엔드포인트 접근 성공');
      
      // 5. WebSocket 연결 테스트
      console.log('\n4️⃣ WebSocket 연결 테스트...');
      const wsTest = await this.controller.connectCDP();
      
      if (!wsTest) {
        console.log('❌ WebSocket 연결 실패');
        return false;
      }
      
      console.log('✅ WebSocket 연결 성공');
      
      // 6. 기본 CDP 명령 테스트
      console.log('\n5️⃣ 기본 CDP 명령 테스트...');
      const initSuccess = await this.controller.initialize();
      
      if (!initSuccess) {
        console.log('❌ CDP 초기화 실패');
        return false;
      }
      
      console.log('✅ CDP 초기화 성공');
      
      return true;
      
    } catch (error) {
      console.error('\n❌ 진단 테스트 실패:', error.message);
      return false;
    }
  }

  /**
   * HTTP 엔드포인트 직접 테스트
   */
  async testHttpEndpoint() {
    const http = require('http');
    
    return new Promise((resolve) => {
      console.log('🌐 http://localhost:9222/json 접근 시도...');
      
      const req = http.get('http://localhost:9222/json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const tabs = JSON.parse(data);
            console.log(`✅ HTTP 응답 성공 - 탭 ${tabs.length}개 발견`);
            tabs.forEach((tab, index) => {
              console.log(`  ${index + 1}. ${tab.title} (${tab.type})`);
            });
            resolve({ success: true, tabs });
          } catch (parseError) {
            console.log('❌ JSON 파싱 실패:', parseError.message);
            resolve({ success: false, error: 'JSON 파싱 실패' });
          }
        });
      });

      req.on('error', (error) => {
        console.log('❌ HTTP 요청 실패:', error.message);
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        console.log('❌ HTTP 요청 타임아웃');
        resolve({ success: false, error: '타임아웃' });
      });
    });
  }

  /**
   * 대안 접근법 안내
   */
  async showAlternativeApproach() {
    console.log('\n🔄 대안 접근법');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 문제: WSL에서 Windows 크롬의 디버깅 포트 접근 제약');
    console.log('');
    console.log('💡 가능한 해결책:');
    console.log('1. 🖥️ Windows PowerShell에서 직접 Node.js 실행');
    console.log('2. 🐧 WSL에서 리눅스 크롬 사용 (헤드리스)');
    console.log('3. 🌐 네트워크 포트 포워딩 설정');
    console.log('4. 🖱️ 수동 브라우저 조작 + 스크린샷 가이드');
    console.log('');
    console.log('🎯 추천: Windows PowerShell에서 실행');
    console.log('   → 파일을 Windows로 복사 후 PowerShell에서 node 실행');
    console.log('');
    console.log('🔧 임시 해결책: 수동 조작 가이드');
    console.log('   → 스크립트가 단계별 안내하고 사용자가 수동 실행');
  }

  /**
   * 수동 조작 가이드 모드
   */
  async manualGuideMode() {
    console.log('\n🖱️ 수동 조작 가이드 모드');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askUser = (question) => {
      return new Promise(resolve => {
        readline.question(question, (answer) => {
          resolve(answer);
        });
      });
    };

    try {
      console.log('🎯 티스토리 자동 포스팅을 수동 가이드로 진행합니다.');
      console.log('');
      
      // 1. 브라우저 확인
      console.log('1️⃣ 브라우저 창 확인');
      console.log('   📌 크롬 브라우저가 열려있는지 확인하세요');
      await askUser('   ✅ 브라우저가 열려있으면 Enter를 누르세요: ');
      
      // 2. 티스토리 접속
      console.log('\n2️⃣ 티스토리 접속');
      console.log('   📌 주소창에 https://www.tistory.com 입력하세요');
      await askUser('   ✅ 티스토리 페이지가 열리면 Enter를 누르세요: ');
      
      // 3. 로그인
      console.log('\n3️⃣ 로그인');
      console.log('   📌 "로그인" 버튼을 클릭하세요');
      console.log('   📌 카카오 로그인을 선택하세요');
      console.log('   📌 이메일: beastrongman@daum.net');
      console.log('   📌 비밀번호: King8160!');
      await askUser('   ✅ 로그인이 완료되면 Enter를 누르세요: ');
      
      // 4. 글쓰기 페이지
      console.log('\n4️⃣ 글쓰기 페이지 이동');
      console.log('   📌 "관리" 또는 "글쓰기" 메뉴를 클릭하세요');
      await askUser('   ✅ 글쓰기 페이지가 열리면 Enter를 누르세요: ');
      
      // 5. 포스트 내용 제공
      console.log('\n5️⃣ 포스트 내용 입력');
      console.log('   📌 제목: "2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석"');
      console.log('   📌 내용은 posts/2025-japan-small-city-travel-tistory.md 파일을 참조하세요');
      console.log('   📌 태그: 일본여행, 나라여행, 홋카이도여행, 소도시여행, 2025년여행');
      await askUser('   ✅ 내용 입력이 완료되면 Enter를 누르세요: ');
      
      // 6. 발행
      console.log('\n6️⃣ 포스트 발행');
      console.log('   📌 "발행" 버튼을 클릭하세요');
      await askUser('   ✅ 발행이 완료되면 Enter를 누르세요: ');
      
      console.log('\n🎊 수동 포스팅 가이드 완료!');
      console.log('✅ 티스토리에 일본 여행 포스트가 발행되었습니다.');
      
    } catch (error) {
      console.error('❌ 수동 가이드 오류:', error.message);
    } finally {
      readline.close();
    }
  }

  /**
   * 전체 테스트 실행
   */
  async runTest() {
    console.log('🎯 Chrome CDP 제어 테스트 (수정 버전)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 진단 테스트 실행
      const diagnosticSuccess = await this.diagnosticTest();
      
      if (diagnosticSuccess) {
        console.log('\n🎊 CDP 제어 테스트 성공!');
        console.log('✅ 자동화된 브라우저 제어가 가능합니다.');
        
        // 실제 티스토리 자동화 테스트 진행
        await this.testActualAutomation();
        
      } else {
        console.log('\n⚠️ CDP 자동 제어 불가능');
        console.log('🔄 수동 가이드 모드로 전환합니다...');
        
        await this.manualGuideMode();
      }
      
    } catch (error) {
      console.error('\n❌ 테스트 실행 오류:', error.message);
    } finally {
      // 정리 작업 (오류 무시)
      try {
        await this.controller.cleanup();
      } catch (cleanupError) {
        console.log('⚠️ 정리 작업 오류 (무시됨)');
      }
    }
    
    console.log('\n🏁 테스트 완료');
  }

  /**
   * 실제 자동화 테스트
   */
  async testActualAutomation() {
    console.log('\n🚀 실제 티스토리 자동화 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 티스토리 접속
      await this.controller.navigateToUrl('https://www.tistory.com');
      await this.controller.takeScreenshot('auto-tistory-main.png');
      
      // 2. 로그인 버튼 클릭 시도
      console.log('🔍 로그인 버튼 찾기...');
      const loginSuccess = await this.controller.clickElement('a[href*="login"]');
      
      if (loginSuccess) {
        await this.controller.takeScreenshot('auto-login-page.png');
        console.log('✅ 로그인 페이지 접속 성공');
      } else {
        console.log('⚠️ 로그인 버튼 클릭 실패');
      }
      
      console.log('💡 이후 단계는 보안상 수동으로 진행해주세요.');
      
    } catch (error) {
      console.error('❌ 자동화 테스트 실패:', error.message);
    }
  }
}

// 메인 실행
async function main() {
  const tester = new ChromeCDPTesterFixed();
  await tester.runTest();
}

// 실행
if (require.main === module) {
  main();
}

module.exports = ChromeCDPTesterFixed;