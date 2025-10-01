import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
import { toast } from 'react-toastify';
import { AiOutlinePaperClip, AiOutlineSend } from 'react-icons/ai';
import { BsCheckAll, BsCheck } from 'react-icons/bs';
import './AdminSupportChat.css';

const AdminSupportChat = () => {
  const { admin } = useAdminAuth();
  const socket = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('message', (message) => {
      if (selectedChat?._id === message.chatId) {
        setMessages(prev => [...prev, message]);
        socket.emit('admin:markMessagesRead', { chatId: selectedChat._id });
      }
      setChats(prev => prev.map(chat => {
        if (chat._id === message.chatId) {
          return {
            ...chat,
            lastMessage: message,
            unreadCount: selectedChat?._id === message.chatId ? 0 : (chat.unreadCount || 0) + 1
          };
        }
        return chat;
      }));
    });

    socket.on('typing', ({ chatId, userId }) => {
      setTypingUsers(prev => new Set(prev).add(userId));
    });

    socket.on('stopTyping', ({ chatId, userId }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socket.on('userOnline', (userId) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    });

    socket.on('userOffline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.off('message');
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, [socket, selectedChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (socket && admin) {
      socket.emit('joinAdminChat');
      fetchChats();
    }
  }, [socket, admin, fetchChats]);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chat/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    }
  }, []);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId) => {
    try {
      const response = await fetch(`/api/admin/chat/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        // Mark messages as read
        socket.emit('admin:markMessagesRead', { chatId });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, [socket]);

  // Chat selection
  const handleChatSelect = useCallback((chat) => {
    setSelectedChat(chat);
    if (isMobile) {
      setShowSidebar(false);
    }
    fetchMessages(chat._id);
  }, [isMobile, fetchMessages]);

  // Message input handlers
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (selectedChat) {
      socket.emit('admin:typing', { chatId: selectedChat._id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('admin:stopTyping', { chatId: selectedChat._id });
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('You can only upload up to 5 files at once');
      return;
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Total file size must be less than 10MB');
      return;
    }

    setAttachments(files);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSendMessage = async () => {
    if (!selectedChat || (!newMessage.trim() && !attachments.length)) {
      return;
    }

    setLoading(true);

    try {
      // Handle file uploads first
      let uploadedFiles = [];
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach(file => {
          formData.append('files', file);
        });

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          body: formData
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          uploadedFiles = data.files;
        }
      }

      // Send message with any attachments
      socket.emit('admin:message', {
        chatId: selectedChat._id,
        content: newMessage.trim(),
        attachments: uploadedFiles
      });

      setNewMessage('');
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-support-container">
      {/* Users sidebar */}
      <div className={`users-sidebar ${!showSidebar ? 'hidden' : ''}`}>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="users-list">
          {chats.filter(chat =>
            chat.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chat.user.email.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(chat => (
            <div
              key={chat._id}
              className={`user-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="user-info">
                <div className={`status-indicator ${onlineUsers.has(chat.user._id) ? 'online' : 'offline'}`} />
                <div className="user-details">
                  <div className="user-name">{chat.user.name}</div>
                  <div className="user-email">{chat.user.email}</div>
                  <div className="last-message">
                    {typingUsers.has(chat.user._id) ? (
                      <span className="typing">typing...</span>
                    ) : (
                      chat.lastMessage?.content
                    )}
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="unread-count">{chat.unreadCount}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="selected-user-info">
                <h2>{selectedChat.user.name}</h2>
                <span className={`status ${onlineUsers.has(selectedChat.user._id) ? 'online' : 'offline'}`}>
                  {onlineUsers.has(selectedChat.user._id) ? 'Online' : 'Offline'}
                </span>
              </div>
              <button 
                onClick={() => {
                  fetch(`/api/admin/chat/${selectedChat._id}/end`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                  });
                  setSelectedChat(null);
                  setChats(chats.filter(c => c._id !== selectedChat._id));
                }} 
                className="end-chat-button"
              >
                End Chat
              </button>
            </div>

            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.senderType === 'Admin' ? 'admin-message' : 'user-message'}`}
                >
                  <div className="message-content">
                    {message.content}
                    {message.attachments?.length > 0 && (
                      <div className="attachments">
                        {message.attachments.map((attachment, i) => (
                          <div key={i} className="attachment">
                            <a
                              href={`/api/admin/chat/attachments/${attachment.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="attachment-link"
                            >
                              <AiOutlinePaperClip />
                              {attachment.originalName} ({formatFileSize(attachment.size)})
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.senderType === 'Admin' && (
                    <div className="message-status">
                      {message.seen ? <BsCheckAll /> : <BsCheck />}
                    </div>
                  )}
                </div>
              ))}
              {typingUsers.has(selectedChat.user._id) && (
                <div className="typing-indicator">
                  typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
              <button
                className="attachment-btn"
                onClick={() => fileInputRef.current.click()}
              >
                <AiOutlinePaperClip size={20} />
              </button>
              <input
                type="file"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
              />
              <div className="message-input-wrapper">
                <textarea
                  className="message-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                />
              </div>
              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={loading || (!newMessage.trim() && !attachments.length)}
              >
                <AiOutlineSend size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a user to start chatting</h3>
            <p>Choose a user from the list to view and respond to their messages.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportChat;