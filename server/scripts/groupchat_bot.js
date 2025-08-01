// server/scripts/groupchat_bot.js
const { io } = require('socket.io-client');

const SERVER_URL = process.env.BOT_SOCKET_URL;
const SIMULATED_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
  'Mallory', 'Niaj', 'Olivia', 'Peggy', 'Rupert', 'Sybil', 'Trent', 'Victor', 'Walter', 'Yasmine'
];
const SIMULATED_MESSAGES = [
  "Hi everyone!",
  "How's it going?",
  "This platform looks awesome!",
  "Anyone investing today?",
  "Admin, can you help me?",
  "Just joined, excited to chat!",
  "What's the best plan here?",
  "I love the dark mode!",
  "How do I withdraw?",
  "Good luck to all!",
  "Nice to meet you all!",
  "Is support fast here?",
  "I just made my first deposit!",
  "Can I invite friends?",
  "What are the fees?",
  "Admin is very helpful!",
  "Let's grow together!",
  "Any tips for beginners?",
  "The UI is so clean!",
  "Happy investing!"
];

function getRandomName() {
  return SIMULATED_NAMES[Math.floor(Math.random() * SIMULATED_NAMES.length)] + Math.floor(Math.random() * 100);
}
function getRandomMessage() {
  return SIMULATED_MESSAGES[Math.floor(Math.random() * SIMULATED_MESSAGES.length)];
}

function startBot() {
  let botName = getRandomName();
  const socket = io(SERVER_URL, { transports: ['websocket'] });

  socket.on('connect', () => {
    console.log(`[BOT] Connected to server as ${botName}`);
    socket.emit('joinGroup', { name: botName });
    sendMessage();
  });

  function sendMessage() {
    setTimeout(() => {
      const msg = {
        name: botName,
        text: getRandomMessage(),
        isAdmin: false,
        time: new Date().toLocaleTimeString(),
      };
      console.log(`[BOT] Sending message as ${botName}: ${msg.text}`);
      socket.emit('groupMessage', msg);
      // 30% chance to switch to a new bot user
      if (Math.random() < 0.3) {
        botName = getRandomName();
        console.log(`[BOT] Switching to new bot user: ${botName}`);
        socket.emit('joinGroup', { name: botName });
      }
      sendMessage();
    }, Math.random() * 8000 + 4000); // every 4-12 seconds
  }
}

startBot();
