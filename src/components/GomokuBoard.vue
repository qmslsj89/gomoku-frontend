<template>
  <div class="gomoku-board" v-if="isConnected">
    <el-card class="box-card">
      <div class="info-section">
        <div v-if="players.length > 1" class="current-player">
          <el-tag type="info">当前玩家:</el-tag>
          <el-tag :type="currentPlayer === 1 ? 'success' : 'warning'" class="player-tag">
            {{ currentPlayer === 1 ? '玩家1 (黑棋)' : '玩家2 (白棋)' }}
          </el-tag>
        </div>
        <div v-else class="current-player">
          <el-tag type="info">等待匹配中...</el-tag>
          <el-button v-if='!isPlayingWithBot' type="primary" @click="playWithBot"
            class="play-with-bot-button">与机器人对局</el-button>
        </div>
        <div class="match-info" v-if="players.length === 2">
          <el-tag type="success">玩家1 (黑棋): {{ players[0] }}</el-tag>
          <el-tag type="warning">玩家2 (白棋): {{ players[1] }}</el-tag>
        </div>
        <div class="current-turn" v-if="players.length === 2">
          <el-alert
            :title="currentPlayer === getCurrentPlayerIndex() ? '轮到你下棋' : '轮到 ' + (currentPlayer === 1 ? '玩家1 (黑棋)' : '玩家2 (白棋)') + ' 下棋'"
            type="info" show-icon></el-alert>
        </div>
      </div>
      <div class="board-container" v-if="players.length === 2">
        <div class="board">
          <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
            <div v-for="(cell, colIndex) in row" :key="colIndex" class="cell"
              :class="{ 'player1': cell === 1, 'player2': cell === 2 }" @click="handleCellClick(rowIndex, colIndex)">
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <el-button type="danger" @click="leaveGame">退出游戏</el-button>
      </div>
      <div class="game-history-toggle">
        <el-button type="primary" @click="toggleGameHistory">
          {{ showGameHistory ? '隐藏对局记录' : '显示对局记录' }}
        </el-button>
      </div>
    </el-card>
    <el-card class="box-card" v-if="showGameHistory">
      <h2>对局记录</h2>
      <div class="game-history-table">
        <div class="game-history-header">
          <span class="header-item">玩家1 (黑棋)</span>
          <span class="header-item">玩家2 (白棋)</span>
          <span class="header-item">胜者</span>
        </div>
        <div v-for="game in paginatedGames" :key="game.id" class="game-history-row">
          <span class="row-item">{{ game.player1_username }}</span>
          <span class="row-item">{{ game.player2_username }}</span>
          <span class="row-item">{{ game.winner_username }}</span>
        </div>
      </div>
      <div class="pagination-container">
        <el-button type="primary" @click="togglePagination" class="pagination-toggle">
          {{ showPagination ? '隐藏分页' : '显示分页' }}
        </el-button>
        <el-pagination v-if="showPagination" @current-change="handlePageChange" @size-change="handleSizeChange"
          :current-page="currentPage" :page-size="pageSize" layout="sizes, prev, pager, next" :total="games.length"
          :page-sizes="[5, 10, 20, 50]" prev-text="<" next-text=">"></el-pagination>
      </div>
    </el-card>
    <!-- 固定的聊天按钮 -->
    <div class="chat-button" @click="toggleChat">
      <span v-if="!isChatOpen">对局聊天</span>
      <span v-else>关闭聊天</span>
    </div>

    <!-- 固定的聊天窗口 -->
    <transition name="chat-fade">
      <div class="chat-window" v-if="isChatOpen">
        <div class="chat-header">
          <span>对局聊天</span>
        </div>
        <div class="chat-messages">
          <div v-for="(msg, index) in messages" :key="index"
            :class="['message', msg.username === username ? 'user' : 'ai']">
            <span class="message-username">{{ msg.username }}:</span>
            <span class="message-content">{{ msg.message }}</span>
            <span class="message-time">{{ msg.time }}</span>
          </div>
        </div>
        <div class="chat-input">
          <input type="text" v-model="newMessage" @keyup.enter="sendMessage" placeholder="输入消息..." />
          <button @click="sendMessage">发送</button>
        </div>
      </div>
    </transition>
  </div>
  <div v-else>正在连接到服务器...</div>
</template>

<script>
import { initSocket, getSocket } from '../socket';
import axios from 'axios';

