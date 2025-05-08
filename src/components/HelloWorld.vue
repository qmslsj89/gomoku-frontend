<template>
  <div class="hello">
    <el-card class="box-card animated-card">
      <h1 class="animated-title">{{ msg }}</h1>
      <p class="animated-text">欢迎来到智联五子棋（AI Connect Gomoku）！</p>
      <div v-if="!isLoggedIn" class="auth-buttons">
        <el-button type="primary" @click="goToLogin" class="animated-button">登录</el-button>
        <el-button type="success" @click="goToRegister" class="animated-button">注册</el-button>
      </div>
      <div v-else class="game-buttons">
        <el-button type="primary" @click="startGame" class="animated-button">开始游戏</el-button>
        <el-button type="info" @click="goToLeaderboard" class="animated-button">排行榜</el-button>
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
      axios.get('http://115.235.191.234:3000/api/me', { headers: { 'x-access-token': token } })
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
.auth-buttons,
.game-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  /* min-height: 500px; */
}

.animated-card {
  animation: fadeIn 1s ease-in-out;
  opacity: 0;
  animation-fill-mode: forwards;
}

.animated-title {
  animation: slideIn 1s ease-in-out;
  animation-delay: 0.2s;
  opacity: 0;
  animation-fill-mode: forwards;
}

.animated-text {
  animation: slideIn 1s ease-in-out;
  animation-delay: 0.4s;
  opacity: 0;
  animation-fill-mode: forwards;
}

.animated-button {
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.animated-button:hover {
  transform: scale(1.05);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>