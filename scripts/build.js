#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('front-matter');
const { marked } = require('marked');

function getAllPosts() {
  const postsDir = path.join(__dirname, '..', 'posts');
  if (!fs.existsSync(postsDir)) {
    console.log('❌ posts 폴더가 없습니다.');
    return [];
  }
  
  return fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const post = matter(content);
      
      return {
        fileName: file,
        slug: path.basename(file, '.md'),
        ...post.attributes,
        content: post.body,
        fullPath: filePath
      };
    })
    .filter(post => !post.draft) // 초안 제외
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // 날짜순 정렬
}

function generatePostHTML(post) {
  const htmlContent = marked(post.content);
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title}</title>
    <meta name="description" content="${post.description}">
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
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f8f9fa;
        }
        .title {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .meta {
            color: #6c757d;
            font-size: 0.9em;
        }
        .tags {
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        .tag {
            background-color: #007bff;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            text-decoration: none;
        }
        .content {
            margin-top: 40px;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 2em;
            margin-bottom: 1em;
        }
        h2 {
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 10px;
        }
        code {
            background-color: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        pre {
            background-color: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
        }
        pre code {
            background: none;
            color: inherit;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #007bff;
            margin: 0;
            padding-left: 20px;
            color: #6c757d;
            font-style: italic;
        }
        .nav {
            text-align: center;
            margin: 40px 0;
        }
        .nav a {
            color: #007bff;
            text-decoration: none;
            font-weight: 500;
        }
        .nav a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav">
            <a href="index.html">← 블로그 홈으로</a>
        </div>
        
        <header class="header">
            <h1 class="title">${post.title}</h1>
            <div class="meta">
                📅 ${post.date} | 📂 ${post.category}
            </div>
            ${post.tags ? `
            <div class="tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            ` : ''}
        </header>
        
        <article class="content">
            ${htmlContent}
        </article>
        
        <div class="nav">
            <a href="index.html">← 블로그 홈으로</a>
        </div>
    </div>
</body>
</html>`;
}

function generateIndexHTML(posts) {
  const postList = posts.map(post => `
    <article class="post-item">
        <h2><a href="${post.slug}.html">${post.title}</a></h2>
        <div class="post-meta">
            📅 ${post.date} | 📂 ${post.category}
        </div>
        <p class="post-description">${post.description}</p>
        ${post.tags ? `
        <div class="tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        ` : ''}
    </article>
  `).join('');
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>내 블로그</title>
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
        .header {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 2px solid #f8f9fa;
        }
        .blog-title {
            font-size: 3em;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .blog-description {
            color: #6c757d;
            font-size: 1.1em;
        }
        .post-item {
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 1px solid #e9ecef;
        }
        .post-item:last-child {
            border-bottom: none;
        }
        .post-item h2 {
            margin-bottom: 10px;
        }
        .post-item h2 a {
            color: #2c3e50;
            text-decoration: none;
        }
        .post-item h2 a:hover {
            color: #007bff;
        }
        .post-meta {
            color: #6c757d;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        .post-description {
            margin-bottom: 15px;
            color: #555;
        }
        .tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .tag {
            background-color: #e9ecef;
            color: #495057;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        .stats {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1 class="blog-title">📝 내 블로그</h1>
            <p class="blog-description">생각을 기록하는 공간</p>
        </header>
        
        <main>
            ${postList}
        </main>
        
        <footer class="stats">
            총 ${posts.length}개의 글이 있습니다.
        </footer>
    </div>
</body>
</html>`;
}

function buildSite() {
  const buildDir = path.join(__dirname, '..', 'build');
  
  // build 폴더 생성
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  
  const posts = getAllPosts();
  
  if (posts.length === 0) {
    console.log('❌ 발행된 글이 없습니다.');
    return;
  }
  
  console.log(`🔨 ${posts.length}개의 글을 빌드하는 중...`);
  
  // 각 글의 HTML 생성
  posts.forEach(post => {
    const html = generatePostHTML(post);
    const fileName = `${post.slug}.html`;
    fs.writeFileSync(path.join(buildDir, fileName), html);
    console.log(`  ✅ ${fileName}`);
  });
  
  // 인덱스 페이지 생성
  const indexHTML = generateIndexHTML(posts);
  fs.writeFileSync(path.join(buildDir, 'index.html'), indexHTML);
  console.log('  ✅ index.html');
  
  console.log(`\n🎉 빌드 완료!`);
  console.log(`📁 빌드 결과: build/ 폴더`);
  console.log(`🌐 브라우저에서 열어보세요: file://${path.resolve(buildDir, 'index.html')}`);
}

buildSite();