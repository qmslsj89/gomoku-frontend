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
  cookie: { maxAge: 30 * 60 * 1000 } // 设置 session 的过期时间为 30 分钟
}));

// 配置静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 设置文件大小限制为 50MB
});

const secretKey = process.env.SECRET_KEY || 'your_secret_key';

// 获取当前时间的格式化字符串
function getCurrentTime() {
  return new Date().toLocaleString();
}

// 用于测试的简单GET路由
app.get('/api/status', (req, res) => {
  res.json({ message: '五子棋服务器正在运行' });
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
      return res.status(400).send({ message: '用户名已存在' });
    }

    const query = 'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)';
    db.query(query, [username, hashedPassword, email, phone], (err, result) => {
      if (err) {
        console.error(`[${getCurrentTime()}] 注册用户时出错:`, err); // 添加错误日志输出
        return res.status(500).send({ message: 'Error registering user' });
      }
      res.status(200).send({ message: 'User registered successfully' });
      io.emit('newUser', { username, email, phone }); // 实时通知前端有新用户注册
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

// 获取用户信息
app.get('/api/me', (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ message: 'No token provided' });

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(500).send({ message: 'Failed to authenticate token' });

    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err) return res.status(500).send({ message: 'Error on the server' });
      if (results.length === 0) return res.status(404).send({ message: 'No user found' });

      res.status(200).send(results[0]);
    });
  });
});

// 记录对局
app.post('/api/games', (req, res) => {
  const { player1, player2, winner } = req.body;
  console.log(`[${getCurrentTime()}] 记录对局请求: ${JSON.stringify(req.body)}`); // 添加日志输出

  // 将玩家和机器人的信息映射到数据库中的 player1_id、player2_id 和 winner_id
  const player1_id = player1 === 'bot' ? null : player1;
  const player2_id = player2 === 'bot' ? null : player2;
  const winner_id = winner === 'bot' ? null : winner;

  console.log(`[${getCurrentTime()}] player1_id: ${player1_id}, player2_id: ${player2_id}, winner_id: ${winner_id}`);

  if (!player1_id && player1_id !== 'bot' || !player2_id && player2_id !== 'bot' || !winner_id && winner_id !== 'bot') {
    return res.status(400).send({ message: '缺少必要的参数' });
  }

  const query = 'INSERT INTO games (player1_id, player2_id, winner_id) VALUES (?, ?, ?)';
  db.query(query, [player1_id, player2_id, winner_id], (err, result) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 记录对局失败:`, err);
      return res.status(500).send({ message: '记录对局失败' });
    }
    res.status(200).send({ message: '记录对局成功' });
  });
});

// 获取用户对局记录
app.get('/api/games/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = 'SELECT * FROM games WHERE player1_id = ? OR player2_id = ?';
  db.query(query, [userId, userId], (err, results) => {
    if (err) return res.status(500).send({ message: 'Error retrieving games' });
    res.status(200).send(results);
  });
});

// 文件上传路由
app.post('/api/uploadAvatar', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '文件上传失败' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  const username = req.body.username;

  const query = 'UPDATE users SET avatar = ? WHERE username = ?';
  db.query(query, [filePath, username], (err, result) => {
    if (err) return res.status(500).send({ message: 'Error updating avatar' });
    res.status(200).send({ success: true, message: '头像上传成功', url: filePath });
  });
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
    for (let i = 0; i < 5; i++) {
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

  // 优先阻止玩家获胜
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col] === 0) {
        for (let direction of directions) {
          if (countConsecutive(row, col, 1, direction) >= 4) {
            return { row, col };
          }
        }
      }
    }
  }

  // 寻找机器人获胜机会
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col] === 0) {
        for (let direction of directions) {
          if (countConsecutive(row, col, 2, direction) >= 4) {
            return { row, col };
          }
        }
      }
    }
  }

  // 如果没有紧急情况，则随机选择一个空位置
  let emptyCells = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col] === 0) {
        emptyCells.push({ row, col });
      }
    }
  }
  if (emptyCells.length > 0) {
    const move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return move;
  }
  return null;
}

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';  // 监听所有网络接口

server.listen(PORT, HOST, () => {
  console.log(`[${getCurrentTime()}] 服务器正在监听 ${HOST}:${PORT}`);
});

// 用户登录
app.post('/api/login', (req, res) => {
  const { username, password, captcha } = req.body;
  console.log(`[${getCurrentTime()}] 登录请求: ${JSON.stringify(req.body)}`); // 添加日志输出
  // 验证验证码
  console.log(`[${getCurrentTime()}] 输入的验证码是: ${captcha}`);
  console.log(`[${getCurrentTime()}] 正在比对验证码...`);
  console.log(`[${getCurrentTime()}] 请求中的验证码是: ${req.body.captcha}`);
  if (!req.body.captcha) {
    console.log(`[${getCurrentTime()}] 验证码错误: 验证码不存在`);
    return res.status(401).json({ message: '验证码错误' });
  }
  if (req.body.captcha.toLowerCase() !== captcha.toLowerCase()) {
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
      return res.status(404).json({ message: '用户不存在' });
    }

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ message: '密码错误' });
    }

    const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: 86400 });
    req.session.username = username; // 将用户名存储在会话中
    console.log(`[${getCurrentTime()}] 将用户名存储在会话中: ${req.session.username}`);
    res.status(200).send({ auth: true, token, user });
  });
  console.log(`[${getCurrentTime()}] 登录成功`);
});

// Socket.IO连接事件
io.on('connection', (socket) => {
  console.log(`[${getCurrentTime()}] 新客户端连接: ${socket.id}`);

  // 处理玩家加入游戏
  socket.on('joinGame', (data) => {
    if (!data || !data.username) {
      // console.log(`[${getCurrentTime()}] 用户名不存在`);
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
        board = Array(15).fill(null).map(() => Array(15).fill(0)); // 重置棋盘
      } else {
        currentPlayer = currentPlayer === 1 ? 2 : 1; // 切换玩家
        if (players[1].username === 'bot' && currentPlayer === 2) {
          const botMove = generateBotMove(board);
          if (botMove) {
            board[botMove.row][botMove.col] = 2;
            io.emit('gameMessage', { type: 'move', row: botMove.row, col: botMove.col, player: 2, username: 'bot' });
            console.log(`[${getCurrentTime()}] 机器人下棋: row=${botMove.row}, col=${botMove.col}`);
            if (checkWin(board, 2)) {
              io.emit('gameMessage', { type: 'win', player: 2, username: 'bot' });
              console.log(`[${getCurrentTime()}] 机器人获胜`);
              board = Array(15).fill(null).map(() => Array(15).fill(0)); // 重置棋盘
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
});
// 用户登出
app.post('/api/logout', (req, res) => {
  // const username = req.session.username; // 在销毁会话之前获取用户名
  // console.log(`[${getCurrentTime()}] 用户${ req.session.username}已登出`);
  req.session.destroy((err) => {
    if (err) {
      console.error(`[${getCurrentTime()}] 登出时出错:`, err);
      return res.status(500).send({ message: '登出失败' });
    }
    console.log(`[${getCurrentTime()}] 用户已登出`);
    res.status(200).send({ message: '登出成功' });
  });
});