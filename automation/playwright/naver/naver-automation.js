const BaseAutomation = require('../base-automation');

class NaverBlogAutomation extends BaseAutomation {
  constructor() {
    super('naver');
    this.loginUrl = 'https://nid.naver.com/nidlogin.login';
    this.blogUrl = 'https://blog.naver.com';
  }

  // 로그인 상태 확인
  async checkLoginStatus(page) {
    try {
      await page.goto(this.blogUrl, { waitUntil: 'networkidle' });
      
      // 로그인 버튼이 있으면 로그인 안된 상태
      const loginBtn = await page.$('a.btn_login');
      if (loginBtn) {
        return false;
      }
      
      // 내 블로그 메뉴가 있으면 로그인된 상태
      const myBlogMenu = await page.$('a[href*="BlogHome.naver"]');
      return !!myBlogMenu;
    } catch (error) {
      this.log(`로그인 상태 확인 실패: ${error.message}`, 'error');
      return false;
    }
  }

  // 네이버 로그인 수행
  async performLogin(page, credentials) {
    try {
      this.log('네이버 로그인 시작');
      
      // 로그인 페이지로 이동
      await page.goto(this.loginUrl, { waitUntil: 'networkidle' });
      
      // 아이디 입력
      await this.waitAndType(page, '#id', credentials.username, 100);
      await page.waitForTimeout(1000);
      
      // 비밀번호 입력
      await this.waitAndType(page, '#pw', credentials.password, 100);
      await page.waitForTimeout(1000);
      
      // 로그인 상태 유지 체크
      const keepLogin = await page.$('#keep');
      if (keepLogin) {
        await keepLogin.click();
      }
      
      // 스크린샷 (디버깅용)
      await this.saveScreenshot(page, 'before-login');
      
      // 로그인 버튼 클릭
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('#log\\.login')
      ]);
      
      // 2차 인증 확인
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      
      // 보안 문자 or 2차 인증이 필요한 경우
      if (currentUrl.includes('captcha') || currentUrl.includes('new_device')) {
        this.log('추가 인증이 필요합니다. 수동으로 완료해주세요.', 'warning');
        await this.saveScreenshot(page, 'need-verification');
        
        // 사용자가 수동으로 인증할 시간 제공 (최대 2분)
        await page.waitForNavigation({ 
          waitUntil: 'networkidle',
          timeout: 120000 
        }).catch(() => {
          this.log('인증 시간 초과', 'error');
        });
      }
      
      // 로그인 성공 확인
      const isLoggedIn = await this.checkLoginStatus(page);
      if (isLoggedIn) {
        this.log('로그인 성공!', 'success');
        
        // 쿠키 저장
        const cookies = await page.context().cookies();
        await this.saveCookies(cookies);
        
        return true;
      } else {
        throw new Error('로그인 실패');
      }
      
    } catch (error) {
      this.log(`로그인 중 오류: ${error.message}`, 'error');
      await this.saveScreenshot(page, 'login-error');
      return false;
    }
  }

  // 블로그 글쓰기
  async writePost(page, postData) {
    try {
      this.log('블로그 글쓰기 시작');
      
      // 블로그 관리 페이지로 이동
      await page.goto('https://blog.naver.com/BlogHome.naver', { 
        waitUntil: 'networkidle' 
      });
      
      // 글쓰기 버튼 클릭
      await this.safeClick(page, 'a[href*="PostWriteForm"]');
      await page.waitForTimeout(3000);
      
      // 스마트에디터 ONE이 로드될 때까지 대기
      await page.waitForSelector('.se-editor-container', { 
        visible: true,
        timeout: 10000 
      });
      
      // 제목 입력
      const titleInput = await page.$('input[placeholder*="제목"]');
      if (titleInput) {
        await titleInput.click();
        await titleInput.type(postData.title);
      }
      
      // 본문 입력 (스마트에디터)
      await page.click('.se-content-editor');
      await page.waitForTimeout(500);
      
      // HTML 모드로 전환 (더 안정적)
      const htmlBtn = await page.$('button[data-name="html"]');
      if (htmlBtn) {
        await htmlBtn.click();
        await page.waitForTimeout(1000);
        
        const htmlEditor = await page.$('.se-html-editor textarea');
        if (htmlEditor) {
          await htmlEditor.click();
          await htmlEditor.fill(postData.content);
        }
        
        // 다시 에디터 모드로
        await htmlBtn.click();
      } else {
        // HTML 버튼이 없으면 직접 입력
        await page.keyboard.type(postData.content);
      }
      
      // 태그 입력
      if (postData.tags && postData.tags.length > 0) {
        const tagInput = await page.$('input[placeholder*="태그"]');
        if (tagInput) {
          for (const tag of postData.tags) {
            await tagInput.click();
            await tagInput.type(tag);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
          }
        }
      }
      
      // 카테고리 선택
      if (postData.category) {
        const categoryBtn = await page.$('button[aria-label*="카테고리"]');
        if (categoryBtn) {
          await categoryBtn.click();
          await page.waitForTimeout(1000);
          
          // 카테고리 항목 클릭
          await this.clickByText(page, postData.category, 'li');
        }
      }
      
      // 발행 옵션 설정
      if (postData.visibility === 'private') {
        const privateBtn = await page.$('input[value="private"]');
        if (privateBtn) {
          await privateBtn.click();
        }
      }
      
      // 스크린샷 저장
      await this.saveScreenshot(page, 'before-publish');
      
      // 발행 버튼 클릭
      const publishBtn = await page.$('button:has-text("발행")');
      if (publishBtn) {
        await publishBtn.click();
        
        // 발행 확인 모달 처리
        await page.waitForTimeout(2000);
        const confirmBtn = await page.$('button:has-text("확인")');
        if (confirmBtn) {
          await confirmBtn.click();
        }
        
        this.log('글 발행 완료!', 'success');
        await page.waitForTimeout(3000);
        
        // 발행된 글 URL 가져오기
        const publishedUrl = page.url();
        this.log(`발행된 글 URL: ${publishedUrl}`);
        
        return {
          success: true,
          url: publishedUrl
        };
      }
      
      throw new Error('발행 버튼을 찾을 수 없습니다');
      
    } catch (error) {
      this.log(`글쓰기 중 오류: ${error.message}`, 'error');
      await this.saveScreenshot(page, 'write-error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 임시저장 글 목록 가져오기
  async getDrafts(page) {
    try {
      await page.goto('https://blog.naver.com/PostList.naver?blogId=&categoryNo=0&from=postList', {
        waitUntil: 'networkidle'
      });
      
      // 임시저장 탭 클릭
      await this.clickByText(page, '임시저장', 'a');
      await page.waitForTimeout(2000);
      
      const drafts = await page.$$eval('.post-list-item', items => {
        return items.map(item => ({
          title: item.querySelector('.title')?.textContent?.trim(),
          date: item.querySelector('.date')?.textContent?.trim(),
          id: item.querySelector('a')?.href?.match(/logNo=(\d+)/)?.[1]
        }));
      });
      
      return drafts;
    } catch (error) {
      this.log(`임시저장 목록 조회 실패: ${error.message}`, 'error');
      return [];
    }
  }
}

module.exports = NaverBlogAutomation;