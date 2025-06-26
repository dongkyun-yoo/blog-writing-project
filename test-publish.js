require('dotenv').config();
const PostPublisher = require('./automation/post-publisher');
const SessionManager = require('./automation/session-manager');
const path = require('path');

/**
 * 포스트 발행 테스트 스크립트
 */
async function testPublish() {
  console.log('🧪 포스트 발행 시스템 테스트 시작');
  console.log('=' .repeat(50));
  
  const publisher = new PostPublisher();
  const sessionManager = new SessionManager();
  
  // 초기화
  await publisher.initialize();
  
  // 1. 더미 세션 생성 (테스트용)
  console.log('1️⃣ 테스트용 세션 생성...');
  
  const testSession = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    cookies: [
      {
        name: 'test_session',
        value: 'dummy_value',
        domain: 'tistory.com',
        path: '/',
        httpOnly: true
      }
    ],
    loginStatus: true,
    userInfo: {
      username: 'testuser',
      email: process.env.KAKAO_EMAIL
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  
  const sessionResult = await sessionManager.saveSession('tistory', testSession);
  console.log(sessionResult ? '✅ 테스트 세션 생성 완료' : '❌ 테스트 세션 생성 실패');
  
  // 2. 세션 검증
  console.log('\n2️⃣ 세션 검증...');
  const verification = await sessionManager.verifySession('tistory');
  console.log(`세션 유효성: ${verification.valid ? '✅ 유효' : '❌ 무효'}`);
  if (!verification.valid) {
    console.log(`이유: ${verification.reason}`);
  }
  
  // 3. 기존 포스트로 발행 테스트
  console.log('\n3️⃣ 포스트 발행 테스트...');
  const postPath = path.join(__dirname, 'posts', '2025-japan-small-city-travel-tistory.md');
  
  try {
    const publishResult = await publisher.publishPost('tistory', postPath);
    
    if (publishResult.success) {
      console.log('✅ MCP 명령어 생성 완료');
      console.log('\n🎭 Claude에게 다음 명령어를 요청하세요:');
      console.log('-' .repeat(60));
      console.log(publishResult.mcpCommands.instructions);
      console.log('-' .repeat(60));
    } else {
      console.log('❌ 포스트 발행 실패:', publishResult.reason);
      
      if (publishResult.needLogin) {
        console.log('🔐 로그인이 필요합니다. 먼저 로그인을 진행하세요.');
      }
    }
  } catch (error) {
    console.error('❌ 발행 테스트 중 오류:', error.message);
  }
  
  // 4. 시스템 상태 확인
  console.log('\n4️⃣ 시스템 상태 확인...');
  await publisher.showStatus();
}

// 메인 실행
if (require.main === module) {
  testPublish().catch(console.error);
}

module.exports = { testPublish };