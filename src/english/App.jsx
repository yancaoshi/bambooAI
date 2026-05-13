import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import wechatQr from '../assets/wechat_qr.png';
import RaceMode from './RaceMode';

// --- Configuration ---
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000/api'
  : '/study/api';
const TOTAL_QUESTIONS = 50;
const TIME_LIMIT = 30 * 60;

// --- Translations ---
const translations = {
  zh: {
    welcome: '欢迎回来, ',
    explorer: '探索者',
    ready: '今天准备好挑战自己的词汇极限了吗？',
    learningHub: '学习中心',
    learningHubDesc: '沉浸式单词卡片学习模式',
    masteryExam: '词汇测验',
    masteryExamDesc: '50道题的全方位实力挑战',
    leaderboard: '排行榜',
    leaderboardDesc: '查看你的全球排名与竞争实力',
    myStats: '我的统计',
    myStatsDesc: '个人学习报告与能力分析',
    admin: '管理后台',
    adminDesc: '管理用户权限与数据审计',
    racingMode: '竞速挑战',
    racingModeDesc: '百题限时竞速，实时排名对决',
    waitingForPlayers: '等待对手加入...',
    startRace: '开始同步竞速',
    raceTip: '所有参与者将同时开始，挑战相同的 100 道题目。',
    raceTip: '所有参与者将同时开始，挑战相同的 100 道题目。',
    availableRooms: '活跃房间',
    createRoom: '发起新挑战',
    noRooms: '当前没有活跃房间，快去创建一个吧！',
    waitingForHost: '等待房主发起挑战...',
    durationLabel: '比赛时长',
    questionCountLabel: '题目数量',
    maxPlayersLabel: '人数上限',
    create: '立即创建',
    cancel: '取消',
    minutes: '分钟',
    questions: '道题',
    players: '人',
    terminate: '退出登录',
    username: '用户名',
    password: '密码',
    signIn: '登录',
    guest: '游客',
    qrTip: '扫码添加好友申请用户',
    guestTip: '游客模式也能体验完整功能，但不会在排行榜中记录数据',
    prev: '上一题',
    next: '下一题',
    finish: '完成提交',
    analyzing: '分析中...',
    examType: '题型：',
    enCn: '英译中',
    cnEn: '中译英',
    phonetic: '音标挑战',
    selectPath: '选择学习路径',
    backToHub: '返回主页',
    weeks: '36周计划',
    difficulty: '按难度',
    alphabet: '字母表',
    random: '随机模式',
    weekN: '第 {} 周',
    starsTip: '星星越多，难度越高',
    randomTip: '从完整词库中随机抽取 20 个单词开始学习。',
    start: '打乱并开始',
    sessionTime: '本次时长',
    prevWord: '上一个',
    nextWord: '下一个',
    finishLearning: '完成本次学习',
    userManagement: '用户管理',
    addNewUser: '新增用户',
    cancel: '取消',
    exitAdmin: '退出管理',
    editUser: '编辑用户',
    newPassword: '新密码 (留空表示不修改)',
    accountRole: '账户权限',
    save: '保存修改',
    userInfo: '用户信息',
    role: '角色',
    tests: '测试次数',
    avg: '平均分',
    wordsLearned: '已学单词',
    actions: '操作',
    myPerformance: '个人战绩',
    security: '账户安全',
    back: '返回',
    updateCreds: '修改密码',
    currentPwd: '当前密码',
    update: '提交修改',
    mastery: '词库掌握度',
    totalExams: '累计测验次数',
    highestScore: '历史最高分',
    avgScore: '平均得分',
    examHistory: '测验记录',
    noExams: '暂无测验记录。快去发起一场挑战吧！',
    points: ' 分',
    duration: '耗时：',
    analysisComplete: '测试分析已完成',
    overallScore: '最终得分',
    returnHub: '返回主页',
    rank: '排名',
    metrics: {
      top_score: '最高分',
      avg_score: '平均分',
      study_time: '学习时长'
    },
    noData: '该分类下暂无数据',
    alerts: {
      loadStatsFailed: '无法加载统计数据',
      loginFailed: '登录失败，请检查用户名和密码。',
      serverError: '服务器连接失败',
      loadRankingFailed: '无法获取排行榜数据',
      loadUsersFailed: '无法加载用户列表',
      createUserFailed: '创建用户失败',
      updateUserFailed: '更新用户信息失败',
      deleteConfirm: '确定要删除该用户吗？所有记录将永久丢失。',
      deleteUserFailed: '删除用户失败',
      noWords: '该选项下没有找到单词。',
      loadWordsFailed: '加载单词失败',
      loadQuizFailed: '加载测验题目失败',
      submitFailed: '提交失败，请重试。',
      pwdSuccess: '密码修改成功！',
      networkError: '网络错误'
    }
  },
  en: {
    welcome: 'Welcome back, ',
    explorer: 'Explorer',
    ready: 'Ready to push your vocabulary limits today?',
    learningHub: 'Learning Hub',
    learningHubDesc: 'Immersive flashcard learning mode',
    masteryExam: 'Mastery Exam',
    masteryExamDesc: '50-question comprehensive challenge',
    leaderboard: 'Leaderboard',
    leaderboardDesc: 'Global rankings and competitive standing',
    myStats: 'My Stats',
    myStatsDesc: 'Personal learning reports and analysis',
    admin: 'Admin Panel',
    adminDesc: 'User permissions and data auditing',
    racingMode: 'Racing Mode',
    racingModeDesc: '100-question timed race with real-time ranking',
    waitingForPlayers: 'Waiting for competitors...',
    startRace: 'START SYNC RACE',
    raceTip: 'All participants start together with the same 100 questions.',
    raceTip: 'All participants start together with the same 100 questions.',
    availableRooms: 'Active Rooms',
    createRoom: 'Create New Race',
    noRooms: 'No active rooms found. Why not create one?',
    waitingForHost: 'Waiting for host to start...',
    durationLabel: 'Duration',
    questionCountLabel: 'Questions',
    maxPlayersLabel: 'Max Players',
    create: 'Create Room',
    cancel: 'Cancel',
    minutes: 'Mins',
    questions: 'Questions',
    players: 'Players',
    terminate: 'TERMINATE SESSION',
    username: 'Username',
    password: 'Password',
    signIn: 'SIGN IN',
    guest: 'GUEST',
    qrTip: 'Scan to apply for an account',
    guestTip: 'Guest mode offers full access but data isn\'t ranked',
    prev: 'PREV',
    next: 'NEXT',
    finish: 'FINISH',
    analyzing: 'Analyzing...',
    examType: 'Type: ',
    enCn: 'EN → CN',
    cnEn: 'CN → EN',
    phonetic: 'PHONETIC',
    selectPath: 'Select Learning Path',
    backToHub: 'BACK TO HUB',
    weeks: '36 Weeks',
    difficulty: 'Difficulty',
    alphabet: 'Alphabet',
    random: 'Random',
    weekN: 'Week {}',
    starsTip: 'More stars mean higher difficulty',
    randomTip: 'Start learning with 20 random words from the library.',
    start: 'START',
    sessionTime: 'Session',
    prevWord: 'PREVIOUS',
    nextWord: 'NEXT',
    finishLearning: 'COMPLETE SESSION',
    userManagement: 'User Management',
    addNewUser: 'ADD USER',
    cancel: 'CANCEL',
    exitAdmin: 'EXIT ADMIN',
    editUser: 'Edit User',
    newPassword: 'New Password (leave blank to keep current)',
    accountRole: 'Account Role',
    save: 'SAVE',
    userInfo: 'User Info',
    role: 'Role',
    tests: 'Tests',
    avg: 'Avg',
    wordsLearned: 'Words',
    actions: 'Actions',
    myPerformance: 'My Performance',
    security: 'SECURITY',
    back: 'BACK',
    updateCreds: 'Update Password',
    currentPwd: 'Current Password',
    update: 'UPDATE',
    mastery: 'Library Mastery',
    totalExams: 'Total Exams',
    highestScore: 'Highest Score',
    avgScore: 'Average Score',
    examHistory: 'Exam History',
    noExams: 'No exam records. Start a challenge!',
    points: ' Pts',
    duration: 'Time: ',
    analysisComplete: 'ANALYSIS COMPLETE',
    overallScore: 'Overall Performance Score',
    returnHub: 'RETURN TO HUB',
    rank: 'Rank',
    metrics: {
      top_score: 'TOP SCORE',
      avg_score: 'AVG SCORE',
      study_time: 'DURATION'
    },
    noData: 'No data in this category',
    alerts: {
      loadStatsFailed: 'Failed to load stats',
      loginFailed: 'Login failed. Check credentials.',
      serverError: 'Server connection failed',
      loadRankingFailed: 'Failed to load ranking',
      loadUsersFailed: 'Failed to load users',
      createUserFailed: 'Failed to create user',
      updateUserFailed: 'Failed to update user',
      deleteConfirm: 'Are you sure you want to delete this user? All records will be lost.',
      deleteUserFailed: 'Failed to delete user',
      noWords: 'No words found for this selection.',
      loadWordsFailed: 'Failed to load words',
      loadQuizFailed: 'Failed to load quiz',
      submitFailed: 'Submission failed. Please try again.',
      pwdSuccess: 'Password updated successfully!',
      networkError: 'Network error'
    }
  }
};

// --- Sub-components (Moved outside to prevent re-mounting on each tick) ---

const TimerDisplay = memo(({ seconds }) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
  return (
    <div style={{
      fontSize: '1.6rem',
      color: seconds < 300 ? 'var(--sci-red)' : '#fff',
      fontWeight: '900',
      background: 'rgba(0,0,0,0.4)',
      padding: '0.5rem 1.5rem',
      borderRadius: '12px',
      fontFamily: 'monospace'
    }}>
      {timeStr}
    </div>
  );
});

const LoginView = ({ handleLogin, skipLogin, t, toggleLang, lang }) => (
  <div className="login-container" style={{
    display: 'flex', flexWrap: 'wrap', minHeight: '100vh',
    padding: 'clamp(1rem, 5vw, 4rem)', alignItems: 'center', justifyContent: 'center', gap: '1.5rem'
  }}>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card"
      style={{ flex: '1 1 400px', maxWidth: '600px', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '520px' }}>
      <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem', background: 'linear-gradient(45deg, var(--sci-blue), var(--sci-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>Word Master</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input name="username" placeholder={t('username')} required style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff' }} className="sci-input" />
        <input name="password" type="password" placeholder={t('password')} required style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff' }} className="sci-input" />
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', alignItems: 'center' }}>
          <button className="btn-primary" type="submit" style={{ flex: 2, padding: '1rem', fontWeight: 'bold' }}>{t('signIn')}</button>
          <button type="button" onClick={skipLogin} className="btn-primary" style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>{t('guest')}</button>
          <motion.span 
            whileHover={{ scale: 1.2, rotate: 5 }} 
            whileTap={{ scale: 0.9 }}
            onClick={toggleLang} 
            style={{ cursor: 'pointer', fontSize: '2.2rem', marginLeft: '0.5rem', filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.3))' }}
          >
            {lang === 'zh' ? '🇺🇸' : '🇨🇳'}
          </motion.span>
        </div>
      </form>
    </motion.div>
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ flex: '1 1 400px', maxWidth: '600px' }}>
      <div className="qr-frame-wrapper" style={{ position: 'relative', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px solid var(--glass-border)', backdropFilter: 'blur(10px)', minHeight: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '30px', height: '30px', borderTop: '4px solid var(--sci-blue)', borderLeft: '4px solid var(--sci-blue)', borderRadius: '20px 0 0 0' }}></div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '30px', height: '30px', borderTop: '4px solid var(--sci-purple)', borderRight: '4px solid var(--sci-purple)', borderRadius: '0 20px 0 0' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '30px', height: '30px', borderBottom: '4px solid var(--sci-purple)', borderLeft: '4px solid var(--sci-purple)', borderRadius: '0 0 0 20px' }}></div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderBottom: '4px solid var(--sci-blue)', borderRight: '4px solid var(--sci-blue)', borderRadius: '0 0 20px 0' }}></div>
        <div style={{ padding: '8px', background: '#fff', borderRadius: '15px', maxWidth: '240px' }}><img src={wechatQr} alt="WeChat" style={{ width: '100%', display: 'block' }} /></div>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>{t('qrTip')}</h3>
          <div style={{ width: '120px', height: '2px', background: 'linear-gradient(to right, var(--sci-blue), var(--sci-purple))', margin: '1rem auto' }}></div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.6 }}>{t('guestTip')}</p>
        </div>
      </div>
    </motion.div>
  </div>
);

