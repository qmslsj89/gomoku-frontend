<template>
  <div class="register">
    <el-card class="box-card">
      <h2 class="register-title">用户注册</h2>
      <el-form ref="form" :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="form.password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" placeholder="请输入电话"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="register" :loading="loading">注册</el-button>
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
import eventBus from '../eventBus';

export default {
  name: 'UserRegister',
  data() {
    return {
      form: {
        username: '',
        password: '',
        email: '',
        phone: ''
      },
      message: '',
      loading: false
    };
  },
  methods: {
    async register() {
      this.loading = true;
      try {
        const response = await axios.post('http://115.235.168.136:3000/api/register', {
          username: this.form.username,
          password: this.form.password,
          email: this.form.email,
          phone: this.form.phone
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', this.form.username); // 将用户名存储在本地
        this.message = '注册成功';
        eventBus.emit('register');
        this.$router.push({ name: 'Home' });
      } catch (error) {
        this.message = error.response.data.message || '注册失败';
        console.error('注册失败:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.register {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  animation: fadeIn 1s;
}

.box-card {
  margin-bottom: 20px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>