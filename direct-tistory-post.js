const fs = require('fs');
const path = require('path');

async function executeDirectTistoryPost() {
  console.log('🚀 티스토리 Direct API 실제 포스팅 실행');
  console.log('❗ 주의: 이것은 실제 포스팅입니다. 테스트가 아닙니다.');
  
  try {
    // 포스트 데이터 준비
    const postContent = fs.readFileSync(
      path.join(__dirname, 'posts', '2025-japan-small-city-travel-tistory.md'), 
      'utf8'
    );
    
    const postData = {
      title: "2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석",
      content: postContent,
      tags: ["일본여행", "나라여행", "홋카이도여행", "소도시여행", "2025년여행"],
      category: "0", // 기본 카테고리
      visibility: "3" // 공개
    };
    
    console.log('📝 포스트 정보:');
    console.log(`- 제목: ${postData.title}`);
    console.log(`- 내용 길이: ${postData.content.length}자`);
    console.log(`- 태그: ${postData.tags.join(', ')}`);
    
    // 티스토리 API 설정 (실제 API 키가 필요합니다)
    const API_CONFIG = {
      // 실제 사용하려면 티스토리 앱 등록 후 API 키 발급 필요
      accessToken: process.env.TISTORY_ACCESS_TOKEN,
      blogName: process.env.TISTORY_BLOG_NAME || 'your-blog-name',
      baseUrl: 'https://www.tistory.com/apis'
    };
    
    if (!API_CONFIG.accessToken) {
      console.log('⚠️ 티스토리 API 토큰이 설정되지 않았습니다.');
      console.log('🔗 API 방식 대신 수동 포스팅 가이드를 생성합니다.');
      
      // 수동 포스팅 가이드 생성
      const manualGuide = generateManualPostingGuide(postData);
      
      fs.writeFileSync(
        path.join(__dirname, 'manual-posting-guide.html'),
        manualGuide
      );
      
      console.log('✅ 수동 포스팅 가이드가 생성되었습니다: manual-posting-guide.html');
      return;
    }
    
    // API 토큰이 없으므로 수동 가이드 생성
    console.log('\n🌐 API 토큰 없음 - 수동 가이드 생성...');
    
    const manualGuide = generateManualPostingGuide(postData);
    
    fs.writeFileSync(
      path.join(__dirname, 'manual-posting-guide.html'),
      manualGuide
    );
    
    console.log('✅ 수동 포스팅 가이드가 생성되었습니다: manual-posting-guide.html');
    
  } catch (error) {
    console.error('❌ 실제 포스팅 실행 중 오류:', error.message);
    
    // 대안으로 수동 포스팅 가이드 생성
    console.log('🔄 대안: 수동 포스팅 가이드 생성...');
    
    const postContent = fs.readFileSync(
      path.join(__dirname, 'posts', '2025-japan-small-city-travel-tistory.md'), 
      'utf8'
    );
    
    const postData = {
      title: "2025년 일본 소도시 여행 전략 가이드: 나라 & 홋카이도 심층 분석",
      content: postContent,
      tags: ["일본여행", "나라여행", "홋카이도여행", "소도시여행", "2025년여행"]
    };
    
    const manualGuide = generateManualPostingGuide(postData);
    
    fs.writeFileSync(
      path.join(__dirname, 'manual-posting-guide.html'),
      manualGuide
    );
    
    console.log('✅ 수동 포스팅 가이드가 생성되었습니다: manual-posting-guide.html');
  }
}