export default {
  data() {
    return {
      board: Array(15).fill(null).map(() => Array(15).fill(0)), // 15x15 棋盘
      currentPlayer: 1, // 1 表示玩家1， 2 表示玩家2
      isConnected: false, // 初始连接状态
      players: [], // 存储玩家信息
      isPlayingWithBot: false, // 是否与机器人对局
      games: [], // 存储对局记录
      showGameHistory: false, // 控制对局记录显示状态
      showPagination: false, // 控制分页组件显示状态
      currentPage: 1, // 当前页码
      pageSize: 5, // 每页显示的记录数
      roomId: null, // 当前房间ID
      messages: [], // 聊天消息
      newMessage: '', // 新消息内容
      username: localStorage.getItem('username'), // 当前用户名
      isChatOpen: false // 聊天窗口状态
    };
  },
  computed: {
    paginatedGames() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.games.slice(start, end);
    }
  },
  created() {
    // 初始化WebSocket连接
    initSocket();
    const socket = getSocket();
    if (socket) {
      socket.on('connect', () => {
        this.isConnected = true;
        this.joinGame();
        this.fetchGameHistory();
      });
      socket.on('disconnect', () => {
        this.isConnected = false;
      });
      socket.on('gameMessage', this.handleGameMessage);
      socket.on('playerAssignment', (data) => {
        this.players.push(data.username);
      });
      socket.on('updatePlayers', (data) => {
        this.players = data.players;
        console.log('玩家信息:', this.players);
      });
      socket.on('startGame', (data) => {
        this.roomId = data.roomId;
        console.log('房间ID已设置:', this.roomId);
      });
      socket.on('chatMessage', (data) => {
        this.messages.push(data);
      });
    }
  },
  methods: {
    joinGame() {
      const socket = getSocket();
      if (socket) {
        const username = localStorage.getItem('username');
        console.log(username);
        socket.emit('joinGame', { username });
      }
    },
    fetchGameHistory() {
      const token = localStorage.getItem('token');
      axios.get('http://115.235.191.234:3000/api/me', { headers: { 'x-access-token': token } })
        .then(response => {
          console.log('当前用户信息:', response.data);

          const username = response.data.username;
          return axios.get(`http://115.235.191.234:3000/api/games/${username}`);
        })
        .then(response => {
          this.games = response.data;
        })
        .catch(error => {
          console.error('获取对局记录失败:', error);
        });
    },
    handleCellClick(row, col) {
      if (this.board[row][col] === 0 && this.currentPlayer === this.getCurrentPlayerIndex()) {
        // 发送玩家移动的消息
        const socket = getSocket();
        if (socket) {
          console.log(`发送消息: row=${row}, col=${col}, player=${this.currentPlayer}`);
          console.log('房间ID:', this.roomId);

          socket.emit('gameMessage', { type: 'move', row, col, player: this.currentPlayer, roomId: this.roomId });
        }
      }
    },
    handleGameMessage(message) {
      if (message.type === 'move') {
        this.board[message.row][message.col] = message.player;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      } else if (message.type === 'win') {
        this.$notify({
          title: '游戏结束',
          message: `玩家 ${message.username} 获胜!`,
          type: 'success'
        });
        this.showRestartDialog();
      }
    },
    resetBoard() {
      this.board = Array(15).fill(null).map(() => Array(15).fill(0));
      this.currentPlayer = 1;
    },
    showRestartDialog() {
      this.$confirm('是否继续游戏？', '提示', {
        confirmButtonText: '继续',
        cancelButtonText: '退出',
        type: 'warning'
      }).then(() => {
        this.resetBoard();
        this.fetchGameHistory(); // 刷新游戏记录
      }).catch(() => {
        this.leaveGame();
      });
    },
    playWithBot() {
      const socket = getSocket();
      if (socket) {
        socket.emit('playWithBot');
        this.isPlayingWithBot = true; // 设置为与机器人对局
      }
      console.log(this.players);
    },
    leaveGame() {
      const socket = getSocket();
      if (socket) {
        socket.emit('leaveGame', { roomId: this.roomId });
        socket.disconnect();
      }
      this.$router.push({ name: 'Home' });
    },
    getCurrentPlayerIndex() {
      const username = localStorage.getItem('username');
      return this.players.findIndex(player => player === username) + 1;
    },
    toggleGameHistory() {
      this.showGameHistory = !this.showGameHistory;
    },
    togglePagination() {
      this.showPagination = !this.showPagination;
    },
    handlePageChange(page) {
      this.currentPage = page;
    },
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1; // 重置到第一页
    },
    sendMessage() {
      if (this.newMessage.trim() === '') return;
      const socket = getSocket();
      if (socket) {
        socket.emit('chatMessage', {
          roomId: this.roomId,
          message: this.newMessage,
          username: this.username
        });
        this.newMessage = '';
      }
    },
    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
    }
  }
};
</script>

