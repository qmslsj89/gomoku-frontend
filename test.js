// 处理玩家加入游戏
socket.on('joinGame', (data) => {
  if (!data || !data.username) {
    return;
  }
  const { username } = data;
  if (players.length < 2) {
    players.push({ id: socket.id, username });
    const player = players.length;
    socket.emit('playerAssignment', { player, username });
    io.emit('updatePlayers', { players: players.map(p => p.username) });
    console.log(`[${getCurrentTime()}] 玩家${player}加入游戏: ${username}`);
  } else {
    socket.emit('gameFull');
    console.log(`[${getCurrentTime()}] 游戏已满，无法加入: ${socket.id}`);
  }
});

// 发送当前游戏状态
socket.on('requestGameState', () => {
  socket.emit('gameState', { board, currentPlayer, players: players.map(p => p.username) });
});

// 监听自定义事件（例如游戏消息）
socket.on('gameMessage', (message) => {
  const { row, col, player } = message;
  if (board[row][col] === 0 && (socket.id === players[currentPlayer - 1].id || players[currentPlayer - 1].username === 'bot')) {
    board[row][col] = player;
    io.emit('gameMessage', { ...message, username: players[currentPlayer - 1].username }); // 广播给所有客户端
    console.log(`[${getCurrentTime()}] 玩家${players[currentPlayer - 1].username}下棋: row=${row}, col=${col}`);

    // 检查是否有玩家获胜
    if (checkWin(board, player)) {
      io.emit('gameMessage', { type: 'win', player, username: players[currentPlayer - 1].username });
      console.log(`[${getCurrentTime()}] 玩家${players[currentPlayer - 1].username}获胜`);
      recordGame(players[0].username, players[1].username, players[currentPlayer - 1].username);
      board = Array(15).fill(null).map(() => Array(15).fill(0)); // 重置棋盘
      currentPlayer = 1; // 重置当前玩家
    } else {
      currentPlayer = currentPlayer === 1 ? 2 : 1; // 切换玩家
      if (players[1] && players[1].username === 'bot' && currentPlayer === 2) {
        const botMove = generateBotMove(board);
        if (botMove) {
          board[botMove.row][botMove.col] = 2;
          io.emit('gameMessage', { type: 'move', row: botMove.row, col: botMove.col, player: 2, username: 'bot' });
          console.log(`[${getCurrentTime()}] 机器人下棋: row=${botMove.row}, col=${botMove.col}`);
          if (checkWin(board, 2)) {
            io.emit('gameMessage', { type: 'win', player: 2, username: 'bot' });
            console.log(`[${getCurrentTime()}] 机器人获胜`);
            recordGame(players[0].username, players[1].username, 'bot');
            board = Array(15).fill(null).map(() => Array(15).fill(0)); // 重置棋盘
            currentPlayer = 1; // 重置当前玩家
          } else {
            currentPlayer = 1; // 切换回玩家1
          }
        }
      }
    }
  }
});

// 监听与机器人对局请求
socket.on('playWithBot', () => {
  if (players.length < 2) {
    players.push({ id: 'bot', username: 'bot' });
    io.emit('playerAssignment', { player: 1, username: players[0].username }); // 确保玩家是黑棋
    io.emit('updatePlayers', { players: players.map(p => p.username) });
    console.log(`[${getCurrentTime()}] 玩家1: ${players[0].username}, 玩家2: 机器人`);
  }
});

// 监听延迟消息
socket.on('latency', (data) => {
  const { player, latency } = data;
  console.log(`[${getCurrentTime()}] 玩家${player}的延迟: ${latency} ms`);
  io.emit('latency', data); // 广播延迟信息给所有客户端
});

// 监听离开游戏事件
socket.on('leaveGame', () => {
  const playerIndex = players.findIndex(p => p.id === socket.id);
  if (playerIndex !== -1) {
    players.splice(playerIndex, 1);
    if (players.some(p => p.username === 'bot')) {
      players.splice(players.findIndex(p => p.username === 'bot'), 1);
    }
    io.emit('updatePlayers', { players: players.map(p => p.username) });
    console.log(`[${getCurrentTime()}] 玩家${socket.id}离开游戏`);
  }
});

// 监听断开连接事件
socket.on('disconnect', () => {
  console.log(`[${getCurrentTime()}] 客户端断开连接: ${socket.id}`);
  const playerIndex = players.findIndex(p => p.id === socket.id);
  if (playerIndex !== -1) {
    players.splice(playerIndex, 1);
    if (players.some(p => p.username === 'bot')) {
      players.splice(players.findIndex(p => p.username === 'bot'), 1);
    }
    io.emit('updatePlayers', { players: players.map(p => p.username) });
    console.log(`[${getCurrentTime()}] 玩家${socket.id}离开游戏`);
  }
});