// This file is being rebuilt from scratch.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaHeadset, FaArrowLeft, FaPaperPlane, FaCheckDouble, FaSmile, FaFileAlt, FaImage, FaTimes, FaRedo, FaStop } from 'react-icons/fa';
import axios from '../utils/axios';
import { useUser } from '../contexts/UserContext';
import socket from '../utils/socket';

const AVATAR_USER = 'https://ui-avatars.com/api/?name=You&background=0D8ABC&color=fff';
const AVATAR_SUPPORT = 'https://ui-avatars.com/api/?name=Support&background=FFD700&color=000';
const UPLOADS_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.luxyield.com'; // prefer env
const FALLBACK_IMG = 'https://ui-avatars.com/api/?name=Image+Not+Found&background=cccccc&color=333';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const quickReplies = [
  'How do I reset my password?',
  'How long does KYC take?',
  'How do I withdraw funds?',
  'Can I change my email address?',
];

export default function SupportChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [sessionExpired, setSessionExpired] = useState(false);
  const chatEndRef = useRef(null);
  const { user } = useUser();

  // New: upload queue and map of abort controllers for cancel
  const [uploadQueue, setUploadQueue] = useState([]); // { id, file, progress, status, error }
  const uploadControllers = useRef({});
  // Cache for authenticated blob URLs to display protected images/files in <img>
  const [authBlobCache, setAuthBlobCache] = useState({}); // key -> objectURL
  const authBlobCacheRef = useRef({});

  // New: image modal for viewing full images
  const [imageModal, setImageModal] = useState(null); // { url, alt }

  // Helper: generate temp id for optimistic messages/uploads
  const genId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  // Upload helper with progress and cancel support
  const uploadFile = useCallback((fileItem, onProgress) => {
    const id = genId();
    const form = new FormData();
    form.append('file', fileItem.file);
    // Create Axios cancel token via AbortController
    const controller = new AbortController();
    uploadControllers.current[id] = controller;

    // Attach auth token so server recognizes the user and doesn't return 401 which triggers global logout
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'multipart/form-data' };
    if (token) headers.Authorization = `Bearer ${token}`;

    return axios.post('/api/support/upload', form, {
      headers,
      onUploadProgress: (evt) => {
        const pct = Math.round((evt.loaded * 100) / (evt.total || 1));
        if (onProgress) onProgress(pct);
      },
      signal: controller.signal
    }).then(res => ({ success: true, data: res.data }))
      .catch(err => {
        if (err.name === 'CanceledError' || err.message === 'canceled' || err.name === 'AbortError') {
          return { success: false, canceled: true, error: 'Canceled' };
        }
        return { success: false, error: err.response?.data?.message || err.message };
      }).finally(() => {
        delete uploadControllers.current[id];
      });
  }, []);

  // New: start upload for an item in queue
  const startUpload = useCallback(async (item) => {
    setUploadQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'uploading', progress: 0 } : x));
    const result = await uploadFile(item, (pct) => {
      setUploadQueue(q => q.map(x => x.id === item.id ? { ...x, progress: pct } : x));
    });

    if (result.success) {
      const { fileUrl, thumbnailUrl, originalName } = result.data;
      // Update optimistic message in chat (match by tempId stored in item.msgId)
      setMessages(prev => prev.map(m => {
        if (m._localId && m._localId === item.msgId) {
          const attachment = {
            file: fileUrl.split('/').pop(),
            thumb: thumbnailUrl ? thumbnailUrl.split('/').pop() : null,
            url: fileUrl,
            thumbUrl: thumbnailUrl || null
          };
          return { ...m, attachment, type: thumbnailUrl ? 'image' : 'file', status: 'sent' };
        }
        return m;
      }));

      // Notify backend of the completed message so server can emit to admins/users
      try {
        const payload = {
          sender: 'user',
          userId: user?._id || user?.id || null,
          name: user?.name || 'Unknown',
          username: user?.username || user?.email || 'unknown',
          content: originalName || fileUrl.split('/').pop(),
          type: thumbnailUrl ? 'image' : 'file',
          timestamp: Date.now(),
          attachment: {
            file: fileUrl.split('/').pop(),
            thumb: thumbnailUrl ? thumbnailUrl.split('/').pop() : null,
            url: fileUrl,
            thumbUrl: thumbnailUrl || null
          }
        };
        axios.post('/api/support/message', payload).catch(e => { console.warn('Failed to notify backend of uploaded message', e); });
      } catch (e) {
        console.warn('Failed to send finalized message to backend', e);
      }

      // Mark queue item done
      setUploadQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'done', progress: 100 } : x));
    } else if (result.canceled) {
      setUploadQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'canceled', error: 'Canceled' } : x));
      setMessages(prev => prev.map(m => m._localId === item.msgId ? { ...m, status: 'canceled' } : m));
    } else {
      setUploadQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'error', error: result.error } : x));
      setMessages(prev => prev.map(m => m._localId === item.msgId ? { ...m, status: 'failed', error: result.error } : m));
    }
  }, [uploadFile]);

  // New: cancel upload
  const cancelUpload = (queueId) => {
    const controllerId = Object.keys(uploadControllers.current)[0];
    // Try to abort controller associated with any running upload; we kept controllers keyed by generated id within uploadFile
    // We don't persist mapping queueId->controllerId here due to simple impl; cancel all running controllers
    Object.values(uploadControllers.current).forEach(ctrl => { try { ctrl.abort(); } catch(e){} });
    setUploadQueue(q => q.map(x => x.id === queueId ? { ...x, status: 'canceled' } : x));
  };

  // New: retry upload
  const retryUpload = async (queueItem) => {
    const item = { ...queueItem, id: genId(), progress: 0, status: 'pending' };
    setUploadQueue(q => [...q.filter(x => x.id !== queueItem.id), item]);
    // Immediately start retry
    startUpload({ ...item, file: item.file, msgId: item.msgId });
  };

  // Modified sendMessage/handleSend logic: handle optimistic message for file uploads
  const sendMessage = async (msg, type = 'text', attachment = null, options = {}) => {
    if (sessionExpired) return;
    const localId = genId();
    const newMsg = {
      _localId: localId,
      sender: 'user',
      userId: user?._id || user?.id || 'Unknown User',
      name: user?.name || 'Unknown',
      username: user?.username || 'unknown',
      content: msg,
      type,
      timestamp: Date.now(),
      attachment,
      status: type === 'text' ? 'sent' : 'pending' // file messages start pending
    };

    setMessages((prev) => [...prev, newMsg]);

    if (type === 'text') {
      // send to backend
      try {
        await axios.post('/api/support/message', newMsg);
      } catch (e) {
        setMessages(prev => prev.map(m => m._localId === localId ? { ...m, status: 'failed', error: e.message } : m));
      }
      return;
    }

    // For files/images, add to upload queue and start upload
    const queueItem = { id: genId(), file: options.fileObj || null, progress: 0, status: 'pending', msgId: localId };
    setUploadQueue(q => [...q, queueItem]);
    // Start upload
    startUpload(queueItem);

    // Also, post a lightweight message record to backend to create chat message placeholder if needed
    try {
      await axios.post('/api/support/message', { ...newMsg, type: 'file' });
    } catch (e) {
      // ignore backend placeholder failure — message may still be delivered after upload
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (sessionExpired) return;
    if (!input.trim() && !file) return;

    if (file) {
      const name = input.trim() || file.name;
      // Restrict file size <= 10MB locally
      const MAX = 10 * 1024 * 1024;
      if (file.size > MAX) {
        alert('File too large. Max 10MB');
        return;
      }
      // push optimistic message and queue upload
      sendMessage(name, file.type.startsWith('image/') ? 'image' : 'file', null, { fileObj: file });
      setFile(null);
      setInput('');
      return;
    }

    sendMessage(input);
    setInput('');
  };

  // Retry a failed message's upload
  const handleRetryMessage = (msgLocalId) => {
    const msg = messages.find(m => m._localId === msgLocalId);
    if (!msg) return;
    // Find associated queue item by msgId
    const qItem = uploadQueue.find(q => q.msgId === msgLocalId || q.msgId === msgLocalId);
    if (qItem) {
      retryUpload(qItem);
    } else {
      // No queue item; user may try re-adding file manually
      alert('No upload record found to retry. Please re-attach the file and send again.');
    }
  };

  // Cancel an in-progress message upload
  const handleCancelMessage = (msgLocalId) => {
    // find queue item
    const qItem = uploadQueue.find(q => q.msgId === msgLocalId);
    if (qItem) cancelUpload(qItem.id);
  };

  // Image click: open modal with full image
  const openImage = (m) => {
    // Prefer absolute URLs returned by server (attachment.url/thumbUrl)
    const maybeUrl = m.attachment?.url ? m.attachment.url : (m.attachment?.file ? `${UPLOADS_BASE_URL}/api/support/file/${m.attachment.file}` : null);
    if (!maybeUrl) return;
    // If it's a presigned/external url, open directly. If it's our API endpoint, fetch with Authorization and create blob URL.
    const isApiFile = maybeUrl.includes('/api/support/file');
    if (!isApiFile) {
      setImageModal({ url: maybeUrl, alt: m.content });
      return;
    }
    // Fetch authenticated image and open in modal
    (async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(maybeUrl, { headers });
        if (!res.ok) throw new Error('Failed to load image');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setImageModal({ url: blobUrl, alt: m.content });
      } catch (err) {
        console.error('Failed to fetch image for modal', err);
        // fallback: try to open the raw URL
        setImageModal({ url: maybeUrl, alt: m.content });
      }
    })();
  };

  // Download support file (handles server-authenticated files and presigned URLs)
  const downloadSupportFile = async (attachment, filename, originalName) => {
    try {
      const url = attachment?.url ? attachment.url : `${UPLOADS_BASE_URL}/api/support/file/${attachment?.file || filename}`;
      const isApiFile = url.includes('/api/support/file');
      if (isApiFile) {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error('Failed to download file');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = originalName || filename || 'file';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        // presigned or external link
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download file.');
    }
  };

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

  // Session timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - sessionStart > 30 * 60 * 1000) {
        setSessionExpired(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStart]);

  // Simulate support typing
  useEffect(() => {
    if (messages.length && messages[messages.length - 1].sender === 'user' && !sessionExpired) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(msgs => [...msgs, {
          sender: 'support',
          content: 'Thank you for your message! Our team will respond shortly.',
          timestamp: Date.now(),
          status: 'delivered',
        }]);
      }, 1200);
    }
  }, [messages, sessionExpired]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // New: effect to auto-start pending uploads (in case user adds multiple)
  useEffect(() => {
    const pending = uploadQueue.filter(q => q.status === 'pending');
    if (pending.length > 0) {
      // Start first pending upload; concurrency could be limited
      startUpload(pending[0]);
    }
  }, [uploadQueue, startUpload]);

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

  function handleQuickReply(q) {
    setInput(q);
  }

  function handleNewSession() {
    setSessionStart(Date.now());
    setSessionExpired(false);
    setMessages([]);
    setInput('');
    setFile(null);
  }

  // Helper to fetch a protected URL (our /api/support/file/* endpoints) with Authorization and cache blob URL
  const fetchProtectedFileAsBlobUrl = useCallback(async (url, cacheKey) => {
    if (!url) return null;
    // Return cached
    if (authBlobCacheRef.current[cacheKey]) return authBlobCacheRef.current[cacheKey];
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch protected file');
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      authBlobCacheRef.current[cacheKey] = objUrl;
      // Trigger state update once
      setAuthBlobCache({...authBlobCacheRef.current});
      return objUrl;
    } catch (err) {
      console.error('Failed to fetch protected file:', err);
      return null;
    }
  }, []);

  // When messages change, prefetch thumbnails for protected attachments
  useEffect(() => {
    (async () => {
      const candidates = messages.filter(m => m.attachment && (m.attachment.thumbUrl || m.attachment.url || m.attachment.file));
      for (const m of candidates) {
        try {
          const att = m.attachment;
          // Determine the URL to fetch (thumb preferred)
          const maybeUrl = att.thumbUrl ? att.thumbUrl : (att.url ? att.url : (att.file ? `${UPLOADS_BASE_URL}/api/support/file/${att.file}` : null));
          if (!maybeUrl) continue;
          if (maybeUrl.includes('/api/support/file')) {
            // Use file name as cache key if available
            const key = att.file ? att.file : (maybeUrl.split('/').pop());
            // For thumbs, prefer a _thumb suffix key
            const thumbKey = att.thumbUrl && att.thumbUrl.includes('_thumb') ? (key + '_thumb') : key;
            if (!authBlobCacheRef.current[thumbKey]) {
              fetchProtectedFileAsBlobUrl(maybeUrl, thumbKey).catch(()=>{});
            }
          }
        } catch (e) { /* ignore per-item errors */ }
      }
    })();
  }, [messages, fetchProtectedFileAsBlobUrl]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-white px-0 sm:px-4 md:px-8 overflow-x-hidden">
      <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl flex flex-col min-h-[80vh] max-h-[98vh] rounded-2xl shadow-2xl border border-yellow-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-yellow-100 to-blue-100 border-b border-yellow-200 shadow w-full relative">
          <button
            className="mr-2 p-2 rounded-full hover:bg-yellow-200 focus:outline-none"
            onClick={() => window.location.href = '/dashboard'}
            title="Back to Dashboard"
          >
            <FaArrowLeft className="text-xl text-yellow-600" />
          </button>
          <FaHeadset className="text-2xl sm:text-3xl text-yellow-500" />
          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 truncate">Support Chat</h2>
            <div className="text-xs sm:text-sm text-gray-500 truncate">Chat with our support team. Attach files if needed.</div>
          </div>
          {/* Session timer */}
          {!sessionExpired && (
            <div className="absolute right-4 top-4 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-bold shadow">
              {Math.max(0, 30 - Math.floor((Date.now() - sessionStart) / 60000))} min left
            </div>
          )}
        </div>
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-white space-y-4 scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60 relative" style={{ minHeight: 0 }}>
          {sessionExpired ? (
            <div className="flex flex-col items-center justify-center p-6 bg-red-50 border-t border-yellow-200 w-full space-y-4">
              <div className="text-red-600 font-bold text-base sm:text-lg mb-2">Session expired</div>
              <div className="text-gray-700 mb-4 text-xs sm:text-base text-center">Your support chat session has ended after 30 minutes. Please start a new chat if you need further assistance.</div>
              <button onClick={() => { setSessionStart(Date.now()); setSessionExpired(false); }} className="bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-full hover:bg-blue-700 w-full max-w-xs">Start New Chat</button>
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="text-center text-gray-400 my-8">No messages yet. Start the conversation below!</div>
              )}

              {messages.map((m, i) => (
                <div key={m._localId || m.timestamp || i} className={`flex mb-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'} w-full group relative`}>
                  {m.sender === 'support' && <img src={AVATAR_SUPPORT} alt="Support" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full mr-2 border-2 border-yellow-400 shadow" />}
                  <div className={`w-full max-w-[90vw] sm:max-w-[70%] px-3 py-2 rounded-2xl ${m.sender === 'user' ? 'bg-blue-100 text-blue-900 rounded-br-none font-semibold float-right' : 'bg-yellow-100 text-gray-900 rounded-bl-none float-left'} shadow-md border border-yellow-100 relative transition-all duration-300`}>
                    {/* File/image preview logic with progress and controls */}
                    {m.type === 'image' && m.attachment ? (
                      <>
                        <img
                          src={
                            // Prefer cached authenticated blob URL if available
                            (m.attachment && m.attachment.file && authBlobCache[m.attachment.file + '_thumb']) ||
                            (m.attachment && m.attachment.file && authBlobCache[m.attachment.file]) ||
                            m.attachment?.thumbUrl || (m.attachment?.url ? m.attachment.url : (m.attachment?.file ? `${UPLOADS_BASE_URL}/api/support/file/${m.attachment.file}` : ''))
                          }
                           alt={m.content}
                           className="max-w-full sm:max-w-[300px] max-h-[300px] rounded mb-2 border cursor-zoom-in transition-transform duration-200 hover:scale-105"
                           onClick={() => openImage(m)}
                           loading="lazy"
                           onError={e => { e.target.onerror=null; e.target.src=FALLBACK_IMG; }}
                        />
                        {m.attachment?.url && (
                          <div className="text-xs text-gray-500">Tap image to view full size</div>
                        )}
                      </>
                    ) : m.type === 'file' && m.attachment ? (
                      <button type="button" onClick={() => downloadSupportFile(m.attachment, m.attachment?.file, m.content)} className="text-blue-600 underline break-all bg-transparent border-0 p-0 text-left" aria-label={`Download ${m.content}`}>{m.content}</button>
                    ) : (
                      <span>{m.content}</span>
                    )}

                    {/* Progress / actions for messages that are pending or failed */}
                    {m.status === 'pending' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                          <div className="h-2 bg-blue-500" style={{ width: `${(uploadQueue.find(q => q.msgId === m._localId)?.progress) || 0}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                          <span>Uploading...</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleCancelMessage(m._localId)} className="text-red-500 px-2 py-1 rounded" aria-label="Cancel upload"><FaStop /></button>
                          </div>
                        </div>
                      </div>
                    )}

                    {m.status === 'failed' && (
                      <div className="mt-2 text-xs text-red-600 flex items-center gap-2">
                        <span>{m.error || 'Upload failed'}</span>
                        <button onClick={() => handleRetryMessage(m._localId)} className="text-blue-600 px-2 py-1 rounded" aria-label="Retry upload"><FaRedo /></button>
                      </div>
                    )}

                    {m.status === 'canceled' && (
                      <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                        <span>Upload canceled</span>
                        <button onClick={() => handleRetryMessage(m._localId)} className="text-blue-600 px-2 py-1 rounded" aria-label="Retry upload"><FaRedo /></button>
                      </div>
                    )}

                    {/* Message status */}
                    <div className="text-xs text-gray-700 mt-2 flex justify-between items-center">
                      <span>{m.sender === 'user' ? 'You' : 'Support'}</span>
                      <span className="flex items-center gap-1">
                        {formatTime(m.timestamp)}
                        {m.status === 'delivered' && <span className="text-gray-400 ml-1">Delivered</span>}
                        {m.status === 'seen' && <FaCheckDouble className="text-blue-500 ml-1" title="Seen" />}
                        {m.status === 'failed' && <span className="text-red-500 ml-1">Failed</span>}
                      </span>
                    </div>
                  </div>
                  {m.sender === 'user' && <img src={AVATAR_USER} alt="User" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ml-2 border-2 border-blue-400 shadow" />}
                </div>
              ))}

              {isTyping && (
                <div className="flex mb-2 justify-start items-center w-full animate-pulse">
                  <img src={AVATAR_SUPPORT} alt="Support" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full mr-2 border-2 border-yellow-400 shadow" />
                  <div className="bg-yellow-100 px-3 py-2 rounded-2xl shadow text-left text-gray-700 w-full">Support is typing<span className="animate-bounce">...</span></div>
                </div>
              )}
              <div ref={chatEndRef} />

              {/* Quick reply suggestions */}
              <div className="flex flex-wrap gap-2 mt-4" role="list">
                {quickReplies.map((q, idx) => (
                  <button key={idx} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full shadow hover:bg-yellow-200" onClick={() => setInput(q)} role="listitem">{q}</button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Input Area (enhanced) */}
        {!sessionExpired && (
          <form className="flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-4 border-t border-yellow-200 bg-white w-full" onSubmit={handleSend} aria-label="Support chat input form">
            <input
              type="text"
              id="support-chat-input"
              name="support-chat-input"
              className="w-full border border-gray-300 rounded-full p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-400 text-xs sm:text-base"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoComplete="on"
              aria-label="Message input"
            />

            <input
              type="file"
              className="hidden"
              id="file-upload"
              name="file-upload"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={e => setFile(e.target.files[0])}
            />
            <label htmlFor="file-upload" className="cursor-pointer bg-gray-200 px-3 py-2 rounded-full hover:bg-gray-300 text-lg sm:text-xl w-full sm:w-auto text-center" aria-label="Attach file">📎</label>

            {file && file.type.startsWith('image/') && (
              <span className="ml-2 flex items-center gap-2">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  style={{ maxWidth: 48, maxHeight: 48, borderRadius: 6, border: '1px solid #ddd' }}
                  onLoad={e => URL.revokeObjectURL(e.target.src)}
                />
                <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full font-semibold truncate w-full sm:max-w-[120px]" title={file.name}>{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="ml-2 text-red-500" aria-label="Remove attachment"><FaTimes /></button>
              </span>
            )}

            {file && !file.type.startsWith('image/') && (
              <span className="ml-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full font-semibold truncate w-full sm:max-w-[120px]" title={file.name}>
                {file.name}
                <button type="button" onClick={() => setFile(null)} className="ml-2 text-red-500" aria-label="Remove attachment"><FaTimes /></button>
              </span>
            )}

            <button type="submit" className="bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-full hover:bg-blue-700 flex items-center gap-2 text-xs sm:text-base w-full sm:w-auto" aria-label="Send message"><FaPaperPlane /> Send</button>
          </form>
        )}
      </div>

      {/* Image modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setImageModal(null)}>
          <div className="bg-white rounded p-4 max-w-4xl w-full" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold">{imageModal.alt}</h3>
              <button className="text-gray-600" onClick={()=>setImageModal(null)} aria-label="Close image viewer"><FaTimes /></button>
            </div>
            <div className="mt-3">
              <img src={imageModal.url} alt={imageModal.alt} className="max-h-[80vh] w-full object-contain" onError={e=>{e.target.onerror=null; e.target.src=FALLBACK_IMG}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
