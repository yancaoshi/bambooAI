const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:4000';
const NUM_BOTS = 5;
const ROOM_ID = process.argv[2]; // Can pass roomId as argument

if (!ROOM_ID) {
  console.log('Usage: node simulate_race.js <ROOM_ID>');
  process.exit(1);
}

const createBot = (index) => {
  const socket = io(SERVER_URL);
  const username = `Bot_${index}`;
  let quiz = [];
  let currentIdx = 0;

  socket.on('connect', () => {
    console.log(`${username} connected. Joining room ${ROOM_ID}...`);
    socket.emit('joinRoom', { roomId: ROOM_ID, username });
  });

  socket.on('raceStarted', ({ questions }) => {
    console.log(`${username} saw race started. Questions: ${questions.length}`);
    quiz = questions;
    startAnswering();
  });

  socket.on('raceFinished', (players) => {
    console.log(`${username} race finished.`);
    socket.disconnect();
  });

  socket.on('error', (err) => {
    console.error(`${username} error:`, err);
  });

  const startAnswering = () => {
    const answerNext = () => {
      if (currentIdx >= quiz.length) return;

      // Simulate thinking time (1-3 seconds)
      const delay = Math.random() * 2000 + 1000;
      
      setTimeout(() => {
        // Bots are "smart" - they always pick the first option just to move forward, 
        // or we could simulate correct/incorrect. Let's just pick a random option.
        const options = quiz[currentIdx].options;
        const answer = options[Math.floor(Math.random() * options.length)];
        
        socket.emit('updateProgress', { roomId: ROOM_ID, index: currentIdx, answer });
        
        currentIdx++;
        answerNext();
      }, delay);
    };

    answerNext();
  };
};

for (let i = 1; i <= NUM_BOTS; i++) {
  createBot(i);
}
