import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://115.235.191.234:3000/api',  // 使用内部IP
  withCredentials: false, // 不发送凭证
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

export function getStatus() {
  return apiClient.get('/status');
}

// 其他API请求函数...