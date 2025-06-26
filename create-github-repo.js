/**
 * GitHub 리포지토리 자동 생성 스크립트
 * GitHub API를 사용하여 리포지토리를 생성합니다.
 */

const https = require('https');
const { execSync } = require('child_process');

class GitHubRepoCreator {
  constructor() {
    this.repoName = 'tistory-auto-posting';
    this.description = '🤖 완전 자동화된 티스토리 블로그 포스팅 시스템 - GitHub Actions 기반';
    this.apiEndpoint = 'api.github.com';
  }

  // GitHub Personal Access Token이 필요한 방법
  async createWithToken(token) {
    const repoData = {
      name: this.repoName,
      description: this.description,
      private: false,
      auto_init: false,
      gitignore_template: null,
      license_template: null
    };

    const options = {
      hostname: this.apiEndpoint,
      port: 443,
      path: '/user/repos',
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Node.js GitHub API Client',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 201) {
              resolve(response);
            } else {
              reject(new Error(`GitHub API Error: ${response.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(repoData));
      req.end();
    });
  }

  // GitHub CLI를 사용하는 방법 (추천)
  async createWithCLI() {
    try {
      // GitHub CLI 설치 확인
      execSync('gh --version', { stdio: 'pipe' });
      
      // 리포지토리 생성
      const command = `gh repo create ${this.repoName} --description "${this.description}" --public --confirm`;
      const result = execSync(command, { encoding: 'utf8' });
      
      return {
        success: true,
        method: 'GitHub CLI',
        result: result.trim(),
        repoUrl: `https://github.com/$(gh api user --jq .login)/${this.repoName}.git`
      };
      
    } catch (error) {
      throw new Error(`GitHub CLI Error: ${error.message}`);
    }
  }

  // 수동 생성 가이드 제공
  getManualInstructions() {
    return {
      method: 'Manual Creation',
      steps: [
        '1. https://github.com/new 접속',
        '2. Repository name: tistory-auto-posting',
        '3. Description: 🤖 완전 자동화된 티스토리 블로그 포스팅 시스템 - GitHub Actions 기반',
        '4. Public 선택',
        '5. README, .gitignore, license 체크 해제',
        '6. "Create repository" 클릭'
      ],
      nextStep: '생성 후 사용자명을 알려주시면 자동으로 푸시하겠습니다.'
    };
  }

  // 로컬 Git 설정 및 푸시
  async setupAndPush(username) {
    try {
      const repoUrl = `https://github.com/${username}/${this.repoName}.git`;
      
      // 원격 리포지토리 설정
      try {
        execSync('git remote remove origin', { stdio: 'pipe' });
      } catch (e) {
        // 기존 origin이 없어도 계속 진행
      }
      
      execSync(`git remote add origin ${repoUrl}`, { stdio: 'pipe' });
      execSync('git branch -M main', { stdio: 'pipe' });
      
      // 최종 커밋
      execSync('git add .', { stdio: 'pipe' });
      
      try {
        execSync(`git commit -m "🚀 완전 자동화된 티스토리 포스팅 시스템

🎯 주요 기능:
- GitHub Actions 기반 완전 자동화
- Puppeteer를 활용한 브라우저 자동화
- 환경 제약 해결 및 CI/CD 최적화
- 실제 포스팅 가능한 완성된 시스템

📋 사용법:
1. GitHub Secrets에 KAKAO_EMAIL, KAKAO_PASSWORD 설정
2. Actions 탭에서 워크플로우 실행
3. 자동으로 티스토리에 포스트 발행

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`, { stdio: 'pipe' });
      } catch (e) {
        // 커밋할 변경사항이 없어도 계속 진행
      }
      
      // 푸시
      const pushResult = execSync('git push -u origin main', { encoding: 'utf8' });
      
      return {
        success: true,
        repoUrl,
        pushResult: pushResult.trim()
      };
      
    } catch (error) {
      throw new Error(`Git Push Error: ${error.message}`);
    }
  }

  // 완료 후 GitHub Actions 설정 가이드
  getActionsSetupGuide(username) {
    return {
      repoUrl: `https://github.com/${username}/${this.repoName}`,
      secretsUrl: `https://github.com/${username}/${this.repoName}/settings/secrets/actions`,
      actionsUrl: `https://github.com/${username}/${this.repoName}/actions`,
      
      secrets: [
        { name: 'KAKAO_EMAIL', value: 'beastrongman@daum.net' },
        { name: 'KAKAO_PASSWORD', value: 'King8160!' }
      ],
      
      instructions: [
        '1. GitHub Secrets 설정:',
        `   - 이동: https://github.com/${username}/${this.repoName}/settings/secrets/actions`,
        '   - "New repository secret" 클릭',
        '   - KAKAO_EMAIL: beastrongman@daum.net',
        '   - KAKAO_PASSWORD: King8160!',
        '',
        '2. 워크플로우 실행:',
        `   - 이동: https://github.com/${username}/${this.repoName}/actions`,
        '   - "Tistory Auto Posting" 선택',
        '   - "Run workflow" 클릭',
        '   - 실행 결과 확인'
      ]
    };
  }
}

// 실행 함수
async function createRepo() {
  const creator = new GitHubRepoCreator();
  
  console.log('🎯 GitHub 리포지토리 자동 생성 시작');
  console.log('=' .repeat(60));
  
  // 방법 1: GitHub CLI 시도
  try {
    console.log('📋 1단계: GitHub CLI로 리포지토리 생성 시도...');
    const result = await creator.createWithCLI();
    
    console.log('✅ GitHub CLI로 리포지토리 생성 성공!');
    console.log(`📁 리포지토리: ${result.result}`);
    
    // 현재 git 사용자 확인
    const username = execSync('gh api user --jq .login', { encoding: 'utf8' }).trim();
    
    // 자동 푸시
    console.log('\n📋 2단계: 코드 푸시 실행...');
    const pushResult = await creator.setupAndPush(username);
    
    console.log('✅ 코드 푸시 완료!');
    console.log(`🔗 리포지토리 URL: ${pushResult.repoUrl}`);
    
    // 다음 단계 안내
    console.log('\n📋 3단계: GitHub Actions 설정');
    const guide = creator.getActionsSetupGuide(username);
    
    console.log('🔧 다음 단계:');
    guide.instructions.forEach(step => console.log(step));
    
    return { success: true, method: 'GitHub CLI', ...guide };
    
  } catch (cliError) {
    console.log(`❌ GitHub CLI 실패: ${cliError.message}`);
    
    // 방법 2: 수동 생성 가이드 제공
    console.log('\n📋 대안: 수동 리포지토리 생성');
    const manual = creator.getManualInstructions();
    
    console.log('🔧 수동 생성 단계:');
    manual.steps.forEach(step => console.log(step));
    
    console.log(`\n📋 ${manual.nextStep}`);
    
    return { success: false, method: 'Manual Required', instructions: manual };
  }
}

// 사용자명이 제공된 경우 바로 푸시
async function pushWithUsername(username) {
  const creator = new GitHubRepoCreator();
  
  try {
    console.log(`📋 ${username} 계정으로 푸시 실행...`);
    const result = await creator.setupAndPush(username);
    
    console.log('✅ 푸시 완료!');
    const guide = creator.getActionsSetupGuide(username);
    
    console.log('🔧 다음 단계:');
    guide.instructions.forEach(step => console.log(step));
    
    return { success: true, ...guide };
    
  } catch (error) {
    console.error('❌ 푸시 실패:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { GitHubRepoCreator, createRepo, pushWithUsername };

// 직접 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === 'push' && args[1]) {
    // 사용자명이 제공된 경우
    pushWithUsername(args[1]).catch(console.error);
  } else {
    // 리포지토리 생성
    createRepo().catch(console.error);
  }
}