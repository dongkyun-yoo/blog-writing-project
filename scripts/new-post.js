#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createNewPost() {
  console.log('🚀 새 블로그 글 생성하기\n');

  const title = await askQuestion('제목을 입력하세요: ');
  const category = await askQuestion('카테고리를 입력하세요 (Tech/Tutorial/Review/General): ');
  const description = await askQuestion('간단한 설명을 입력하세요: ');
  const tags = await askQuestion('태그를 입력하세요 (쉼표로 구분): ');

  console.log('\n템플릿을 선택하세요:');
  console.log('1. 기술 블로그 (tech-blog)');
  console.log('2. 튜토리얼 (tutorial)');
  console.log('3. 리뷰 (review)');
  console.log('4. 일반 글 (general)');
  
  const templateChoice = await askQuestion('선택 (1-4): ');
  
  const templates = {
    '1': 'tech-blog',
    '2': 'tutorial', 
    '3': 'review',
    '4': 'general'
  };

  const templateName = templates[templateChoice] || 'general';
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.md`);
  
  if (!fs.existsSync(templatePath)) {
    console.error('❌ 템플릿 파일을 찾을 수 없습니다.');
    rl.close();
    return;
  }

  let template = fs.readFileSync(templatePath, 'utf8');
  
  // 메타데이터 교체
  const currentDate = getCurrentDate();
  const slug = createSlug(title);
  const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  
  template = template
    .replace(/title: ".*"/, `title: "${title}"`)
    .replace(/date: "YYYY-MM-DD"/, `date: "${currentDate}"`)
    .replace(/category: ".*"/, `category: "${category}"`)
    .replace(/description: ".*"/, `description: "${description}"`)
    .replace(/tags: \[.*\]/, `tags: [${tagArray.map(tag => `"${tag}"`).join(', ')}]`);

  // 파일 저장
  const fileName = `${currentDate}-${slug}.md`;
  const filePath = path.join(__dirname, '..', 'drafts', fileName);
  
  fs.writeFileSync(filePath, template);
  
  console.log(`\n✅ 새 글이 생성되었습니다!`);
  console.log(`📝 파일 위치: drafts/${fileName}`);
  console.log(`\n다음 명령어로 글을 편집하세요:`);
  console.log(`code drafts/${fileName}`);
  
  rl.close();
}

createNewPost().catch(console.error);