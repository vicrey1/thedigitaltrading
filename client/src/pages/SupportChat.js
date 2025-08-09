import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaHeadset, FaPaperPlane, FaCheckDouble, FaArrowLeft } from 'react-icons/fa';
import { useUser } from '../contexts/UserContext';
import socket from '../utils/socket';

const AVATAR_USER = 'https://ui-avatars.com/api/?name=You&background=0D8ABC&color=fff';
const AVATAR_SUPPORT = 'https://ui-avatars.com/api/?name=Support&background=FFD700&color=000';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SupportChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const chatEndRef = useRef(null);
  const { user } = useUser();

  useEffect(() => {
    // Socket.IO: listen for new messages and typing
    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    const handleAdminTyping = ({ userId }) => {
      if ((user?._id || user?.id) === userId) setIsTyping(true);
    };
    const handleAdminStopTyping = ({ userId }) => {
      if ((user?._id || user?.id) === userId) setIsTyping(false);
    };
    socket.on('newMessage', handleNewMessage);
    socket.on('adminTyping', handleAdminTyping);
    socket.on('adminStopTyping', handleAdminStopTyping);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('adminTyping', handleAdminTyping);
      socket.off('adminStopTyping', handleAdminStopTyping);
    };
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (msg, type = 'text', attachment = null) => {
    if (sessionExpired) return;
    const newMsg = {
      sender: 'user',
      userId: user?._id || user?.id || 'Unknown User',
      name: user?.name || 'Unknown',
      username: user?.username || 'unknown',
      content: msg,
      type,
      timestamp: Date.now(),
      attachment,
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);
    await axios.post('/api/support/message', newMsg);
    setTimeout(async () => {
      if (type === 'text') {
        const reply = {
          sender: 'support',
          content: autoReply(msg),
          type,
          timestamp: Date.now(),
          attachment: null,
        };
        await axios.post('/api/support/message', reply);
      }
      setIsTyping(false);
    }, 1200);
  };

  const autoReply = (msg) => {
    if (/refund|money/i.test(msg)) return 'For refund requests, please provide your transaction ID.';
    if (/kyc|verify/i.test(msg)) return 'KYC verification can take up to 24 hours.';
    if (/withdraw/i.test(msg)) return 'Withdrawals are processed within 1-2 business days.';
    return 'Thank you for contacting support! An agent will reply soon.';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (sessionExpired) return;
    if (!input.trim() && !file) return;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post('/api/upload-support-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        sendMessage(input.trim() || res.data.originalName, 'file', res.data.url);
      } catch (err) {
        alert('File upload failed: ' + (err.response?.data?.message || err.message));
        console.error('File upload error:', err);
      }
      setFile(null);
    } else {
      sendMessage(input);
    }
    setInput('');
  };

  const handleNewSession = () => {
    setMessages([]);
    setSessionExpired(false);
    setInput('');
    setFile(null);
  };

  const adminHasReplied = messages.some(m => m.sender === 'support' && m.content !== 'Thank you for contacting support! An agent will reply soon.');
  const filteredMessages = adminHasReplied
    ? messages.filter(m => !(m.sender === 'support' && m.content === 'Thank you for contacting support! An agent will reply soon.'))
    : messages;

  return (
    <div className="max-w-screen-xl mx-auto px-2 md:px-6 py-8 space-y-8 support-chat-responsive" style={{ minHeight: '100vh' }}>
      <div className="glass-card p-4 md:p-6 rounded-xl shadow-2xl border border-yellow-700 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden mb-8 w-full max-w-full">
        <div className="flex flex-col md:flex-row items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-yellow-100 to-blue-100 border-b border-gray-200 shadow-none rounded-t-xl">
          <button
            className="mr-2 p-2 rounded-full hover:bg-yellow-200 focus:outline-none"
            onClick={() => window.location.href = '/dashboard'}
            title="Back to Dashboard"
          >
            <FaArrowLeft className="text-xl text-yellow-600" />
          </button>
          <FaHeadset className="text-3xl text-yellow-500" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Support Chat</h2>
            <div className="text-sm text-gray-500">Chat with our support team. Attach files if needed.</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-white scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60 rounded-b-xl" style={{ minHeight: 0 }}>
          <div className="w-full max-w-full">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 my-8">No messages yet. Start the conversation below!</div>
            )}
            {filteredMessages.map((m, i) => (
              <div key={i} className={`flex mb-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.sender === 'support' && <img src={AVATAR_SUPPORT} alt="Support" className="w-8 h-8 md:w-9 md:h-9 rounded-full mr-2 border-2 border-yellow-400" />}
                <div className={`max-w-[90vw] md:max-w-[70%] px-3 md:px-4 py-2 rounded-2xl ${m.sender === 'user' ? 'bg-blue-100 text-blue-900 rounded-br-none font-semibold' : 'bg-yellow-200 text-gray-900 rounded-bl-none'} shadow-md relative`}>
                  {m.type === 'file' && m.attachment && m.content && m.content !== m.attachment ? (
                    m.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <>
                        <img src={m.attachment} alt={m.content} className="max-w-[150px] md:max-w-[200px] max-h-[150px] md:max-h-[200px] rounded mb-2 border" onError={e => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Image+Not+Found&background=cccccc&color=555'; }} />
                        <span className="block mt-2 font-bold text-lg text-blue-900 text-center">{m.content}</span>
                      </>
                    ) : (
                      <a href={m.attachment} download={m.content} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">{m.content}</a>
                    )
                  ) : m.type === 'file' && m.attachment && m.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img src={m.attachment} alt={m.content} className="max-w-[150px] md:max-w-[200px] max-h-[150px] md:max-h-[200px] rounded mb-2 border" onError={e => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Image+Not+Found&background=cccccc&color=555'; }} />
                  ) : m.type === 'file' && m.attachment ? (
                    <a href={m.attachment} download={m.content} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">{m.content}</a>
                  ) : (
                    <span>{m.content}</span>
                  )}
                  <div className="text-xs text-gray-700 mt-1 flex justify-between items-center">
                    <span>{m.sender === 'user' ? 'You' : 'Support'}</span>
                    <span className="flex items-center gap-1">
                      {formatTime(m.timestamp)}
                      {(user && user.isAdmin ? m.sender === 'support' : m.sender === 'user') && (
                        <FaCheckDouble className={m.status === 'seen' ? 'text-blue-500 ml-1' : 'text-gray-400 ml-1'} title={m.status === 'seen' ? 'Seen' : 'Sent'} />
                      )}
                    </span>
                  </div>
                </div>
                {m.sender === 'user' && <img src={AVATAR_USER} alt="User" className="w-8 h-8 md:w-9 md:h-9 rounded-full ml-2 border-2 border-blue-400" />}
              </div>
            ))}
            {isTyping && (
              <div className="flex mb-2 justify-start items-center">
                <img src={AVATAR_SUPPORT} alt="Support" className="w-8 h-8 md:w-9 md:h-9 rounded-full mr-2 border-2 border-yellow-400" />
                <div className="bg-yellow-200 px-3 md:px-4 py-2 rounded-2xl shadow text-left text-gray-700">Support is typing...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
        {sessionExpired ? (
          <div className="flex flex-col items-center justify-center p-4 md:p-6 bg-red-50 border-t border-gray-200 rounded-b-xl">
            <div className="text-red-600 font-bold text-lg mb-2">Session expired</div>
            <div className="text-gray-700 mb-4">Your support chat session has ended after 30 minutes. Please start a new chat if you need further assistance.</div>
            <button onClick={handleNewSession} className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700">Start New Chat</button>
          </div>
        ) : (
          <form className="flex flex-col md:flex-row items-center gap-2 p-3 md:p-4 border-t border-gray-200 bg-white rounded-b-xl" onSubmit={handleSend}>
            <input
              type="text"
              id="support-chat-input"
              name="support-chat-input"
              className="flex-1 border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400 mb-2 md:mb-0"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoComplete="on"
            />
            <input
              type="file"
              className="hidden"
              id="file-upload"
              name="file-upload"
              onChange={e => setFile(e.target.files[0])}
            />
            <label htmlFor="file-upload" className="cursor-pointer bg-gray-200 px-3 py-2 rounded-full hover:bg-gray-300 text-xl">📎</label>
            {file && (
              <span className="ml-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full font-semibold truncate max-w-[120px]" title={file.name}>
                {file.name}
              </span>
            )}
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 flex items-center gap-2"><FaPaperPlane /> Send</button>
          </form>
        )}
      </div>
    </div>
  );
}
