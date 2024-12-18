<template>
  <div class="gomoku-board" v-if="isConnected">
    <el-card class="box-card">
      <div v-if="player > 1" class="current-player">
        当前玩家: <span :class="{ 'player1': currentPlayer === 1, 'player2': currentPlayer === 2 }">{{ currentPlayer === 1 ?
          '玩家1 (黑棋)' : '玩家2 (白棋)' }}</span>
      </div>
      <div v-else class="current-player">
        等待匹配中...
        <el-button v-if='!isPlayingWithBot' type="primary" @click="playWithBot">与机器人对局</el-button>
      </div>
      <div class="match-info">
        <div v-if="players.length === 2">
          <p>玩家1 (黑棋): {{ players[0] }}</p>
          <p>玩家2 (白棋): {{ players[1] }}</p>
        </div>
      </div>
      <div class="current-turn" v-if="players.length === 2">
        <p v-if="currentPlayer === player">轮到你下棋</p>
        <p v-else>轮到 {{ currentPlayer === 1 ? '玩家1 (黑棋)' : '玩家2 (白棋)' }} 下棋</p>
      </div>
      <div class="board" v-if="players.length === 2">
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
          <div v-for="(cell, colIndex) in row" :key="colIndex" class="cell"
            :class="{ 'player1': cell === 1, 'player2': cell === 2 }" @click="handleCellClick(rowIndex, colIndex)">
          </div>
        </div>
      </div>
      <el-button type="danger" @click="leaveGame">退出游戏</el-button>
      <div class="game-history">
        <h2>对局记录</h2>
        <ul>
          <li v-for="game in games" :key="game.id">
            玩家1: {{ game.player1_id }}, 玩家2: {{ game.player2_id }}, 胜者: {{ game.winner_id }}
          </li>
        </ul>
      </div>
    </el-card>
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
      player: 0, // 当前玩家
      players: [], // 存储玩家信息
      latencies: { 1: 0, 2: 0 }, // 存储玩家延迟
      isPlayingWithBot: false, // 是否与机器人对局
      games: [] // 存储对局记录
    };
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
        this.player = data.player;
      });
      socket.on('updatePlayers', (data) => {
        this.players = data.players;
        console.log('玩家信息:', this.players);
      });
      socket.on('latency', (data) => {
        this.$set(this.latencies, data.player, data.latency);
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
      axios.get('http://115.235.134.18:3000/api/me', { headers: { 'x-access-token': token } })
        .then(response => {
          const userId = response.data.id;
          return axios.get(`http://115.235.134.18:3000/api/games/${userId}`);
        })
        .then(response => {
          this.games = response.data;
        })
        .catch(error => {
          console.error('获取对局记录失败:', error);
        });
    },
    handleCellClick(row, col) {
      if (this.board[row][col] === 0 && this.player === this.currentPlayer) {
        // 发送玩家移动的消息
        const socket = getSocket();
        if (socket) {
          console.log(`发送消息: row=${row}, col=${col}, player=${this.player}`);
          socket.emit('gameMessage', { type: 'move', row, col, player: this.player });
        }
      }
    },
    handleGameMessage(message) {
      if (message.type === 'move') {
        this.board[message.row][message.col] = message.player;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        if (message.player === 1 && this.players[1] === '机器人') {
          this.currentPlayer = 2; // 切换到机器人
          this.makeBotMove();
        }
      } else if (message.type === 'win') {
        alert(`玩家 ${message.username} 获胜!`);
        this.recordGame(message.player);
        this.showRestartDialog();
      }
    },
    recordGame(winnerId) {
      const token = localStorage.getItem('token');
      axios.get('http://115.235.134.18:3000/api/me', { headers: { 'x-access-token': token } })
        .then(response => {
          const userId = response.data.id;
          const player1 = this.players[0] === '玩家1' ? userId : (this.players[0] === '机器人' ? 'bot' : null);
          const player2 = this.players[1] === '玩家2' ? userId : (this.players[1] === '机器人' ? 'bot' : null);
          return axios.post('http://115.235.134.18:3000/api/games', {
            player1,
            player2,
            winner: winnerId === 1 ? player1 : player2
          });
        })
        .then(() => {
          this.fetchGameHistory();
        })
        .catch(error => {
          console.error('记录对局失败:', error);
        });
    },
    resetBoard() {
      this.board = Array(15).fill(null).map(() => Array(15).fill(0));
      this.currentPlayer = 1;
    },
    showRestartDialog() {
      if (confirm("是否继续游戏？")) {
        this.resetBoard();
      } else {
        this.leaveGame();
      }
    },
    playWithBot() {
      const socket = getSocket();
      if (socket) {
        socket.emit('playWithBot');
        // this.player = 2; // 确保玩家是黑棋
        // this.currentPlayer = 1; // 确保玩家先下棋
        this.isPlayingWithBot = true; // 设置为与机器人对局
        // this.players = ['玩家1', '机器人']; // 设置玩家信息
      }
      console.log(this.players);
    },
    makeBotMove() {
      const socket = getSocket();
      if (socket) {
        const botMove = this.generateBotMove();
        if (botMove) {
          socket.emit('gameMessage', { type: 'move', row: botMove.row, col: botMove.col, player: 2 });
          this.currentPlayer = 1; // 切换回玩家
        }
      }
    },
    generateBotMove() {
      let emptyCells = [];
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (this.board[row][col] === 0) {
            emptyCells.push({ row, col });
          }
        }
      }
      if (emptyCells.length > 0) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
      return null;
    },
    startLatencyCheck() {
      const socket = getSocket();
      if (socket) {
        setInterval(() => {
          const startTime = Date.now();
          socket.emit('ping', () => {
            const latency = Date.now() - startTime;
            socket.emit('latency', { player: this.player, latency });
          });
        }, 1000); // 每秒检查一次延迟
      }
    },
    leaveGame() {
      const socket = getSocket();
      if (socket) {
        socket.emit('leaveGame');
        socket.disconnect();
      }
      this.$router.push({ name: 'Home' });
    }
  }
};
</script>

<style scoped>
.gomoku-board {
  text-align: center;
}

.current-player {
  margin-top: 10px;
  font-size: 1.2em;
}

.current-player .player1 {
  color: black;
}

.current-player .player2 {
  color: white;
  background-color: black;
  padding: 2px 5px;
}

.match-info {
  margin-top: 10px;
  font-size: 1em;
}

.current-turn {
  margin-top: 10px;
  font-size: 1.2em;
  color: #d9534f;
  /* 红色提示 */
}

.board {
  display: inline-block;
  margin-top: 20px;
  background-color: #f0d9b5;
  /* 棋盘背景颜色 */
  padding: 10px;
  border: 2px solid #8b4513;
  /* 棋盘边框颜色 */
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
}

.cell.player1 {
  background-color: black;
  /* 玩家1棋子颜色 */
}

.cell.player2 {
  background-color: white;
  /* 玩家2棋子颜色 */
}

.game-history {
  margin-top: 20px;
}
</style>