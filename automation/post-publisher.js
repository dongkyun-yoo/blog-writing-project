require('dotenv').config();
const SessionManager = require('./session-manager');
const fs = require('fs').promises;
const path = require('path');

/**
 * 포스트 발행 시스템
 * 세션을 활용하여 블로그 플랫폼에 자동으로 포스트를 발행
 */
class PostPublisher {
  constructor() {
    this.sessionManager = new SessionManager();
    this.postsDir = path.join(__dirname, '../posts');
    this.draftsDir = path.join(__dirname, '../drafts');
    this.templatesDir = path.join(__dirname, '../templates');
    
    // 플랫폼별 발행 URL
    this.publishUrls = {
      tistory: 'https://www.tistory.com/manage/newpost/',
      naver: 'https://blog.naver.com/PostWriteForm.naver',
      velog: 'https://velog.io/write',
      medium: 'https://medium.com/new-story'
    };
    
    // 플랫폼별 선택자
    this.selectors = {
      tistory: {
        title: '#post-title, input[name="title"]',
        content: '#post-content, .cke_wysiwyg_frame, #content',
        category: '#post-category, select[name="category"]',
        tags: '#post-tags, input[name="tag"]',
        publishBtn: '#publish-btn, .btn-publish, button[type="submit"]',
        visibility: '#visibility, select[name="visibility"]'
      },
      naver: {
        title: '#title, input[name="title"]',
        content: '#content, .se-content',
        category: '#categoryId, select[name="categoryId"]',
        tags: '#tag, input[name="tag"]',
        publishBtn: '#publish, .btn_register',
        visibility: '#openType, select[name="openType"]'
      }
    };
  }

