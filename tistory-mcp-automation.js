const PlaywrightMCPController = require('./mcp-playwright-controller');
const fs = require('fs').promises;
const path = require('path');

/**
 * 티스토리 MCP 기반 자동화 클래스
 * 플레이라이트 MCP를 통한 티스토리 자동 포스팅
 */
class TistoryMCPAutomation {
  constructor(options = {}) {
    this.controller = new PlaywrightMCPController({
      headless: false, // 대화형 작업을 위해 헤드풀 모드 사용
      screenshotDir: './screenshots/tistory',
      ...options
    });
    
    this.credentials = null;
    this.isLoggedIn = false;
    
    // 티스토리 선택자
    this.selectors = {
      // 로그인 페이지
      loginButton: 'a[href*="login"]',
      kakaoLoginButton: 'a[href*="kakao"]',
      emailInput: '#loginId',
      passwordInput: '#password',
      loginSubmit: '.btn_login',
      
      // 글쓰기 페이지
      writeButton: 'a[href*="/manage/posts/write"]',
      titleInput: 'input[name="title"]',
      contentEditor: '.tx-content-container',
      categorySelect: 'select[name="categoryId"]',
      tagInput: 'input[name="tag"]',
      publishButton: 'button.btn-primary',
      saveButton: 'button.btn-secondary',
      
      // 에디터 관련
      htmlModeButton: '.tx-html',
      editorFrame: 'iframe[title="Rich text area"]',
      editorBody: 'body[contenteditable="true"]'
    };
  }

  /**
   * 초기화
   */
  async initialize() {
    console.log('🎭 티스토리 MCP 자동화 초기화');
    
    const success = await this.controller.initialize();
    if (!success) {
      throw new Error('MCP 컨트롤러 초기화 실패');
    }
    
    await this.controller.createBrowser();
    await this.controller.createPage();
    
    console.log('✅ 티스토리 자동화 초기화 완료');
    return true;
  }

  /**
   * 자격증명 설정
   */
  setCredentials(credentials) {
    this.credentials = credentials;
    console.log('🔐 로그인 정보 설정 완료');
  }

  /**
   * 티스토리 로그인 워크플로우
   */
  async loginWorkflow() {
    console.log('\n🔑 티스토리 로그인 시작');
    
    try {
      // 1. 티스토리 메인 페이지 접속
      await this.controller.goto('https://www.tistory.com');
      await this.controller.waitFor(2000);
      
      // 2. 로그인 버튼 클릭
      console.log('🔍 로그인 버튼 찾는 중...');
      await this.controller.click(this.selectors.loginButton);
      await this.controller.waitFor(3000);
      
      // 3. 카카오 로그인 선택
      console.log('🟡 카카오 로그인 선택');
      await this.controller.click(this.selectors.kakaoLoginButton);
      await this.controller.waitFor(3000);
      
      // 4. 사용자 개입 요청 (카카오 로그인은 보안상 수동 처리)
      const userAction = await this.controller.requestUserIntervention(
        '카카오 로그인을 수동으로 완료해주세요.\n' +
        '로그인이 완료되면 Enter를 눌러주세요.',
        { screenshot: true }
      );
      
      if (userAction.action === 'abort') {
        throw new Error('사용자가 로그인을 중단했습니다.');
      }
      
      // 5. 로그인 완료 확인
      await this.controller.waitFor(3000);
      const currentUrl = await this.controller.getCurrentUrl();
      
      if (currentUrl.includes('tistory.com') && !currentUrl.includes('login')) {
        this.isLoggedIn = true;
        console.log('✅ 로그인 성공');
        await this.controller.screenshot('login-success.png');
        return true;
      } else {
        throw new Error('로그인 실패 - URL 확인 필요');
      }
      
    } catch (error) {
      console.error('❌ 로그인 실패:', error.message);
      await this.controller.screenshot('login-error.png');
      return false;
    }
  }

