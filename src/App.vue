<template>
  <div id="app">
    <el-watermark :font="font" :content="['智联五子棋', '（AI Connect Gomoku）']">
      <el-container>
        <el-header class="app-header animated-header">
          <div class="title animated-title" @click="goHome">智联五子棋（AI Connect Gomoku）</div>
          <div class="user-info-container" v-if="isLoggedIn">
            <el-dropdown @command="handleCommand">
              <template #default>
                <div class="user-info animated-user-info">
                  <span class="el-dropdown-link home_userinfo">{{ username }}</span>
                  <img :src="'http://115.235.191.234:3000' + userface" alt="用户头像" class="user-avatar" fit="cover">
                </div>
              </template>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="navigateToProfile">个人中心</el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" @click="navigateToMyAi">我的Ai</el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" @click="navigateToAdmin">管理用户</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>登出</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-watermark>

    <!-- 个人信息修改表单 -->
    <el-dialog v-model="isProfileDialogVisible" title="个人信息" :width="dialogWidth">
      <el-form :model="editableUser" label-width="100px">
        <el-form-item label="头像">
          <el-upload
            action="http://115.235.191.234:3000/api/uploadAvatar"
            list-type="picture-card"
            :auto-upload="true"
            :data="{ username: editableUser.username }"
            :file-list="fileList"
            @success="handleAvatarUploadSuccess"
            @change="handleAvatarChange"
            @before-upload="beforeAvatarUpload"
          >
            <img v-if="editableUser.userface" :src="'http://115.235.191.234:3000' + editableUser.userface" class="user-avatar" />
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="editableUser.username"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editableUser.email"></el-input>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="editableUser.phone"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveUserInfo" class="animated-button">保存</el-button>
          <el-button type="danger" @click="confirmDeleteAccount" class="animated-button">删除账户</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 固定的 AI 聊天按钮 -->
    <div class="chat-button" v-if="isAdmin" @click="toggleChat">
      <span v-if="!isChatOpen">AI 聊天</span>
      <span v-else>关闭聊天</span>
    </div>

    <!-- 固定的 AI 聊天窗口 -->
    <transition name="chat-fade" >
      <div class="chat-window"  v-if="isChatOpen">
        <div class="chat-header">
          <span >AI 聊天</span>
          <!-- <button @click="toggleChat">关闭</button> -->
        </div>
        <div class="chat-messages">
          <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
            <strong>{{ message.role === 'user' ? 'User' : 'AI' }}:</strong> {{ message.content }}
          </div>
        </div>
        <div class="chat-input">
          <input type="text" v-model="inputMessage" @keyup.enter="sendMessage" placeholder="输入消息..." />
          <button @click="sendMessage">发送</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import axios from 'axios';
import { ElMessageBox, ElMessage } from 'element-plus';
import eventBus from './eventBus';
import { reactive, watch } from 'vue';
import { isDark } from './dark';