const Dashboard = ({ user, setView, startTest, startLearning, fetchRanking, t, toggleLang, lang }) => (
  <div style={{ width: '100%', maxWidth: '1920px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 4rem)', textAlign: 'center' }}>
    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{t('welcome')}<span style={{ color: 'var(--sci-blue)' }}>{user ? user.username : t('explorer')}</span></h1>
    <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>{t('ready')}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', marginTop: '4rem' }}>
      <motion.div whileHover={{ y: -5, boxShadow: '0 0 30px rgba(56, 189, 248, 0.1)' }} onClick={startLearning} className="glass-card" style={{ width: '280px', cursor: 'pointer', padding: '2.5rem', border: '1px solid var(--sci-blue)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>📖</div>
        <h3 style={{ color: 'var(--sci-blue)', fontSize: '1.4rem' }}>{t('learningHub')}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '1rem' }}>{t('learningHubDesc')}</p>
      </motion.div>
      <motion.div whileHover={{ y: -5, boxShadow: '0 0 30px rgba(168, 85, 247, 0.1)' }} onClick={startTest} className="glass-card" style={{ width: '280px', cursor: 'pointer', padding: '2.5rem', border: '1px solid var(--sci-purple)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>⚡</div>
        <h3 style={{ color: 'var(--sci-purple)', fontSize: '1.4rem' }}>{t('masteryExam')}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '1rem' }}>{t('masteryExamDesc')}</p>
      </motion.div>
      {user && (
        <motion.div whileHover={{ y: -5, boxShadow: '0 0 30px rgba(34, 211, 238, 0.1)' }} onClick={() => setView('race')} className="glass-card" style={{ width: '280px', cursor: 'pointer', padding: '2.5rem', border: '1px solid var(--sci-cyan)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🏁</div>
          <h3 style={{ color: 'var(--sci-cyan)', fontSize: '1.4rem' }}>{t('racingMode')}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '1rem' }}>{t('racingModeDesc')}</p>
        </motion.div>
      )}
      <motion.div whileHover={{ y: -5, boxShadow: '0 0 30px rgba(34, 197, 94, 0.1)' }} onClick={fetchRanking} className="glass-card" style={{ width: '280px', cursor: 'pointer', padding: '2.5rem', border: '1px solid var(--sci-green)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🏆</div>
        <h3 style={{ color: 'var(--sci-green)', fontSize: '1.4rem' }}>{t('leaderboard')}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '1rem' }}>{t('leaderboardDesc')}</p>
      </motion.div>
      {user && (
        <motion.div whileHover={{ y: -5, boxShadow: '0 0 30px rgba(251, 146, 60, 0.1)' }} onClick={() => setView('stats')} className="glass-card" style={{ width: '280px', cursor: 'pointer', padding: '2.5rem', border: '1px solid var(--sci-orange)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>📊</div>
          <h3 style={{ color: 'var(--sci-orange)', fontSize: '1.4rem' }}>{t('myStats')}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '1rem' }}>{t('myStatsDesc')}</p>
        </motion.div>
      )}
      {user && user.role === 'admin' && (
        <motion.div whileHover={{ y: -5, boxShadow: '0 0 30px rgba(239, 68, 68, 0.1)' }} onClick={() => setView('admin')} className="glass-card" style={{ width: '280px', cursor: 'pointer', padding: '2.5rem', border: '1px solid var(--sci-red)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🛠️</div>
          <h3 style={{ color: 'var(--sci-red)', fontSize: '1.4rem' }}>{t('admin')}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '1rem' }}>{t('adminDesc')}</p>
        </motion.div>
      )}
    </div>
    <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'center', gap: '2.5rem', alignItems: 'center' }}>
      <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: 'var(--sci-red)', cursor: 'pointer', opacity: 0.5, letterSpacing: '2px' }}>{t('terminate')}</button>
      <motion.span 
        whileHover={{ scale: 1.2 }} 
        whileTap={{ scale: 0.9 }}
        onClick={toggleLang} 
        style={{ cursor: 'pointer', fontSize: '2rem', opacity: 0.8, filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.2))' }}
      >
        {lang === 'zh' ? '🇺🇸' : '🇨🇳'}
      </motion.span>
    </div>
  </div>
);

