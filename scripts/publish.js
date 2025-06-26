#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('front-matter');

function getAllDrafts() {
  const draftsDir = path.join(__dirname, '..', 'drafts');
  if (!fs.existsSync(draftsDir)) {
    console.log('❌ drafts 폴더가 없습니다.');
    return [];
  }
  
  return fs.readdirSync(draftsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(draftsDir, file));
}

function publishPost(draftPath) {
  const content = fs.readFileSync(draftPath, 'utf8');
  const parsed = matter(content);
  
  // draft: false로 변경
  parsed.attributes.draft = false;
  
  // 새로운 내용 생성
  const frontMatterKeys = Object.keys(parsed.attributes);
  const frontMatterContent = frontMatterKeys
    .map(key => {
      const value = parsed.attributes[key];
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      } else if (typeof value === 'string') {
        return `${key}: "${value}"`;
      } else {
        return `${key}: ${value}`;
      }
    })
    .join('\n');
  
  const newContent = `---\n${frontMatterContent}\n---\n\n${parsed.body}`;
  
  // posts 폴더로 이동
  const fileName = path.basename(draftPath);
  const publishPath = path.join(__dirname, '..', 'posts', fileName);
  
  // posts 폴더 생성 (없으면)
  const postsDir = path.dirname(publishPath);
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }
  
  fs.writeFileSync(publishPath, newContent);
  fs.unlinkSync(draftPath); // 초안 삭제
  
  console.log(`✅ 발행 완료: ${fileName}`);
  console.log(`📍 위치: posts/${fileName}`);
}

function listDrafts() {
  const drafts = getAllDrafts();
  
  if (drafts.length === 0) {
    console.log('📝 발행할 초안이 없습니다.');
    return;
  }
  
  console.log('📋 발행 가능한 초안 목록:\n');
  
  drafts.forEach((draftPath, index) => {
    const content = fs.readFileSync(draftPath, 'utf8');
    const parsed = matter(content);
    const { title, date, category } = parsed.attributes;
    
    console.log(`${index + 1}. ${title}`);
    console.log(`   📅 ${date} | 📂 ${category}`);
    console.log(`   📄 ${path.basename(draftPath)}\n`);
  });
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    listDrafts();
    return;
  }
  
  const command = args[0];
  
  if (command === 'list') {
    listDrafts();
  } else if (command === 'publish') {
    const fileName = args[1];
    if (!fileName) {
      console.log('❌ 파일명을 지정해주세요.');
      console.log('사용법: npm run publish publish <파일명>');
      return;
    }
    
    const draftPath = path.join(__dirname, '..', 'drafts', fileName);
    if (!fs.existsSync(draftPath)) {
      console.log(`❌ 파일을 찾을 수 없습니다: ${fileName}`);
      return;
    }
    
    publishPost(draftPath);
  } else if (command === 'all') {
    const drafts = getAllDrafts();
    drafts.forEach(publishPost);
    console.log(`🎉 총 ${drafts.length}개의 글을 발행했습니다!`);
  } else {
    console.log('❌ 알 수 없는 명령어입니다.');
    console.log('사용법:');
    console.log('  npm run publish          # 초안 목록 보기');
    console.log('  npm run publish list     # 초안 목록 보기');
    console.log('  npm run publish publish <파일명>  # 특정 글 발행');
    console.log('  npm run publish all      # 모든 초안 발행');
  }
}

main();