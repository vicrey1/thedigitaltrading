import { io } from 'socket.io-client';
// Always use the backend port for both admin and user
const socket = io('http://localhost:5001/', { transports: ['websocket'] });
export default socket;