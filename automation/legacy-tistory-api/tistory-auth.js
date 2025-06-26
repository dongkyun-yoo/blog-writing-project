const axios = require('axios');
const express = require('express');
const open = require('open');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TistoryAuth {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.blogName = config.blogName;
    this.tokenPath = path.join(__dirname, '../../auth/tistory-token.json');
  }

  // OAuth 인증 URL 생성
  getAuthorizationUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: crypto.randomBytes(16).toString('hex')
    });

    return `https://www.tistory.com/oauth/authorize?${params.toString()}`;
  }

  // Authorization Code를 Access Token으로 교환
  async getAccessToken(code) {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: code,
        grant_type: 'authorization_code'
      });

      const response = await axios.post(
        'https://www.tistory.com/oauth/access_token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      // Tistory는 access_token=xxx 형식으로 응답
      const accessToken = response.data.split('=')[1];
      
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }

      await this.saveToken(accessToken);
      return accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // 토큰 저장
  async saveToken(accessToken) {
    const tokenData = {
      access_token: accessToken,
      created_at: new Date().toISOString(),
      blog_name: this.blogName
    };

    await fs.mkdir(path.dirname(this.tokenPath), { recursive: true });
    await fs.writeFile(this.tokenPath, JSON.stringify(tokenData, null, 2));
  }

  // 저장된 토큰 읽기
  async loadToken() {
    try {
      const data = await fs.readFile(this.tokenPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  // 토큰 유효성 검증
  async validateToken(accessToken) {
    try {
      const response = await axios.get('https://www.tistory.com/apis/blog/info', {
        params: {
          access_token: accessToken,
          output: 'json'
        }
      });

      return response.data.tistory.status === '200';
    } catch (error) {
      return false;
    }
  }

  // OAuth 인증 프로세스 시작
  async authenticate() {
    return new Promise((resolve, reject) => {
      const app = express();
      const server = app.listen(3000);

      app.get('/callback', async (req, res) => {
        const { code, error } = req.query;

        if (error) {
          res.send('인증이 취소되었습니다.');
          server.close();
          reject(new Error('Authentication cancelled'));
          return;
        }

        try {
          const accessToken = await this.getAccessToken(code);
          res.send(`
            <html>
              <body>
                <h2>인증 성공!</h2>
                <p>이 창을 닫고 터미널로 돌아가세요.</p>
                <script>window.close();</script>
              </body>
            </html>
          `);
          server.close();
          resolve(accessToken);
        } catch (error) {
          res.send('인증 실패: ' + error.message);
          server.close();
          reject(error);
        }
      });

      // 브라우저에서 인증 URL 열기
      const authUrl = this.getAuthorizationUrl();
      console.log('브라우저에서 인증 페이지를 엽니다...');
      open(authUrl);
    });
  }

  // 기존 토큰 확인 또는 새로 인증
  async ensureAuthenticated() {
    const tokenData = await this.loadToken();
    
    if (tokenData && tokenData.access_token) {
      const isValid = await this.validateToken(tokenData.access_token);
      if (isValid) {
        console.log('기존 토큰이 유효합니다.');
        return tokenData.access_token;
      }
    }

    console.log('새로운 인증이 필요합니다.');
    return await this.authenticate();
  }
}

module.exports = TistoryAuth;