import { io } from 'socket.io-client';

let socket = null;

export function initSocket() {
  if (socket) {
    socket.disconnect();
  }
  // 连接到Socket.IO服务器
  socket = io('http://115.235.191.234:3000');  // 使用内部IP

  // 监听连接事件
  socket.on('connect', () => {
    console.log('Socket.IO连接已建立');
  });

  // 监听自定义事件（例如游戏消息）
  socket.on('gameMessage', (message) => {
    console.log('收到消息:', message);
    // 处理接收到的消息，例如更新棋盘状态
  });

  // 监听断开连接事件
  socket.on('disconnect', () => {
    console.log('Socket.IO连接已断开');
  });

  // 监听错误事件
  socket.on('error', (error) => {
    console.error('Socket.IO错误:', error);
  });

  // 监听连接失败事件
  socket.on('connect_error', (error) => {
    console.error('Socket.IO连接失败:', error);
  });

  return socket;
}

export function getSocket() {
  return socket;
}