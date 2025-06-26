const BaseAutomation = require('../base-automation');

class TistoryAutomation extends BaseAutomation {
  constructor() {
    super('tistory');
    this.loginUrl = 'https://www.tistory.com/auth/login';
    this.adminUrl = 'https://www.tistory.com/manage';
  }

  // 로그인 상태 확인
  async checkLoginStatus(page) {
    try {
      await page.goto(this.adminUrl, { waitUntil: 'networkidle' });
      
      // 로그인 페이지로 리다이렉트되면 로그인 안된 상태
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/login')) {
        return false;
      }
      
      // 관리자 페이지 요소 확인
      const manageMenu = await page.$('.menu-manage');
      return !!manageMenu;
    } catch (error) {
      this.log(`로그인 상태 확인 실패: ${error.message}`, 'error');
      return false;
    }
  }

  // 티스토리 로그인 (Kakao 계정 - Playwright MCP 전용)
  async performLogin(page, credentials) {
    try {
      this.log('티스토리 로그인 시작 (Kakao 계정 - Playwright MCP)');
      
      // 로그인 페이지로 이동
      await page.goto(this.loginUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // 다양한 Kakao 로그인 버튼 선택자 시도
      const kakaoSelectors = [
        'a.btn_login.link_kakao_id',
        'a[href*="kakao"]',
        '.btn_kakao',
        'button:has-text("카카오")',
        'a:has-text("카카오로 로그인")'
      ];
      
      let kakaoLoginBtn = null;
      for (const selector of kakaoSelectors) {
        kakaoLoginBtn = await page.$(selector);
        if (kakaoLoginBtn) {
          this.log(`Kakao 로그인 버튼 발견: ${selector}`);
          break;
        }
      }
      
      if (!kakaoLoginBtn) {
        // 스크린샷으로 현재 페이지 확인
        await this.saveScreenshot(page, 'no-kakao-button');
        throw new Error('Kakao 로그인 버튼을 찾을 수 없습니다');
      }
      
      // Kakao 로그인 클릭
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        kakaoLoginBtn.click()
      ]);
      
      await page.waitForTimeout(2000);
      
      // Kakao 로그인 페이지의 다양한 입력 필드 시도
      const idSelectors = [
        '#loginId--1',
        '#id_email_2',
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="아이디"]',
        'input[placeholder*="이메일"]'
      ];
      
      const pwSelectors = [
        '#password--2', 
        '#id_password_3',
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="비밀번호"]'
      ];
      
      // 아이디 입력 필드 찾기
      let idInput = null;
      for (const selector of idSelectors) {
        try {
          await page.waitForSelector(selector, { visible: true, timeout: 3000 });
          idInput = await page.$(selector);
          if (idInput) {
            this.log(`ID 입력 필드 발견: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!idInput) {
        await this.saveScreenshot(page, 'no-id-field');
        throw new Error('아이디 입력 필드를 찾을 수 없습니다');
      }
      
      // 아이디 입력
      await idInput.click();
      await idInput.fill(''); // 기존 내용 삭제
      await idInput.type(credentials.username, { delay: 100 });
      await page.waitForTimeout(1000);
      
      // 비밀번호 입력 필드 찾기
      let pwInput = null;
      for (const selector of pwSelectors) {
        pwInput = await page.$(selector);
        if (pwInput) {
          this.log(`비밀번호 입력 필드 발견: ${selector}`);
          break;
        }
      }
      
      if (!pwInput) {
        await this.saveScreenshot(page, 'no-pw-field');
        throw new Error('비밀번호 입력 필드를 찾을 수 없습니다');
      }
      
      // 비밀번호 입력
      await pwInput.click();
      await pwInput.fill(''); // 기존 내용 삭제
      await pwInput.type(credentials.password, { delay: 100 });
      await page.waitForTimeout(1000);
      
      // 로그인 상태 유지 체크박스
      const keepLoginSelectors = [
        '#keepLogin',
        'input[name="stay"]',
        'input[type="checkbox"]'
      ];
      
      for (const selector of keepLoginSelectors) {
        const keepLogin = await page.$(selector);
        if (keepLogin) {
          const isChecked = await keepLogin.isChecked();
          if (!isChecked) {
            await keepLogin.click();
            this.log('로그인 상태 유지 체크');
          }
          break;
        }
      }
      
      // 로그인 전 스크린샷
      await this.saveScreenshot(page, 'before-kakao-login');
      
      // 로그인 버튼 찾기 및 클릭
      const loginBtnSelectors = [
        '.btn_g.highlight.submit',
        'button[type="submit"]',
        '.submit_btn',
        'button:has-text("로그인")',
        '.login_btn'
      ];
      
      let loginBtn = null;
      for (const selector of loginBtnSelectors) {
        loginBtn = await page.$(selector);
        if (loginBtn) {
          this.log(`로그인 버튼 발견: ${selector}`);
          break;
        }
      }
      
      if (!loginBtn) {
        await this.saveScreenshot(page, 'no-login-button');
        throw new Error('로그인 버튼을 찾을 수 없습니다');
      }
      
      // 로그인 버튼 클릭
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
        loginBtn.click()
      ]);
      
      // 추가 인증 처리
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      
      // 다양한 추가 인증 페이지 감지
      if (currentUrl.includes('auth/verify') || 
          currentUrl.includes('auth/device') ||
          currentUrl.includes('captcha') ||
          currentUrl.includes('verification')) {
        
        this.log('추가 인증이 필요합니다. 수동으로 완료해주세요.', 'warning');
        await this.saveScreenshot(page, 'need-verification');
        
        // 사용자 수동 인증 대기 (최대 3분)
        this.log('수동 인증을 위해 3분간 대기합니다...', 'info');
        
        try {
          await page.waitForNavigation({ 
            waitUntil: 'networkidle',
            timeout: 180000 // 3분
          });
        } catch (e) {
          this.log('인증 시간 초과. 계속 진행합니다.', 'warning');
        }
      }
      
      // 최종 로그인 상태 확인
      await page.waitForTimeout(3000);
      const finalUrl = page.url();
      
      // 성공 조건 확인
      if (finalUrl.includes('tistory.com') && 
          !finalUrl.includes('/auth/') && 
          !finalUrl.includes('/login')) {
        
        this.log('티스토리 로그인 성공!', 'success');
        
        // 쿠키 저장
        const cookies = await page.context().cookies();
        await this.saveCookies(cookies);
        
        // 최종 성공 스크린샷
        await this.saveScreenshot(page, 'login-success');
        
        return true;
      } else {
        throw new Error(`로그인 실패 - 현재 URL: ${finalUrl}`);
      }
      
    } catch (error) {
      this.log(`로그인 중 오류: ${error.message}`, 'error');
      await this.saveScreenshot(page, 'login-error');
      throw error;
    }
  }

  // 티스토리 글쓰기 (Playwright MCP 전용)
  async writePost(page, postData) {
    try {
      this.log('티스토리 글쓰기 시작 (Playwright MCP)');
      
      // 관리 페이지로 이동
      await page.goto(this.adminUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // 블로그 선택 (여러 블로그가 있을 경우)
      if (postData.blogName) {
        const blogSelector = await page.$(`a[href*="${postData.blogName}"]`);
        if (blogSelector) {
          await blogSelector.click();
          await page.waitForTimeout(2000);
        }
      }
      
      // 다양한 글쓰기 버튼 선택자 시도
      const writeBtnSelectors = [
        'a.btn_write',
        'a[href*="/manage/newpost"]',
        'a[href*="/post/write"]', 
        'button:has-text("글쓰기")',
        '.write-btn',
        '.btn-write'
      ];
      
      let writeBtn = null;
      for (const selector of writeBtnSelectors) {
        writeBtn = await page.$(selector);
        if (writeBtn) {
          this.log(`글쓰기 버튼 발견: ${selector}`);
          break;
        }
      }
      
      if (!writeBtn) {
        await this.saveScreenshot(page, 'no-write-button');
        throw new Error('글쓰기 버튼을 찾을 수 없습니다');
      }
      
      await writeBtn.click();
      await page.waitForTimeout(3000);
      
      // 에디터 로딩 대기 (다양한 선택자 시도)
      const editorSelectors = [
        '#editorContainer',
        '.editor-container',
        '.post-editor',
        '.editor-wrap',
        '.tt_editor_wrap'
      ];
      
      let editorFound = false;
      for (const selector of editorSelectors) {
        try {
          await page.waitForSelector(selector, { visible: true, timeout: 5000 });
          editorFound = true;
          this.log(`에디터 발견: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!editorFound) {
        this.log('표준 에디터를 찾지 못했지만 계속 진행합니다', 'warning');
      }
      
      // 제목 입력 (다양한 선택자 시도)
      const titleSelectors = [
        'input[name="title"]',
        '#title-input',
        '.title-input',
        'input[placeholder*="제목"]',
        '.post-title input'
      ];
      
      let titleInput = null;
      for (const selector of titleSelectors) {
        titleInput = await page.$(selector);
        if (titleInput) {
          this.log(`제목 입력 필드 발견: ${selector}`);
          break;
        }
      }
      
      if (titleInput) {
        await titleInput.click();
        await titleInput.fill(''); // 기존 내용 삭제
        await titleInput.type(postData.title, { delay: 50 });
        await page.waitForTimeout(1000);
      } else {
        this.log('제목 입력 필드를 찾을 수 없습니다', 'warning');
      }
      
      // 카테고리 선택
      if (postData.category) {
        const categorySelectors = [
          '.btn-category',
          'button[aria-label*="카테고리"]',
          '.category-selector',
          'select[name="category"]'
        ];
        
        for (const selector of categorySelectors) {
          const categoryBtn = await page.$(selector);
          if (categoryBtn) {
            await categoryBtn.click();
            await page.waitForTimeout(1000);
            
            // 카테고리 항목 선택
            const categoryItem = await page.$(`text="${postData.category}"`);
            if (categoryItem) {
              await categoryItem.click();
              this.log(`카테고리 선택: ${postData.category}`);
            }
            break;
          }
        }
      }
      
      // 본문 입력 (여러 에디터 타입 지원)
      await this.insertContent(page, postData.content);
      
      // 태그 입력
      if (postData.tags && postData.tags.length > 0) {
        await this.insertTags(page, postData.tags);
      }
      
      // 공개 설정
      if (postData.visibility) {
        await this.setVisibility(page, postData.visibility);
      }
      
      // 발행 전 스크린샷
      await this.saveScreenshot(page, 'before-publish');
      
      // 발행 버튼 찾기 및 클릭
      const publishResult = await this.publishPost(page);
      
      if (publishResult.success) {
        this.log('글 발행 완료!', 'success');
        await this.saveScreenshot(page, 'publish-success');
        return publishResult;
      } else {
        throw new Error(publishResult.error);
      }
      
    } catch (error) {
      this.log(`글쓰기 중 오류: ${error.message}`, 'error');
      await this.saveScreenshot(page, 'write-error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 본문 내용 입력 헬퍼
  async insertContent(page, content) {
    const contentMethods = [
      // 1. 마크다운 에디터
      async () => {
        const mdSelectors = [
          '.CodeMirror',
          '.markdown-editor',
          '.md-editor textarea'
        ];
        
        for (const selector of mdSelectors) {
          const mdEditor = await page.$(selector);
          if (mdEditor) {
            await mdEditor.click();
            await page.keyboard.type(content);
            this.log('마크다운 에디터 사용');
            return true;
          }
        }
        return false;
      },

      // 2. 리치 텍스트 에디터
      async () => {
        const richSelectors = [
          '[contenteditable="true"]',
          '.editor-content',
          '.post-content'
        ];
        
        for (const selector of richSelectors) {
          const richEditor = await page.$(selector);
          if (richEditor) {
            await richEditor.click();
            await richEditor.fill(content);
            this.log('리치 텍스트 에디터 사용');
            return true;
          }
        }
        return false;
      },

      // 3. iframe 에디터
      async () => {
        const iframeEditor = await page.$('.tt_editor_wrap iframe, iframe[title*="에디터"]');
        if (iframeEditor) {
          const frame = await iframeEditor.contentFrame();
          if (frame) {
            await frame.click('body');
            await frame.type('body', content);
            this.log('iframe 에디터 사용');
            return true;
          }
        }
        return false;
      },

      // 4. 텍스트 영역
      async () => {
        const textareaSelectors = [
          'textarea[name="content"]',
          'textarea.editor',
          '.editor textarea'
        ];
        
        for (const selector of textareaSelectors) {
          const textarea = await page.$(selector);
          if (textarea) {
            await textarea.click();
            await textarea.fill(content);
            this.log('텍스트 영역 사용');
            return true;
          }
        }
        return false;
      }
    ];

    // 각 방법 시도
    for (const method of contentMethods) {
      if (await method()) {
        return true;
      }
    }
    
    throw new Error('지원되는 에디터를 찾을 수 없습니다');
  }

  // 태그 입력 헬퍼
  async insertTags(page, tags) {
    const tagSelectors = [
      'input[name="tag"]',
      '.tag-input',
      'input[placeholder*="태그"]'
    ];
    
    for (const selector of tagSelectors) {
      const tagInput = await page.$(selector);
      if (tagInput) {
        for (const tag of tags) {
          await tagInput.click();
          await tagInput.type(tag);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }
        this.log(`태그 입력: ${tags.join(', ')}`);
        return true;
      }
    }
    
    this.log('태그 입력 필드를 찾을 수 없습니다', 'warning');
    return false;
  }

  // 공개 설정 헬퍼
  async setVisibility(page, visibility) {
    const visibilitySelectors = [
      '.btn-privacy',
      'button[aria-label*="공개"]',
      '.visibility-btn'
    ];
    
    for (const selector of visibilitySelectors) {
      const visibilityBtn = await page.$(selector);
      if (visibilityBtn) {
        await visibilityBtn.click();
        await page.waitForTimeout(1000);
        
        const visibilityMap = {
          'public': ['공개', '전체공개'],
          'private': ['비공개', '나만보기'],
          'protected': ['보호', '비밀번호']
        };
        
        const options = visibilityMap[visibility] || ['공개'];
        
        for (const option of options) {
          const visibilityOption = await page.$(`text="${option}"`);
          if (visibilityOption) {
            await visibilityOption.click();
            this.log(`공개 설정: ${option}`);
            return true;
          }
        }
      }
    }
    
    this.log('공개 설정 옵션을 찾을 수 없습니다', 'warning');
    return false;
  }

  // 발행 헬퍼
  async publishPost(page) {
    const publishSelectors = [
      'button:has-text("발행")',
      'button:has-text("완료")',
      'button:has-text("저장")',
      '.btn_save',
      '.btn-publish',
      'button[type="submit"]'
    ];
    
    for (const selector of publishSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        this.log(`발행 버튼 클릭: ${selector}`);
        
        // 발행 완료 대기
        await page.waitForTimeout(3000);
        
        // URL 슬러그 설정 모달 처리
        const slugModal = await page.$('.modal-slug, .url-setting');
        if (slugModal) {
          const confirmBtn = await page.$('button:has-text("확인")');
          if (confirmBtn) {
            await confirmBtn.click();
          }
        }
        
        // 성공 확인
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        
        if (currentUrl.includes('/manage/posts') || 
            currentUrl.includes('/admin/') ||
            currentUrl.includes('/posts')) {
          
          return {
            success: true,
            message: '글이 성공적으로 발행되었습니다',
            url: currentUrl
          };
        }
        
        // 실제 글 URL 찾기
        const viewBtn = await page.$('a:has-text("보기"), a.link_view, a[target="_blank"]');
        if (viewBtn) {
          const postUrl = await viewBtn.getAttribute('href');
          return {
            success: true,
            url: postUrl,
            message: '글이 성공적으로 발행되었습니다'
          };
        }
        
        return {
          success: true,
          message: '글이 발행되었습니다'
        };
      }
    }
    
    return {
      success: false,
      error: '발행 버튼을 찾을 수 없습니다'
    };
  }

  // 블로그 목록 가져오기
  async getBlogs(page) {
    try {
      await page.goto(this.adminUrl, { waitUntil: 'networkidle' });
      
      const blogs = await page.$$eval('.list_blog a', links => {
        return links.map(link => ({
          name: link.textContent.trim(),
          url: link.href
        }));
      });
      
      return blogs;
    } catch (error) {
      this.log(`블로그 목록 조회 실패: ${error.message}`, 'error');
      return [];
    }
  }

  // 최근 글 목록 가져오기
  async getRecentPosts(page, limit = 5) {
    try {
      await page.goto(`${this.adminUrl}/posts`, { waitUntil: 'networkidle' });
      
      const posts = await page.$$eval('.post-item', (items, limit) => {
        return items.slice(0, limit).map(item => ({
          title: item.querySelector('.title')?.textContent?.trim(),
          date: item.querySelector('.date')?.textContent?.trim(),
          url: item.querySelector('a')?.href
        }));
      }, limit);
      
      return posts;
    } catch (error) {
      this.log(`글 목록 조회 실패: ${error.message}`, 'error');
      return [];
    }
  }
}

module.exports = TistoryAutomation;