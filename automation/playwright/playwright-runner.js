require('dotenv').config();
const readline = require('readline');

class PlaywrightRunner {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // MCP Playwright 사용 안내
  async initializePlaywright() {
    console.log('\n🎭 Playwright MCP를 통한 브라우저 자동화');
    console.log('==================================\n');
    
    console.log('📌 사용 방법:');
    console.log('1. MCP Playwright 서버가 실행 중인지 확인하세요');
    console.log('2. 브라우저가 자동으로 열립니다');
    console.log('3. 필요시 수동으로 보안 인증을 완료하세요\n');
    
    return true;
  }

  // 사용자 입력 받기
  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  // 플랫폼 선택
  async selectPlatform() {
    console.log('\n📝 블로그 플랫폼 선택:');
    console.log('1. 네이버 블로그');
    console.log('2. 티스토리');
    console.log('3. Velog');
    console.log('4. Medium');
    console.log('5. 워드프레스');
    
    const choice = await this.askQuestion('\n선택 (1-5): ');
    
    const platforms = {
      '1': 'naver',
      '2': 'tistory',
      '3': 'velog',
      '4': 'medium',
      '5': 'wordpress'
    };
    
    return platforms[choice] || null;
  }

  // 작업 선택
  async selectAction() {
    console.log('\n🔧 작업 선택:');
    console.log('1. 로그인 테스트');
    console.log('2. 글쓰기');
    console.log('3. 임시저장 글 확인');
    console.log('4. 쿠키 삭제 (재로그인)');
    
    const choice = await this.askQuestion('\n선택 (1-4): ');
    
    const actions = {
      '1': 'login',
      '2': 'write',
      '3': 'drafts',
      '4': 'clear'
    };
    
    return actions[choice] || null;
  }

  // 자격증명 입력
  async getCredentials(platform) {
    console.log(`\n🔐 ${platform} 로그인 정보:`);
    
    const username = await this.askQuestion('아이디/이메일: ');
    const password = await this.askQuestion('비밀번호: ');
    
    return { username, password };
  }

  // 글 정보 입력
  async getPostData() {
    console.log('\n📝 글 정보 입력:');
    
    const title = await this.askQuestion('제목: ');
    const content = await this.askQuestion('내용 (HTML 가능): ');
    const tagsInput = await this.askQuestion('태그 (쉼표로 구분): ');
    const category = await this.askQuestion('카테고리: ');
    const visibility = await this.askQuestion('공개 설정 (public/private) [public]: ') || 'public';
    
    return {
      title,
      content,
      tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : [],
      category,
      visibility
    };
  }

  // MCP를 통한 작업 실행 안내
  async executeWithMCP(platform, action, data) {
    console.log('\n🚀 MCP Playwright를 통해 작업을 실행합니다...');
    console.log(`플랫폼: ${platform}`);
    console.log(`작업: ${action}`);
    
    // 여기서 실제 MCP 명령어를 생성하거나 안내
    console.log('\n💡 다음 단계:');
    console.log('1. MCP Playwright를 통해 브라우저를 제어합니다');
    console.log('2. 자동화 스크립트가 실행됩니다');
    console.log('3. 필요시 수동 개입이 요청될 수 있습니다');
    
    // 실제 구현 시 여기서 MCP와 통신
    return {
      success: true,
      message: 'MCP를 통한 작업이 준비되었습니다'
    };
  }

  // 메인 실행
  async run() {
    try {
      await this.initializePlaywright();
      
      const platform = await this.selectPlatform();
      if (!platform) {
        console.log('❌ 잘못된 플랫폼 선택');
        return;
      }
      
      const action = await this.selectAction();
      if (!action) {
        console.log('❌ 잘못된 작업 선택');
        return;
      }
      
      let data = {};
      
      if (action === 'login' || action === 'write') {
        // 자격증명 확인
        const AutomationClass = this.getAutomationClass(platform);
        const automation = new AutomationClass();
        
        let credentials = await automation.loadCredentials();
        if (!credentials) {
          console.log('\n저장된 로그인 정보가 없습니다.');
          credentials = await this.getCredentials(platform);
          
          const save = await this.askQuestion('로그인 정보를 저장하시겠습니까? (y/n): ');
          if (save.toLowerCase() === 'y') {
            await automation.saveCredentials(credentials);
            console.log('✅ 로그인 정보가 안전하게 저장되었습니다.');
          }
        } else {
          console.log('✅ 저장된 로그인 정보를 사용합니다.');
        }
        
        data.credentials = credentials;
      }
      
      if (action === 'write') {
        data.postData = await this.getPostData();
      }
      
      // MCP를 통한 실행
      const result = await this.executeWithMCP(platform, action, data);
      
      if (result.success) {
        console.log(`\n✅ ${result.message}`);
      } else {
        console.log(`\n❌ 오류: ${result.error}`);
      }
      
    } catch (error) {
      console.error('\n❌ 오류 발생:', error.message);
    } finally {
      this.rl.close();
    }
  }

  // 자동화 클래스 가져오기
  getAutomationClass(platform) {
    const classes = {
      naver: require('./naver/naver-automation'),
      tistory: require('./tistory/tistory-automation'),
      velog: require('./velog/velog-automation'),
      medium: require('./medium/medium-automation'),
      wordpress: require('./wordpress/wordpress-automation')
    };
    
    return classes[platform] || require('./naver/naver-automation');
  }
}

// 실행
if (require.main === module) {
  const runner = new PlaywrightRunner();
  runner.run();
}

module.exports = PlaywrightRunner;