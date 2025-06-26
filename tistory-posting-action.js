require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * GitHub Actions용 티스토리 자동 포스팅 스크립트
 * CI/CD 환경에서 실행 가능하도록 최적화
 */
class TistoryAutoPoster {
  constructor() {
    this.credentials = {
      email: process.env.KAKAO_EMAIL || 'beastrongman@daum.net',
      password: process.env.KAKAO_PASSWORD || 'King8160!'
    };
    
    this.postData = {
      title: '2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석',
      tags: '일본여행,나라여행,홋카이도여행,소도시여행,2025년여행',
      category: '여행'
    };
  }

  async readPostContent() {
    try {
      const postPath = path.join(__dirname, 'posts', '2025-japan-small-city-travel-tistory.md');
      const content = await fs.readFile(postPath, 'utf8');
      
      // 마크다운을 HTML로 간단 변환
      const htmlContent = content
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.+)$/gm, '<p>$1</p>');
      
      return htmlContent;
    } catch (error) {
      console.error('포스트 내용 읽기 실패:', error.message);
      return null;
    }
  }

  async launchBrowser() {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    });
    
    return browser;
  }

  async loginToTistory(page) {
    console.log('🔐 티스토리 로그인 시작...');
    
    // 로그인 페이지로 이동
    await page.goto('https://www.tistory.com/auth/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // 카카오 로그인 버튼 클릭
    const kakaoBtn = await page.$('a.btn_login.link_kakao_id');
    if (!kakaoBtn) {
      throw new Error('카카오 로그인 버튼을 찾을 수 없습니다');
    }
    
    await kakaoBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // 카카오 로그인 정보 입력
    await page.waitForTimeout(2000);
    
    // 이메일 입력
    const emailSelectors = ['#loginId--1', '#id_email_2', 'input[name="email"]'];
    let emailInput = null;
    
    for (const selector of emailSelectors) {
      emailInput = await page.$(selector);
      if (emailInput) break;
    }
    
    if (!emailInput) {
      throw new Error('이메일 입력 필드를 찾을 수 없습니다');
    }
    
    await emailInput.type(this.credentials.email);
    console.log('✅ 이메일 입력 완료');
    
    // 비밀번호 입력
    const passwordSelectors = ['#password--2', '#id_password_3', 'input[name="password"]'];
    let passwordInput = null;
    
    for (const selector of passwordSelectors) {
      passwordInput = await page.$(selector);
      if (passwordInput) break;
    }
    
    if (!passwordInput) {
      throw new Error('비밀번호 입력 필드를 찾을 수 없습니다');
    }
    
    await passwordInput.type(this.credentials.password);
    console.log('✅ 비밀번호 입력 완료');
    
    // 로그인 버튼 클릭
    const loginSelectors = ['button[type="submit"]', '.btn_g.highlight'];
    let loginBtn = null;
    
    for (const selector of loginSelectors) {
      loginBtn = await page.$(selector);
      if (loginBtn) break;
    }
    
    if (!loginBtn) {
      throw new Error('로그인 버튼을 찾을 수 없습니다');
    }
    
    await loginBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('✅ 로그인 완료');
    return true;
  }

  async writePost(page, content) {
    console.log('📝 포스트 작성 시작...');
    
    // 글쓰기 페이지로 이동
    await page.goto('https://www.tistory.com/manage/newpost/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // 제목 입력
    const titleSelectors = ['input[name="title"]', '#title', '.title-input'];
    let titleInput = null;
    
    for (const selector of titleSelectors) {
      titleInput = await page.$(selector);
      if (titleInput) break;
    }
    
    if (titleInput) {
      await titleInput.click();
      await titleInput.clear();
      await titleInput.type(this.postData.title);
      console.log('✅ 제목 입력 완료');
    }
    
    // 내용 입력 (에디터 종류에 따라 다른 방식 시도)
    const contentSelectors = [
      '.cke_wysiwyg_frame',
      '#content',
      '.editor-content',
      'iframe[title="Rich Text Area"]'
    ];
    
    let contentInserted = false;
    
    for (const selector of contentSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          if (selector.includes('iframe')) {
            // iframe 에디터의 경우
            const frame = await element.contentFrame();
            const body = await frame.$('body');
            if (body) {
              await body.click();
              await frame.evaluate((content) => {
                document.body.innerHTML = content;
              }, content);
              contentInserted = true;
              break;
            }
          } else {
            // 일반 에디터의 경우
            await element.click();
            await page.evaluate((selector, content) => {
              const el = document.querySelector(selector);
              if (el) {
                el.innerHTML = content;
              }
            }, selector, content);
            contentInserted = true;
            break;
          }
        }
      } catch (error) {
        console.log(`${selector} 시도 실패: ${error.message}`);
      }
    }
    
    if (contentInserted) {
      console.log('✅ 내용 입력 완료');
    } else {
      console.log('⚠️ 내용 입력 실패 - 수동으로 처리 필요');
    }
    
    // 태그 입력
    const tagSelectors = ['input[name="tag"]', '#tag', '.tag-input'];
    let tagInput = null;
    
    for (const selector of tagSelectors) {
      tagInput = await page.$(selector);
      if (tagInput) break;
    }
    
    if (tagInput) {
      await tagInput.click();
      await tagInput.type(this.postData.tags);
      console.log('✅ 태그 입력 완료');
    }
    
    return true;
  }

  async publishPost(page) {
    console.log('🚀 포스트 발행 시작...');
    
    // 임시저장 먼저 (안전장치)
    const saveSelectors = ['.btn-save', '#save', 'button:contains("임시저장")'];
    for (const selector of saveSelectors) {
      try {
        const saveBtn = await page.$(selector);
        if (saveBtn) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          console.log('✅ 임시저장 완료');
          break;
        }
      } catch (error) {
        // 임시저장 실패해도 계속 진행
      }
    }
    
    // 발행 버튼 클릭
    const publishSelectors = [
      '.btn-publish',
      '#publish',
      'button:contains("발행")',
      'input[value="발행"]'
    ];
    
    let published = false;
    
    for (const selector of publishSelectors) {
      try {
        const publishBtn = await page.$(selector);
        if (publishBtn) {
          await publishBtn.click();
          await page.waitForTimeout(3000);
          
          // 발행 확인
          const currentUrl = page.url();
          if (!currentUrl.includes('newpost')) {
            published = true;
            console.log(`✅ 포스트 발행 완료: ${currentUrl}`);
            break;
          }
        }
      } catch (error) {
        console.log(`발행 시도 실패: ${error.message}`);
      }
    }
    
    return published;
  }

  async run() {
    let browser = null;
    
    try {
      console.log('🎯 티스토리 자동 포스팅 시작');
      console.log('=' .repeat(50));
      
      // 포스트 내용 읽기
      const content = await this.readPostContent();
      if (!content) {
        throw new Error('포스트 내용을 읽을 수 없습니다');
      }
      
      // 브라우저 시작
      browser = await this.launchBrowser();
      const page = await browser.newPage();
      
      // User-Agent 설정
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 로그인
      await this.loginToTistory(page);
      
      // 포스트 작성
      await this.writePost(page, content);
      
      // 발행
      const published = await this.publishPost(page);
      
      if (published) {
        console.log('🎉 티스토리 자동 포스팅 성공!');
        return { success: true, url: page.url() };
      } else {
        console.log('⚠️ 발행 단계에서 문제 발생');
        return { success: false, reason: '발행 실패' };
      }
      
    } catch (error) {
      console.error('❌ 자동 포스팅 실패:', error.message);
      return { success: false, reason: error.message };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

// GitHub Actions 환경에서 실행
if (require.main === module) {
  const poster = new TistoryAutoPoster();
  poster.run().then(result => {
    if (result.success) {
      console.log('✅ 자동 포스팅 완료');
      process.exit(0);
    } else {
      console.error('❌ 자동 포스팅 실패:', result.reason);
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ 실행 중 오류:', error);
    process.exit(1);
  });
}

module.exports = TistoryAutoPoster;