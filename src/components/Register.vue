<template>
  <div class="register">
    <el-card class="box-card">
      <el-form ref="form" :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="form.password"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email"></el-input>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="register">注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-alert v-if="message" :title="message" type="error" show-icon></el-alert>
  </div>
</template>

<script>
import axios from 'axios';

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
      message: ''
    };
  },
  methods: {
    async register() {
      try {
        const response = await axios.post('http://115.235.134.18:3000/api/register', {
          username: this.form.username,
          password: this.form.password,
          email: this.form.email,
          phone: this.form.phone
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', this.form.username); // 将用户名存储在本地
        this.message = '注册成功';
        this.$emit('register', this.form.username);
        this.$emit('login', this.form.username);
        this.$router.push({ name: 'Home' });
      } catch (error) {
        this.message = error.response.data.message || '注册失败';
        console.error('注册失败:', error);
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
}
.box-card {
  margin-bottom: 20px;
}
</style>