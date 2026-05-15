const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 支持多路径访问 Socket.io (适配 Nginx 是否剥离 /study 前缀的两种情况)
server.prependListener('request', (req, res) => {
  if (req.url.startsWith('/study/socket.io')) {
    req.url = req.url.replace('/study/socket.io', '/socket.io');
  }
});
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// 请求日志，用于排查部署路径问题
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// 静态资源彻底兜底：无论请求路径如何（例如 /study/english/assets/xxx.js），
// 只要路径包含 /assets/，就直接去 dist/assets 文件夹找。
app.get(/.*\/assets\/(.*)/, (req, res) => {
  const filename = req.params[0];
  const assetPath = path.join(__dirname, '../dist/assets', filename);
  if (fs.existsSync(assetPath)) {
    res.sendFile(assetPath);
  } else {
    res.status(404).send('Asset not found');
  }
});

// Database setup
const dbDir = process.env.DB_PATH || path.join(__dirname, 'db');
const dbPath = path.join(dbDir, 'english.sqlite');

// Ensure db directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    phonetic TEXT,
    translation TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    distractors_en TEXT, -- JSON array of 6+ English words
    distractors_zh TEXT, -- JSON array of 6+ Chinese translations
    mastered BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );
`);

// 数据库迁移：确保 users 表有 role 和 total_study_seconds 列
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN total_study_seconds INTEGER DEFAULT 0");
} catch (e) {}

db.exec(`
  -- 基础表结构初始化
  CREATE TABLE IF NOT EXISTS test_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    score INTEGER,
    duration_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_word_progress (
    user_id INTEGER,
    word_id INTEGER,
    view_count INTEGER DEFAULT 0,
    last_viewed DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, word_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(word_id) REFERENCES words(id)
  );
