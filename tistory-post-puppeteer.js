const puppeteer = require('puppeteer');
const fs = require('fs');

async function postToTistory() {
    // 블로그 포스트 내용 읽기
    const postContent = fs.readFileSync('/mnt/e/blog-writing-project/posts/2025-japan-small-city-travel-tistory.md', 'utf8');
    
    // 브라우저 시작
    console.log('브라우저를 시작합니다...');
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        timeout: 60000
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // 1. 티스토리 로그인 페이지로 이동
        console.log('티스토리 로그인 페이지로 이동...');
        await page.goto('https://www.tistory.com/auth/login', { waitUntil: 'networkidle0' });
        
        // 2. 카카오 로그인 버튼 클릭
        console.log('카카오 로그인 버튼을 찾는 중...');
        await page.waitForSelector('.link_kakao_login', { timeout: 10000 });
        await page.click('.link_kakao_login');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        // 3. 카카오 로그인 폼 입력
        console.log('카카오 로그인 정보 입력...');
        await page.waitForSelector('#id_email_2', { timeout: 10000 });
        await page.type('#id_email_2', 'beastrongman@daum.net');
        await page.type('#id_password_3', 'King8160!');
        
        // 4. 로그인 버튼 클릭
        await page.click('.btn_confirm');
        console.log('로그인 처리 중...');
        
        // 5. 로그인 완료 대기
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
        console.log('로그인 완료!');
        
        // 현재 URL 확인
        const currentUrl = page.url();
        console.log('현재 URL:', currentUrl);
        
        // 6. 글쓰기 페이지로 이동
        console.log('글쓰기 페이지로 이동...');
        await page.goto('https://www.tistory.com/manage/newpost/', { waitUntil: 'networkidle0' });
        
        // 7. 제목 입력
        console.log('제목 입력 중...');
        await page.waitForSelector('input[name="title"]', { timeout: 15000 });
        await page.type('input[name="title"]', '2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석');
        
        // 8. 본문 내용 입력
        console.log('본문 내용 입력 중...');
        
        // 에디터 타입 확인
        const hasTextarea = await page.$('textarea[name="content"]');
        const hasIframe = await page.$('iframe[title*="에디터"]');
        
        if (hasIframe) {
            // iframe 에디터인 경우
            console.log('iframe 에디터 감지됨');
            const frame = await hasIframe.contentFrame();
            await frame.waitForSelector('body');
            await frame.click('body');
            await frame.evaluate((content) => {
                document.body.innerHTML = content.replace(/\n/g, '<br>');
            }, postContent);
        } else if (hasTextarea) {
            // textarea 에디터인 경우
            console.log('textarea 에디터 감지됨');
            await page.type('textarea[name="content"]', postContent);
        } else {
            // 다른 에디터 타입 시도
            console.log('대체 에디터 방식 시도...');
            await page.evaluate((content) => {
                const contentArea = document.querySelector('[contenteditable="true"]') || 
                                  document.querySelector('.content-editor') ||
                                  document.querySelector('[data-ke-type="editor"]');
                if (contentArea) {
                    contentArea.innerHTML = content.replace(/\n/g, '<br>');
                }
            }, postContent);
        }
        
        // 9. 태그 입력
        console.log('태그 입력 중...');
        const tagSelector = 'input[placeholder*="태그"]';
        if (await page.$(tagSelector)) {
            await page.type(tagSelector, '일본여행,나라여행,홋카이도여행,소도시여행,2025년여행');
        }
        
        // 10. 임시저장
        console.log('임시저장 중...');
        const saveButton = await page.$('button:contains("임시저장")') || 
                          await page.$('[data-ke-type="save"]') ||
                          await page.$('.save-button');
        if (saveButton) {
            await saveButton.click();
            await page.waitForTimeout(3000);
        }
        
        // 11. 발행
        console.log('발행 중...');
        const publishButton = await page.$('button:contains("발행")') || 
                             await page.$('[data-ke-type="publish"]') ||
                             await page.$('.publish-button');
        if (publishButton) {
            await publishButton.click();
            await page.waitForTimeout(5000);
        }
        
        // 12. 결과 확인
        console.log('발행 완료 확인 중...');
        const finalUrl = page.url();
        console.log('최종 URL:', finalUrl);
        
        // 스크린샷 저장
        await page.screenshot({ path: '/mnt/e/blog-writing-project/tistory-post-result.png', fullPage: true });
        
        console.log('✅ 티스토리 포스팅 작업이 완료되었습니다!');
        console.log('📸 스크린샷이 저장되었습니다: tistory-post-result.png');
        
    } catch (error) {
        console.error('❌ 포스팅 중 오류 발생:', error);
        
        // 오류 발생 시 스크린샷 저장
        await page.screenshot({ path: '/mnt/e/blog-writing-project/tistory-error.png', fullPage: true });
        
        // 현재 페이지 정보 출력
        console.log('현재 URL:', page.url());
        console.log('페이지 제목:', await page.title());
        
        throw error;
    } finally {
        await browser.close();
    }
}

// 실행
postToTistory().catch(console.error);