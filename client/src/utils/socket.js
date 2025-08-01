import { io } from 'socket.io-client';
const SOCKET_URL = process.env.REACT_APP_WS_BASE_URL;
const socket = io(SOCKET_URL, { transports: ['websocket'] });
export default socket;