  /**
   * 글쓰기 페이지 접속
   */
  async navigateToWritePage() {
    console.log('\n📝 글쓰기 페이지로 이동');
    
    try {
      // 관리 페이지로 이동
      await this.controller.goto('https://tistory.com/manage');
      await this.controller.waitFor(3000);
      
      // 글쓰기 버튼 클릭
      await this.controller.click('a[href*="write"]');
      await this.controller.waitFor(5000);
      
      console.log('✅ 글쓰기 페이지 접속 완료');
      await this.controller.screenshot('write-page.png');
      return true;
    } catch (error) {
      console.error('❌ 글쓰기 페이지 접속 실패:', error.message);
      await this.controller.screenshot('write-page-error.png');
      return false;
    }
  }

  /**
   * 포스트 작성 워크플로우
   */
  async writePostWorkflow(postData) {
    console.log('\n✍️ 포스트 작성 시작');
    console.log(`제목: ${postData.title}`);
    console.log(`내용 길이: ${postData.content.length}자`);
    
    try {
      // 1. 제목 입력
      console.log('📝 제목 입력 중...');
      await this.controller.click('input[name="title"]');
      await this.controller.type('input[name="title"]', postData.title);
      await this.controller.waitFor(1000);
      
      // 2. HTML 모드로 전환
      console.log('🔧 HTML 모드로 전환');
      try {
        await this.controller.click('.tx-html');
        await this.controller.waitFor(2000);
      } catch (error) {
        console.log('⚠️ HTML 모드 버튼 찾기 실패, 기본 에디터 사용');
      }
      
      // 3. 내용 입력 (HTML 모드)
      console.log('📄 내용 입력 중...');
      await this.controller.click('textarea[name="content"]');
      await this.controller.type('textarea[name="content"]', postData.content);
      await this.controller.waitFor(2000);
      
      // 4. 태그 입력
      if (postData.tags && postData.tags.length > 0) {
        console.log('🏷️ 태그 입력 중...');
        const tagString = postData.tags.join(', ');
        await this.controller.click('input[name="tag"]');
        await this.controller.type('input[name="tag"]', tagString);
        await this.controller.waitFor(1000);
      }
      
      // 5. 카테고리 설정 (선택사항)
      if (postData.category) {
        console.log('📂 카테고리 설정 중...');
        try {
          await this.controller.click('select[name="categoryId"]');
          // 카테고리 선택 로직 (실제 구현에서는 옵션 값 확인 필요)
          await this.controller.waitFor(1000);
        } catch (error) {
          console.log('⚠️ 카테고리 설정 실패:', error.message);
        }
      }
      
      console.log('✅ 포스트 작성 완료');
      await this.controller.screenshot('post-written.png');
      return true;
      
    } catch (error) {
      console.error('❌ 포스트 작성 실패:', error.message);
      await this.controller.screenshot('post-write-error.png');
      return false;
    }
  }

  /**
   * 임시저장 워크플로우
   */
  async saveDraftWorkflow() {
    console.log('\n💾 임시저장 중...');
    
    try {
      await this.controller.click('button[data-role="temp-save"]');
      await this.controller.waitFor(3000);
      
      console.log('✅ 임시저장 완료');
      return true;
    } catch (error) {
      console.error('❌ 임시저장 실패:', error.message);
      return false;
    }
  }

  /**
   * 발행 워크플로우
   */
  async publishWorkflow() {
    console.log('\n🚀 포스트 발행 시작');
    
    try {
      // 발행 버튼 클릭
      await this.controller.click('button[data-role="publish"]');
      await this.controller.waitFor(3000);
      
      // 발행 확인 대화상자 처리 (필요시)
      try {
        await this.controller.click('button.confirm');
        await this.controller.waitFor(3000);
      } catch (error) {
        console.log('ℹ️ 발행 확인 대화상자 없음');
      }
      
      // 발행 완료 확인
      const currentUrl = await this.controller.getCurrentUrl();
      if (currentUrl.includes('/manage/posts') || currentUrl.includes('/entry/')) {
        console.log('✅ 포스트 발행 완료');
        await this.controller.screenshot('publish-success.png');
        return true;
      } else {
        throw new Error('발행 완료 확인 실패');
      }
      
    } catch (error) {
      console.error('❌ 발행 실패:', error.message);
      await this.controller.screenshot('publish-error.png');
      
      // 사용자 개입 요청
      const userAction = await this.controller.requestUserIntervention(
        '발행에 문제가 있을 수 있습니다. 수동으로 확인해주세요.',
        { screenshot: true }
      );
      
      return userAction.action !== 'abort';
    }
  }

