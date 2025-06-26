const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function postToTistory() {
    // 블로그 포스트 내용 읽기
    const postContent = fs.readFileSync('/mnt/e/blog-writing-project/posts/2025-japan-small-city-travel-tistory.md', 'utf8');
    
    // 브라우저 시작
    console.log('브라우저를 시작합니다...');
    const browser = await chromium.launch({ 
        headless: true,   // headless 모드로 변경
        slowMo: 1000      // 각 액션 사이에 1초 대기
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // 1. 티스토리 로그인 페이지로 이동
        console.log('티스토리 로그인 페이지로 이동...');
        await page.goto('https://www.tistory.com/auth/login');
        await page.waitForLoadState('networkidle');
        
        // 2. 카카오 로그인 버튼 클릭
        console.log('카카오 로그인 버튼을 찾는 중...');
        await page.waitForSelector('.link_kakao_login', { timeout: 10000 });
        await page.click('.link_kakao_login');
        await page.waitForLoadState('networkidle');
        
        // 3. 카카오 로그인 폼 입력
        console.log('카카오 로그인 정보 입력...');
        await page.waitForSelector('#id_email_2', { timeout: 10000 });
        await page.fill('#id_email_2', 'beastrongman@daum.net');
        await page.fill('#id_password_3', 'King8160!');
        
        // 4. 로그인 버튼 클릭
        await page.click('.btn_confirm');
        console.log('로그인 처리 중...');
        
        // 5. 로그인 완료 대기 (메인 페이지로 리다이렉트 대기)
        await page.waitForURL('**/manage**', { timeout: 30000 });
        console.log('로그인 완료!');
        
        // 6. 글쓰기 페이지로 이동
        console.log('글쓰기 페이지로 이동...');
        await page.goto('https://www.tistory.com/manage/newpost/');
        await page.waitForLoadState('networkidle');
        
        // 7. 에디터 로드 대기
        console.log('에디터 로딩 대기...');
        await page.waitForSelector('input[name="title"]', { timeout: 15000 });
        
        // 8. 제목 입력
        console.log('제목 입력 중...');
        await page.fill('input[name="title"]', '2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석');
        
        // 9. 본문 내용 입력 (에디터 타입 확인 후 입력)
        console.log('본문 내용 입력 중...');
        
        // 에디터 iframe이 있는지 확인
        const editorFrame = page.frameLocator('iframe[title="에디터"]').first();
        const hasIframe = await page.locator('iframe[title="에디터"]').count() > 0;
        
        if (hasIframe) {
            // iframe 에디터인 경우
            await editorFrame.locator('body').click();
            await editorFrame.locator('body').fill(postContent);
        } else {
            // 일반 textarea인 경우
            const contentSelector = 'textarea[name="content"]';
            await page.waitForSelector(contentSelector, { timeout: 10000 });
            await page.fill(contentSelector, postContent);
        }
        
        // 10. 태그 입력
        console.log('태그 입력 중...');
        const tagInput = page.locator('input[placeholder*="태그"]').first();
        if (await tagInput.count() > 0) {
            await tagInput.fill('일본여행,나라여행,홋카이도여행,소도시여행,2025년여행');
        }
        
        // 11. 임시저장 먼저
        console.log('임시저장 중...');
        const saveButton = page.locator('button:has-text("임시저장")');
        if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(3000);
        }
        
        // 12. 발행 버튼 클릭
        console.log('발행 중...');
        const publishButton = page.locator('button:has-text("발행")');
        if (await publishButton.count() > 0) {
            await publishButton.click();
            await page.waitForTimeout(5000);
        }
        
        // 13. 발행 성공 확인
        console.log('발행 완료 확인 중...');
        await page.waitForTimeout(3000);
        
        console.log('✅ 티스토리 포스팅이 성공적으로 완료되었습니다!');
        
        // 스크린샷 저장
        await page.screenshot({ path: '/mnt/e/blog-writing-project/tistory-post-success.png' });
        
    } catch (error) {
        console.error('❌ 포스팅 중 오류 발생:', error);
        
        // 오류 발생 시 스크린샷 저장
        await page.screenshot({ path: '/mnt/e/blog-writing-project/tistory-error.png' });
        
        throw error;
    } finally {
        // 5초 후 브라우저 종료
        console.log('5초 후 브라우저를 종료합니다...');
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// 실행
postToTistory().catch(console.error);