export default {
  name: 'App',
  data() {
    return {
      isLoggedIn: false,
      username: '',
      userface: '',
      isProfileDialogVisible: false,
      isAdmin: false,
      editableUser: {
        username: '',
        email: '',
        phone: '',
        userface: ''
      },
      fileList: [],
      font: reactive({
        color: 'rgba(0, 0, 0, .15)',
      }),
      isChatOpen: false,
      inputMessage: '',
      messages: [],
      isSending: false
    };
  },
  computed: {
    dialogWidth() {
      return window.innerWidth < 768 ? '90%' : '50%';
    }
  },
  methods: {
    goHome() {
      this.$router.push({ name: 'Home' });
    },
    handleCommand(command) {
      if (command === 'logout') {
        this.logout();
      } else if (command === 'profile') {
        this.isProfileDialogVisible = true;
      }
    },
    navigateToProfile() {
      this.isProfileDialogVisible = true;
    },
    navigateToAdmin() {
      this.$router.push({ name: 'Admin' });
    },
    navigateToMyAi() {
      this.$router.push({ name: 'MyAi' });
    },
    logout() {
      axios.post('http://115.235.191.234:3000/api/logout')
        .then(() => {
          this.isLoggedIn = false;
          this.username = '';
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          this.$router.push({ name: 'Login' });
        })
        .catch(error => {
          console.error('登出失败:', error);
        });
    },
    handleAvatarUploadSuccess(response) {
      if (response.success) {
        this.editableUser.userface = response.url;
        this.userface = response.url;
      } else {
        console.error('头像上传失败:', response.message);
      }
    },
    handleAvatarChange(file, fileList) {
      this.fileList = fileList;
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isPNG = file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG && !isPNG) {
        this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
        return false;
      }
      return true;
    },
    async saveUserInfo() {
      try {
        const response = await axios.post('http://115.235.191.234:3000/api/updateUser', this.editableUser);
        if (response.data.success) {
          this.isProfileDialogVisible = false;
          ElMessage.success('用户信息更新成功');
          this.fetchUserInfo(); // 更新用户信息后刷新
        } else {
          console.error('更新用户信息失败:', response.data.message);
        }
      } catch (error) {
        console.error('更新用户信息时出错:', error);
      }
    },
    confirmDeleteAccount() {
      ElMessageBox.confirm('确定要删除账户吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteAccount();
        this.$router.push({ name: 'Login' });
      }).catch(() => { });
    },
    async deleteAccount() {
      try {
        const response = await axios.post('http://115.235.191.234:3000/api/deleteUser', { username: this.editableUser.username });
        if (response.data.success) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          this.isLoggedIn = false;
          this.username = '';
          this.isProfileDialogVisible = false;
          ElMessage.success('账户删除成功');
          this.$router.push({ name: 'Home' });
          this.fetchUserInfo(); // 删除账户后刷新
        } else {
          console.error('删除账户失败:', response.data.message);
        }
      } catch (error) {
        console.error('删除账户时出错:', error);
      }
    },
    async fetchUserInfo() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://115.235.191.234:3000/api/me', { headers: { 'x-access-token': token } });
          this.isLoggedIn = true;
          this.username = response.data.username;
          this.userface = response.data.userface;
          this.isAdmin = response.data.isAdmin;
          this.editableUser = { ...response.data };
        } catch {
          this.isLoggedIn = false;
          this.username = '';
        }
      }
    },
    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
    },
    async sendMessage() {
      const message = this.inputMessage;
      if (!message || this.isSending) return;

      this.messages.push({ role: 'user', content: message });
      this.inputMessage = '';
      this.isSending = true;

      try {
        const response = await fetch('http://115.235.191.234:3000/api/MyAi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: message })
        });
        const data = await response.json();
        this.messages.push({ role: 'ai', content: data.message });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.isSending = false;
      }
    }
  },
  created() {
    this.fetchUserInfo();
    eventBus.on('login', this.fetchUserInfo);
    eventBus.on('register', this.fetchUserInfo);

    watch(
      isDark,
      () => {
        this.font.color = isDark.value
          ? 'rgba(255, 255, 255, .05)'
          : 'rgba(0, 0, 0, .05)';
      },
      {
        immediate: true,
      }
    );
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  background-color: #f5f5f5; /* 更改背景颜色 */
  /* margin: 0;
  padding: 0; */
  min-height: 100vh;
}

.app-header {
  background-color: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px; /* 增加导航栏高度 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000; /* 确保导航栏在水印上方 */
}

.title {
  font-size: 22px;
  cursor: pointer;
}

.user-info-container {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.home_userinfo {
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  margin-right: 5px;
  margin-left: 5px;
  border-radius: 50%;
  object-fit: cover;
}

.animated-header {
  animation: fadeIn 1s ease-in-out;
}

.animated-title {
  animation: slideIn 1s ease-in-out;
  animation-delay: 0.2s;
  opacity: 0;
  animation-fill-mode: forwards;
}

.animated-user-info {
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

@media (max-width: 768px) {
  .app-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: auto; /* 允许导航栏高度自动调整 */
  }

  .title {
    margin-bottom: 0;
  }

  .user-info-container {
    justify-content: flex-end;
    width: auto;
  }

  .el-dialog {
    width: 100% !important;
    margin: 0 !important;
    min-height: 100vh;
  }

  .el-form-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .el-form-item label {
    width: auto !important;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 10px;
    height: auto; /* 允许导航栏高度自动调整 */
    flex-direction: row;
    justify-content: space-between;
  }

  .title {
    font-size: 18px;
  }

  .user-avatar {
    width: 30px;
    height: 30px;
  }

  .el-dialog {
    padding: 10px;
  }

  .el-form-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .el-form-item label {
    width: 100%;
  }
}

/* 新增的聊天按钮和聊天窗口样式 */
.chat-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #409eff;
  color: #fff;
  padding: 10px 20px;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: fadeIn 1s ease-in-out;
}

.chat-window {
  position: fixed;
  bottom: 70px;
  right: 20px;
  width: 300px;
  min-height: 400px;
  max-height: 400px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.5s ease-in-out;
}

.chat-header {
  background-color: #409eff;
  color: #fff;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.chat-messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.message {
  margin: 5px 0;
  animation: fadeIn 0.5s ease-in-out;
}

.message.user {
  text-align: right;
  color: #409eff;
}

.message.ai {
  text-align: left;
  color: #f96060;
}

.chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
}

.chat-input button {
  padding: 5px 10px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 新增的聊天窗口过渡动画 */
.chat-fade-enter-active, .chat-fade-leave-active {
  transition: opacity 0.5s;
}
.chat-fade-enter, .chat-fade-leave-to /* .chat-fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>