`);

// Router definition
const apiRouter = express.Router();

// Apply router to both paths
app.use('/api', apiRouter);
app.use('/study/api', apiRouter);

// 初始化管理员账号 (从环境变量读取)
const initAdmin = () => {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  
  if (adminUser && adminPass) {
    try {
      const stmt = db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)');
      stmt.run(adminUser, adminPass, 'admin');
      console.log(`[Init] Admin user "${adminUser}" ensured.`);
    } catch (err) {
      console.error('[Init] Failed to ensure admin user:', err.message);
    }
  }
};
initAdmin();

// 抽取题目的通用函数
const generateQuiz = (limit = 50) => {
  const words = db.prepare('SELECT * FROM words ORDER BY RANDOM() LIMIT ?').all(limit);
  return words.map(w => {
    const type = Math.floor(Math.random() * 3);
    let distractors, correct, question;

    if (type === 0) {
      distractors = JSON.parse(w.distractors_zh || '[]');
      correct = w.translation;
      question = w.word;
    } else if (type === 1) {
      distractors = JSON.parse(w.distractors_en || '[]');
      correct = w.word;
      question = w.translation;
    } else {
      distractors = JSON.parse(w.distractors_zh || '[]');
      correct = w.translation;
      question = w.phonetic || w.word;
    }
    
    const selectedDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    return {
      id: w.id,
      type,
      question,
      options: [...selectedDistractors, correct].sort(() => 0.5 - Math.random()),
      correct // 仅用于服务端比对或 Racing 模式同步
    };
  });
};

// 获取 50 道随机题目 (API 接口，隐藏正确答案)
apiRouter.get('/quiz', (req, res) => {
  try {
    const quiz = generateQuiz(50).map(q => {
      const { correct, ...rest } = q;
      return rest;
    });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 服务端判卷并提交
apiRouter.post('/submit', (req, res) => {
  const { user_id, answers, duration_seconds } = req.body; // answers: { [quizIndex]: selectedOption }
  
  try {
    let score = 0;
    const quizData = req.body.quiz; // 包含题目 ID 的数组

    quizData.forEach((q, idx) => {
      const selected = answers[idx];
      if (!selected) return;

      // 从数据库查询该题的正确答案
      const word = db.prepare('SELECT word, translation FROM words WHERE id = ?').get(q.id);
      if (!word) return;

      // 根据题型判断正确答案
      let correct;
      if (q.type === 0 || q.type === 2) correct = word.translation;
      else if (q.type === 1) correct = word.word;

      if (selected === correct) {
        score += 2;
      }
    });

    // 记录成绩
    const info = db.prepare('INSERT INTO test_records (user_id, score, duration_seconds) VALUES (?, ?, ?)')
      .run(user_id || null, score, duration_seconds);

    res.json({ success: true, score, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 排行榜接口 (支持类型切换)
apiRouter.get('/ranking', (req, res) => {
  const { type = 'top_score' } = req.query;
  try {
    let query = '';
    if (type === 'study_time') {
      query = `
        SELECT u.username, CAST(IFNULL(u.total_study_seconds, 0) AS FLOAT) as value 
        FROM users u
        WHERE u.total_study_seconds > 0
        ORDER BY value DESC 
        LIMIT 20
      `;
    } else if (type === 'top_score') {
      query = `
        SELECT u.username, CAST(MAX(r.score) AS FLOAT) as value
        FROM test_records r
        JOIN users u ON r.user_id = u.id
        GROUP BY u.id
        ORDER BY value DESC
        LIMIT 20
      `;
    } else {
      // 默认平均分 (Average Score)
      query = `
        SELECT u.username, CAST(AVG(r.score) AS FLOAT) as value
        FROM test_records r
        JOIN users u ON r.user_id = u.id
        GROUP BY u.id
        ORDER BY value DESC
        LIMIT 20
      `;
    }
    const rows = db.prepare(query).all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单词列表 (支持多种筛选模式)
apiRouter.get('/words', (req, res) => {
  const { mode, value } = req.query;
  try {
    let query = 'SELECT id, word, phonetic, translation, difficulty FROM words';
    let params = [];

    if (mode === 'week') {
      const week = parseInt(value) || 1;
      const pageSize = 64; // 2294 / 36 ≈ 64
      const offset = (week - 1) * pageSize;
      query += ` ORDER BY id ASC LIMIT ? OFFSET ?`;
      params = [pageSize, offset];
    } else if (mode === 'difficulty') {
      query += ` WHERE difficulty = ? ORDER BY RANDOM() LIMIT 50`;
      params = [parseInt(value) || 1];
    } else if (mode === 'alphabet') {
      query += ` WHERE word LIKE ? ORDER BY word ASC`;
      params = [`${value}%` || 'a%'];
    } else {
      // 默认随机模式
      query += ` ORDER BY RANDOM() LIMIT 20`;
    }

    const words = db.prepare(query).all(...params);
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 记录单词查看次数及学习时长
apiRouter.post('/log-view', (req, res) => {
  const { user_id, word_id, duration_seconds = 0 } = req.body;
  if (!user_id || !word_id) return res.status(400).json({ error: 'Missing user_id or word_id' });

  try {
    // 1. 更新单词查看进度
    db.prepare(`
      INSERT INTO user_word_progress (user_id, word_id, view_count, last_viewed)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, word_id) DO UPDATE SET
        view_count = view_count + 1,
        last_viewed = CURRENT_TIMESTAMP
    `).run(user_id, word_id);

    // 2. 累加用户总学习时长
    if (duration_seconds > 0) {
      db.prepare('UPDATE users SET total_study_seconds = total_study_seconds + ? WHERE id = ?')
        .run(duration_seconds, user_id);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 简单的登录模拟 (现在从数据库查询角色)
apiRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const user = db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      // 为了演示方便，如果数据库没有用户但用户名密码一致，自动创建
      if (username === password) {
        const info = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, password);
        res.json({ success: true, user: { id: info.lastInsertRowid, username, role: 'user' } });
      } else {
        res.status(401).json({ success: false, message: '账号或密码错误' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个用户的学习统计数据
apiRouter.get('/user/stats/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM user_word_progress WHERE user_id = ?) as words_learned,
        (SELECT COUNT(*) FROM test_records WHERE user_id = ?) as total_tests,
        (SELECT MAX(score) FROM test_records WHERE user_id = ?) as best_score,
        (SELECT AVG(score) FROM test_records WHERE user_id = ?) as avg_score
    `).get(userId, userId, userId, userId);

    const history = db.prepare(`
      SELECT score, duration_seconds, created_at 
      FROM test_records 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all(userId);

    res.json({ success: true, stats, history });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 用户：修改自己的密码
apiRouter.post('/user/update-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user || user.password !== oldPassword) {
      return res.status(401).json({ success: false, error: 'Current password incorrect' });
    }
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 管理员：获取所有用户概览
apiRouter.get('/admin/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id, u.username, u.role,
        COUNT(DISTINCT r.id) as test_count,
        AVG(r.score) as avg_score,
        COUNT(DISTINCT p.word_id) as words_learned
      FROM users u
      LEFT JOIN test_records r ON u.id = r.user_id
      LEFT JOIN user_word_progress p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `).all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 管理员：新增用户
