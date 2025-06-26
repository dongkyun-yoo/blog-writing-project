const TistoryAPI = require('../../login/tistory/tistory-api');
const TistoryAuth = require('../../login/tistory/tistory-auth');
const TistoryAutomation = require('./tistory-automation');

/**
 * 티스토리 하이브리드 자동화
 * OAuth API가 가능한 경우 API 사용, 불가능한 경우 브라우저 자동화
 */
class TistoryHybrid {
  constructor(config) {
    this.config = config;
    this.useAPI = config.useAPI !== false; // 기본값 true
    this.apiAuth = null;
    this.api = null;
    this.automation = new TistoryAutomation();
  }

  // 초기화
  async initialize() {
    if (this.useAPI && this.config.clientId && this.config.clientSecret) {
      try {
        // API 인증 시도
        this.apiAuth = new TistoryAuth({
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
          redirectUri: this.config.redirectUri || 'http://localhost:3000/callback',
          blogName: this.config.blogName
        });

        const token = await this.apiAuth.loadToken();
        if (token && await this.apiAuth.validateToken(token.access_token)) {
          this.api = new TistoryAPI(token.access_token, this.config.blogName);
          console.log('✅ 티스토리 API 사용 가능');
          return { method: 'api', ready: true };
        }
      } catch (error) {
        console.log('⚠️ API 초기화 실패, 브라우저 자동화로 전환');
      }
    }

    // 브라우저 자동화 준비
    console.log('🎭 브라우저 자동화 모드 사용');
    return { method: 'browser', ready: true };
  }

  // 로그인
  async login(credentials) {
    if (this.api) {
      // 이미 API 인증됨
      return { success: true, method: 'api' };
    }

    if (this.useAPI && this.apiAuth) {
      try {
        const token = await this.apiAuth.authenticate();
        this.api = new TistoryAPI(token, this.config.blogName);
        return { success: true, method: 'api' };
      } catch (error) {
        console.log('API 인증 실패, 브라우저 사용');
      }
    }

    // 브라우저 자동화는 playwright-runner.js를 통해 실행
    return {
      success: false,
      method: 'browser',
      message: 'playwright-runner.js를 사용하여 브라우저 로그인을 실행하세요'
    };
  }

  // 글쓰기
  async writePost(postData) {
    // API 사용 가능한 경우
    if (this.api) {
      try {
        const result = await this.api.writePost({
          title: postData.title,
          content: postData.content,
          category: postData.category || '0',
          tags: postData.tags || [],
          visibility: this.mapVisibility(postData.visibility),
          acceptComment: postData.acceptComment || '1',
          published: postData.published || new Date().toISOString()
        });

        return {
          success: true,
          method: 'api',
          postId: result.postId,
          url: result.url
        };
      } catch (error) {
        console.error('API 글쓰기 실패:', error.message);
        
        // API 실패시 브라우저 자동화로 폴백
        if (this.config.fallbackToBrowser) {
          console.log('브라우저 자동화로 재시도...');
          return {
            success: false,
            method: 'browser',
            message: 'playwright-runner.js를 사용하여 글쓰기를 실행하세요'
          };
        }
        
        throw error;
      }
    }

    // 브라우저 자동화 사용
    return {
      success: false,
      method: 'browser',
      message: 'playwright-runner.js를 사용하여 글쓰기를 실행하세요'
    };
  }

  // 글 목록 조회
  async getPosts(page = 1, count = 10) {
    if (this.api) {
      try {
        const result = await this.api.getRecentPosts(page, count);
        return {
          success: true,
          method: 'api',
          posts: result.item.posts
        };
      } catch (error) {
        console.error('API 글 목록 조회 실패:', error.message);
      }
    }

    return {
      success: false,
      method: 'browser',
      message: 'API를 사용할 수 없습니다'
    };
  }

  // 카테고리 목록 조회
  async getCategories() {
    if (this.api) {
      try {
        const result = await this.api.getCategories();
        return {
          success: true,
          method: 'api',
          categories: result.item.category
        };
      } catch (error) {
        console.error('API 카테고리 조회 실패:', error.message);
      }
    }

    return {
      success: false,
      method: 'browser',
      message: 'API를 사용할 수 없습니다'
    };
  }

  // 공개 설정 매핑
  mapVisibility(visibility) {
    const map = {
      'private': '0',
      'protected': '1', 
      'public': '3'
    };
    return map[visibility] || '3';
  }

  // 현재 사용 중인 방법 확인
  getMethod() {
    return this.api ? 'api' : 'browser';
  }

  // API 사용 가능 여부
  isAPIAvailable() {
    return !!this.api;
  }
}

module.exports = TistoryHybrid;