  /**
   * 전체 자동 포스팅 워크플로우
   */
  async autoPostWorkflow(postData, options = {}) {
    console.log('\n🎯 티스토리 자동 포스팅 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 1. 로그인 확인
      if (!this.isLoggedIn) {
        const loginSuccess = await this.loginWorkflow();
        if (!loginSuccess) {
          throw new Error('로그인 실패');
        }
      }
      
      // 2. 글쓰기 페이지 접속
      const navigateSuccess = await this.navigateToWritePage();
      if (!navigateSuccess) {
        throw new Error('글쓰기 페이지 접속 실패');
      }
      
      // 3. 포스트 작성
      const writeSuccess = await this.writePostWorkflow(postData);
      if (!writeSuccess) {
        throw new Error('포스트 작성 실패');
      }
      
      // 4. 임시저장 또는 발행
      if (options.saveAsDraft) {
        const saveSuccess = await this.saveDraftWorkflow();
        if (!saveSuccess) {
          throw new Error('임시저장 실패');
        }
        
        console.log('✅ 임시저장으로 포스팅 완료');
      } else {
        const publishSuccess = await this.publishWorkflow();
        if (!publishSuccess) {
          throw new Error('발행 실패');
        }
        
        console.log('✅ 자동 포스팅 완전 성공!');
      }
      
      return {
        success: true,
        message: '자동 포스팅이 성공적으로 완료되었습니다.',
        url: await this.controller.getCurrentUrl()
      };
      
    } catch (error) {
      console.error('❌ 자동 포스팅 실패:', error.message);
      await this.controller.screenshot('auto-post-error.png');
      
      return {
        success: false,
        error: error.message,
        url: await this.controller.getCurrentUrl()
      };
    }
  }

  /**
   * 포스트 데이터 로드
   */
  async loadPostFromFile(filePath) {
    console.log(`📄 포스트 파일 로드: ${filePath}`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 마크다운 파싱 (간단한 구현)
      const lines = content.split('\n');
      const title = lines[0].replace(/^#\s*/, '');
      const htmlContent = content.replace(/^#.*\n/, '').replace(/\n/g, '<br>');
      
      return {
        title: title,
        content: htmlContent,
        tags: ['일본여행', '나라여행', '홋카이도여행', '소도시여행'],
        category: '여행'
      };
    } catch (error) {
      console.error('❌ 포스트 파일 로드 실패:', error.message);
      throw error;
    }
  }

  /**
   * 정리 및 종료
   */
  async cleanup() {
    console.log('\n🧹 티스토리 자동화 정리 중...');
    await this.controller.cleanup();
  }
}

// CLI에서 직접 실행 시
if (require.main === module) {
  async function main() {
    const automation = new TistoryMCPAutomation();
    
    try {
      await automation.initialize();
      
      // 일본 여행 포스트 로드
      const postData = await automation.loadPostFromFile('./posts/2025-japan-small-city-travel-tistory.md');
      
      // 자동 포스팅 실행
      const result = await automation.autoPostWorkflow(postData, { saveAsDraft: false });
      
      if (result.success) {
        console.log('\n🎊 성공!');
        console.log(`포스트 URL: ${result.url}`);
      } else {
        console.log('\n❌ 실패!');
        console.log(`오류: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ 실행 오류:', error.message);
    } finally {
      await automation.cleanup();
    }
  }
  
  main();
}

module.exports = TistoryMCPAutomation;