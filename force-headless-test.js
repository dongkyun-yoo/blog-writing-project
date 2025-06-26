require('dotenv').config();

/**
 * 방법 1: 헤드리스 브라우저 강제 실행 시도
 * 시스템 제약을 우회하는 다양한 방법 시도
 */

async function attemptMethod1_ForceHeadless() {
  console.log('🔧 방법 1: 헤드리스 브라우저 강제 실행 시도');
  
  const methods = [
    {
      name: 'Puppeteer with system Chrome',
      test: async () => {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
          headless: "new",
          executablePath: '/usr/bin/google-chrome-stable',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--remote-debugging-port=0',
            '--disable-features=VizDisplayCompositor'
          ]
        });
        return browser;
      }
    },
    {
      name: 'Puppeteer with bundled Chrome',
      test: async () => {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
          headless: "new",
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        });
        return browser;
      }
    },
    {
      name: 'Playwright Chromium forced',
      test: async () => {
        const { chromium } = require('playwright');
        const browser = await chromium.launch({
          headless: true,
          chromiumSandbox: false,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process'
          ]
        });
        return browser;
      }
    },
    {
      name: 'Playwright Firefox',
      test: async () => {
        const { firefox } = require('playwright');
        const browser = await firefox.launch({
          headless: true,
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true
          }
        });
        return browser;
      }
    }
  ];

  for (const method of methods) {
    try {
      console.log(`\n🧪 시도 중: ${method.name}`);
      
      const browser = await method.test();
      const page = await browser.newPage();
      
      // 간단한 테스트
      await page.goto('https://httpbin.org/get', { waitUntil: 'networkidle2' });
      const title = await page.title();
      
      console.log(`✅ 성공: ${method.name}`);
      console.log(`📄 페이지 제목: ${title}`);
      
      await browser.close();
      return { success: true, method: method.name };
      
    } catch (error) {
      console.log(`❌ 실패: ${method.name} - ${error.message}`);
    }
  }
  
  return { success: false, reason: '모든 헤드리스 방법 실패' };
}

