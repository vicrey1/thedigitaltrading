import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import { FaCheckDouble, FaArrowLeft } from 'react-icons/fa';
import { getUsers } from '../services/adminAPI';

const AVATAR_ADMIN = 'https://ui-avatars.com/api/?name=Support+Admin&background=FFD700&color=000';
const AVATAR_USER = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SupportAdmin() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userSelected, setUserSelected] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const chatEndRef = useRef(null);
  const lastMessageRef = useRef();
  const chatContainerRef = useRef();

  // Authenticated blob cache for admin to preview protected thumbnails/files
  const [authBlobCache, setAuthBlobCache] = useState({});
  const authBlobCacheRef = useRef({});

  const UPLOADS_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.luxyield.com';

  const fetchProtectedFileAsBlobUrl = async (url, cacheKey) => {
    if (!url) return null;
    if (authBlobCacheRef.current[cacheKey]) return authBlobCacheRef.current[cacheKey];
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch protected file');
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      authBlobCacheRef.current[cacheKey] = objUrl;
      setAuthBlobCache({ ...authBlobCacheRef.current });
      return objUrl;
    } catch (e) {
      console.warn('[SUPPORT_ADMIN] Failed to fetch protected file', e && e.message);
      return null;
    }
  };

  // Prefetch thumbnails for messages when they arrive
  useEffect(() => {
    (async () => {
      const candidates = messages.filter(m => m.attachment);
      for (const m of candidates) {
        try {
          const att = m.attachment;
          let urls = [];
          if (typeof att === 'object') {
            // prefer thumbUrl then url then file
            if (att.thumbUrl) urls.push({ url: att.thumbUrl, key: att.thumbUrl.split('/').pop() });
            if (att.url) urls.push({ url: att.url, key: att.url.split('/').pop() });
            if (att.file) urls.push({ url: `${UPLOADS_BASE_URL}/api/support/file/${att.file}`, key: att.file });
            if (att.thumb) urls.push({ url: `${UPLOADS_BASE_URL}/api/support/file/${att.thumb}`, key: att.thumb });
          } else if (typeof att === 'string') {
            // att could be full url or filename
            const isFull = att.includes('/');
            const url = isFull ? att : `${UPLOADS_BASE_URL}/api/support/file/${att}`;
            urls.push({ url, key: isFull ? att.split('/').pop() : att });
          }

          for (const entry of urls) {
            if (!entry.url) continue;
            // Only fetch protected API paths (server) or presigned URLs as needed
            const key = entry.key;
            if (!authBlobCacheRef.current[key]) {
              // Fire and forget
              fetchProtectedFileAsBlobUrl(entry.url, key).catch(() => {});
            }
          }
        } catch (e) { /* ignore per-item errors */ }
      }
    })();
  }, [messages]);

  // Fetch all users for search/select
  useEffect(() => {
    async function fetchAllUsers() {
      try {
        const users = await getUsers();
        setAllUsers(users);
      } catch (e) {
        setAllUsers([]);
      }
    }
    fetchAllUsers();
  }, []);

  // Track unread messages for each user
  useEffect(() => {
    // Reset unread count for selected user
    setMessages(prev => prev.map(m => {
      if (userSelected && m.userId === userSelected && m.sender === 'user') {
        return { ...m, unread: false };
      }
      return m;
    }));
  }, [userSelected]);

  // Compute unread count for each user
  // Build a quick lookup of authoritative user records fetched from the server
  const allUsersMap = useMemo(() => {
    const map = {};
    allUsers.forEach(u => {
      if (u && (u._id || u.id)) map[u._id || u.id] = u;
    });
    return map;
  }, [allUsers]);

  const userMap = {};
  messages.forEach(m => {
    if (m.sender === 'user') {
      const id = m.userId || 'Unknown User';
      if (!userMap[id]) {
        const lookup = allUsersMap[id];
        userMap[id] = {
          userId: id,
          // Prefer the authoritative name/username from allUsers when available
          name: (lookup && (lookup.name || lookup.fullName)) || m.name || 'Unknown',
          username: (lookup && (lookup.username || lookup.email)) || m.username || id,
          lastMessage: '',
          lastTimestamp: 0,
          unread: 0,
        };
      }
      // Track last message and timestamp
      if (!userMap[id].lastTimestamp || m.timestamp > userMap[id].lastTimestamp) {
        userMap[id].lastMessage = m.content;
        userMap[id].lastTimestamp = m.timestamp;
      }
      // Count unread messages (not seen and not currently selected)
      if ((!m.status || m.status !== 'seen') && userSelected !== id) {
        userMap[id].unread = (userMap[id].unread || 0) + 1;
      }
    }
  });
  const users = Object.values(userMap).sort((a, b) => b.lastTimestamp - a.lastTimestamp);

  // Filter all users for search box (exclude those already in chat list)
  const usersInChat = new Set(users.map(u => u.userId));
  const filteredAllUsers = allUsers
    .filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.username?.toLowerCase().includes(userSearch.toLowerCase()))
    .filter(u => !usersInChat.has(u._id));

  useEffect(() => {
    socket.emit('adminJoin');
    return () => {
      socket.emit('leaveAdmins');
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        // Only add if not already present
        if (prev.some(m => m.timestamp === msg.timestamp && m.content === msg.content && m.sender === msg.sender && m.userId === msg.userId)) {
          return prev;
        }
        // If the message is for a user not currently selected, increment unread
        if (msg.sender === 'user' && msg.userId && msg.userId !== userSelected) {
          // Mark as unread
          return [...prev, { ...msg, unread: true }];
        }
        return [...prev, msg];
      });
    };
    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [userSelected]);

  const fetchSupportMessages = async () => {
    const res = await axios.get('/api/support/messages');
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!input.trim() || !userSelected) return;
    const msg = {
      sender: 'support',
      userId: userSelected,
      content: input,
      type: 'text',
      timestamp: Date.now(),
      attachment: null,
    };
    setMessages((prev) => [...prev, msg]);
    await axios.post('/api/support/message', msg);
    setInput('');
  };

  // Filter messages for the selected user
  const filteredMessages = useMemo(
    () =>
      userSelected
        ? messages.filter(m => (m.userId || 'Unknown User') === userSelected)
        : [],
    [messages, userSelected]
  );

  useEffect(() => {
    fetchSupportMessages();
  }, []);

  useEffect(() => {
    if (userSelected) {
      fetchSupportMessages();
    }
    // eslint-disable-next-line
  }, [userSelected]);

  // Typing indicator: emit and listen
  const typingTimeout = useRef();
  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit('adminTyping', { userId: userSelected });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('adminStopTyping', { userId: userSelected });
    }, 1500);
  };

  // End chat for a user (admin action)
  const handleEndChat = () => {
    if (userSelected) {
      console.log('Admin emitting endSupportSession for user:', userSelected);
      socket.emit('endSupportSession', { userId: userSelected });
      setUserSelected(null);
    }
  };

  // Mark user messages as seen when admin views them
  useEffect(() => {
    if (!userSelected) return;
    // Find the latest user message that is not seen
    const unseen = filteredMessages.filter(m => m.sender === 'user' && m.status !== 'seen');
    if (unseen.length > 0) {
      axios.post('/api/support/message-seen', {
        userId: userSelected,
        sender: 'support',
      });
    }
  }, [filteredMessages, userSelected]);

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
  }, []);

  // If there are message userIds not present in allUsersMap, fetch their profiles individually
  const missingIds = Array.from(new Set(messages.filter(m => m.sender === 'user' && m.userId).map(m => m.userId))).filter(id => !allUsersMap[id]);
  if (missingIds.length > 0) {
    let cancelled = false;
    (async () => {
      for (const id of missingIds) {
        try {
          const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await axios.get(`/api/admin/users/${id}/profile`, { headers });
          if (cancelled) return;
          const profile = res.data;
          // Merge into allUsers if not already present
          setAllUsers(prev => {
            if (prev.some(u => (u._id || u.id) === (profile._id || profile.id))) return prev;
            return [...prev, profile];
          });
        } catch (e) {
          // ignore failures for missing or unauthorized requests
          console.warn('[SUPPORT_ADMIN] Failed to fetch profile for userId', id, e && e.message);
        }
      }
    })();
    return () => { cancelled = true; };
  }

  // Only render chat area if a user is selected
  return (
    <div className="fixed inset-0 z-40 flex bg-white">
      {/* User list sidebar with search/select */}
      <div className="w-72 h-full bg-gray-100 border-r border-gray-300 flex flex-col">
        <div className="flex items-center p-4 font-bold text-lg border-b border-gray-300 text-gray-900" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          <button
            className="mr-3 p-2 rounded-full hover:bg-yellow-200 focus:outline-none"
            onClick={() => window.location.href = '/admin'}
            title="Back to Dashboard"
          >
            <FaArrowLeft className="text-xl text-yellow-600" />
          </button>
          Users
        </div>
        <div className="p-2 border-b border-gray-200">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-full px-3 py-2 text-sm"
            placeholder="Search users by name, email, or username"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
          {userSearch && filteredAllUsers.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded shadow">
              {filteredAllUsers.map(u => (
                <div
                  key={u._id}
                  className="p-2 cursor-pointer hover:bg-yellow-100 flex flex-col"
                  onClick={() => {
                    setUserSelected(u._id);
                    setUserSearch('');
                  }}
                >
                  <span className="font-bold text-gray-900">{u.name || 'User'}</span>
                  <span className="text-xs text-gray-600">@{u.username || u.email}</span>
                  <span className="text-xs text-gray-400">{u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
          {users.length === 0 && <div className="text-gray-400 p-4">No users yet.</div>}
          {users.map(user => (
            <div
              key={user.userId}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-yellow-100 ${userSelected === user.userId ? 'bg-yellow-200 font-bold' : ''}`}
              onClick={() => setUserSelected(user.userId)}
            >
              <img src={AVATAR_USER} alt="User" className="w-8 h-8 rounded-full border-2 border-blue-400" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate font-bold text-gray-900 text-base" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>{user.name !== 'Unknown' ? user.name : 'User'}</span>
                <span className="truncate font-bold text-gray-700 text-xs" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>@{user.username}</span>
                <span className={`truncate text-xs mt-1 ${user.unread > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`} title={user.lastMessage}>{user.lastMessage}</span>
              </div>
              {user.unread > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{user.unread}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Chat area */}
      {userSelected ? (
        <div className="flex-1 h-full flex flex-col">
          {/* Chat header with selected user info */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-100 to-blue-100 border-b border-gray-200">
            <span className="text-3xl text-yellow-500">🛠️</span>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-gray-800">Support Admin Panel</h2>
              <div className="text-sm text-gray-500">View and reply to user messages in real time.</div>
              {userSelected && users.length > 0 && (
                (() => {
                  const user = users.find(u => u.userId === userSelected);
                  if (!user) return null;
                  return (
                    <>
                      <div className="mt-2 flex items-center gap-2">
                        <img src={AVATAR_USER} alt="User" className="w-7 h-7 rounded-full border-2 border-blue-400" />
                        <span className="font-bold text-gray-900 text-base" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>{user.name !== 'Unknown' ? user.name : 'User'}</span>
                        <span className="font-bold text-gray-700 text-xs ml-2" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>@{user.username}</span>
                      </div>
                    </>
                  );
                })()
              )}
            </div>
            {userSelected && (
              <>
                <button
                  onClick={() => setUserSelected(null)}
                  className="ml-auto bg-red-100 text-red-700 px-4 py-1 rounded-full font-bold hover:bg-red-200 border border-red-300 transition"
                  style={{ marginLeft: 'auto' }}
                >
                  Close Chat
                </button>
                <button
                  onClick={handleEndChat}
                  className="ml-2 bg-gray-200 text-gray-800 px-4 py-1 rounded-full font-bold hover:bg-gray-300 border border-gray-400 transition"
                >
                  End Chat
                </button>
              </>
            )}
          </div>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 bg-white scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60"
            style={{ minHeight: 0 }}
          >
            {(!userSelected || filteredMessages.length === 0) && (
              <div className="text-center text-gray-400 my-8">{!userSelected ? 'Select a user to view messages.' : 'No messages yet.'}</div>
            )}
            {filteredMessages.map((m, i) => (
              <div
                key={i}
                ref={i === filteredMessages.length - 1 ? lastMessageRef : null}
                className={`flex mb-3 ${m.sender === 'support' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'support' && <img src={AVATAR_ADMIN} alt="Support" className="w-9 h-9 rounded-full ml-2 border-2 border-yellow-400" />}
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${m.sender === 'support' ? 'bg-yellow-200 text-gray-900 rounded-br-none font-semibold' : 'bg-blue-100 text-blue-900 rounded-bl-none font-semibold'} shadow-md relative`}>
                  {(() => {
                    // Support attachment as object (file/thumb/url/thumbUrl) or legacy string URL
                    if (m.type === 'file' && m.attachment) {
                      const att = m.attachment;
                      // If attachment is object and contains image types
                      if (typeof att === 'object') {
                        const isImage = (att.file && att.file.match && att.file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) || (att.url && att.url.match && att.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) || (att.thumbUrl || att.thumb);
                        if (isImage) {
                          const src = (
                            // prefer cached blob for thumb
                            (att.file && authBlobCache[att.file + '_thumb']) ||
                            (att.thumb && authBlobCache[att.thumb + '_thumb']) ||
                            att.thumbUrl ||
                            att.url ||
                            (att.file ? `${UPLOADS_BASE_URL}/api/support/file/${att.file}` : null)
                          );
                          return <img src={src || ''} alt={m.content} className="max-w-[200px] max-h-[200px] rounded mb-2 border" />;
                        }
                        // Non-image file: render download link (use url if available or api endpoint)
                        const href = att.url || (att.file ? `${UPLOADS_BASE_URL}/api/support/file/${att.file}` : '#');
                        return <a href={href} download={m.content} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">{m.content}</a>;
                      }
                      // Legacy string attachment: treat as URL or filename
                      if (typeof m.attachment === 'string') {
                        const isImg = m.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        if (isImg) return <img src={m.attachment} alt={m.content} className="max-w-[200px] max-h-[200px] rounded mb-2 border" />;
                        return <a href={m.attachment} download={m.content} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">{m.content}</a>;
                      }
                    }
                    return <span>{m.content}</span>;
                  })()}
                  <div className="text-xs text-gray-700 mt-1 flex justify-between items-center">
                    <span>{m.sender === 'user' ? 'User' : 'Support'}</span>
                    <span className="flex items-center gap-1">
                      {formatTime(m.timestamp)}
                      {/* Double tick: grey for sent, blue for seen (admin side) */}
                      {m.sender === 'support' && (
                        <FaCheckDouble className={m.status === 'seen' ? 'text-blue-500 ml-1' : 'text-gray-400 ml-1'} title={m.status === 'seen' ? 'Seen' : 'Sent'} />
                      )}
                    </span>
                  </div>
                </div>
                {m.sender === 'user' && <img src={AVATAR_USER} alt="User" className="w-9 h-9 rounded-full mr-2 border-2 border-blue-400" />}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="flex items-center gap-2 p-4 border-t border-gray-200 bg-white" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black placeholder-gray-400"
              placeholder={userSelected ? 'Type your reply...' : 'Select a user to reply'}
              value={input}
              onChange={handleInputChange}
              disabled={!userSelected}
            />
            <button type="submit" className="bg-yellow-400 text-gray-900 px-5 py-2 rounded-full hover:bg-yellow-500 font-bold" disabled={!userSelected}>Send</button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
          Select a user to view messages.
        </div>
      )}
    </div>
  );
}
