<template>
  <div class="login">
    <el-card class="box-card animated-card">
      <h2 class="login-title animated-title">用户登录</h2>
      <el-form ref="form" :model="form" label-width="80px" class="animated-form">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="form.password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="验证码">
          <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
          <img :src="captchaUrl" @click="refreshCaptcha" alt="验证码" class="captcha-img">
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login" :loading="loading" class="animated-button">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <transition name="fade">
      <el-alert v-if="message" :title="message" type="error" show-icon></el-alert>
    </transition>
  </div>
</template>

<script>
import axios from 'axios';
import io from 'socket.io-client';
import eventBus from '../eventBus';

export default {
  name: 'UserLogin',
  data() {
    return {
      form: {
        username: '',
        password: '',
        captcha: ''
      },
      captchaUrl: 'http://115.235.191.234:3000/verifyCode',
      message: '',
      loading: false
    };
  },
  methods: {
    async login() {
      this.loading = true;
      try {
        const response = await axios.post('http://115.235.191.234:3000/api/login', {
          username: this.form.username,
          password: this.form.password,
          captcha: this.form.captcha
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', this.form.username); // 将用户名存储在本地
        localStorage.setItem('isAdmin', response.data.user.isAdmin); // 将管理员信息存储在本地
        this.message = '登录成功';
        eventBus.emit('login');
        this.$router.push({ name: 'Home' });

        // 连接到 Socket.IO 并传递用户名
        const socket = io('http://115.235.191.234:3000', {
          query: { username: this.form.username }
        });
        socket.emit('joinGame');
      } catch (error) {
        this.message = error.response.data.message || '登录失败';
        console.error('登录失败:', error);
        this.refreshCaptcha(); // 登录失败后刷新验证码
      } finally {
        this.loading = false;
      }
    },
    refreshCaptcha() {
      this.captchaUrl = `http://115.235.191.234:3000/verifyCode?${Date.now()}`;
    }
  }
};
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  animation: fadeIn 1s ease-in-out;
}

.box-card {
  margin-bottom: 20px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.captcha-img {
  cursor: pointer;
  margin-left: 10px;
  vertical-align: middle;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}

.animated-card {
  animation: fadeIn 1s ease-in-out;
  opacity: 0;
  animation-fill-mode: forwards;
}

.animated-title {
  animation: slideIn 0.8s ease-in-out;
  animation-delay: 0.2s;
  opacity: 0;
  animation-fill-mode: forwards;
}

.animated-form {
  animation: slideIn 0.8s ease-in-out;
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