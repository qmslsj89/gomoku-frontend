<template>
  <div id="app">
    <nav>
      <router-link v-if="!isLoggedIn" to="/login">登录</router-link>
      <router-link v-if="!isLoggedIn" to="/register">注册</router-link>
      <span v-if="isLoggedIn">欢迎, {{ username }}</span>
      <router-link v-if="isLoggedIn" to="/" @click="logout">登出</router-link>
    </nav>
    <router-view @login="handleLogin" @register="handleRegister"></router-view>
  </div>
</template>

<script>
import axios from 'axios';
import { getSocket } from './socket';

export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false,
      username: ''
    };
  },
  methods: {
    handleLogin(username) {
      this.isLoggedIn = true;
      this.username = username;
    },
    handleRegister(username) {
      this.isLoggedIn = true;
      this.username = username;
    },
    logout() {
      axios.post('http://115.235.134.18:3000/api/logout')
        .then(() => {
          this.isLoggedIn = false;
          this.username = '';
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          const socket = getSocket();
          if (socket) {
            socket.emit('leaveGame');
            socket.disconnect();
          }
          this.$router.push({ name: 'Login' });
        })
        .catch(error => {
          console.error('登出失败:', error);
        });
    }
  },
  created() {
    const token = localStorage.getItem('token');
    if (token) {
      // 假设后端有一个 /api/me 路由来获取当前用户信息
      axios.get('http://115.235.134.18:3000/api/me', { headers: { 'x-access-token': token } })
        .then(response => {
          this.isLoggedIn = true;
          this.username = response.data.username;
        })
        .catch(() => {
          this.isLoggedIn = false;
          this.username = '';
        });
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
nav {
  padding: 10px;
}
nav a {
  margin: 0 10px;
}
</style>