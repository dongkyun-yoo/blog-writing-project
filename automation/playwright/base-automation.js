const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BaseAutomation {
  constructor(platform) {
    this.platform = platform;
    this.sessionPath = path.join(__dirname, '../sessions', `${platform}-session.json`);
    this.screenshotPath = path.join(__dirname, '../screenshots', platform);
    this.cookiePath = path.join(__dirname, '../sessions', `${platform}-cookies.json`);
  }

  // 암호화/복호화 (환경변수의 ENCRYPTION_KEY 사용)
  encrypt(text) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!', 'utf8').slice(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!', 'utf8').slice(0, 32);
    const decipher = crypto.createDecipheriv(
      algorithm, 
      key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // 자격증명 저장
  async saveCredentials(credentials) {
    const encrypted = {
      username: this.encrypt(credentials.username),
      password: this.encrypt(credentials.password)
    };
    
    await fs.mkdir(path.dirname(this.sessionPath), { recursive: true });
    await fs.writeFile(
      this.sessionPath, 
      JSON.stringify(encrypted, null, 2)
    );
  }

  // 자격증명 로드
  async loadCredentials() {
    try {
      const data = await fs.readFile(this.sessionPath, 'utf8');
      const encrypted = JSON.parse(data);
      
      return {
        username: this.decrypt(encrypted.username),
        password: this.decrypt(encrypted.password)
      };
    } catch (error) {
      return null;
    }
  }

  // 쿠키 저장
  async saveCookies(cookies) {
    await fs.mkdir(path.dirname(this.cookiePath), { recursive: true });
    await fs.writeFile(
      this.cookiePath,
      JSON.stringify(cookies, null, 2)
    );
  }

  // 쿠키 로드
  async loadCookies() {
    try {
      const data = await fs.readFile(this.cookiePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  // 스크린샷 저장
  async saveScreenshot(page, name) {
    await fs.mkdir(this.screenshotPath, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotPath, filename);
    
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 스크린샷 저장: ${filename}`);
    return filepath;
  }

  // 로그인 상태 확인 (각 플랫폼별로 override)
  async checkLoginStatus(page) {
    throw new Error('checkLoginStatus must be implemented by subclass');
  }

  // 로그인 수행 (각 플랫폼별로 override)
  async performLogin(page, credentials) {
    throw new Error('performLogin must be implemented by subclass');
  }

  // 글쓰기 수행 (각 플랫폼별로 override)
  async writePost(page, postData) {
    throw new Error('writePost must be implemented by subclass');
  }

  // 대기 헬퍼 함수
  async waitAndType(page, selector, text, delay = 100) {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    await page.type(selector, text, { delay });
  }

  // 안전한 클릭 헬퍼
  async safeClick(page, selector, options = {}) {
    await page.waitForSelector(selector, { visible: true, ...options });
    await page.click(selector);
  }

  // 텍스트 기반 요소 찾기
  async clickByText(page, text, tag = '*') {
    const element = await page.$(`${tag}:has-text("${text}")`);
    if (element) {
      await element.click();
      return true;
    }
    return false;
  }

  // 페이지 로드 대기
  async waitForNavigation(page, options = {}) {
    await page.waitForLoadState('networkidle', options);
  }

  // 로그 출력
  log(message, type = 'info') {
    const prefix = {
      info: '📌',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    
    console.log(`${prefix[type]} [${this.platform}] ${message}`);
  }
}

module.exports = BaseAutomation;