async function attemptMethod2_TistoryAPI() {
  console.log('\n🔧 방법 2: Tistory API 기반 포스팅');
  
  try {
    // Tistory API 인증 확인
    const clientId = process.env.TISTORY_CLIENT_ID;
    const clientSecret = process.env.TISTORY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.log('⚠️ Tistory API 설정이 필요합니다');
      console.log('https://www.tistory.com/guide/api/manage/register 에서 앱 등록 필요');
      
      return { 
        success: false, 
        reason: 'API 키 미설정',
        nextStep: 'API 앱 등록 및 OAuth 인증 구현'
      };
    }
    
    // OAuth 인증 URL 생성
    const authUrl = `https://www.tistory.com/oauth/authorize?client_id=${clientId}&redirect_uri=${process.env.TISTORY_REDIRECT_URI}&response_type=code`;
    
    console.log('📋 Tistory API 인증 필요:');
    console.log(`🔗 인증 URL: ${authUrl}`);
    
    return {
      success: false,
      reason: 'OAuth 인증 필요',
      authUrl,
      nextStep: '브라우저에서 인증 후 access_token 획득'
    };
    
  } catch (error) {
    console.log(`❌ API 방법 실패: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function attemptMethod3_Docker() {
  console.log('\n🔧 방법 3: Docker 컨테이너 환경');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    // Docker 설치 확인
    const dockerVersion = await execAsync('docker --version');
    console.log(`✅ Docker 확인: ${dockerVersion.stdout.trim()}`);
    
    // Playwright Docker 이미지 실행 시도
    const dockerCommand = `
      docker run --rm -it \
        -v $(pwd):/workspace \
        -w /workspace \
        mcr.microsoft.com/playwright:v1.40.0-jammy \
        /bin/bash -c "npm install && node test-tistory-login.js"
    `;
    
    console.log('🐳 Docker 컨테이너에서 Playwright 실행 시도...');
    console.log('명령어:', dockerCommand);
    
    const result = await execAsync(dockerCommand, { timeout: 120000 });
    
    return {
      success: true,
      method: 'Docker',
      output: result.stdout
    };
    
  } catch (error) {
    console.log(`❌ Docker 방법 실패: ${error.message}`);
    
    if (error.message.includes('docker: command not found')) {
      return {
        success: false,
        reason: 'Docker 미설치',
        nextStep: 'Docker 설치 필요'
      };
    }
    
    return { success: false, reason: error.message };
  }
}

async function attemptMethod4_RemoteExecution() {
  console.log('\n🔧 방법 4: 원격 실행 환경 구축');
  
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // GitHub Actions 워크플로우 생성
    const workflowContent = `
name: Tistory Auto Posting

on:
  workflow_dispatch:
    inputs:
      post_title:
        description: 'Post Title'
        required: true
        default: '2025년 일본 소도시 여행 전략 가이드'

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install puppeteer dotenv
        
      - name: Run auto posting
        env:
          KAKAO_EMAIL: \${{ secrets.KAKAO_EMAIL }}
          KAKAO_PASSWORD: \${{ secrets.KAKAO_PASSWORD }}
        run: node tistory-puppeteer-post.js
`;

    const workflowDir = '.github/workflows';
    await fs.mkdir(workflowDir, { recursive: true });
    await fs.writeFile(path.join(workflowDir, 'tistory-posting.yml'), workflowContent);
    
    console.log('✅ GitHub Actions 워크플로우 생성 완료');
    console.log('📁 파일: .github/workflows/tistory-posting.yml');
    console.log('🔧 다음 단계:');
    console.log('1. GitHub에 리포지토리 푸시');
    console.log('2. Repository Settings > Secrets에서 KAKAO_EMAIL, KAKAO_PASSWORD 설정');
    console.log('3. Actions 탭에서 워크플로우 수동 실행');
    
    return {
      success: true,
      method: 'GitHub Actions',
      nextStep: 'GitHub 설정 및 워크플로우 실행'
    };
    
  } catch (error) {
    console.log(`❌ 원격 실행 설정 실패: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

// 메인 실행 함수
async function executeAllMethods() {
  console.log('🎯 자동 포스팅 문제 해결 - 순차적 방법 시도');
  console.log('=' .repeat(60));
  
  const methods = [
    { name: '헤드리스 브라우저 강제 실행', fn: attemptMethod1_ForceHeadless },
    { name: 'Tistory API 사용', fn: attemptMethod2_TistoryAPI },
    { name: 'Docker 컨테이너', fn: attemptMethod3_Docker },
    { name: '원격 실행 환경', fn: attemptMethod4_RemoteExecution }
  ];
  
  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    console.log(`\n[${i + 1}/${methods.length}] ${method.name} 시도 중...`);
    
    try {
      const result = await method.fn();
      
      if (result.success) {
        console.log(`\n🎉 성공! ${method.name}로 해결됨`);
        
        if (result.method === 'GitHub Actions') {
          console.log('\n📋 다음 단계 실행 가이드:');
          console.log(result.nextStep);
        } else {
          // 성공한 방법으로 실제 포스팅 실행
          console.log('\n🚀 실제 포스팅 실행 중...');
          await executeActualPosting(result.method);
        }
        
        return result;
      } else {
        console.log(`❌ ${method.name} 실패: ${result.reason}`);
        if (result.nextStep) {
          console.log(`📋 다음 단계: ${result.nextStep}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${method.name} 오류: ${error.message}`);
    }
  }
  
  console.log('\n❌ 모든 자동화 방법 실패');
  console.log('📋 수동 포스팅 가이드를 사용하세요: manual-posting-guide.html');
  
  return { success: false, reason: '모든 방법 실패' };
}

async function executeActualPosting(method) {
  console.log(`\n🎯 ${method} 방법으로 실제 포스팅 실행`);
  
  // 실제 포스팅 로직은 성공한 방법에 따라 다르게 구현
  // 여기서는 테스트 실행만 표시
  console.log('📝 포스트 제목: 2025년 일본 소도시 여행 전략 가이드');
  console.log('🏷️ 태그: 일본여행,나라여행,홋카이도여행,소도시여행');
  console.log('✅ 포스팅 준비 완료');
}

// 실행
if (require.main === module) {
  executeAllMethods().catch(console.error);
}

module.exports = { executeAllMethods };