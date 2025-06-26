#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('front-matter');
const { marked } = require('marked');

function generateHTML(post) {
  const { attributes, body } = post;
  const htmlContent = marked(body);
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${attributes.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .meta {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 4px solid #007bff;
        }
        .meta h3 {
            margin-top: 0;
            color: #007bff;
        }
        .meta-item {
            margin: 8px 0;
        }
        .tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .tag {
            background-color: #e9ecef;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
        }
        h1 {
            border-bottom: 3px solid #007bff;
            padding-bottom: 10px;
        }
        h2 {
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 5px;
        }
        code {
            background-color: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border: 1px solid #e9ecef;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #007bff;
            margin: 0;
            padding-left: 20px;
            color: #6c757d;
            font-style: italic;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .draft-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        ${attributes.draft ? '<div class="draft-notice">⚠️ 이 글은 초안입니다.</div>' : ''}
        
        <div class="meta">
            <h3>📋 글 정보</h3>
            <div class="meta-item"><strong>제목:</strong> ${attributes.title}</div>
            <div class="meta-item"><strong>날짜:</strong> ${attributes.date}</div>
            <div class="meta-item"><strong>카테고리:</strong> ${attributes.category}</div>
            <div class="meta-item"><strong>설명:</strong> ${attributes.description}</div>
            ${attributes.tags ? `
            <div class="meta-item">
                <strong>태그:</strong>
                <div class="tags">
                    ${attributes.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            ` : ''}
        </div>
        
        <article>
            ${htmlContent}
        </article>
    </div>
</body>
</html>`;
}

function previewPost(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('❌ 파일을 찾을 수 없습니다:', filePath);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const post = matter(content);
  const html = generateHTML(post);
  
  const fileName = path.basename(filePath, '.md');
  const previewPath = path.join(__dirname, '..', `preview-${fileName}.html`);
  
  fs.writeFileSync(previewPath, html);
  
  console.log('🎉 미리보기가 생성되었습니다!');
  console.log(`📄 파일: ${path.basename(previewPath)}`);
  console.log('\n브라우저에서 열어보세요:');
  console.log(`file://${path.resolve(previewPath)}`);
}

function listFiles(directory) {
  const dir = path.join(__dirname, '..', directory);
  if (!fs.existsSync(dir)) {
    console.log(`❌ ${directory} 폴더가 없습니다.`);
    return [];
  }
  
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.md'))
    .map(file => ({
      name: file,
      path: path.join(dir, file)
    }));
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📝 미리보기 가능한 파일들:\n');
    
    console.log('📄 초안 (drafts):');
    const drafts = listFiles('drafts');
    if (drafts.length === 0) {
      console.log('  없음\n');
    } else {
      drafts.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
      });
      console.log('');
    }
    
    console.log('📄 발행된 글 (posts):');
    const posts = listFiles('posts');
    if (posts.length === 0) {
      console.log('  없음\n');
    } else {
      posts.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
      });
      console.log('');
    }
    
    console.log('사용법:');
    console.log('  npm run preview <파일경로>');
    console.log('  예시: npm run preview drafts/2024-01-01-my-post.md');
    return;
  }
  
  const filePath = args[0];
  const fullPath = path.resolve(filePath);
  
  previewPost(fullPath);
}

main();