apiRouter.post('/admin/users', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const info = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, role || 'user');
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// 管理员：更新用户 (密码或角色)
apiRouter.put('/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const { password, role } = req.body;
  try {
    if (password && role) {
      db.prepare('UPDATE users SET password = ?, role = ? WHERE id = ?').run(password, role, id);
    } else if (password) {
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password, id);
    } else if (role) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 管理员：删除用户
apiRouter.delete('/admin/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    // 同时清理相关记录
    db.prepare('DELETE FROM test_records WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM user_word_progress WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multi-page SPA support & Fallback
// 极致宽容模式：根据路径尝试匹配 dist 下的 index.html
app.get(/^(?!\/(api|study\/api|socket\.io)\/).*/, (req, res) => {
  const urlPath = req.path;
  
  // 1. 尝试匹配具体页面 (english, earth-globe, optics-lab)
  const pages = ['english', 'earth-globe', 'optics-lab'];
  const matchedPage = pages.find(p => urlPath.includes(`/${p}`));
  
  if (matchedPage) {
    const pageIndex = path.join(__dirname, '../dist', matchedPage, 'index.html');
    if (fs.existsSync(pageIndex)) {
      return res.sendFile(pageIndex);
    }
  }

  // 2. 尝试匹配 dist 根目录下的 test.html (兼容旧路径)
  if (urlPath.includes('/test')) {
    return res.sendFile(path.join(__dirname, '../dist/test.html'));
  }

  // 3. 兜底返回主 index.html
  const rootIndex = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(rootIndex)) {
    res.sendFile(rootIndex);
  } else {
    // 如果 dist/index.html 也不存在，尝试返回 english/index.html 作为主页
    const englishIndex = path.join(__dirname, '../dist/english/index.html');
    if (fs.existsSync(englishIndex)) {
      res.sendFile(englishIndex);
    } else {
      res.status(404).send('Page not found');
    }
  }
});

// --- Multi-Room Racing Mode (Socket.io) ---
let rooms = {}; // { roomId: { status, players, questions, timeLeft, timer, settings: { duration, questionCount } } }

const generateRoomId = () => Math.floor(1000 + Math.random() * 9000).toString();

// 过滤掉不可序列化的对象（如 timer）和敏感数据（如 questions）
const getSerializableRoom = (room) => {
  if (!room) return null;
  const { timer, questions, ...rest } = room;
  return rest;
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 获取房间列表
  socket.on('getRooms', () => {
    const roomList = Object.keys(rooms).map(id => ({
      id,
      playerCount: Object.keys(rooms[id].players).length,
      status: rooms[id].status,
      settings: rooms[id].settings
    }));
    socket.emit('roomList', roomList);
  });

  // 创建房间
  socket.on('createRoom', ({ username, settings }) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      status: 'waiting',
      players: {},
      questions: [],
      timeLeft: settings.duration * 60,
      timer: null,
      settings: {
        duration: settings.duration || 5,
        questionCount: settings.questionCount || 100,
        maxPlayers: settings.maxPlayers || 10
      },
      hostId: socket.id
    };

    rooms[roomId].players[socket.id] = {
      username: username || `Host_${socket.id.slice(0, 4)}`,
      score: 0,
      progress: 0,
      finished: false,
      isHost: true
    };

    socket.join(roomId);
    socket.emit('roomJoined', { roomId, roomState: getSerializableRoom(rooms[roomId]) });
    io.emit('roomListUpdate'); // 通知大厅更新
  });

  // 加入指定房间
  socket.on('joinRoom', ({ roomId, username }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', '房间不存在');
    if (Object.keys(room.players).length >= room.settings.maxPlayers) return socket.emit('error', '房间已满');
    if (room.status !== 'waiting') return socket.emit('error', '比赛已开始');

    room.players[socket.id] = {
      username: username || `Guest_${socket.id.slice(0, 4)}`,
      score: 0,
      progress: 0,
      finished: false,
      isHost: false
    };

    socket.join(roomId);
    socket.emit('roomJoined', { roomId, roomState: getSerializableRoom(room) }); // 通知加入者进入房间视图
    io.to(roomId).emit('roomUpdate', getSerializableRoom(room));
    io.emit('roomListUpdate');
  });

  // 开始比赛 (仅限房主或管理员)
  socket.on('startRace', (roomId) => {
    const room = rooms[roomId];
    if (!room || room.status === 'racing') return;
    
    // 权限检查：必须是房主
    if (room.hostId !== socket.id) return;

    room.status = 'racing';
    room.questions = generateQuiz(room.settings.questionCount);
    room.timeLeft = room.settings.duration * 60;
    
    Object.keys(room.players).forEach(id => {
      room.players[id].score = 0;
      room.players[id].progress = 0;
      room.players[id].finished = false;
    });

    io.to(roomId).emit('raceStarted', {
      questions: room.questions.map(q => {
        const { correct, ...rest } = q;
        return rest;
      }),
      timeLeft: room.timeLeft
    });

    // 启动房间独立计时器
    if (room.timer) clearInterval(room.timer);
    room.timer = setInterval(() => {
      room.timeLeft--;
      if (room.timeLeft <= 0) {
        clearInterval(room.timer);
        room.status = 'finished';
        io.to(roomId).emit('raceFinished', room.players);
      } else {
        io.to(roomId).emit('timerUpdate', room.timeLeft);
      }
    }, 1000);
  });

  // 更新进度
  socket.on('updateProgress', ({ roomId, index, answer }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'racing') return;

    const player = room.players[socket.id];
    if (!player) return;

    const question = room.questions[index];
    if (question && question.correct === answer) {
      player.score += 1;
    }
    player.progress = index + 1;

    if (player.progress >= room.settings.questionCount) {
      player.finished = true;
    }

    io.to(roomId).emit('roomUpdate', getSerializableRoom(room));

    // 检查是否全员完成
    const allFinished = Object.values(room.players).every(p => p.finished);
    if (allFinished) {
      clearInterval(room.timer);
      room.status = 'finished';
      io.to(roomId).emit('raceFinished', room.players);
    }
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      const room = rooms[roomId];
      if (room && room.players[socket.id]) {
        delete room.players[socket.id];
        
        // 如果房主走了，移交房主
        if (room.hostId === socket.id) {
          const nextHost = Object.keys(room.players)[0];
          if (nextHost) {
            room.hostId = nextHost;
            room.players[nextHost].isHost = true;
          }
        }

        if (Object.keys(room.players).length === 0) {
          clearInterval(room.timer);
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('roomUpdate', getSerializableRoom(room));
        }
      }
    }
    io.emit('roomListUpdate');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