<style scoped>
.gomoku-board {
  text-align: center;
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
  /* 增加卡片之间的间隔 */
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.box-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.info-section {
  margin-bottom: 20px;
}

.current-player {
  margin-top: 10px;
  font-size: 1.2em;
  color: #333;
}

.current-player .player1 {
  color: black;
}

.current-player .player2 {
  color: white;
  background-color: black;
  padding: 2px 5px;
  border-radius: 3px;
}

.match-info {
  margin-top: 10px;
  font-size: 1em;
  color: #666;
}

.current-turn {
  margin-top: 10px;
  font-size: 1.2em;
  color: #d9534f;
  /* 红色提示 */
}

.board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.board {
  background-color: #f0d9b5;
  /* 棋盘背景颜色 */
  padding: 10px;
  border: 2px solid #8b4513;
  /* 棋盘边框颜色 */
  border-radius: 5px;
}

.row {
  display: flex;
}

.cell {
  width: 30px;
  height: 30px;
  border: 1px solid #8b4513;
  /* 棋格边框颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #f3e5ab;
  /* 棋格背景颜色 */
  transition: background-color 0.3s;
  /* margin: auto; */
}

.cell.player1 {
  background-color: black;
  /* border-radius: 50%;
  border: 1px solid red; */
  /* 玩家1棋子颜色 */
}

.cell.player2 {
  background-color: white;
  /* border-radius: 50%;
  border: 1px solid red; */
  /* 玩家2棋子颜色 */
}

.cell:hover {
  background-color: #d3c5a5;
}

.actions {
  margin-top: 20px;
}

.game-history-toggle {
  margin-top: 20px;
}

.game-history {
  margin-top: 20px;
}

.game-history h2 {
  margin-bottom: 10px;
  color: #333;
}

.game-history-table {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-history-header,
.game-history-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.game-history-header {
  font-weight: bold;
  background-color: #f5f5f5;
}

.game-history-row {
  background-color: #fff;
  transition: background-color 0.3s;
}

.game-history-row:hover {
  background-color: #f1f1f1;
}

.header-item,
.row-item {
  flex: 1;
  text-align: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.chat-container {
  margin-top: 20px;
}

.messages {
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.message {
  margin: 5px 0;
  padding: 5px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.message-username {
  font-weight: bold;
}

.message-content {
  display: inline-block;
  margin-left: 5px;
}

.message-time {
  display: block;
  font-size: 0.8em;
  color: #999;
}

.user {
  background-color: #e0f7fa;
  color: #00796b;
  text-align: right;
}

.ai {
  background-color: #e8f5e9;
  color: #388e3c;
  text-align: left;
}

.input-container {
  display: flex;
  justify-content: space-between;
}

input[type="text"] {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-right: 10px;
}

button {
  padding: 10px 20px;
  /* background-color: #00796b; */
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}


button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .board-container {
    margin-top: 10px;
  }

  .board {
    width: 100%;
    padding: 5px;
  }

  .cell {
    width: 20px;
    height: 20px;
  }

  .pagination-container {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .board-container {
    margin-top: 5px;
  }

  .board {
    width: 100%;
    padding: 2px;
  }

  .cell {
    width: 15px;
    height: 15px;
  }

  .pagination-container {
    flex-direction: column;
    align-items: center;
  }

  .el-pagination {
    font-size: 12px;
  }

  .pagination-toggle {
    margin-bottom: 10px;
  }
}
.chat-button {
  position: fixed;
  right: 20px;
  bottom: 65px;
  background-color: #00796b;
  color: #fff;
  padding: 10px 20px;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.chat-window {
  position: fixed;
  right: 20px;
  bottom: 110px;
  width: 300px;
  max-height: 400px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background-color: #00796b;
  color: #fff;
  padding: 10px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.chat-messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-right: 10px;
}

.chat-input button {
  padding: 10px 20px;
  background-color: #00796b;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.chat-input button:hover {
  background-color: #004d40;
}

.chat-fade-enter-active, .chat-fade-leave-active {
  transition: opacity 0.5s;
}

.chat-fade-enter, .chat-fade-leave-to /* .chat-fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>