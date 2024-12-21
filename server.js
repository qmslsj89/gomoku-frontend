require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 允许所有来源，或者指定特定的域名
    methods: ["GET", "POST"]
  }
});

// 启用 CORS 支持
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 启用 session 支持
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 30 * 60 * 1000,
    secure: false
  } // 设置 session 的过期时间为 30 分钟
}));

// 从环境变量中获取密钥，如果不存在则使用默认值
const secretKey = process.env.SECRET_KEY || 'your_secret_key';

// 获取当前时间的格式化字符串
function getCurrentTime() {
  return new Date().toLocaleString();
}

// 用于测试的简单GET路由
app.get('/api/status', (req, res) => {
  res.json({ message: '五子棋服务器正在运行' });
});



// 棋盘状态
let board = Array(15).fill(null).map(() => Array(15).fill(0));
let currentPlayer = 1;
let players = [];


// 检查是否有玩家获胜
function checkWin(board, player) {
  const directions = [
    { x: 1, y: 0 }, // 水平
    { x: 0, y: 1 }, // 垂直
    { x: 1, y: 1 }, // 斜向下
    { x: 1, y: -1 } // 斜向上
  ];

  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col] === player) {
        for (let { x, y } of directions) {
          let count = 1;
          for (let i = 1; i < 5; i++) {
            const newRow = row + i * y;
            const newCol = col + i * x;
            if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && board[newRow][newCol] === player) {
              count++;
            } else {
              break;
            }
          }
          if (count === 5) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// 生成机器人的移动
function generateBotMove(board) {
  const directions = [
    { x: 1, y: 0 }, // 水平
    { x: 0, y: 1 }, // 垂直
    { x: 1, y: 1 }, // 斜向下
    { x: 1, y: -1 } // 斜向上
  ];

  function countConsecutive(row, col, player, direction) {
    let count = 0;
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * direction.y;
      const newCol = col + i * direction.x;
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  function evaluatePosition(row, col, player) {
    let score = 0;
    for (let direction of directions) {
      const count1 = countConsecutive(row, col, player, direction);
      const count2 = countConsecutive(row, col, player, { x: -direction.x, y: -direction.y });
      const totalCount = count1 + count2;

      // 根据连续棋子数量和空位情况进行评分
      if (totalCount >= 4) {
        score += 10000; // 五连
      } else if (totalCount === 3) {
        score += 1000; // 活四
      } else if (totalCount === 2) {
        score += 100; // 活三
      } else if (totalCount === 1) {
        score += 10; // 活二
      }
    }
    return score;
  }

  let bestMove = null;
  let bestScore = -Infinity;

  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col] === 0) {
        // 计算玩家和机器人的评分
        const playerScore = evaluatePosition(row, col, 1);
        const botScore = evaluatePosition(row, col, 2);

        // 优先阻止玩家获胜
        if (playerScore >= 10000) {
          return { row, col };
        }

        // 寻找机器人获胜机会
        if (botScore >= 10000) {
          return { row, col };
        }

        // 选择评分最高的位置
        const score = Math.max(playerScore, botScore);
        if (score > bestScore) {
          bestScore = score;
          bestMove = { row, col };
        }
      }
    }
  }

  // 如果没有紧急情况，则选择评分最高的位置
  return bestMove;
}

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';  // 监听所有网络接口

server.listen(PORT, HOST, () => {
  console.log(`[${getCurrentTime()}] 服务器正在监听 ${HOST}:${PORT}`);
});



// 记录对局结果
function recordGame(player1, player2, winner) {
  const query = 'INSERT INTO games (player1_username, player2_username, winner_username, created_at) VALUES (?, ?, ?, NOW())';
  db.query(query, [player1, player2, winner], (err, result) => {
    if (err) {
      console.error('记录对局失败:', err);
    } else {
      console.log('对局记录成功:', result.insertId);
    }
  });
}

