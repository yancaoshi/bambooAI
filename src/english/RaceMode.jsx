import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000'
  : '';

const RaceMode = ({ user, setView, t }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomList, setRoomList] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [view, setInternalView] = useState('lobby-list'); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- Toast Notification System ---
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Create Room Settings ---
  const [duration, setDuration] = useState(5);
  const [questionCount, setQuestionCount] = useState(50);
  const [maxPlayers, setMaxPlayers] = useState(10);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    const newSocket = io(SOCKET_URL, { reconnectionAttempts: 5, timeout: 10000 });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('getRooms');
    });

    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('roomList', (list) => setRoomList(list));
    newSocket.on('roomListUpdate', () => newSocket.emit('getRooms'));

    newSocket.on('roomJoined', ({ roomId, roomState }) => {
      setRoomId(roomId);
      setRoomState(roomState);
      setInternalView('lobby-room');
      setIsCreating(false);
      setShowCreateModal(false);
      showToast(t('roomJoinedSuccess') || `Entered Room #${roomId}`);
    });

    newSocket.on('roomUpdate', (state) => setRoomState(state));

    newSocket.on('raceStarted', ({ questions, timeLeft }) => {
      setQuiz(questions);
      setTimeLeft(timeLeft);
      setCurrentIdx(0);
      setInternalView('racing');
      showToast(t('raceStarted') || 'Race Started!');
    });

    newSocket.on('timerUpdate', (time) => setTimeLeft(time));
    newSocket.on('raceFinished', () => {
      setInternalView('finished');
      showToast(t('raceFinished') || 'Finished!');
    });

    newSocket.on('error', (msg) => {
      showToast(msg, 'error');
      setIsCreating(false);
    });

    return () => {
      newSocket.close();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const createRoom = () => {
    if (!isConnected) return;
    setIsCreating(true);
    socket.emit('createRoom', { username: user?.username, settings: { duration, questionCount, maxPlayers } });
  };

  const joinRoom = (id) => {
    if (!isConnected) return;
    socket.emit('joinRoom', { roomId: id, username: user?.username });
  };

  const startRace = () => {
    if (socket && roomId) socket.emit('startRace', roomId);
  };

  const handleAnswer = (answer) => {
    if (view !== 'racing') return;
    socket.emit('updateProgress', { roomId, index: currentIdx, answer });
    if (currentIdx < quiz.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const sortedPlayers = roomState?.players 
    ? Object.values(roomState.players).sort((a, b) => b.score - a.score || b.progress - a.progress)
    : [];

  const isHost = roomState?.hostId === socket?.id || user?.role === 'admin';

  const Stepper = ({ label, value, onAdd, onSub, min, max, unit = "" }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      <label style={{ fontSize: '0.85rem', color: 'var(--sci-cyan)', fontWeight: 800, letterSpacing: '1px', textAlign: 'center' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '0.4rem', border: '1px solid var(--glass-border)' }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => value > min && onSub()} style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer', fontWeight: 900 }}>-</motion.button>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{value}<span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '4px' }}>{unit}</span></div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => value < max && onAdd()} style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer', fontWeight: 900 }}>+</motion.button>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '1rem' : '2rem' }}>
      
      {/* Toast Notification System */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }} 
            style={{ 
              position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 3000,
              padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem',
              background: toast.type === 'error' ? 'var(--sci-red)' : 'var(--sci-cyan)',
              color: toast.type === 'error' ? '#fff' : '#020617',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)'
            }}>
            {toast.type === 'error' ? '⚠️' : '✨'} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: isMobile ? '2rem' : '4rem', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900, background: 'linear-gradient(45deg, var(--sci-cyan), var(--sci-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🏁 {t('racingMode')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? 'var(--sci-green)' : 'var(--sci-red)' }}></div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isConnected ? 'var(--sci-green)' : 'var(--sci-red)' }}>{isConnected ? 'LIVE' : 'DISCONNECTED'}</span>
          </div>
          {roomId && (
            <div style={{ padding: '0.4rem 1rem', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '15px', border: '1px solid var(--sci-cyan)', fontWeight: 900, color: 'var(--sci-cyan)', fontSize: '0.9rem' }}>
              #{roomId}
            </div>
          )}
        </div>
        <button onClick={() => setView('dashboard')} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1.5rem', fontSize: '0.9rem', width: isMobile ? '100%' : 'auto' }}>
          {t('back')}
        </button>
      </div>

      {view === 'lobby-list' && (
        <div className="glass-card" style={{ padding: isMobile ? '1.5rem' : '3rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '2rem', gap: '1rem' }}>
            <h3 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 800 }}>{t('availableRooms')}</h3>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--sci-cyan), var(--sci-blue))' }}>
              {t('createRoom')}
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {roomList.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--glass-border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛰️</div>
                <div style={{ fontSize: '1rem' }}>{t('noRooms')}</div>
              </div>
            ) : (
              roomList.map(r => (
                <motion.div key={r.id} whileHover={{ y: -5 }} className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => joinRoom(r.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--sci-cyan)' }}>#{r.id}</span>
                    <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '15px', background: r.status === 'waiting' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 146, 60, 0.1)', color: r.status === 'waiting' ? 'var(--sci-green)' : 'var(--sci-orange)', fontWeight: 800 }}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <span>👥 {r.playerCount}/{r.settings.maxPlayers}</span>
                    <span>⏱️ {r.settings.duration}min</span>
                    <span>📝 {r.settings.questionCount}q</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'lobby-room' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: isMobile ? '2rem' : '4rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', letterSpacing: '4px', marginBottom: '0.5rem' }}>ROOM ID</div>
            <h3 style={{ fontSize: isMobile ? '3.5rem' : '5rem', fontWeight: 900, color: 'var(--sci-cyan)', letterSpacing: '8px' }}>{roomId}</h3>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
            {sortedPlayers.map((p, i) => (
              <div key={i} style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: p.isHost ? '2px solid var(--sci-cyan)' : '1px solid var(--glass-border)', fontWeight: 800, fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                {p.isHost && '👑'} {p.username}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{t('durationLabel')}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{roomState?.settings.duration}m</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{t('questionCountLabel')}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{roomState?.settings.questionCount}q</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            {isHost ? (
              <button className="btn-primary" onClick={startRace} style={{ padding: '1.2rem 4rem', fontSize: '1.2rem', width: isMobile ? '100%' : 'auto', background: 'linear-gradient(135deg, var(--sci-green), #059669)', fontWeight: 900 }}>
                {t('startRace')}
              </button>
            ) : (
              <div style={{ fontSize: '1.1rem', color: 'var(--sci-cyan)', fontWeight: 800 }} className="analyzing">
                {t('waitingForHost')}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {view === 'racing' && (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem' }}>
          <div className="glass-card" style={{ flex: 1, padding: isMobile ? '1.5rem' : '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sci-cyan)' }}>{currentIdx + 1}/{quiz.length}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: timeLeft < 30 ? 'var(--sci-red)' : '#fff' }}>{formatTime(timeLeft)}</div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', textAlign: 'center', margin: isMobile ? '2rem 0' : '4rem 0', fontWeight: 900, minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {quiz[currentIdx]?.question}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  {quiz[currentIdx]?.options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(opt)} className="btn-primary" style={{ padding: isMobile ? '1rem' : '1.5rem', fontSize: isMobile ? '1rem' : '1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="glass-card" style={{ width: isMobile ? '100%' : '320px', padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--sci-cyan)', textAlign: 'center' }}>STANDINGS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sortedPlayers.map((p, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 800 }}>{i + 1}. {p.username}</span>
                    <span style={{ color: 'var(--sci-green)', fontWeight: 900 }}>{p.score}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${(p.progress / (roomState?.settings.questionCount || 100)) * 100}%` }} style={{ height: '100%', background: 'var(--sci-cyan)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'finished' && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: isMobile ? '2rem' : '5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: isMobile ? '2.5rem' : '4rem', marginBottom: '2rem', fontWeight: 900, color: 'var(--sci-cyan)' }}>FINISH</h2>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {sortedPlayers.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', background: i === 0 ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255,255,255,0.02)', borderRadius: '15px', border: i === 0 ? '2px solid var(--sci-cyan)' : '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{p.username}</span>
                </div>
                <div style={{ fontWeight: 900, color: 'var(--sci-cyan)', fontSize: '1.2rem' }}>{p.score}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setInternalView('lobby-list')} className="btn-primary" style={{ marginTop: '3rem', padding: '1.2rem 4rem', width: isMobile ? '100%' : 'auto' }}>{t('backToLobby')}</button>
        </motion.div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(20px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: isMobile ? '2rem' : '3.5rem', border: '1px solid var(--sci-cyan)', borderRadius: '30px' }}>
              <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900, marginBottom: '2.5rem', color: 'var(--sci-cyan)', textAlign: 'center' }}>
                {t('createRoom')}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                <Stepper label={t('durationLabel')} value={duration} unit="m" onAdd={() => setDuration(d => Math.min(30, d + 1))} onSub={() => setDuration(d => Math.max(1, d - 1))} min={1} max={30} />
                <Stepper label={t('questionCountLabel')} value={questionCount} unit="q" onAdd={() => setQuestionCount(q => Math.min(200, q + 10))} onSub={() => setQuestionCount(q => Math.max(10, q - 10))} min={10} max={200} />
                <Stepper label={t('maxPlayersLabel')} value={maxPlayers} unit="p" onAdd={() => setMaxPlayers(p => Math.min(50, p + 2))} onSub={() => setMaxPlayers(p => Math.max(2, p - 2))} min={2} max={50} />
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
                <button onClick={createRoom} className="btn-primary" disabled={isCreating} style={{ flex: 2, padding: '1.2rem', fontSize: '1.2rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--sci-cyan), var(--sci-blue))' }}>
                  {isCreating ? '...' : t('create')}
                </button>
                <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '15px', cursor: 'pointer', padding: '1rem' }}>
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RaceMode;
