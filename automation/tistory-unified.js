#!/usr/bin/env node

/**
 * 티스토리 통합 자동화 스크립트
 * OAuth API와 브라우저 자동화를 모두 지원
 */

require('dotenv').config();
const TistoryHybrid = require('./playwright/tistory/tistory-hybrid');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🚀 티스토리 통합 자동화 시스템');
  console.log('================================\n');

  // 설정 확인
  const hasAPI = process.env.TISTORY_CLIENT_ID && process.env.TISTORY_CLIENT_SECRET;
  
  if (hasAPI) {
    console.log('✅ OAuth API 설정 발견');
  } else {
    console.log('⚠️  OAuth API 설정 없음 - 브라우저 자동화만 사용 가능');
  }

  // 작업 선택
  console.log('\n📋 작업을 선택하세요:');
  console.log('1. 글쓰기');
  console.log('2. 글 목록 조회');
  console.log('3. 카테고리 조회');
  console.log('4. API/브라우저 전환');
  
  const action = await askQuestion('\n선택 (1-4): ');

  // 하이브리드 객체 생성
  const hybrid = new TistoryHybrid({
    clientId: process.env.TISTORY_CLIENT_ID,
    clientSecret: process.env.TISTORY_CLIENT_SECRET,
    blogName: process.env.TISTORY_BLOG_NAME,
    useAPI: hasAPI,
    fallbackToBrowser: true
  });

  // 초기화
  const init = await hybrid.initialize();
  console.log(`\n🔧 사용 모드: ${init.method === 'api' ? 'OAuth API' : '브라우저 자동화'}`);

  switch (action) {
    case '1': // 글쓰기
      console.log('\n📝 글 정보 입력:');
      const title = await askQuestion('제목: ');
      const content = await askQuestion('내용: ');
      const tags = await askQuestion('태그 (쉼표로 구분): ');
      const category = await askQuestion('카테고리: ');
      const visibility = await askQuestion('공개 설정 (public/private/protected) [public]: ') || 'public';

      const postData = {
        title,
        content,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        category,
        visibility
      };

      const result = await hybrid.writePost(postData);
      
      if (result.success) {
        console.log(`\n✅ 글 작성 성공! (${result.method} 사용)`);
        if (result.url) console.log(`URL: ${result.url}`);
      } else {
        console.log(`\n❌ ${result.message}`);
        if (result.method === 'browser') {
          console.log('\n💡 브라우저 자동화 사용 방법:');
          console.log('npm run automation 명령어를 실행하여 브라우저를 통해 글을 작성하세요.');
        }
      }
      break;

    case '2': // 글 목록
      const posts = await hybrid.getPosts();
      if (posts.success) {
        console.log('\n📋 최근 글 목록:');
        posts.posts.forEach((post, idx) => {
          console.log(`${idx + 1}. ${post.title}`);
        });
      } else {
        console.log(`\n❌ ${posts.message}`);
      }
      break;

    case '3': // 카테고리
      const categories = await hybrid.getCategories();
      if (categories.success) {
        console.log('\n📁 카테고리 목록:');
        categories.categories.forEach(cat => {
          console.log(`- [${cat.id}] ${cat.name} (${cat.entries}개)`);
        });
      } else {
        console.log(`\n❌ ${categories.message}`);
      }
      break;

    case '4': // 모드 전환
      const currentMethod = hybrid.getMethod();
      console.log(`\n현재 모드: ${currentMethod}`);
      
      if (currentMethod === 'api') {
        console.log('브라우저 자동화로 전환하려면 npm run automation을 실행하세요.');
      } else {
        console.log('API를 사용하려면 .env 파일에 OAuth 정보를 설정하세요.');
      }
      break;

    default:
      console.log('❌ 잘못된 선택입니다.');
  }

  rl.close();
}

main().catch(error => {
  console.error('❌ 오류:', error.message);
  rl.close();
  process.exit(1);
});