// 监听自定义事件（例如游戏消息）
io.on('connection', (socket) => {
  console.log(`[${getCurrentTime()}] 新客户端连接: ${socket.id}`);

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
      // 清空棋盘
      board = Array(15).fill(null).map(() => Array(15).fill(0));
      currentPlayer = 1;
      io.emit('updatePlayers', { players: players.map(p => p.username) });
      io.emit('gameState', { board, currentPlayer, players: players.map(p => p.username) });
      console.log(`[${getCurrentTime()}] 玩家${socket.id}离开游戏，棋盘已重置`);
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
      // 清空棋盘
      board = Array(15).fill(null).map(() => Array(15).fill(0));
      currentPlayer = 1;
      io.emit('updatePlayers', { players: players.map(p => p.username) });
      io.emit('gameState', { board, currentPlayer, players: players.map(p => p.username) });
      console.log(`[${getCurrentTime()}] 玩家${socket.id}离开游戏，棋盘已重置`);
    }
  });
});









// 用户登录
app.post('/api/login', (req, res) => {
  const { username, password, captcha } = req.body;
  console.log(`[${getCurrentTime()}] 登录请求: ${JSON.stringify(req.body)}`); // 添加日志输出

  // 验证验证码
  const sessionCaptcha = req.body.captcha;
  console.log(`[${getCurrentTime()}] 输入的验证码是: ${captcha}`);
  console.log(`[${getCurrentTime()}] 正在比对验证码...`);
  if (!sessionCaptcha) {
    console.log(`[${getCurrentTime()}] 验证码错误: 验证码不存在`);
    return res.status(401).json({ message: '验证码错误' });
  }
  if (captcha.toLowerCase() !== sessionCaptcha.toLowerCase()) {
    console.log(`[${getCurrentTime()}] 验证码错误: 验证码不匹配`);
    return res.status(401).json({ message: '验证码错误' });
  }
  console.log(`[${getCurrentTime()}] 验证码验证成功`);

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 登录时出错:`, err);
      return res.status(500).json({ message: '服务器错误' });
    }
    if (results.length === 0) {
      console.log(`[${getCurrentTime()}] 用户不存在: ${username}`);
      return res.status(404).json({ message: '用户不存在' });
    }

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      console.log(`[${getCurrentTime()}] 密码错误: ${username}`);
      return res.status(401).json({ message: '密码错误' });
    }

    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: 86400 });
    req.session.username = username; // 将用户名存储在会话中
    console.log(`[${getCurrentTime()}] 将用户名存储在会话中: ${req.session.username}`);
    res.status(200).send({ auth: true, token, user: { username: user.username, email: user.email, phone: user.phone, userface: user.userface } });
    console.log(`[${getCurrentTime()}] 登录成功: ${username}`);
  });
});

// 用户登出
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 登出时出错:`, err);
      return res.status(500).send({ message: '登出失败' });
    }
    console.log(`[${getCurrentTime()}] 用户已登出`);
    res.status(200).send({ message: '登出成功' });
  });
});

