const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function executeLiveTistoryPost() {
  console.log('🚀 티스토리 실제 포스팅 실행 시작');
  console.log('❗ 주의: 이것은 실제 포스팅입니다. 테스트가 아닙니다.');
  
  try {
    // 포스트 데이터 준비
    const postContent = fs.readFileSync(
      path.join(__dirname, 'posts', '2025-japan-small-city-travel-tistory.md'), 
      'utf8'
    );
    
    const postData = {
      title: "2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석",
      content: postContent,
      tags: ["일본여행", "나라여행", "홋카이도여행", "소도시여행", "2025년여행"],
      category: "여행",
      visibility: "public"
    };
    
    // 로그인 정보
    const credentials = {
      username: "beastrongman@daum.net",
      password: "King8160!"
    };
    
    console.log('📝 포스트 정보:');
    console.log(`- 제목: ${postData.title}`);
    console.log(`- 내용 길이: ${postData.content.length}자`);
    console.log(`- 태그: ${postData.tags.join(', ')}`);
    
    // 브라우저 시작 (실행 과정 확인을 위해 headless: false)
    console.log('\n🌐 브라우저 시작...');
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // 1. 티스토리 로그인 페이지 이동
    console.log('\n1️⃣ 티스토리 로그인 페이지 접속...');
    await page.goto('https://www.tistory.com/auth/login', { 
      waitUntil: 'networkidle0' 
    });
    
    await page.waitForTimeout(2000);
    
    // 2. 카카오 로그인 버튼 클릭
    console.log('2️⃣ 카카오 로그인 버튼 클릭...');
    await page.click('a.btn_login.link_kakao_id');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // 3. 카카오 계정 정보 입력
    console.log('3️⃣ 카카오 로그인 정보 입력...');
    
    // ID 입력
    await page.waitForSelector('#loginId--1', { visible: true });
    await page.type('#loginId--1', credentials.username, { delay: 100 });
    
    // 비밀번호 입력
    await page.waitForSelector('#password--2', { visible: true });
    await page.type('#password--2', credentials.password, { delay: 100 });
    
    // 로그인 버튼 클릭
    await page.click('.btn_g.highlight.submit');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('✅ 로그인 완료!');
    
    // 4. 티스토리 관리 페이지로 이동
    console.log('\n4️⃣ 글쓰기 페이지 이동...');
    await page.goto('https://www.tistory.com/manage/newpost/', { 
      waitUntil: 'networkidle0' 
    });
    
    await page.waitForTimeout(3000);
    
    // 5. 제목 입력
    console.log('5️⃣ 제목 입력...');
    await page.waitForSelector('input[name="title"]', { visible: true });
    await page.click('input[name="title"]');
    await page.type('input[name="title"]', postData.title, { delay: 50 });
    
    // 6. 본문 입력
    console.log('6️⃣ 본문 입력...');
    
    // 에디터 타입 확인 및 적절한 방법으로 내용 입력
    try {
      // 마크다운 에디터 확인
      const markdownEditor = await page.$('.CodeMirror');
      if (markdownEditor) {
        console.log('마크다운 에디터 감지');
        await page.click('.CodeMirror');
        await page.keyboard.type(postData.content);
      } else {
        // 리치 텍스트 에디터 확인
        const richEditor = await page.$('[contenteditable="true"]');
        if (richEditor) {
          console.log('리치 텍스트 에디터 감지');
          await page.click('[contenteditable="true"]');
          await page.keyboard.type(postData.content);
        } else {
          // iframe 에디터 확인
          const iframeEditor = await page.$('iframe');
          if (iframeEditor) {
            console.log('iframe 에디터 감지');
            const frame = await iframeEditor.contentFrame();
            await frame.click('body');
            await frame.type('body', postData.content);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ 에디터 감지 실패, 기본 방법 시도');
      await page.evaluate((content) => {
        const editors = document.querySelectorAll('textarea, [contenteditable="true"]');
        if (editors.length > 0) {
          editors[0].value = content;
          editors[0].innerHTML = content;
        }
      }, postData.content);
    }
    
    // 7. 태그 입력
    if (postData.tags && postData.tags.length > 0) {
      console.log('7️⃣ 태그 입력...');
      try {
        const tagInput = await page.$('input[name="tag"]');
        if (tagInput) {
          for (const tag of postData.tags) {
            await page.type('input[name="tag"]', tag);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
          }
        }
      } catch (error) {
        console.log('⚠️ 태그 입력 실패:', error.message);
      }
    }
    
    // 8. 스크린샷 저장 (발행 전)
    await page.screenshot({ 
      path: path.join(__dirname, 'automation/screenshots/tistory/before-publish.png'),
      fullPage: true 
    });
    
    // 9. 발행 버튼 클릭
    console.log('8️⃣ 실제 발행 실행...');
    
    const publishBtn = await page.$('button:contains("발행")') || 
                     await page.$('button:contains("완료")') ||
                     await page.$('.btn_save');
    
    if (publishBtn) {
      await publishBtn.click();
      await page.waitForTimeout(3000);
      
      console.log('🎉 실제 포스팅 완료!');
      
      // 발행 후 스크린샷
      await page.screenshot({ 
        path: path.join(__dirname, 'automation/screenshots/tistory/after-publish.png'),
        fullPage: true 
      });
      
      // 성공 로그 저장
      const successLog = {
        timestamp: new Date().toISOString(),
        title: postData.title,
        result: 'SUCCESS',
        url: page.url(),
        message: '실제 티스토리 포스팅 완료'
      };
      
      // 로그 디렉토리 생성
      const logDir = path.join(__dirname, 'automation/logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(logDir, 'live-posting-success.json'),
        JSON.stringify(successLog, null, 2)
      );
      
    } else {
      throw new Error('발행 버튼을 찾을 수 없습니다');
    }
    
    // 결과 확인을 위해 잠깐 대기
    console.log('\n📱 결과 확인을 위해 5초 대기...');
    await page.waitForTimeout(5000);
    
    await browser.close();
    
    console.log('\n🏁 실제 티스토리 포스팅 완료!');
    console.log('📊 포스팅된 내용:');
    console.log(`- 제목: ${postData.title}`);
    console.log(`- 태그: ${postData.tags.join(', ')}`);
    console.log(`- 발행 시간: ${new Date().toLocaleString('ko-KR')}`);
    
  } catch (error) {
    console.error('❌ 실제 포스팅 실행 중 오류:', error.message);
    
    // 오류 로그 저장
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      result: 'FAILED'
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'automation/logs/live-posting-error.json'),
      JSON.stringify(errorLog, null, 2)
    );
    
    throw error;
  }
}

// 즉시 실행
if (require.main === module) {
  executeLiveTistoryPost()
    .then(() => {
      console.log('✨ 실제 포스팅 프로세스 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 실제 포스팅 실행 실패:', error.message);
      process.exit(1);
    });
}

module.exports = executeLiveTistoryPost;