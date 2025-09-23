import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import './SupportChat.css';

const SupportChat = () => {
  const { user } = useUser();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'account', label: 'Account Issues' },
    { value: 'investment', label: 'Investment Questions' },
    { value: 'security', label: 'Security Concerns' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#fd7e14' },
    { value: 'urgent', label: 'Urgent', color: '#dc3545' }
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket._id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/support/tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
        
        // Auto-select first ticket if none selected
        if (data.tickets.length > 0 && !selectedTicket) {
          setSelectedTicket(data.tickets[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    }
  };

  const fetchMessages = async (ticketId) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTicket)
      });

      if (response.ok) {
        const data = await response.json();
        setTickets([data.ticket, ...tickets]);
        setSelectedTicket(data.ticket);
        setNewTicket({ subject: '', description: '', category: 'general', priority: 'medium' });
        setShowNewTicketForm(false);
        toast.success('Support ticket created successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('messageType', 'text');

      // Add attachments
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });

      const response = await fetch(`/api/support/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage('');
        setAttachments([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': '#007bff',
      'in_progress': '#ffc107',
      'waiting_for_customer': '#17a2b8',
      'resolved': '#28a745',
      'closed': '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="support-chat">
      <div className="support-header">
        <h2>Support Center</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewTicketForm(true)}
        >
          New Ticket
        </button>
      </div>

      <div className="support-content">
        {/* Tickets Sidebar */}
        <div className="tickets-sidebar">
          <h3>Your Tickets</h3>
          <div className="tickets-list">
            {tickets.length === 0 ? (
              <div className="no-tickets">
                <p>No support tickets yet</p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setShowNewTicketForm(true)}
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket._id}
                  className={`ticket-item ${selectedTicket?._id === ticket._id ? 'active' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="ticket-header">
                    <span className="ticket-id">#{ticket.ticketId}</span>
                    <span 
                      className="ticket-status"
                      style={{ backgroundColor: getStatusColor(ticket.status) }}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="ticket-subject">{ticket.subject}</h4>
                  <div className="ticket-meta">
                    <span className="ticket-category">{ticket.category}</span>
                    <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="ticket-header-detail">
                <div className="ticket-info">
                  <h3>#{selectedTicket.ticketId} - {selectedTicket.subject}</h3>
                  <div className="ticket-meta-detail">
                    <span className="category">{selectedTicket.category}</span>
                    <span 
                      className="priority"
                      style={{ color: priorities.find(p => p.value === selectedTicket.priority)?.color }}
                    >
                      {selectedTicket.priority} priority
                    </span>
                    <span 
                      className="status"
                      style={{ color: getStatusColor(selectedTicket.status) }}
                    >
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messages.map(message => (
                  <div 
                    key={message._id}
                    className={`message ${message.senderType === 'user' ? 'user-message' : 'agent-message'}`}
                  >
                    <div className="message-header">
                      <span className="sender">
                        {message.senderType === 'user' ? 'You' : 'Support Agent'}
                      </span>
                      <span className="timestamp">{formatDate(message.createdAt)}</span>
                    </div>
                    <div className="message-content">
                      {message.content}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments">
                          {message.attachments.map(attachment => (
                            <div key={attachment._id} className="attachment">
                              <a 
                                href={`/api/support/attachments/${attachment._id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-link"
                              >
                                📎 {attachment.originalName} ({formatFileSize(attachment.size)})
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedTicket.status !== 'closed' && (
                <form onSubmit={sendMessage} className="message-form">
                  {attachments.length > 0 && (
                    <div className="attachments-preview">
                      {attachments.map((file, index) => (
                        <div key={index} className="attachment-preview">
                          <span>{file.name} ({formatFileSize(file.size)})</span>
                          <button 
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="remove-attachment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="message-input-container">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="message-input"
                      rows="3"
                    />
                    <div className="message-actions">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        className="file-input"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-outline-secondary"
                      >
                        📎
                      </button>
                      <button 
                        type="submit"
                        disabled={loading || (!newMessage.trim() && attachments.length === 0)}
                        className="btn btn-primary"
                      >
                        {loading ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="no-ticket-selected">
              <h3>Select a ticket to view conversation</h3>
              <p>Choose a ticket from the sidebar to start chatting with our support team.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Support Ticket</h3>
              <button 
                className="close-btn"
                onClick={() => setShowNewTicketForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={createTicket} className="modal-body">
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  required
                  placeholder="Brief description of your issue"
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                  required
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  required
                  rows="4"
                  placeholder="Please provide detailed information about your issue"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChat;