require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

/**
 * MCP 기반 자동화 실행기
 * Claude의 다양한 MCP 서버들을 활용한 블로그 자동화 시스템
 */
class MCPAutomationRunner {
  constructor() {
    this.sessionPath = path.join(__dirname, 'sessions');
    this.screenshotPath = path.join(__dirname, 'screenshots');
    this.logPath = path.join(__dirname, 'logs');
    
    this.mcpServers = {
      playwright: 'Playwright MCP - 브라우저 자동화',
      filesystem: 'Filesystem MCP - 파일 관리',
      memory: 'Memory MCP - 세션 및 상태 저장',
      search: 'Search MCP - 웹 검색 및 리서치'
    };
  }

  /**
   * 초기화 - 필요한 디렉토리 생성
   */
  async initialize() {
    console.log('🚀 MCP 자동화 시스템 초기화');
    
    const dirs = [this.sessionPath, this.screenshotPath, this.logPath];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 디렉토리 생성/확인: ${dir}`);
      } catch (error) {
        console.log(`⚠️ 디렉토리 생성 실패: ${dir} - ${error.message}`);
      }
    }
    
    console.log('✅ MCP 자동화 시스템 초기화 완료\n');
  }

  /**
   * 사용 가능한 MCP 서버 목록
   */
  listMCPServers() {
    console.log('🔧 사용 가능한 MCP 서버들:');
    console.log('=' .repeat(50));
    
    Object.entries(this.mcpServers).forEach(([key, description]) => {
      console.log(`• ${key.toUpperCase()}: ${description}`);
    });
    
    console.log('=' .repeat(50));
    console.log('💡 Claude에게 "MCP 서버명 + 작업 내용"으로 요청하세요\n');
  }

  /**
   * 티스토리 로그인 MCP 실행 가이드
   */
  getTistoryLoginGuide() {
    return {
      title: '🎭 Playwright MCP를 통한 티스토리 로그인',
      steps: [
        {
          step: 1,
          action: 'Playwright MCP로 브라우저 시작',
          request: 'Playwright MCP를 사용해서 새 브라우저 페이지를 열어줘'
        },
        {
          step: 2,
          action: '티스토리 로그인 페이지로 이동',
          request: 'https://www.tistory.com/auth/login 페이지로 이동해줘'
        },
        {
          step: 3,
          action: '카카오 로그인 버튼 클릭',
          request: '카카오 로그인 버튼을 찾아서 클릭해줘',
          selectors: [
            'a.btn_login.link_kakao_id',
            'a[href*="kakao"]',
            '.btn_kakao'
          ]
        },
        {
          step: 4,
          action: '카카오 계정 로그인',
          request: '카카오 이메일과 비밀번호를 입력해서 로그인해줘',
          credentials: {
            email: process.env.KAKAO_EMAIL,
            password: '[ENV에서 로드]'
          }
        },
        {
          step: 5,
          action: '로그인 상태 확인',
          request: '티스토리 관리자 페이지에 접근 가능한지 확인해줘',
          verifyUrl: 'https://www.tistory.com/manage'
        },
        {
          step: 6,
          action: '세션 저장',
          request: 'Memory MCP를 사용해서 로그인 세션을 저장해줘'
        }
      ],
      example: `
Claude에게 이렇게 요청하세요:

"Playwright MCP를 사용해서 다음 단계로 티스토리 로그인을 실행해줘:

1. 새 브라우저 페이지 열기
2. https://www.tistory.com/auth/login 이동
3. 카카오 로그인 버튼 클릭 (선택자: a.btn_login.link_kakao_id)
4. 이메일: ${process.env.KAKAO_EMAIL}
5. 비밀번호: [환경변수에서 로드]
6. 로그인 완료 후 https://www.tistory.com/manage 접근 확인
7. Memory MCP로 세션 저장

각 단계별로 스크린샷을 찍어서 확인해줘."
      `
    };
  }

  /**
   * 블로그 포스트 발행 MCP 실행 가이드
   */
  getPostPublishGuide() {
    return {
      title: '📝 MCP를 통한 블로그 포스트 발행',
      steps: [
        {
          step: 1,
          action: '세션 복원',
          request: 'Memory MCP에서 저장된 티스토리 세션을 불러와줘'
        },
        {
          step: 2,
          action: '글쓰기 페이지 이동',
          request: 'Playwright MCP로 티스토리 글쓰기 페이지로 이동해줘'
        },
        {
          step: 3,
          action: '포스트 내용 입력',
          request: 'Filesystem MCP로 작성된 마크다운 파일을 읽어서 내용을 입력해줘'
        },
        {
          step: 4,
          action: '발행 설정',
          request: '카테고리, 태그, 공개 설정을 구성해줘'
        },
        {
          step: 5,
          action: '발행 실행',
          request: '포스트를 발행하고 결과를 확인해줘'
        }
      ]
    };
  }

  /**
   * 전체 자동화 워크플로우 실행 가이드
   */
  getFullWorkflowGuide() {
    return {
      title: '🔄 전체 블로그 자동화 워크플로우',
      workflow: [
        '1. Search MCP로 트렌드 리서치',
        '2. Memory MCP로 아이디어 저장',
        '3. Filesystem MCP로 포스트 작성',
        '4. Playwright MCP로 로그인 및 발행',
        '5. Memory MCP로 발행 기록 저장'
      ],
      request: `
Claude에게 전체 워크플로우 요청:

"다음 MCP 서버들을 순서대로 사용해서 블로그 자동화를 실행해줘:

1. Search MCP: '2025년 일본 여행 트렌드' 리서치
2. Memory MCP: 리서치 결과를 아이디어로 저장
3. Filesystem MCP: posts/ 폴더에 새 마크다운 파일 생성
4. Playwright MCP: 티스토리 로그인 및 포스트 발행
5. Memory MCP: 발행 완료 기록 저장

각 단계별로 진행상황을 보고해줘."
      `
    };
  }

  /**
   * 로그 저장
   */
  async saveLog(action, result, timestamp = new Date().toISOString()) {
    const logData = {
      timestamp,
      action,
      result,
      success: result.success || false
    };
    
    const logFile = path.join(this.logPath, `mcp-automation-${new Date().toISOString().split('T')[0]}.json`);
    
    try {
      let logs = [];
      try {
        const existingLogs = await fs.readFile(logFile, 'utf8');
        logs = JSON.parse(existingLogs);
      } catch (e) {
        // 새 파일 생성
      }
      
      logs.push(logData);
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
      
      console.log(`📝 로그 저장 완료: ${logFile}`);
    } catch (error) {
      console.error('❌ 로그 저장 실패:', error.message);
    }
  }

  /**
   * 실행 상태 표시
   */
  showStatus() {
    console.log('\n🎯 MCP 자동화 시스템 상태');
    console.log('=' .repeat(50));
    
    const status = {
      '환경변수': {
        'KAKAO_EMAIL': process.env.KAKAO_EMAIL ? '✅ 설정됨' : '❌ 미설정',
        'KAKAO_PASSWORD': process.env.KAKAO_PASSWORD ? '✅ 설정됨' : '❌ 미설정'
      },
      'MCP 서버': Object.keys(this.mcpServers).reduce((acc, key) => {
        acc[key] = '⏳ Claude를 통해 확인 필요';
        return acc;
      }, {}),
      '디렉토리': {
        '세션': this.sessionPath,
        '스크린샷': this.screenshotPath,
        '로그': this.logPath
      }
    };
    
    console.log(JSON.stringify(status, null, 2));
    console.log('=' .repeat(50));
  }
}

// 모듈 내보내기
module.exports = MCPAutomationRunner;

// 직접 실행 시 가이드 표시
if (require.main === module) {
  const runner = new MCPAutomationRunner();
  
  (async () => {
    await runner.initialize();
    runner.listMCPServers();
    
    console.log('\n📋 티스토리 로그인 가이드:');
    const loginGuide = runner.getTistoryLoginGuide();
    console.log(loginGuide.example);
    
    runner.showStatus();
  })();
}