  /**
   * 초기화
   */
  async initialize() {
    await this.sessionManager.initialize();
    
    const dirs = [this.postsDir, this.draftsDir];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.log(`📁 디렉토리 이미 존재: ${dir}`);
      }
    }
    
    console.log('✅ 포스트 발행 시스템 초기화 완료');
  }

  /**
   * 마크다운 파일 읽기 및 파싱
   */
  async readMarkdownPost(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Front Matter 파싱 (간단한 YAML 헤더)
      const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
      
      if (frontMatterMatch) {
        const frontMatter = this.parseFrontMatter(frontMatterMatch[1]);
        const markdown = frontMatterMatch[2];
        
        return {
          frontMatter,
          content: markdown,
          title: frontMatter.title || 'Untitled',
          tags: frontMatter.tags || [],
          category: frontMatter.category || 'general',
          visibility: frontMatter.visibility || 'public'
        };
      } else {
        // Front Matter가 없는 경우 첫 번째 제목을 타이틀로 사용
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : 'Untitled';
        
        return {
          frontMatter: {},
          content,
          title,
          tags: [],
          category: 'general',
          visibility: 'public'
        };
      }
    } catch (error) {
      console.error('❌ 마크다운 파일 읽기 실패:', error.message);
      return null;
    }
  }

  /**
   * 간단한 YAML Front Matter 파서
   */
  parseFrontMatter(yamlString) {
    const result = {};
    
    yamlString.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        
        // 배열 처리 (tags 등)
        if (value.startsWith('[') && value.endsWith(']')) {
          result[key] = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
        } else {
          result[key] = value.replace(/['"]/g, '');
        }
      }
    });
    
    return result;
  }

  /**
   * 마크다운을 HTML로 변환 (간단한 변환)
   */
  markdownToHtml(markdown) {
    return markdown
      // 제목
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // 강조
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 링크
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      // 이미지
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
      // 줄바꿈
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      // 문단 감싸기
      .replace(/^(.+)$/gm, '<p>$1</p>');
  }

  /**
   * 플랫폼별 포스트 발행 (MCP 명령어 생성)
   */
  async publishPost(platform, postPath, options = {}) {
    try {
      console.log(`📝 ${platform}에 포스트 발행 시작: ${postPath}`);
      
      // 1. 세션 유효성 확인
      const sessionCheck = await this.sessionManager.verifySession(platform);
      if (!sessionCheck.valid) {
        console.error(`❌ ${platform} 세션이 유효하지 않습니다: ${sessionCheck.reason}`);
        return {
          success: false,
          reason: `세션 오류: ${sessionCheck.reason}`,
          needLogin: true
        };
      }
      
      // 2. 포스트 파일 읽기
      const post = await this.readMarkdownPost(postPath);
      if (!post) {
        return {
          success: false,
          reason: '포스트 파일 읽기 실패'
        };
      }
      
      // 3. 플랫폼별 HTML 변환
      const htmlContent = this.markdownToHtml(post.content);
      
      // 4. MCP Playwright 명령어 생성
      const mcpCommands = this.generateMCPCommands(platform, post, htmlContent, options);
      
      console.log('🎭 Playwright MCP 명령어:');
      console.log(mcpCommands.instructions);
      
      return {
        success: true,
        mcpCommands,
        post,
        platform
      };
      
    } catch (error) {
      console.error(`❌ ${platform} 포스트 발행 실패:`, error.message);
      return {
        success: false,
        reason: error.message
      };
    }
  }

  /**
   * MCP Playwright 명령어 생성
   */
  generateMCPCommands(platform, post, htmlContent, options = {}) {
    const url = this.publishUrls[platform];
    const selectors = this.selectors[platform] || this.selectors.tistory;
    
    const instructions = `
Playwright MCP를 사용해서 ${platform}에 포스트를 발행해주세요:

1. 세션 복원 및 페이지 이동:
   - 저장된 세션을 사용해서 브라우저 시작
   - ${url} 페이지로 이동
   - 로그인 상태 확인

2. 포스트 정보 입력:
   - 제목 입력 (선택자: ${selectors.title}): "${post.title}"
   - 내용 입력 (선택자: ${selectors.content}): 
     ${htmlContent.slice(0, 200)}...
   
3. 메타데이터 설정:
   - 카테고리 선택 (선택자: ${selectors.category}): "${post.category}"
   - 태그 입력 (선택자: ${selectors.tags}): "${post.tags.join(', ')}"
   - 공개 설정 (선택자: ${selectors.visibility}): "${post.visibility}"

4. 발행 실행:
   - 미리보기 확인
   - 발행 버튼 클릭 (선택자: ${selectors.publishBtn})
   - 발행 완료 확인

5. 결과 저장:
   - 발행된 포스트 URL 캡처
   - 최종 스크린샷 저장
   - 성공/실패 결과 리포트

각 단계별로 스크린샷을 찍어서 진행상황을 확인해주세요.
`;

    return {
      instructions,
      platform,
      url,
      selectors,
      post: {
        title: post.title,
        content: htmlContent,
        category: post.category,
        tags: post.tags,
        visibility: post.visibility
      },
      options
    };
  }

  /**
   * 사용 가능한 포스트 목록 조회
   */
  async listAvailablePosts() {
    const posts = {};
    
    try {
      // posts 디렉토리 스캔
      const postFiles = await fs.readdir(this.postsDir);
      posts.published = postFiles.filter(file => file.endsWith('.md'));
      
      // drafts 디렉토리 스캔
      try {
        const draftFiles = await fs.readdir(this.draftsDir);
        posts.drafts = draftFiles.filter(file => file.endsWith('.md'));
      } catch {
        posts.drafts = [];
      }
      
    } catch (error) {
      console.error('❌ 포스트 목록 조회 실패:', error.message);
      posts.published = [];
      posts.drafts = [];
    }
    
    return posts;
  }

  /**
   * 포스트 발행 상태 확인
   */
  async showStatus() {
    console.log('\n📊 포스트 발행 시스템 상태');
    console.log('=' .repeat(50));
    
    // 세션 상태
    const sessions = await this.sessionManager.listSessions();
    console.log('🔐 세션 상태:');
    Object.entries(sessions).forEach(([platform, status]) => {
      const icon = status.valid ? '✅' : '❌';
      console.log(`  ${icon} ${platform}: ${status.reason}`);
    });
    
    console.log('');
    
    // 포스트 목록
    const posts = await this.listAvailablePosts();
    console.log('📝 포스트 목록:');
    console.log(`  발행됨: ${posts.published.length}개`);
    console.log(`  초안: ${posts.drafts.length}개`);
    
    if (posts.published.length > 0) {
      console.log('  최근 포스트:');
      posts.published.slice(-3).forEach(post => {
        console.log(`    - ${post}`);
      });
    }
    
    console.log('=' .repeat(50));
    
    return { sessions, posts };
  }

  /**
   * 발행 가이드 표시
   */
  showPublishGuide() {
    console.log('\n📋 포스트 발행 가이드');
    console.log('=' .repeat(50));
    console.log('1. 포스트 파일을 posts/ 또는 drafts/ 디렉토리에 준비');
    console.log('2. Front Matter로 메타데이터 설정:');
    console.log('   ---');
    console.log('   title: "포스트 제목"');
    console.log('   category: "카테고리"');
    console.log('   tags: ["태그1", "태그2"]');
    console.log('   visibility: "public"');
    console.log('   ---');
    console.log('3. publishPost() 메서드 호출');
    console.log('4. 생성된 MCP 명령어를 Claude에게 전달');
    console.log('=' .repeat(50));
  }
}

module.exports = PostPublisher;

// 직접 실행 시 상태 확인
if (require.main === module) {
  const publisher = new PostPublisher();
  
  (async () => {
    await publisher.initialize();
    await publisher.showStatus();
    publisher.showPublishGuide();
  })();
}