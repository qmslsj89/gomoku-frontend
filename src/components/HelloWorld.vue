<template>
  <div class="hello">
    <el-card class="box-card">
      <h1>{{ msg }}</h1>
      <p>欢迎来到五子棋游戏！</p>
      <el-button type="primary" @click="startGame">开始游戏</el-button>
    </el-card>
  </div>
</template>

<script>
import { initSocket, getSocket } from '../socket';

export default {
  name: 'HelloWorld',
  props: {
    msg: String
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
    }
  }
};
</script>

<style scoped>
h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}
p {
  margin: 1em 0;
  color: #666;
}
.box-card {
  margin-bottom: 20px;
}
</style>