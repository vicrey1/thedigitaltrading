// Polyfill Buffer for bitcoinjs-lib in browser
import { Buffer } from 'buffer';
window.Buffer = Buffer;
