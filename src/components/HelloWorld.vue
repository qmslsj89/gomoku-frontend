<template>
  <div class="hello">
    <el-card class="box-card">
      <h1>{{ msg }}</h1>
      <p>欢迎来到五子棋游戏！</p>
      <div v-if="!isLoggedIn" class="auth-buttons">
        <el-button type="primary" @click="goToLogin">登录</el-button>
        <el-button type="success" @click="goToRegister">注册</el-button>
      </div>
      <div v-else>
        <el-button type="primary" @click="startGame">开始游戏</el-button>
        <el-button type="info" @click="goToLeaderboard">排行榜</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
import { initSocket, getSocket } from '../socket';

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      isLoggedIn: false,
      username: '',
      userface: ''
    };
  },
  methods: {
    startGame() {
      // 初始化WebSocket连接
      initSocket();
      const socket = getSocket();
      if (socket) {
        socket.on('connect', () => {
          console.log('连接到服务器成功');
          this.$router.push({ name: 'GomokuBoard' });
        });
        socket.on('connect_error', (err) => {
          console.error('连接到服务器失败:', err);
        });
      }
    },
    goToLogin() {
      this.$router.push({ name: 'Login' });
    },
    goToRegister() {
      this.$router.push({ name: 'Register' });
    },
    goToLeaderboard() {
      this.$router.push({ name: 'Leaderboard' });
    }
  },
  created() {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://115.235.168.136:3000/api/me', { headers: { 'x-access-token': token } })
        .then(response => {
          this.isLoggedIn = true;
          this.username = response.data.username;
          this.userface = response.data.userface;
        })
        .catch(() => {
          this.isLoggedIn = false;
          this.username = '';
        });
    }
  }
};
</script>

<style scoped>
h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
  text-align: center;
}
p {
  margin: 1em 0;
  color: #666;
  text-align: center;
}
.box-card {
  margin-bottom: 20px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.auth-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>