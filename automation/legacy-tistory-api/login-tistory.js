#!/usr/bin/env node

require('dotenv').config();
const TistoryAuth = require('./tistory-auth');
const TistoryAPI = require('./tistory-api');

async function main() {
  try {
    // 환경 변수 확인
    if (!process.env.TISTORY_CLIENT_ID || !process.env.TISTORY_CLIENT_SECRET) {
      console.error('❌ 환경 변수가 설정되지 않았습니다.');
      console.error('`.env` 파일에 다음 정보를 설정하세요:');
      console.error('- TISTORY_CLIENT_ID');
      console.error('- TISTORY_CLIENT_SECRET');
      console.error('- TISTORY_REDIRECT_URI');
      console.error('- TISTORY_BLOG_NAME');
      process.exit(1);
    }

    // TistoryAuth 인스턴스 생성
    const auth = new TistoryAuth({
      clientId: process.env.TISTORY_CLIENT_ID,
      clientSecret: process.env.TISTORY_CLIENT_SECRET,
      redirectUri: process.env.TISTORY_REDIRECT_URI || 'http://localhost:3000/callback',
      blogName: process.env.TISTORY_BLOG_NAME
    });

    console.log('🚀 티스토리 로그인 프로세스를 시작합니다...\n');

    // 인증 진행
    const accessToken = await auth.ensureAuthenticated();
    console.log('✅ 인증 성공!\n');

    // API 클라이언트 생성
    const api = new TistoryAPI(accessToken, process.env.TISTORY_BLOG_NAME);

    // 블로그 정보 확인
    console.log('📊 블로그 정보를 가져오는 중...');
    const blogInfo = await api.getBlogInfo();
    
    console.log('\n📝 블로그 정보:');
    blogInfo.item.forEach(blog => {
      console.log(`- 이름: ${blog.name}`);
      console.log(`- URL: ${blog.url}`);
      console.log(`- 설명: ${blog.description || '없음'}`);
      console.log('---');
    });

    // 카테고리 목록 가져오기
    console.log('\n📁 카테고리 목록:');
    const categories = await api.getCategories();
    
    if (categories.item && categories.item.category) {
      const categoryList = Array.isArray(categories.item.category) 
        ? categories.item.category 
        : [categories.item.category];
      
      categoryList.forEach(cat => {
        console.log(`- [${cat.id}] ${cat.name} (${cat.entries}개 글)`);
      });
    } else {
      console.log('- 카테고리가 없습니다.');
    }

    // 최근 게시글 확인
    console.log('\n📋 최근 게시글 (5개):');
    const recentPosts = await api.getRecentPosts(1, 5);
    
    if (recentPosts.item && recentPosts.item.posts) {
      const posts = Array.isArray(recentPosts.item.posts) 
        ? recentPosts.item.posts 
        : [recentPosts.item.posts];
      
      posts.forEach(post => {
        console.log(`- [${post.id}] ${post.title}`);
        console.log(`  작성일: ${new Date(post.date * 1000).toLocaleString()}`);
      });
    } else {
      console.log('- 게시글이 없습니다.');
    }

    console.log('\n✅ 티스토리 로그인 및 API 연결 테스트 완료!');
    console.log('💾 인증 토큰이 저장되었습니다.');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = { TistoryAuth, TistoryAPI };