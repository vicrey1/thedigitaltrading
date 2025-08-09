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
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const chatEndRef = useRef(null);
  const { user } = useUser();

  // Restore sessionStart from localStorage only once on mount
  useEffect(() => {
    if (sessionStart === null) {
      const storedStart = localStorage.getItem('supportSessionStart');
      if (storedStart) {
        setSessionStart(Number(storedStart));
      }
    }
  }, [sessionStart]);

  // Set sessionStart from messages only if not already set
  useEffect(() => {
    if (sessionStart) return;
    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.sender === 'user');
      if (firstUserMsg) {
        setSessionStart(firstUserMsg.timestamp);
      }
    }
  }, [messages, sessionStart]);

  // Persist sessionStart in localStorage
  useEffect(() => {
    if (sessionStart) {
      localStorage.setItem('supportSessionStart', sessionStart);
    }
  }, [sessionStart]);

  // Expiration check only runs when sessionStart is valid
  useEffect(() => {
    if (!sessionStart) return;
    const checkExpiration = () => {
      const now = Date.now();
      if (now - sessionStart >= 30 * 60 * 1000) {
        setSessionExpired(true);
        localStorage.setItem('supportSessionExpired', 'true');
      } else {
        setSessionExpired(false);
        localStorage.removeItem('supportSessionExpired');
      }
    };
    checkExpiration();
    const interval = setInterval(checkExpiration, 10000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Restore sessionExpired from localStorage
  useEffect(() => {
    const storedExpired = localStorage.getItem('supportSessionExpired');
    if (storedExpired === 'true') {
      setSessionExpired(true);
    }
  }, []);

  // Clear messages when session expires or is ended by admin
  useEffect(() => {
    if (sessionExpired) {
      setMessages([]);
      localStorage.removeItem('supportSessionStart');
      localStorage.removeItem('supportSessionExpired');
    }
  }, [sessionExpired]);

  // On mount, if session is expired, do not load old messages
  useEffect(() => {
    const storedExpired = localStorage.getItem('supportSessionExpired');
    if (storedExpired === 'true') {
      setMessages([]);
      return;
    }
    // Fetch chat history from backend
    axios.get('/api/support/messages').then(res => {
      setMessages(res.data);
    });
  }, [user]);

  useEffect(() => {
    // Socket.IO: listen for new messages and typing
    const handleNewMessage = (msg) => {
      if (msg.sender === 'support') {
        setMessages((prev) => [...prev, msg]);
      }
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

  // Always join the userId room on socket connect (run when user._id or user.id changes)
  useEffect(() => {
    function joinRoom() {
      if (user?._id || user?.id) {
        socket.emit('join', user._id || user.id);
        console.log('User joined room:', user._id || user.id);
      }
    }
    socket.on('connect', joinRoom);
    joinRoom(); // Call immediately in case already connected
    return () => {
      socket.off('connect', joinRoom);
    };
  }, [user?._id, user?.id]); // Add user._id and user.id as dependencies

  // Listen for admin ending the chat
  useEffect(() => {
    const handleEndSession = () => {
      console.log('Received endSupportSession event from admin');
      setSessionExpired(true);
      setMessages([]);
      localStorage.removeItem('supportSessionStart');
      localStorage.setItem('supportSessionExpired', 'true');
    };
    socket.on('endSupportSession', handleEndSession);
    return () => {
      socket.off('endSupportSession', handleEndSession);
    };
  }, []);

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
    // Add the message locally so the user sees their own message
    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);
    // Send to backend
    await axios.post('/api/support/message', newMsg);
    // Simulate support reply (replace with backend call for real agent)
    setTimeout(async () => {
      if (type === 'text') {
        const reply = {
          sender: 'support',
          content: autoReply(msg),
          type,
          timestamp: Date.now(),
          attachment: null,
        };
        // Do NOT add the reply here; wait for Socket.IO event
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
      // Upload file to backend
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post('/api/upload-support-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        // Send a message with both text and file if both are present
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

  // Only clear session on new session or admin end, not on refresh
  const handleNewSession = () => {
    setMessages([]);
    setSessionStart(null);
    setSessionExpired(false);
    setInput('');
    setFile(null);
    localStorage.removeItem('supportSessionStart');
    localStorage.removeItem('supportSessionExpired');
  };

  useEffect(() => {
    document.body.classList.add('support-chat-open');
    document.documentElement.classList.add('support-chat-open');
    document.getElementById('root')?.classList.add('support-chat-open');
    return () => {
      document.body.classList.remove('support-chat-open');
      document.documentElement.classList.remove('support-chat-open');
      document.getElementById('root')?.classList.remove('support-chat-open');
    };
  }, []);

  // Filter out the auto-reply if admin has replied
  const adminHasReplied = messages.some(m => m.sender === 'support' && m.content !== 'Thank you for contacting support! An agent will reply soon.');
  const filteredMessages = adminHasReplied
    ? messages.filter(m => !(m.sender === 'support' && m.content === 'Thank you for contacting support! An agent will reply soon.'))
    : messages;

  // Mark messages as seen when chat is open or new messages arrive
  useEffect(() => {
    if (!user) return;
    // Find the latest message from the other party that is not seen
    const unseen = messages.filter(m => m.sender !== ((user && user.isAdmin) ? 'support' : 'user') && m.status !== 'seen');
    if (unseen.length > 0) {
      axios.post('/api/support/message-seen', {
        userId: user._id || user.id,
        sender: (user && user.isAdmin) ? 'support' : 'user',
      });
    }
  }, [messages, user]);

  // Listen for messagesSeen event to update message status
  useEffect(() => {
    function handleMessagesSeen({ userId, sender }) {
      setMessages(prev => prev.map(m => {
        if (
          ((sender === 'user' && m.sender === 'support') || (sender === 'support' && m.sender === 'user')) &&
          m.userId === userId
        ) {
          return { ...m, status: 'seen' };
        }
        return m;
      }));
    }
    socket.on('messagesSeen', handleMessagesSeen);
    return () => socket.off('messagesSeen', handleMessagesSeen);
  }, [user]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-white">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-100 to-blue-100 border-b border-gray-200 shadow-none">
          <button
            className="mr-2 p-2 rounded-full hover:bg-yellow-200 focus:outline-none"
            onClick={() => window.location.href = '/dashboard'}
            title="Back to Dashboard"
          >
            <FaArrowLeft className="text-xl text-yellow-600" />
          </button>
          <FaHeadset className="text-3xl text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Support Chat</h2>
            <div className="text-sm text-gray-500">Chat with our support team. Attach files if needed.</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-white scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60" style={{ minHeight: 0 }}>
          {messages.length === 0 && (
            <div className="text-center text-gray-400 my-8">No messages yet. Start the conversation below!</div>
          )}
          {filteredMessages.map((m, i) => (
            <div key={i} className={`flex mb-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'support' && <img src={AVATAR_SUPPORT} alt="Support" className="w-9 h-9 rounded-full mr-2 border-2 border-yellow-400" />}
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${m.sender === 'user' ? 'bg-blue-100 text-blue-900 rounded-br-none font-semibold' : 'bg-yellow-200 text-gray-900 rounded-bl-none'} shadow-md relative`}>
                {/* Show both file and text if both are present, with text under image */}
                {m.type === 'file' && m.attachment && m.content && m.content !== m.attachment ? (
                  <>
                    {m.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <>
                        <img src={m.attachment} alt={m.content} className="max-w-[200px] max-h-[200px] rounded mb-2 border" />
                        <span className="block mt-2 font-bold text-lg text-blue-900 text-center">{m.content}</span>
                      </>
                    ) : (
                      <a href={m.attachment} download={m.content} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">{m.content}</a>
                    )}
                  </>
                ) : m.type === 'file' && m.attachment && m.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={m.attachment} alt={m.content} className="max-w-[200px] max-h-[200px] rounded mb-2 border" />
                ) : m.type === 'file' && m.attachment ? (
                  <a href={m.attachment} download={m.content} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">{m.content}</a>
                ) : (
                  <span>{m.content}</span>
                )}
                <div className="text-xs text-gray-700 mt-1 flex justify-between items-center">
                  <span>{m.sender === 'user' ? 'You' : 'Support'}</span>
                  <span className="flex items-center gap-1">
                    {formatTime(m.timestamp)}
                    {/* Double tick: grey for sent, blue for seen */}
                    {m.sender === ((user && user.isAdmin) ? 'support' : 'user') && (
                      <FaCheckDouble className={m.status === 'seen' ? 'text-blue-500 ml-1' : 'text-gray-400 ml-1'} title={m.status === 'seen' ? 'Seen' : 'Sent'} />
                    )}
                  </span>
                </div>
              </div>
              {m.sender === 'user' && <img src={AVATAR_USER} alt="User" className="w-9 h-9 rounded-full ml-2 border-2 border-blue-400" />}
            </div>
          ))}
          {isTyping && (
            <div className="flex mb-2 justify-start items-center">
              <img src={AVATAR_SUPPORT} alt="Support" className="w-9 h-9 rounded-full mr-2 border-2 border-yellow-400" />
              <div className="bg-yellow-200 px-4 py-2 rounded-2xl shadow text-left text-gray-700">Support is typing...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {sessionExpired ? (
          <div className="flex flex-col items-center justify-center p-6 bg-red-50 border-t border-gray-200">
            <div className="text-red-600 font-bold text-lg mb-2">Session expired</div>
            <div className="text-gray-700 mb-4">Your support chat session has ended after 30 minutes. Please start a new chat if you need further assistance.</div>
            <button onClick={handleNewSession} className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700">Start New Chat</button>
          </div>
        ) : (
          <form className="flex items-center gap-2 p-4 border-t border-gray-200 bg-white" onSubmit={handleSend}>
            <input
              type="text"
              id="support-chat-input"
              name="support-chat-input"
              className="flex-1 border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400"
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
