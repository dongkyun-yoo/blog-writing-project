require('dotenv').config();

/**
 * Playwright MCP를 활용한 티스토리 로그인 스크립트
 * 
 * 이 스크립트는 Claude의 Playwright MCP 서버를 통해 실행됩니다.
 * 직접 실행하지 말고, Claude에게 요청하여 MCP를 통해 실행하세요.
 */

const TISTORY_LOGIN_CONFIG = {
  // 티스토리 로그인 관련 URL
  loginUrl: 'https://www.tistory.com/auth/login',
  adminUrl: 'https://www.tistory.com/manage',
  
  // 카카오 로그인 선택자들
  kakaoSelectors: [
    'a.btn_login.link_kakao_id',
    'a[href*="kakao"]',
    '.btn_kakao',
    'button:has-text("카카오")',
    'a:has-text("카카오로 로그인")'
  ],
  
  // 카카오 이메일 입력 선택자들
  emailSelectors: [
    '#loginId--1',
    '#id_email_2',
    'input[name="email"]',
    'input[type="email"]',
    'input[placeholder*="아이디"]',
    'input[placeholder*="이메일"]'
  ],
  
  // 카카오 비밀번호 입력 선택자들
  passwordSelectors: [
    '#password--2',
    '#id_password_3',
    'input[name="password"]',
    'input[type="password"]',
    'input[placeholder*="비밀번호"]'
  ],
  
  // 로그인 버튼 선택자들
  loginButtonSelectors: [
    'button[type="submit"]',
    '.btn_g.highlight',
    '.submit',
    'button.btn_g',
    'input[type="submit"]'
  ],
  
  // 대기 시간 설정
  timeouts: {
    pageLoad: 10000,
    elementWait: 5000,
    loginProcess: 8000,
    verification: 3000
  }
};

/**
 * MCP Playwright 로그인 프로세스
 * 
 * Claude에게 다음과 같이 요청하세요:
 * "Playwright MCP를 사용해서 이 스크립트의 loginToTistory 함수를 실행해줘"
 */
async function loginToTistory() {
  const config = TISTORY_LOGIN_CONFIG;
  const credentials = {
    email: process.env.KAKAO_EMAIL,
    password: process.env.KAKAO_PASSWORD
  };
  
  console.log('🎭 Playwright MCP를 통한 티스토리 로그인 시작');
  
  // Step 1: 로그인 상태 확인
  console.log('📋 Step 1: 로그인 상태 확인');
  
  // Step 2: 티스토리 로그인 페이지로 이동
  console.log('📋 Step 2: 티스토리 로그인 페이지 접속');
  console.log(`URL: ${config.loginUrl}`);
  
  // Step 3: 카카오 로그인 버튼 클릭
  console.log('📋 Step 3: 카카오 로그인 버튼 찾기 및 클릭');
  console.log('시도할 선택자들:', config.kakaoSelectors);
  
  // Step 4: 카카오 계정 정보 입력
  console.log('📋 Step 4: 카카오 계정 정보 입력');
  console.log('이메일:', credentials.email);
  console.log('비밀번호: [보안으로 숨김]');
  
  // Step 5: 로그인 완료 확인
  console.log('📋 Step 5: 로그인 완료 확인');
  console.log('성공 URL 패턴: tistory.com (login 제외)');
  
  return {
    success: true,
    message: 'MCP를 통해 실행해야 하는 스크립트입니다',
    config: config,
    credentials: {
      email: credentials.email,
      password: '[MASKED]'
    }
  };
}

/**
 * 세션 저장 함수
 */
async function saveSession() {
  console.log('💾 세션 저장 중...');
  // MCP를 통해 쿠키와 세션 데이터를 저장
  // 파일: automation/sessions/tistory-session.json
}

/**
 * 로그인 상태 검증 함수
 */
async function verifyLogin() {
  console.log('✅ 로그인 상태 검증 중...');
  // 관리자 페이지 접근 가능 여부 확인
  // URL: https://www.tistory.com/manage
}

// 모듈 내보내기
module.exports = {
  loginToTistory,
  saveSession,
  verifyLogin,
  TISTORY_LOGIN_CONFIG
};

// 직접 실행 시 안내 메시지
if (require.main === module) {
  console.log('⚠️  이 스크립트는 Playwright MCP를 통해 실행해야 합니다.');
  console.log('Claude에게 다음과 같이 요청하세요:');
  console.log('"Playwright MCP를 사용해서 티스토리 로그인을 실행해줘"');
  
  // 설정 정보만 표시
  loginToTistory().then(result => {
    console.log('📊 설정 정보:', JSON.stringify(result, null, 2));
  });
}