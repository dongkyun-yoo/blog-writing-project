const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function autoPostToTistory() {
  let browser;
  let page;
  
  try {
    console.log('🚀 티스토리 자동 포스팅 시작 (Puppeteer)');
    
    // 1. 포스트 내용 읽기
    const postPath = '/mnt/e/blog-writing-project/posts/2025-japan-small-city-travel-tistory.md';
    const postContent = await fs.readFile(postPath, 'utf8');
    
    // 마크다운에서 제목 추출
    const titleMatch = postContent.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : '2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석';
    
    // 태그 추출
    const tagMatch = postContent.match(/\*\*태그\*\*:\s*(.+)/);
    const tagsString = tagMatch ? tagMatch[1] : '#일본여행 #나라여행 #홋카이도여행 #소도시여행 #2025년여행계획';
    const tags = tagsString.replace(/#/g, '').split(/\s+/).filter(tag => tag.trim()).slice(0, 5);
    
    console.log('📄 포스트 데이터 준비 완료');
    console.log(`제목: ${title}`);
    console.log(`태그: ${tags.join(', ')}`);
    
    // 2. 브라우저 시작
    console.log('🌐 브라우저 시작...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 스크린샷 저장 헬퍼 함수
    const saveScreenshot = async (name) => {
      const screenshotDir = '/mnt/e/blog-writing-project/automation/screenshots/tistory';
      await fs.mkdir(screenshotDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${name}-${timestamp}.png`;
      const filepath = path.join(screenshotDir, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      console.log(`📸 스크린샷 저장: ${filename}`);
      return filepath;
    };
    
    // 3. 티스토리 로그인 페이지로 이동
    console.log('🔑 로그인 페이지로 이동...');
    await page.goto('https://www.tistory.com/auth/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await saveScreenshot('01-login-page');
    
    // 4. 카카오 로그인 버튼 찾기 및 클릭
    console.log('🔍 카카오 로그인 버튼 찾기...');
    
    const kakaoSelectors = [
      'a.btn_login.link_kakao_id',
      'a[href*="kakao"]',
      '.btn_kakao',
      'a:contains("카카오")',
      'a[title*="카카오"]'
    ];
    
    let kakaoButton = null;
    for (const selector of kakaoSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        kakaoButton = await page.$(selector);
        if (kakaoButton) {
          console.log(`✅ 카카오 로그인 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!kakaoButton) {
      // 페이지 내용을 분석해서 카카오 관련 링크 찾기
      const kakaoLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.find(link => 
          link.href.includes('kakao') || 
          link.textContent.includes('카카오') ||
          link.title?.includes('카카오')
        )?.outerHTML;
      });
      
      if (kakaoLink) {
        console.log(`카카오 링크 발견: ${kakaoLink}`);
        await page.click('a[href*="kakao"]');
      } else {
        await saveScreenshot('02-no-kakao-button');
        throw new Error('카카오 로그인 버튼을 찾을 수 없습니다');
      }
    } else {
      await kakaoButton.click();
    }
    
    console.log('🔄 카카오 로그인 페이지로 이동 중...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await saveScreenshot('03-kakao-login-page');
    
    // 5. 카카오 계정 로그인
    console.log('📝 로그인 정보 입력...');
    
    // 아이디/이메일 입력 필드 찾기
    const idSelectors = [
      '#loginId--1',
      '#id_email_2', 
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="아이디"]',
      'input[placeholder*="이메일"]',
      'input[data-testid="input-email"]'
    ];
    
    let idInput = null;
    for (const selector of idSelectors) {
      try {
        await page.waitForSelector(selector, { visible: true, timeout: 3000 });
        idInput = await page.$(selector);
        if (idInput) {
          console.log(`✅ 아이디 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!idInput) {
      await saveScreenshot('04-no-id-field');
      throw new Error('아이디 입력 필드를 찾을 수 없습니다');
    }
    
    // 아이디 입력
    await idInput.click();
    await idInput.type('beastrongman@daum.net', { delay: 100 });
    console.log('✅ 아이디 입력 완료');
    
    // 비밀번호 입력 필드 찾기
    const pwSelectors = [
      '#password--2',
      '#id_password_3',
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="비밀번호"]',
      'input[data-testid="input-password"]' 
    ];
    
    let pwInput = null;
    for (const selector of pwSelectors) {
      try {
        pwInput = await page.$(selector);
        if (pwInput) {
          console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!pwInput) {
      await saveScreenshot('05-no-pw-field');
      throw new Error('비밀번호 입력 필드를 찾을 수 없습니다');
    }
    
    // 비밀번호 입력
    await pwInput.click();
    await pwInput.type('King8160!', { delay: 100 });
    console.log('✅ 비밀번호 입력 완료');
    
    await saveScreenshot('06-before-login-submit');
    
    // 6. 로그인 버튼 클릭
    console.log('🔐 로그인 버튼 클릭...');
    
    const loginBtnSelectors = [
      '.btn_g.highlight.submit',
      'button[type="submit"]',
      '.submit_btn',
      'button:contains("로그인")',
      '.login_btn',
      'input[type="submit"]'
    ];
    
    let loginBtn = null;
    for (const selector of loginBtnSelectors) {
      try {
        loginBtn = await page.$(selector);
        if (loginBtn) {
          console.log(`✅ 로그인 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!loginBtn) {
      await saveScreenshot('07-no-login-button');
      throw new Error('로그인 버튼을 찾을 수 없습니다');
    }
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      loginBtn.click()
    ]);
    
    console.log('⏳ 로그인 처리 중...');
    await page.waitForTimeout(3000);
    await saveScreenshot('08-after-login');
    
    // 7. 추가 인증 처리 (필요시)
    const currentUrl = page.url();
    if (currentUrl.includes('auth') || currentUrl.includes('verify')) {
      console.log('⚠️  추가 인증이 필요할 수 있습니다. 수동 처리 필요.');
      await saveScreenshot('09-need-verification');
      
      // 추가 인증 대기 (예: SMS 인증)
      console.log('⏳ 30초 대기 중... (추가 인증 처리)');
      await page.waitForTimeout(30000);
    }
    
    // 8. 티스토리 관리 페이지로 이동
    console.log('📋 관리 페이지로 이동...');
    await page.goto('https://www.tistory.com/manage/newpost/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    await saveScreenshot('10-manage-page');
    
    // 9. 글쓰기 에디터 확인 및 제목 입력
    console.log('✏️  글쓰기 시작...');
    
    // 제목 입력
    const titleSelectors = [
      'input[name="title"]',
      '#title-input',
      '.title-input',
      'input[placeholder*="제목"]',
      '.post-title input',
      '.editor-title input'
    ];
    
    let titleInput = null;
    for (const selector of titleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        titleInput = await page.$(selector);
        if (titleInput) {
          console.log(`✅ 제목 입력 필드 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (titleInput) {
      await titleInput.click();
      await titleInput.type(title, { delay: 50 });
      console.log('✅ 제목 입력 완료');
    } else {
      console.log('⚠️  제목 입력 필드를 찾을 수 없습니다');
    }
    
    // 10. 본문 내용 입력
    console.log('📝 본문 내용 입력...');
    
    const contentSelectors = [
      '[contenteditable="true"]',
      '.editor-content',
      '.post-content',
      'textarea[name="content"]',
      '.CodeMirror',
      'iframe[title*="에디터"]'
    ];
    
    let contentInput = null;
    for (const selector of contentSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        contentInput = await page.$(selector);
        if (contentInput) {
          console.log(`✅ 본문 입력 필드 발견: ${selector}`);
          
          if (selector.includes('iframe')) {
            // iframe 에디터 처리
            const frame = await contentInput.contentFrame();
            if (frame) {
              await frame.click('body');
              await frame.type('body', postContent, { delay: 10 });
            }
          } else if (selector.includes('CodeMirror')) {
            // CodeMirror 에디터 처리
            await contentInput.click();
            await page.keyboard.type(postContent);
          } else if (selector === '[contenteditable="true"]') {
            // ContentEditable 에디터 처리
            await contentInput.click();
            await contentInput.type(postContent, { delay: 10 });
          } else {
            // 일반 textarea 처리
            await contentInput.click();
            await contentInput.type(postContent, { delay: 10 });
          }
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!contentInput) {
      console.log('⚠️  본문 입력 필드를 찾을 수 없습니다. 페이지 분석 중...');
      await saveScreenshot('11-no-content-field');
    } else {
      console.log('✅ 본문 입력 완료');
    }
    
    await saveScreenshot('12-content-filled');
    
    // 11. 태그 입력
    console.log('🏷️  태그 입력...');
    
    const tagSelectors = [
      'input[name="tag"]',
      '.tag-input',
      'input[placeholder*="태그"]',
      '.tags input'
    ];
    
    for (const selector of tagSelectors) {
      try {
        const tagInput = await page.$(selector);
        if (tagInput) {
          console.log(`✅ 태그 입력 필드 발견: ${selector}`);
          
          for (const tag of tags) {
            await tagInput.click();
            await tagInput.type(tag);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
          }
          
          console.log(`✅ 태그 입력 완료: ${tags.join(', ')}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 12. 카테고리 설정 (선택사항)
    console.log('📂 카테고리 설정...');
    
    try {
      const categoryBtn = await page.$('.btn-category, button[aria-label*="카테고리"]');
      if (categoryBtn) {
        await categoryBtn.click();
        await page.waitForTimeout(1000);
        
        // '여행' 카테고리 선택 시도
        const travelCategory = await page.$('text="여행"');
        if (travelCategory) {
          await travelCategory.click();
          console.log('✅ 카테고리 "여행" 선택');
        } else {
          console.log('⚠️  "여행" 카테고리 없음');
        }
      }
    } catch (e) {
      console.log('⚠️  카테고리 설정 생략');
    }
    
    await saveScreenshot('13-before-publish');
    
    // 13. 임시저장
    console.log('💾 임시저장 시도...');
    
    try {
      const tempSaveBtn = await page.$('button:contains("임시저장"), .btn-temp-save');
      if (tempSaveBtn) {
        await tempSaveBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ 임시저장 완료');
      }
    } catch (e) {
      console.log('⚠️  임시저장 버튼 없음');
    }
    
    // 14. 발행
    console.log('🚀 포스트 발행...');
    
    const publishSelectors = [
      'button:contains("발행")',
      'button:contains("완료")',
      'button:contains("저장")',
      '.btn_save',
      '.btn-publish',
      'button[type="submit"]'
    ];
    
    let publishBtn = null;
    for (const selector of publishSelectors) {
      try {
        publishBtn = await page.$(selector);
        if (publishBtn) {
          console.log(`✅ 발행 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!publishBtn) {
      await saveScreenshot('14-no-publish-button');
      throw new Error('발행 버튼을 찾을 수 없습니다');
    }
    
    await publishBtn.click();
    console.log('⏳ 발행 처리 중...');
    await page.waitForTimeout(5000);
    
    // URL 설정 모달 처리
    try {
      const confirmBtn = await page.$('button:contains("확인")');
      if (confirmBtn) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // 모달이 없으면 무시
    }
    
    await saveScreenshot('15-publish-complete');
    
    // 15. 결과 확인
    const finalUrl = page.url();
    console.log(`📍 현재 URL: ${finalUrl}`);
    
    // 성공 여부 판단
    const isSuccess = finalUrl.includes('/manage/') || 
                     finalUrl.includes('/admin/') ||
                     !finalUrl.includes('/auth/');
    
    if (isSuccess) {
      console.log('🎉 포스트 발행 성공!');
      
      // 포스트 URL 찾기 시도
      try {
        const viewLink = await page.$('a:contains("보기"), a[target="_blank"]');
        if (viewLink) {
          const postUrl = await page.evaluate(el => el.href, viewLink);
          console.log(`📎 포스트 URL: ${postUrl}`);
        }
      } catch (e) {
        console.log('⚠️  포스트 URL 확인 불가');
      }
      
      // 성공 보고서 저장
      const report = {
        success: true,
        timestamp: new Date().toISOString(),
        postTitle: title,
        tags: tags,
        finalUrl: finalUrl,
        message: '티스토리 포스트가 성공적으로 발행되었습니다.'
      };
      
      await fs.mkdir('/mnt/e/blog-writing-project/automation/logs', { recursive: true });
      await fs.writeFile(
        '/mnt/e/blog-writing-project/automation/logs/tistory-post-success.json',
        JSON.stringify(report, null, 2)
      );
      
      console.log('📊 성공 보고서가 저장되었습니다.');
      
    } else {
      throw new Error('포스트 발행 실패 - 최종 URL 확인 필요');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    if (page) {
      await saveScreenshot('99-error-state');
    }
    
    // 오류 보고서 저장
    const errorReport = {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };
    
    await fs.mkdir('/mnt/e/blog-writing-project/automation/logs', { recursive: true });
    await fs.writeFile(
      '/mnt/e/blog-writing-project/automation/logs/tistory-post-error.json',
      JSON.stringify(errorReport, null, 2)
    );
    
    throw error;
    
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔚 브라우저 종료');
    }
  }
}

// 프로그램 실행
autoPostToTistory()
  .then(() => {
    console.log('✅ 티스토리 자동 포스팅 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 실행 실패:', error.message);
    process.exit(1);
  });