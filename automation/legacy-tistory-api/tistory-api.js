const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class TistoryAPI {
  constructor(accessToken, blogName) {
    this.accessToken = accessToken;
    this.blogName = blogName;
    this.baseUrl = 'https://www.tistory.com/apis';
  }

  // API 요청 헬퍼
  async request(endpoint, params = {}, method = 'GET') {
    const url = `${this.baseUrl}/${endpoint}`;
    params.access_token = this.accessToken;
    params.output = 'json';

    try {
      const config = {
        method,
        url,
        params: method === 'GET' ? params : undefined,
        data: method === 'POST' ? params : undefined,
        headers: method === 'POST' ? {
          'Content-Type': 'application/x-www-form-urlencoded'
        } : undefined
      };

      const response = await axios(config);
      
      if (response.data.tistory.status !== '200') {
        throw new Error(response.data.tistory.error_message);
      }

      return response.data.tistory;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  // 블로그 정보 가져오기
  async getBlogInfo() {
    return await this.request('blog/info');
  }

  // 카테고리 목록 가져오기
  async getCategories() {
    const params = {
      blogName: this.blogName
    };
    return await this.request('category/list', params);
  }

  // 최근 게시글 목록
  async getRecentPosts(page = 1, count = 10) {
    const params = {
      blogName: this.blogName,
      page,
      count
    };
    return await this.request('post/list', params);
  }

  // 게시글 작성
  async writePost(postData) {
    const params = new URLSearchParams({
      blogName: this.blogName,
      title: postData.title,
      content: postData.content,
      visibility: postData.visibility || '3', // 0: 비공개, 1: 보호, 3: 공개
      category: postData.category || '0',
      published: postData.published || new Date().toISOString(),
      slogan: postData.slogan || '',
      tag: postData.tags ? postData.tags.join(',') : '',
      acceptComment: postData.acceptComment || '1',
      password: postData.password || ''
    });

    return await this.request('post/write', params, 'POST');
  }

  // 게시글 수정
  async modifyPost(postId, postData) {
    const params = new URLSearchParams({
      blogName: this.blogName,
      postId: postId,
      title: postData.title,
      content: postData.content,
      visibility: postData.visibility || '3',
      category: postData.category || '0',
      published: postData.published,
      slogan: postData.slogan || '',
      tag: postData.tags ? postData.tags.join(',') : '',
      acceptComment: postData.acceptComment || '1',
      password: postData.password || ''
    });

    return await this.request('post/modify', params, 'POST');
  }

  // 게시글 읽기
  async readPost(postId) {
    const params = {
      blogName: this.blogName,
      postId: postId
    };
    return await this.request('post/read', params);
  }

  // 게시글 삭제
  async deletePost(postId) {
    const params = {
      blogName: this.blogName,
      postId: postId
    };
    return await this.request('post/delete', params, 'POST');
  }

  // 파일 업로드
  async uploadFile(filePath) {
    const form = new FormData();
    form.append('access_token', this.accessToken);
    form.append('blogName', this.blogName);
    form.append('uploadedfile', fs.createReadStream(filePath));
    form.append('output', 'json');

    try {
      const response = await axios.post(
        `${this.baseUrl}/post/attach`,
        form,
        {
          headers: form.getHeaders()
        }
      );

      if (response.data.tistory.status !== '200') {
        throw new Error(response.data.tistory.error_message);
      }

      return response.data.tistory;
    } catch (error) {
      console.error('File upload error:', error.message);
      throw error;
    }
  }

  // 댓글 목록 가져오기
  async getComments(postId, page = 1, count = 10) {
    const params = {
      blogName: this.blogName,
      postId: postId,
      page,
      count
    };
    return await this.request('comment/list', params);
  }

  // 댓글 작성
  async writeComment(postId, content, parentId = null, secret = '0') {
    const params = {
      blogName: this.blogName,
      postId: postId,
      content: content,
      parentId: parentId || '',
      secret: secret
    };
    return await this.request('comment/write', params, 'POST');
  }

  // 댓글 삭제
  async deleteComment(postId, commentId) {
    const params = {
      blogName: this.blogName,
      postId: postId,
      commentId: commentId
    };
    return await this.request('comment/delete', params, 'POST');
  }
}

module.exports = TistoryAPI;