const TestingView = ({ quiz, currentIdx, setCurrentIdx, userAnswers, selectOption, timeLeft, submitTest, isSubmitting, t }) => {
  const q = quiz[currentIdx];
  if (!q) return null;
  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: 'clamp(0.75rem, 3vw, 3rem)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--sci-blue)', letterSpacing: '1px' }}>{t('masteryExam').toUpperCase()}</div>
        <TimerDisplay seconds={timeLeft} />
      </div>

      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '3rem', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${((currentIdx + 1) / quiz.length) * 100}%` }} style={{ height: '100%', background: 'linear-gradient(to right, var(--sci-blue), var(--sci-purple))' }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card" style={{ textAlign: 'center', padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '3px', marginBottom: '2rem' }}>
            {t('examType')}{q.type === 0 ? t('enCn') : q.type === 1 ? t('cnEn') : t('phonetic')}
          </div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', marginBottom: '0.5rem', fontWeight: '900' }}>{q.question}</h2>
          {q.type === 0 && q.phonetic && (<div style={{ color: 'var(--sci-blue)', fontSize: '1.6rem', marginBottom: '1.5rem', fontFamily: 'monospace', opacity: 0.8 }}>[{q.phonetic}]</div>)}
          {q.type !== 0 && <div style={{ height: '3.5rem' }}></div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.2rem', marginTop: '1.5rem' }}>
            {q.options.map((opt, i) => (
              <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => selectOption(opt)}
                style={{
                  padding: '1.6rem', borderRadius: '18px', border: userAnswers[currentIdx] === opt ? '2px solid var(--sci-blue)' : '1px solid var(--glass-border)',
                  background: userAnswers[currentIdx] === opt ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <span style={{ marginRight: '1rem', opacity: 0.2 }}>{String.fromCharCode(65 + i)}</span> {opt}
              </motion.button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4.5rem', alignItems: 'center' }}>
            <button className="btn-primary" disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} style={{ opacity: currentIdx === 0 ? 0.2 : 1, background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem' }}>{t('prev')}</button>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 2rem', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--sci-blue)', border: '1px solid var(--glass-border)' }}>
              {currentIdx + 1} <span style={{ opacity: 0.3, margin: '0 0.5rem' }}>/</span> {quiz.length}
            </div>

            {currentIdx === TOTAL_QUESTIONS - 1 ? (
              <button className="btn-primary" onClick={submitTest} disabled={isSubmitting} style={{ background: 'var(--sci-green)', padding: '1rem 3.5rem', fontWeight: 800 }}>
                {isSubmitting ? t('analyzing') : t('finish')}
              </button>
            ) : (<button className="btn-primary" onClick={() => setCurrentIdx(currentIdx + 1)} style={{ padding: '1rem 2.5rem' }}>{t('next')}</button>)}
          </div>
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', gap: '5px', marginTop: '3rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
        {quiz.map((_, idx) => (
          <div key={idx} onClick={() => setCurrentIdx(idx)}
            style={{
              height: '35px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
              border: currentIdx === idx ? '2px solid var(--sci-blue)' : '1px solid var(--glass-border)',
              background: userAnswers[idx] ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.05)', transition: 'all 0.2s',
              color: currentIdx === idx ? 'var(--sci-blue)' : '#fff'
            }}
          >{idx + 1}</div>
        ))}
      </div>
    </div>
  );
};

const LearningSetupView = ({ onSelect, setView, t }) => {
  const [activeTab, setActiveTab] = useState('week');

  const weeks = Array.from({ length: 36 }, (_, i) => i + 1);
  const stars = [1, 2, 3, 4, 5];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 4rem)' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 900, marginBottom: '3rem', background: 'linear-gradient(45deg, var(--sci-blue), var(--sci-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {t('selectPath')}
      </h2>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
        {[
          { id: 'week', label: t('weeks') },
          { id: 'difficulty', label: t('difficulty') },
          { id: 'alphabet', label: t('alphabet') },
          { id: 'random', label: t('random') }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: activeTab === tab.id ? '1px solid var(--sci-blue)' : '1px solid var(--glass-border)', background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.03)', color: activeTab === tab.id ? 'var(--sci-blue)' : 'var(--text-dim)', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px' }}>
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '3rem' }}>
        {activeTab === 'week' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem' }}>
            {weeks.map(w => (
              <motion.button key={w} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSelect('week', w)}
                style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}>
                {t('weekN').replace('{}', w)}
              </motion.button>
            ))}
          </div>
        )}

        {activeTab === 'difficulty' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            {stars.map(s => (
              <motion.button key={s} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onSelect('difficulty', s)}
                style={{ width: '100%', maxWidth: '300px', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--sci-orange)', background: 'rgba(251, 146, 60, 0.05)', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: i < s ? 'var(--sci-orange)' : 'rgba(255,255,255,0.1)', fontSize: '1.5rem' }}>★</span>
                ))}
              </motion.button>
            ))}
            <p style={{ color: 'var(--text-dim)', marginTop: '1rem' }}>{t('starsTip')}</p>
          </div>
        )}

        {activeTab === 'alphabet' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.8rem' }}>
            {alphabet.map(letter => (
              <motion.button key={letter} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onSelect('alphabet', letter.toLowerCase())}
                style={{ height: '60px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800 }}>
                {letter}
              </motion.button>
            ))}
          </div>
        )}

        {activeTab === 'random' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem' }}>{t('randomTip')}</p>
            <button className="btn-primary" onClick={() => onSelect('random')} style={{ padding: '1.5rem 4rem', fontSize: '1.2rem' }}>{t('start')}</button>
          </div>
        )}
      </motion.div>

      <button onClick={() => setView('dashboard')} style={{ marginTop: '3rem', width: '100%', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.9rem', letterSpacing: '2px' }}>{t('backToHub')}</button>
    </div>
  );
};

const LearningView = ({ learningWords, learningIdx, setLearningIdx, setView, user, t }) => {
  const startTimeRef = useRef(Date.now());
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // 正向计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const reportDuration = async () => {
    if (!user || !learningWords[learningIdx]) return;
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (duration < 1) return;

    try {
      await fetch(`${API_BASE}/log-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          word_id: learningWords[learningIdx].id,
          duration_seconds: duration
        })
      });
    } catch (err) { console.error('Failed to log duration:', err); }
  };

  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => { reportDuration(); };
  }, [learningIdx, user]);

  const handleNext = () => { reportDuration(); setLearningIdx(learningIdx + 1); };
  const handlePrev = () => { reportDuration(); setLearningIdx(learningIdx - 1); };
  const handleJump = (idx) => { reportDuration(); setLearningIdx(idx); };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 4rem)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--sci-blue)', letterSpacing: '1px' }}>{t('learningHub').toUpperCase()}</h2>
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem 1rem', borderRadius: '10px', color: 'var(--sci-blue)', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          {t('sessionTime')} ⏱️ {formatTime(sessionSeconds)}
        </div>
      </div>

      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '3rem', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${((learningIdx + 1) / learningWords.length) * 100}%` }} style={{ height: '100%', background: 'linear-gradient(to right, var(--sci-blue), var(--sci-purple))' }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={learningIdx} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="glass-card" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)', textAlign: 'center', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
          {learningWords[learningIdx] && (
            <>
              <h1 style={{
                fontSize: learningWords[learningIdx].word.length > 12 ? 'clamp(2.5rem, 10vw, 3.8rem)' : 'clamp(3rem, 12vw, 5rem)',
                fontWeight: 900,
                marginBottom: '0.5rem',
                lineHeight: 1.1,
                wordBreak: 'break-word'
              }}>
                {learningWords[learningIdx].word}
              </h1>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.8rem', color: 'var(--sci-blue)', fontFamily: 'monospace', opacity: 0.8 }}>[{learningWords[learningIdx].phonetic}]</span>
                <button onClick={() => {
                  const utterance = new SpeechSynthesisUtterance(learningWords[learningIdx].word);
                  utterance.lang = 'en-US';
                  window.speechSynthesis.speak(utterance);
                }} style={{ background: 'rgba(56, 189, 248, 0.1)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', color: 'var(--sci-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔊</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{
                    color: i < learningWords[learningIdx].difficulty ? 'var(--sci-orange)' : 'rgba(255,255,255,0.05)',
                    fontSize: '1.5rem',
                    textShadow: i < learningWords[learningIdx].difficulty ? '0 0 10px rgba(251, 146, 60, 0.5)' : 'none'
                  }}>★</span>
                ))}
              </div>

              <div style={{ fontSize: '2.2rem', color: '#fff', fontWeight: 500, background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                {learningWords[learningIdx].translation}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem', alignItems: 'center' }}>
        <button className="btn-primary" disabled={learningIdx === 0} onClick={handlePrev} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', opacity: learningIdx === 0 ? 0.3 : 1, padding: '1rem' }}>{t('prevWord')}</button>

        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '0.7rem 1.5rem', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--sci-blue)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
          {learningIdx + 1} <span style={{ opacity: 0.3, margin: '0 0.5rem' }}>/</span> {learningWords.length}
        </div>

        {learningIdx === learningWords.length - 1 ? (
          <button className="btn-primary" onClick={() => setView('dashboard')} style={{ flex: 2, background: 'var(--sci-green)', padding: '1rem' }}>{t('finishLearning')}</button>
        ) : (<button className="btn-primary" onClick={handleNext} style={{ flex: 2, padding: '1rem' }}>{t('nextWord')}</button>)}
      </div>

      <div style={{ marginTop: '3rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))', gap: '6px' }}>
          {learningWords.map((_, idx) => (
            <div key={idx} onClick={() => handleJump(idx)}
              style={{
                height: '28px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                border: learningIdx === idx ? '1px solid var(--sci-blue)' : '1px solid var(--glass-border)',
                background: idx < learningIdx ? 'rgba(56, 189, 248, 0.2)' : idx === learningIdx ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.02)',
                color: idx <= learningIdx ? '#fff' : 'var(--text-dim)',
                transition: 'all 0.2s'
              }}
            >{idx + 1}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminView = ({ adminUsers, setView, onCreate, onUpdate, onDelete, t }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onCreate(fd.get('username'), fd.get('password'), fd.get('role'));
    setShowAdd(false);
    e.target.reset();
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onUpdate(editingUser.id, fd.get('password'), fd.get('role'));
    setEditingUser(null);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1920px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 4rem)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{t('userManagement')}</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary" style={{ padding: '0.8rem 1.5rem', background: showAdd ? 'var(--sci-red)' : 'var(--sci-blue)' }}>
            {showAdd ? t('cancel') : t('addNewUser')}
          </button>
          <button onClick={() => setView('dashboard')} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', cursor: 'pointer' }}>{t('exitAdmin')}</button>
        </div>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--sci-blue)' }}>{t('addNewUser')}</h3>
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input name="username" placeholder={t('username')} required style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff', flex: 1 }} />
            <input name="password" type="password" placeholder={t('password')} required style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff', flex: 1 }} />
            <select name="role" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: '#1e1b4b', color: '#fff' }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn-primary">{t('start')}</button>
          </form>
        </motion.div>
      )}

      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem' }}>
            <h2 style={{ marginBottom: '2rem' }}>{t('editUser')}: {editingUser.username}</h2>
            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>{t('newPassword')}</label>
                <input name="password" type="password" placeholder="••••••••" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>{t('accountRole')}</label>
                <select name="role" defaultValue={editingUser.role} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: '#1e1b4b', color: '#fff' }}>
                  <option value="user">USER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>{t('save')}</button>
                <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--sci-blue)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px' }}>
              <th style={{ padding: '1.5rem', textAlign: 'left' }}>{t('userInfo')}</th>
              <th style={{ padding: '1.5rem' }}>{t('role')}</th>
              <th style={{ padding: '1.5rem' }}>{t('tests')}</th>
              <th style={{ padding: '1.5rem' }}>{t('avg')}</th>
              <th style={{ padding: '1.5rem' }}>{t('wordsLearned')}</th>
              <th style={{ padding: '1.5rem' }}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{u.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {u.id}</div>
                </td>
                <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <span style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', background: u.role === 'admin' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? 'var(--sci-blue)' : 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 800 }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1.5rem', textAlign: 'center', fontSize: '1.1rem' }}>{u.test_count}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--sci-green)', fontWeight: 800, fontSize: '1.1rem' }}>{u.avg_score ? Number(u.avg_score).toFixed(1) : '-'}</td>
                <td style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{u.words_learned}</div>
                  <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', margin: '5px auto', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (u.words_learned / 2294) * 100)}%`, height: '100%', background: 'var(--sci-blue)' }} />
                  </div>
                </td>
                <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingUser(u)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>✎</button>
                    <button onClick={() => onDelete(u.id)} disabled={u.username === 'yanadmin'} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--sci-red)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', opacity: u.username === 'yanadmin' ? 0.2 : 1 }}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UserStatsView = ({ stats, history, setView, user, t }) => {
  if (!stats) return null;
  const [showPwdForm, setShowPwdForm] = useState(false);
  const totalWords = 2294; // Total in library
  const percent = Math.min(100, (stats.words_learned / totalWords) * 100);

  const handlePwdChange = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const oldPassword = fd.get('oldPassword');
    const newPassword = fd.get('newPassword');

    try {
      const res = await fetch(`${API_BASE}/user/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert(t('alerts.pwdSuccess'));
        setShowPwdForm(false);
        e.target.reset();
      } else {
        alert(data.error || t('alerts.updateUserFailed'));
      }
    } catch (err) {
      alert(t('alerts.networkError'));
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 4rem)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{t('myPerformance')}</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowPwdForm(!showPwdForm)} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1.5rem', border: '1px solid var(--sci-blue)' }}>{showPwdForm ? t('cancel') : t('security')}</button>
          <button onClick={() => setView('dashboard')} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1.5rem' }}>{t('back')}</button>
        </div>
      </div>

      {showPwdForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', border: '1px solid var(--sci-blue)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{t('updateCreds')}</h3>
          <form onSubmit={handlePwdChange} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input name="oldPassword" type="password" placeholder={t('currentPwd')} required style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff' }} />
            <input name="newPassword" type="password" placeholder={t('password')} required style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: '#fff' }} />
            <button type="submit" className="btn-primary" style={{ padding: '0.8rem 2rem' }}>{t('update')}</button>
          </form>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--sci-blue)" strokeWidth="8"
                strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * percent / 100)}
                strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.2rem', fontWeight: 800 }}>{percent.toFixed(1)}%</div>
          </div>
          <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('mastery')}</h3>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.5rem' }}>{stats.words_learned} <span style={{ fontSize: '1rem', opacity: 0.3 }}>/ {totalWords}</span></div>
        </div>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>{t('totalExams')}</span>
            <span style={{ fontWeight: 800, color: 'var(--sci-purple)' }}>{stats.total_tests}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>{t('highestScore')}</span>
            <span style={{ fontWeight: 800, color: 'var(--sci-green)' }}>{stats.best_score || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-dim)' }}>{t('avgScore')}</span>
            <span style={{ fontWeight: 800, color: 'var(--sci-blue)' }}>{stats.avg_score ? stats.avg_score.toFixed(1) : 0}</span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>{t('examHistory')}</h3>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>{t('noExams')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: h.score >= 60 ? 'var(--sci-green)' : 'var(--sci-red)' }}>{h.score}{t('points')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(h.created_at).toLocaleString()}</div>
                </div>
                <div style={{ fontFamily: 'monospace', color: 'var(--sci-blue)' }}>{t('duration')}{Math.floor(h.duration_seconds / 60)}:{(h.duration_seconds % 60).toString().padStart(2, '0')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ResultView = ({ lastResult, setView, t }) => (
  <div style={{ textAlign: 'center', padding: '4rem' }}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '5rem' }}>
      <h1 style={{ fontSize: '1rem', letterSpacing: '5px', opacity: 0.4, marginBottom: '2.5rem' }}>{t('analysisComplete').toUpperCase()}</h1>
      <div style={{ fontSize: '8rem', fontWeight: '950', color: lastResult.score >= 60 ? 'var(--sci-green)' : 'var(--sci-red)', textShadow: '0 0 40px rgba(255,255,255,0.05)' }}>{lastResult.score}</div>
      <div style={{ fontSize: '1.3rem', color: 'var(--text-dim)', marginTop: '-1rem', marginBottom: '4rem' }}>{t('overallScore')}</div>
      <button className="btn-primary" onClick={() => setView('dashboard')} style={{ width: '100%', padding: '1.4rem', fontWeight: 800 }}>{t('returnHub')}</button>
    </motion.div>
  </div>
);

const RankingView = ({ ranking, rankingType, onTypeChange, isLoading, setView, t }) => {
  const formatValue = (val) => {
    if (val === null || val === undefined) return '0.0';
    const numVal = Number(val);
    if (isNaN(numVal)) return '0.0';

    if (rankingType === 'study_time') {
      const v = Math.floor(numVal);
      const h = Math.floor(v / 3600);
      const m = Math.floor((v % 3600) / 60);
      const s = v % 60;
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    }
    return (rankingType === 'avg_score' || rankingType === 'top_score') ? numVal.toFixed(1) : numVal;
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: 'clamp(0.75rem, 3vw, 4rem)', position: 'relative' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px' }}>{t('leaderboard')}</h1>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem', flexWrap: 'wrap' }}>
        {[
          { id: 'top_score', label: t('metrics.top_score'), icon: '⚡' },
          { id: 'avg_score', label: t('metrics.avg_score'), icon: '📊' },
          { id: 'study_time', label: t('metrics.study_time'), icon: '📖' }
        ].map(t_btn => (
          <button key={t_btn.id}
            disabled={isLoading}
            onClick={() => onTypeChange(t_btn.id)}
            style={{
              padding: '0.8rem 1.5rem', borderRadius: '12px', cursor: isLoading ? 'default' : 'pointer', fontWeight: 700, transition: 'all 0.2s',
              border: rankingType === t_btn.id ? '1px solid var(--sci-blue)' : '1px solid var(--glass-border)',
              background: rankingType === t_btn.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.03)',
              color: rankingType === t_btn.id ? '#fff' : 'var(--text-dim)',
              opacity: isLoading ? 0.6 : 1
            }}>
            <span style={{ marginRight: '0.5rem' }}>{t_btn.icon}</span> {t_btn.label}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '0.5rem', overflowX: 'auto', position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: '40px', height: '40px', border: '3px solid var(--sci-blue)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--sci-blue)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px' }}>
              <th style={{ padding: '1.8rem', width: '100px' }}>{t('rank')}</th>
              <th style={{ padding: '1.8rem', textAlign: 'left' }}>{t('username')}</th>
              <th style={{ padding: '1.8rem', textAlign: 'right' }}>{t('metrics.' + rankingType)}</th>
            </tr>
          </thead>
          <tbody>
            {ranking.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>{t('noData')}</td></tr>
            ) : ranking.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '1.8rem', textAlign: 'center', fontWeight: '900', fontSize: '1.3rem', opacity: 0.3 }}>#{(idx + 1).toString().padStart(2, '0')}</td>
                <td style={{ padding: '1.8rem', textAlign: 'left', fontWeight: '700', fontSize: '1.1rem' }}>{r.username}</td>
                <td style={{ padding: '1.8rem', textAlign: 'right', color: 'var(--sci-green)', fontWeight: '800', fontSize: '1.3rem' }}>
                  {formatValue(r.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-primary" onClick={() => setView('dashboard')} style={{ width: '100%', marginTop: '2.5rem', background: 'rgba(255,255,255,0.03)' }}>{t('back')}</button>
    </div>
  );
};

// --- Main App Component ---

function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'zh');
  const [view, setView] = useState(localStorage.getItem('view') || 'login');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [quiz, setQuiz] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [lastResult, setLastResult] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [rankingType, setRankingType] = useState('top_score');
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [learningWords, setLearningWords] = useState([]);
  const [learningIdx, setLearningIdx] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const timerRef = useRef(null);

  const t = (key) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  const toggleLang = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  useEffect(() => {
    // If not logged in and not in login view, force login
    if (!user && view !== 'login') {
      setView('login');
    }
    // Auto-redirect if session data is lost on refresh
    if (view === 'testing' && quiz.length === 0) setView('dashboard');
    if (view === 'learning' && learningWords.length === 0) setView('dashboard');

    localStorage.setItem('view', view);
  }, [view, user, quiz.length, learningWords.length]);

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/user/stats/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setUserStats(data.stats);
        setUserHistory(data.history);
        setView('stats');
      }
    } catch (err) { alert(t('alerts.loadStatsFailed')); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password } = e.target.elements;
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value, password: password.value })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setView('dashboard');
      } else { alert(t('alerts.loginFailed')); }
    } catch (err) { alert(t('alerts.serverError')); }
  };

  const skipLogin = () => { 
    const guestUser = { id: 0, username: t('explorer'), role: 'guest' };
    setUser(guestUser); 
    localStorage.setItem('user', JSON.stringify(guestUser));
    setView('dashboard'); 
  };

  const fetchRanking = async (type = rankingType) => {
    setIsRankingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ranking?type=${type}`);
      const data = await res.json();
      setRanking(data);
      setRankingType(type);
      setView('ranking');
    } catch (err) { alert(t('alerts.loadRankingFailed')); }
    finally { setIsRankingLoading(false); }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      const data = await res.json();
      setAdminUsers(data);
    } catch (err) { alert(t('alerts.loadUsersFailed')); }
  };

  useEffect(() => {
    if (view === 'admin') fetchAdminUsers();
    if (view === 'stats') fetchUserStats();
  }, [view]);

  const createUser = async (username, password, role) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      const data = await res.json();
      if (data.success) fetchAdminUsers();
      else alert(data.error);
    } catch (err) { alert(t('alerts.createUserFailed')); }
  };

  const updateUser = async (id, password, role) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, role })
      });
      if (res.ok) fetchAdminUsers();
    } catch (err) { alert(t('alerts.updateUserFailed')); }
  };

  const deleteUser = async (id) => {
    if (!confirm(t('alerts.deleteConfirm'))) return;
    try {
      await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' });
      fetchAdminUsers();
    } catch (err) { alert(t('alerts.deleteUserFailed')); }
  };

  const startLearning = async (mode = 'random', value = '') => {
    try {
      const url = `${API_BASE}/words?mode=${mode}&value=${value}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.length === 0) {
        alert(t('alerts.noWords'));
        return;
      }
      setLearningWords(data);
      setLearningIdx(0);
      setView('learning');
    } catch (err) { alert(t('alerts.loadWordsFailed')); }
  };

  const startTest = async () => {
    try {
      const res = await fetch(`${API_BASE}/quiz`);
      const data = await res.json();
      setQuiz(data);
      setCurrentIdx(0);
      setUserAnswers({});
      setTimeLeft(TIME_LIMIT);
      setStartTime(Date.now());
      setView('testing');
    } catch (err) { alert(t('alerts.loadQuizFailed')); }
  };

  useEffect(() => {
    if (view === 'testing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { submitTest(); return 0; }
          return t - 1;
        });
      }, 1000);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [view]);

  const selectOption = (option) => {
    setUserAnswers(prev => ({ ...prev, [currentIdx]: option }));
    if (currentIdx < TOTAL_QUESTIONS - 1 && !userAnswers[currentIdx]) {
      setTimeout(() => setCurrentIdx(currentIdx + 1), 300);
    }
  };

  const submitTest = async () => {
    if (view !== 'testing' || isSubmitting) return;
    setIsSubmitting(true);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user ? user.id : null, answers: userAnswers, quiz: quiz, duration_seconds: duration })
      });
      const data = await res.json();
      if (data.success) {
        setLastResult({ score: data.score, duration, date: new Date().toLocaleString() });
        setView('result');
      }
    } catch (err) { alert(t('alerts.submitFailed')); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="app-shell" style={{ position: 'relative', minHeight: '100vh', background: '#020617', backgroundImage: 'radial-gradient(circle at 50% -20%, #1e1b4b 0%, #020617 85%)', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
      <AnimatePresence mode="wait">
        {view === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginView handleLogin={handleLogin} skipLogin={skipLogin} t={t} toggleLang={toggleLang} lang={lang} />
        </motion.div>}
        {view === 'dashboard' && <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Dashboard user={user} setView={setView} startTest={startTest} startLearning={() => setView('learning-setup')} fetchRanking={fetchRanking} t={t} toggleLang={toggleLang} lang={lang} />
        </motion.div>}
        {view === 'learning-setup' && <motion.div key="learning-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LearningSetupView onSelect={startLearning} setView={setView} t={t} />
        </motion.div>}
        {view === 'testing' && <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {quiz.length > 0 && (
            <TestingView quiz={quiz} currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} userAnswers={userAnswers} selectOption={selectOption} timeLeft={timeLeft} submitTest={submitTest} isSubmitting={isSubmitting} t={t} />
          )}
        </motion.div>}
        {view === 'learning' && <motion.div key="learning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {learningWords.length > 0 && (
            <LearningView learningWords={learningWords} learningIdx={learningIdx} setLearningIdx={setLearningIdx} setView={setView} user={user} t={t} />
          )}
        </motion.div>}
        {view === 'result' && <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ResultView lastResult={lastResult} setView={setView} t={t} />
        </motion.div>}
        {view === 'ranking' && <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <RankingView ranking={ranking} rankingType={rankingType} onTypeChange={fetchRanking} isLoading={isRankingLoading} setView={setView} t={t} />
        </motion.div>}
        {view === 'admin' && <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AdminView adminUsers={adminUsers} setView={setView} onCreate={createUser} onUpdate={updateUser} onDelete={deleteUser} t={t} />
        </motion.div>}
        {view === 'stats' && <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <UserStatsView stats={userStats} history={userHistory} setView={setView} user={user} t={t} />
        </motion.div>}
        {view === 'race' && <motion.div key="race" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <RaceMode user={user} setView={setView} t={t} />
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}

export default App;
