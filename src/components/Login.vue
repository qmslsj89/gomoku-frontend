<template>
  <div class="login">
    <el-card class="box-card">
      <el-form ref="form" :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="form.password"></el-input>
        </el-form-item>
        <el-form-item label="验证码">
          <el-input v-model="form.captcha"></el-input>
          <img :src="captchaUrl" @click="refreshCaptcha" alt="验证码">
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-alert v-if="message" :title="message" type="error" show-icon></el-alert>
  </div>
</template>

<script>
import axios from 'axios';
import io from 'socket.io-client';

export default {
  name: 'UserLogin',
  data() {
    return {
      form: {
        username: '',
        password: '',
        captcha: ''
      },
      captchaUrl: 'http://115.235.134.18:3000/verifyCode',
      message: ''
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post('http://115.235.134.18:3000/api/login', {
          username: this.form.username,
          password: this.form.password,
          captcha: this.form.captcha
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', this.form.username); // 将用户名存储在本地
        this.message = '登录成功';
        this.$emit('login', this.form.username);
        this.$router.push({ name: 'Home' });

        // 连接到 Socket.IO 并传递用户名
        const socket = io('http://115.235.134.18:3000', {
          query: { username: this.form.username }
        });
        socket.emit('joinGame');
      } catch (error) {
        this.message = error.response.data.message || '登录失败';
        console.error('登录失败:', error);
        this.refreshCaptcha(); // 登录失败后刷新验证码
      }
    },
    refreshCaptcha() {
      this.captchaUrl = `http://115.235.134.18:3000/verifyCode?${Date.now()}`;
    }
  }
};
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}
</style>