// 用户注册
app.post('/api/register', (req, res) => {
  const { username, password, email, phone } = req.body;
  console.log(`[${getCurrentTime()}] 注册请求: ${JSON.stringify(req.body)}`); // 添加日志输出
  const hashedPassword = bcrypt.hashSync(password, 8);

  // 检查用户名是否已存在
  const checkUserQuery = 'SELECT * FROM users WHERE username = ?';
  db.query(checkUserQuery, [username], (err, results) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 检查用户名时出错:`, err); // 添加错误日志输出
      return res.status(500).send({ message: 'Error checking username' });
    }
    if (results.length > 0) {
      console.log(`[${getCurrentTime()}] 用户名已存在: ${username}`);
      return res.status(400).send({ message: '用户名已存在' });
    }

    const query = 'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)';
    db.query(query, [username, hashedPassword, email, phone], (err, result) => {
      if (err) {
        console.error(`[${getCurrentTime()}] 注册用户时出错:`, err); // 添加错误日志输出
        return res.status(500).send({ message: 'Error registering user' });
      }
      console.log(`[${getCurrentTime()}] 用户注册成功: ${username}`);

      // 生成 JWT
      const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });
      res.status(200).send({ message: '注册成功', token });
    });
  });
});

// 生成随机验证码
const generateCaptcha = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return captcha;
};

// 生成验证码图片逻辑
app.get('/verifyCode', (req, res) => {
  const captcha = generateCaptcha();
  req.session.captcha = captcha;
  console.log(`[${getCurrentTime()}] 生成的验证码是: ${captcha}`); // 在控制台输出验证码
  const canvas = createCanvas(100, 40);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 100, 40);
  ctx.fillStyle = '#000';
  ctx.font = '24px Arial';
  ctx.fillText(captcha, 10, 30);
  res.setHeader('Content-Type', 'image/png');
  canvas.pngStream().pipe(res);
});

// 验证验证码的路由
app.post('/verify-captcha', (req, res) => {
  const { userCaptcha } = req.body;
  const sessionCaptcha = req.session.captcha;

  if (userCaptcha.toLowerCase() === sessionCaptcha.toLowerCase()) {
    res.send({ success: true, message: '验证码正确' });
  } else {
    res.send({ success: false, message: '验证码错误' });
  }
});

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  console.log(`[${getCurrentTime()}] 创建上传目录: ${uploadDir}`);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`[${getCurrentTime()}] 文件上传目录: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    console.log(`[${getCurrentTime()}] 上传的文件名: ${file.originalname}`);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 设置文件大小限制为 50MB
});

// 配置静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 获取用户信息
app.get('/api/me', (req, res) => {
  console.log(`[${getCurrentTime()}] 获取用户信息请求`);
  const token = req.headers['x-access-token'];
  if (!token) {
    console.log(`[${getCurrentTime()}] 未提供令牌`);
    return res.status(401).send({ message: '未提供令牌' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log(`[${getCurrentTime()}] 令牌认证失败: ${err.message}`);
      return res.status(500).send({ message: '令牌认证失败', error: err.message });
    }

    const query = 'SELECT username, email, phone, userface FROM users WHERE username = ?';
    db.query(query, [decoded.username], (err, results) => {
      if (err) {
        console.log(`[${getCurrentTime()}] 服务器错误: ${err.message}`);
        return res.status(500).send({ message: '服务器错误', error: err.message });
      }
      if (results.length === 0) {
        console.log(`[${getCurrentTime()}] 未找到用户`);
        return res.status(404).send({ message: '未找到用户' });
      }

      console.log(`[${getCurrentTime()}] 成功获取用户信息: ${JSON.stringify(results[0])}`);
      res.status(200).send(results[0]);
    });
  });
});

// 头像文件上传
app.post('/api/uploadAvatar', upload.single('file'), (req, res) => {
  console.log(`[${getCurrentTime()}] 头像上传请求: ${JSON.stringify(req.file)}`);
  if (!req.file) {
    console.log(`[${getCurrentTime()}] 文件上传失败: 未找到文件`);
    return res.status(400).json({ success: false, message: '文件上传失败' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  const username = req.body.username;

  const query = 'UPDATE users SET userface = ? WHERE username = ?';
  db.query(query, [filePath, username], (err, result) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 更新头像时出错:`, err);
      return res.status(500).send({ message: 'Error updating avatar' });
    }
    console.log(`[${getCurrentTime()}] 头像上传成功: ${username}`);
    res.status(200).send({ success: true, message: '头像上传成功', url: filePath });
  });
});

// 更新用户信息
app.post('/api/updateUser', (req, res) => {
  console.log(`[${getCurrentTime()}] 更新用户信息请求: ${JSON.stringify(req.body)}`);
  const { username, email, phone, userface } = req.body;
  const query = 'UPDATE users SET email = ?, phone = ?, userface = ? WHERE username = ?';
  db.query(query, [email, phone, userface, username], (err, result) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 更新用户信息时出错:`, err);
      return res.status(500).send({ message: 'Error updating user information' });
    }
    console.log(`[${getCurrentTime()}] 用户信息更新成功: ${username}`);
    res.status(200).send({ success: true, message: 'User information updated successfully' });
  });
});

// 删除用户信息
app.post('/api/deleteUser', (req, res) => {
  const { username } = req.body;
  const query = 'DELETE FROM users WHERE username = ?';
  db.query(query, [username], (err, result) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 删除用户时出错:`, err);
      return res.status(500).send({ message: 'Error deleting user' });
    }
    console.log(`[${getCurrentTime()}] 用户删除成功: ${username}`);
    res.status(200).send({ success: true, message: 'User deleted successfully' });
  });
});

// 获取用户对局记录
app.get('/api/games/:username', (req, res) => {
  const username = req.params.username;

  const query = 'SELECT * FROM games WHERE player1_username = ? OR player2_username = ?';
  db.query(query, [username, username], (err, results) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 获取对局记录时出错:`, err);
      return res.status(500).send({ message: 'Error retrieving games' });
    }
    console.log(`[${getCurrentTime()}] 成功获取对局记录: ${JSON.stringify(results)}`);
    res.status(200).send(results);
  });
});