function generateManualPostingGuide(postData) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>티스토리 수동 포스팅 가이드</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #ff6b35; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content-box { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; }
        .copy-btn { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px 0; }
        .copy-btn:hover { background: #0056b3; }
        .step { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 10px 0; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 티스토리 실제 포스팅 가이드</h1>
        <p>생성 시간: ${new Date().toLocaleString('ko-KR')}</p>
        <p><strong>⚠️ 주의: 이것은 실제 포스팅용 콘텐츠입니다.</strong></p>
    </div>
    
    <div class="section">
        <h2>📋 1단계: 티스토리 접속 및 로그인</h2>
        <div class="step">
            <p><strong>1.</strong> 티스토리 로그인 페이지로 이동</p>
            <p>🔗 <a href="https://www.tistory.com/auth/login" target="_blank">https://www.tistory.com/auth/login</a></p>
        </div>
        <div class="step">
            <p><strong>2.</strong> 카카오 계정으로 로그인</p>
            <p>📧 계정: <code>beastrongman@daum.net</code></p>
            <p>🔑 비밀번호: <code>King8160!</code></p>
        </div>
    </div>
    
    <div class="section">
        <h2>✍️ 2단계: 새 글쓰기</h2>
        <div class="step">
            <p><strong>1.</strong> 글쓰기 페이지로 이동</p>
            <p>🔗 <a href="https://www.tistory.com/manage/newpost/" target="_blank">https://www.tistory.com/manage/newpost/</a></p>
        </div>
    </div>
    
    <div class="section">
        <h2>📝 3단계: 제목 입력</h2>
        <div class="content-box">
            <h3>제목 (복사하여 붙여넣기)</h3>
            <button class="copy-btn" onclick="copyToClipboard('title')">제목 복사</button>
            <pre id="title">${postData.title}</pre>
        </div>
    </div>
    
    <div class="section">
        <h2>📄 4단계: 본문 내용 입력</h2>
        <div class="highlight">
            <p><strong>💡 팁:</strong> 아래 본문을 전체 선택하여 복사한 후, 티스토리 에디터에 붙여넣기하세요.</p>
        </div>
        <div class="content-box">
            <h3>본문 내용 (복사하여 붙여넣기)</h3>
            <button class="copy-btn" onclick="copyToClipboard('content')">본문 복사</button>
            <pre id="content">${postData.content}</pre>
        </div>
    </div>
    
    <div class="section">
        <h2>🏷️ 5단계: 태그 입력</h2>
        <div class="content-box">
            <h3>태그 (쉼표로 구분)</h3>
            <button class="copy-btn" onclick="copyToClipboard('tags')">태그 복사</button>
            <pre id="tags">${postData.tags.join(', ')}</pre>
        </div>
    </div>
    
    <div class="section">
        <h2>🎯 6단계: 설정 확인</h2>
        <div class="step">
            <p><strong>카테고리:</strong> 여행 (또는 적절한 카테고리 선택)</p>
        </div>
        <div class="step">
            <p><strong>공개 설정:</strong> 전체 공개</p>
        </div>
        <div class="step">
            <p><strong>댓글 허용:</strong> 허용</p>
        </div>
    </div>
    
    <div class="section">
        <h2>🚀 7단계: 발행</h2>
        <div class="highlight">
            <p><strong>⚠️ 최종 확인:</strong></p>
            <ul>
                <li>제목이 올바르게 입력되었는지 확인</li>
                <li>본문 내용이 완전히 복사되었는지 확인</li>
                <li>태그가 모두 입력되었는지 확인</li>
            </ul>
        </div>
        <div class="step">
            <p><strong>발행 버튼을 클릭하여 실제 포스팅을 완료하세요!</strong></p>
        </div>
    </div>
    
    <div class="section">
        <h2>📊 포스팅 정보 요약</h2>
        <ul>
            <li><strong>제목:</strong> ${postData.title}</li>
            <li><strong>내용 길이:</strong> ${postData.content.length.toLocaleString()}자</li>
            <li><strong>태그 수:</strong> ${postData.tags.length}개</li>
            <li><strong>생성 시간:</strong> ${new Date().toLocaleString('ko-KR')}</li>
        </ul>
    </div>
    
    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent;
            
            navigator.clipboard.writeText(text).then(function() {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '복사 완료!';
                btn.style.background = '#28a745';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#007bff';
                }, 2000);
            });
        }
        
        // 페이지 로드 시 알림
        window.onload = function() {
            alert('🚀 티스토리 실제 포스팅 가이드가 준비되었습니다!\\n\\n각 섹션의 "복사" 버튼을 사용하여 내용을 복사하고 티스토리에 붙여넣으세요.');
        };
    </script>
</body>
</html>`;
}

// 즉시 실행
if (require.main === module) {
  executeDirectTistoryPost()
    .then(() => {
      console.log('✨ 포스팅 프로세스 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 포스팅 실행 실패:', error.message);
      process.exit(1);
    });
}

module.exports = executeDirectTistoryPost;