require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * 세션 관리 시스템
 * 로그인 상태, 쿠키, 토큰 등을 안전하게 저장하고 관리
 */
class SessionManager {
  constructor() {
    this.sessionsDir = path.join(__dirname, 'sessions');
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    this.algorithm = 'aes-256-gcm';
    
    // 플랫폼별 세션 파일 경로
    this.sessionFiles = {
      tistory: path.join(this.sessionsDir, 'tistory-session.json'),
      naver: path.join(this.sessionsDir, 'naver-session.json'),
      velog: path.join(this.sessionsDir, 'velog-session.json'),
      medium: path.join(this.sessionsDir, 'medium-session.json')
    };
  }

  /**
   * 암호화 키 생성
   */
  generateEncryptionKey() {
    const key = crypto.randomBytes(32).toString('hex');
    console.log('⚠️ 새 암호화 키가 생성되었습니다. .env 파일에 ENCRYPTION_KEY를 설정하세요:');
    console.log(`ENCRYPTION_KEY=${key}`);
    return key;
  }

  /**
   * 초기화 - 세션 디렉토리 생성
   */
  async initialize() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
      console.log(`📁 세션 디렉토리 초기화: ${this.sessionsDir}`);
      return true;
    } catch (error) {
      console.error('❌ 세션 디렉토리 초기화 실패:', error.message);
      return false;
    }
  }

  /**
   * 데이터 암호화
   */
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('❌ 암호화 실패:', error.message);
      return null;
    }
  }

  /**
   * 데이터 복호화
   */
  decrypt(encryptedData) {
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      
      if (encryptedData.authTag) {
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      }
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('❌ 복호화 실패:', error.message);
      return null;
    }
  }

  /**
   * 세션 데이터 저장
   */
  async saveSession(platform, sessionData) {
    try {
      const sessionInfo = {
        platform,
        timestamp: new Date().toISOString(),
        userAgent: sessionData.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        cookies: sessionData.cookies || [],
        localStorage: sessionData.localStorage || {},
        sessionStorage: sessionData.sessionStorage || {},
        loginStatus: sessionData.loginStatus || false,
        userInfo: sessionData.userInfo || {},
        lastVerified: new Date().toISOString(),
        expiresAt: sessionData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      // 암호화하여 저장
      const encryptedData = this.encrypt(sessionInfo);
      if (!encryptedData) {
        throw new Error('세션 데이터 암호화 실패');
      }

      const filePath = this.sessionFiles[platform];
      await fs.writeFile(filePath, JSON.stringify(encryptedData, null, 2));
      
      console.log(`✅ ${platform} 세션 저장 완료: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ ${platform} 세션 저장 실패:`, error.message);
      return false;
    }
  }

  /**
   * 세션 데이터 로드
   */
  async loadSession(platform) {
    try {
      const filePath = this.sessionFiles[platform];
      
      // 파일 존재 확인
      try {
        await fs.access(filePath);
      } catch {
        console.log(`⚠️ ${platform} 세션 파일이 존재하지 않습니다: ${filePath}`);
        return null;
      }

      // 암호화된 데이터 읽기
      const encryptedData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      // 복호화
      const sessionData = this.decrypt(encryptedData);
      if (!sessionData) {
        throw new Error('세션 데이터 복호화 실패');
      }

      // 만료 시간 확인
      if (new Date(sessionData.expiresAt) < new Date()) {
        console.log(`⚠️ ${platform} 세션이 만료되었습니다`);
        await this.deleteSession(platform);
        return null;
      }

      console.log(`✅ ${platform} 세션 로드 완료`);
      return sessionData;
    } catch (error) {
      console.error(`❌ ${platform} 세션 로드 실패:`, error.message);
      return null;
    }
  }

  /**
   * 세션 유효성 검증
   */
  async verifySession(platform, sessionData = null) {
    try {
      const session = sessionData || await this.loadSession(platform);
      if (!session) {
        return { valid: false, reason: '세션 없음' };
      }

      // 기본 유효성 검사
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (expiresAt < now) {
        return { valid: false, reason: '세션 만료' };
      }

      // 쿠키 유효성 검사
      if (!session.cookies || session.cookies.length === 0) {
        return { valid: false, reason: '쿠키 없음' };
      }

      // 로그인 상태 검사
      if (!session.loginStatus) {
        return { valid: false, reason: '로그인 상태 아님' };
      }

      // 플랫폼별 추가 검증
      const platformCheck = await this.platformSpecificVerification(platform, session);
      if (!platformCheck.valid) {
        return platformCheck;
      }

      console.log(`✅ ${platform} 세션 유효성 검증 완료`);
      return { valid: true, session };
    } catch (error) {
      console.error(`❌ ${platform} 세션 검증 실패:`, error.message);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * 플랫폼별 세션 검증
   */
  async platformSpecificVerification(platform, session) {
    switch (platform) {
      case 'tistory':
        // 티스토리 특정 쿠키 확인
        const tistoryCookies = session.cookies.filter(cookie => 
          cookie.domain?.includes('tistory.com') || 
          cookie.domain?.includes('kakao.com')
        );
        
        if (tistoryCookies.length === 0) {
          return { valid: false, reason: '티스토리 쿠키 없음' };
        }
        break;
        
      case 'naver':
        // 네이버 특정 쿠키 확인
        const naverCookies = session.cookies.filter(cookie => 
          cookie.domain?.includes('naver.com')
        );
        
        if (naverCookies.length === 0) {
          return { valid: false, reason: '네이버 쿠키 없음' };
        }
        break;
        
      default:
        // 기본 검증만 수행
        break;
    }
    
    return { valid: true };
  }

  /**
   * 세션 갱신
   */
  async refreshSession(platform, newData = {}) {
    try {
      const existingSession = await this.loadSession(platform);
      if (!existingSession) {
        console.log(`⚠️ ${platform} 기존 세션이 없어 새로 생성합니다`);
        return await this.saveSession(platform, newData);
      }

      // 기존 세션과 새 데이터 병합
      const updatedSession = {
        ...existingSession,
        ...newData,
        lastVerified: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      return await this.saveSession(platform, updatedSession);
    } catch (error) {
      console.error(`❌ ${platform} 세션 갱신 실패:`, error.message);
      return false;
    }
  }

  /**
   * 세션 삭제
   */
  async deleteSession(platform) {
    try {
      const filePath = this.sessionFiles[platform];
      await fs.unlink(filePath);
      console.log(`🗑️ ${platform} 세션 삭제 완료`);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`❌ ${platform} 세션 삭제 실패:`, error.message);
      }
      return false;
    }
  }

  /**
   * 모든 세션 목록 조회
   */
  async listSessions() {
    const sessions = {};
    
    for (const [platform, filePath] of Object.entries(this.sessionFiles)) {
      try {
        await fs.access(filePath);
        const session = await this.loadSession(platform);
        const verification = await this.verifySession(platform, session);
        
        sessions[platform] = {
          exists: true,
          valid: verification.valid,
          reason: verification.reason || 'OK',
          timestamp: session?.timestamp || 'Unknown',
          expiresAt: session?.expiresAt || 'Unknown'
        };
      } catch {
        sessions[platform] = {
          exists: false,
          valid: false,
          reason: '파일 없음'
        };
      }
    }
    
    return sessions;
  }

  /**
   * 세션 상태 요약 출력
   */
  async showStatus() {
    console.log('\n📊 세션 관리 시스템 상태');
    console.log('=' .repeat(50));
    
    const sessions = await this.listSessions();
    
    Object.entries(sessions).forEach(([platform, status]) => {
      const statusIcon = status.valid ? '✅' : (status.exists ? '⚠️' : '❌');
      console.log(`${statusIcon} ${platform.toUpperCase()}: ${status.reason}`);
      
      if (status.exists) {
        console.log(`   생성: ${status.timestamp}`);
        console.log(`   만료: ${status.expiresAt}`);
      }
    });
    
    console.log('=' .repeat(50));
    console.log(`🔐 암호화 키: ${this.encryptionKey ? '설정됨' : '미설정'}`);
    console.log(`📁 세션 디렉토리: ${this.sessionsDir}\n`);
    
    return sessions;
  }
}

module.exports = SessionManager;

// 직접 실행 시 상태 확인
if (require.main === module) {
  const sessionManager = new SessionManager();
  
  (async () => {
    await sessionManager.initialize();
    await sessionManager.showStatus();
  })();
}