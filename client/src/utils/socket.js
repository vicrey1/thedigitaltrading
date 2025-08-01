import { io } from 'socket.io-client';
const SOCKET_URL = process.env.REACT_APP_WS_BASE_URL || 'wss://api.luxyield.com/';
const socket = io(SOCKET_URL, { transports: ['websocket'] });
export default socket;