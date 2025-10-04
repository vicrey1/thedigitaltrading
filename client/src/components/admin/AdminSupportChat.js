import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
import { toast } from 'react-toastify';
import './AdminSupportChat.css';

const AdminSupportChat = () => {
  useAdminAuth();
  const socket = useSocket();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedAgent: 'all'
  });
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_for_customer', label: 'Waiting for Customer' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#fd7e14' },
    { value: 'urgent', label: 'Urgent', color: '#dc3545' }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'account', label: 'Account Issues' },
    { value: 'investment', label: 'Investment Questions' },
    { value: 'security', label: 'Security Concerns' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' }
  ];

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (selectedTicket && msg.ticketId === selectedTicket._id) {
        setMessages((prev) => [...prev, msg]);
      }
      // Update ticket preview if exists
      setTickets(prev => prev.map(ticket => {
        if (ticket._id === msg.ticketId) {
          return { ...ticket, lastMessage: msg.content, updatedAt: new Date() };
        }
        return ticket;
      }));
    };

    const handleStatusChange = ({ ticketId, status }) => {
      setTickets(prev => prev.map(ticket => {
        if (ticket._id === ticketId) {
          return { ...ticket, status };
        }
        return ticket;
      }));
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status }));
      }
    };

    const handleNewTicket = (ticket) => {
      setTickets(prev => [ticket, ...prev]);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('ticketStatusChange', handleStatusChange);
    socket.on('newTicket', handleNewTicket);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('ticketStatusChange', handleStatusChange);
      socket.off('newTicket', handleNewTicket);
    };
  }, [socket, selectedTicket]);

  // fetchMessages and fetchTickets are called from the initial effect below
  // fetchMessages will be defined below; effect moved after its declaration to avoid use-before-define warnings

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const { getStoredAdminToken } = require('../../utils/authToken');
      const adminToken = getStoredAdminToken();
      const response = await fetch('/api/admin/support/analytics', {
        headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const { getStoredAdminToken } = require('../../utils/authToken');
      const adminToken2 = getStoredAdminToken();
      const response = await fetch('/api/admin/support/agents', {
        headers: adminToken2 ? { 'Authorization': `Bearer ${adminToken2}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all') {
          queryParams.append(key, value);
        }
      });

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const { getStoredAdminToken } = require('../../utils/authToken');
      const adminToken3 = getStoredAdminToken();
      const response = await fetch(`/api/admin/support/tickets?${queryParams}`, {
        headers: adminToken3 ? { 'Authorization': `Bearer ${adminToken3}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    }
  }, [filters, searchTerm]);
  

  const fetchMessages = useCallback(async (ticketId) => {
    try {
      const { getStoredAdminToken } = require('../../utils/authToken');
      const adminToken4 = getStoredAdminToken();
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        headers: adminToken4 ? { 'Authorization': `Bearer ${adminToken4}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, []);

  // Call fetchMessages when a ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket._id || selectedTicket);
    }
  }, [selectedTicket, fetchMessages]);

  // Run initial fetches after helpers are defined
  useEffect(() => {
    fetchAnalytics();
    fetchAgents();
    fetchTickets();

    // mobile detection
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [fetchAnalytics, fetchAgents, fetchTickets]);

  const assignTicket = async (ticketId, agentId) => {
    try {
      const { getStoredAdminToken } = require('../../utils/authToken');
      const adminToken5 = getStoredAdminToken();
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken5 ? { 'Authorization': `Bearer ${adminToken5}` } : {})
        },
        body: JSON.stringify({ agentId })
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(tickets.map(t => t._id === ticketId ? data.ticket : t));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        toast.success('Ticket assigned successfully');
       } else {
         const error = await response.json();
         toast.error(error.message || 'Failed to assign ticket');
       }
     } catch (error) {
       console.error('Error assigning ticket:', error);
       toast.error('Failed to assign ticket');
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const { getStoredAdminToken } = require('../../utils/authToken');
      const adminToken6 = getStoredAdminToken();
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken6 ? { 'Authorization': `Bearer ${adminToken6}` } : {})
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(tickets.map(t => t._id === ticketId ? data.ticket : t));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        toast.success('Ticket status updated successfully');
       } else {
         const error = await response.json();
         toast.error(error.message || 'Failed to update status');
       }
     } catch (error) {
       console.error('Error updating status:', error);
       toast.error('Failed to update status');
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

      const { getStoredAdminToken } = require('../../utils/authToken');
      const adminToken7 = getStoredAdminToken();
      const response = await fetch(`/api/admin/support/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: adminToken7 ? { 'Authorization': `Bearer ${adminToken7}` } : {},
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

  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#28a745',
      'medium': '#ffc107',
      'high': '#fd7e14',
      'urgent': '#dc3545'
    };
    return colors[priority] || '#6c757d';
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
    <div className="admin-support-chat">
      {/* Header with Analytics */}
      <div className="admin-support-header">
        <div className="flex items-center justify-between">
          <h2>Support Management</h2>
          {isMobile && (
            <button onClick={() => setShowSidebar(prev => !prev)} className="px-3 py-2 rounded bg-gray-100">{showSidebar ? 'Hide' : 'Show'} tickets</button>
          )}
        </div>
        <div className="analytics-cards">
          <div className="analytics-card">
            <div className="card-value">{analytics.totalTickets || 0}</div>
            <div className="card-label">Total Tickets</div>
          </div>
          <div className="analytics-card">
            <div className="card-value">{analytics.openTickets || 0}</div>
            <div className="card-label">Open Tickets</div>
          </div>
          <div className="analytics-card">
            <div className="card-value">{analytics.avgResponseTime || '0h'}</div>
            <div className="card-label">Avg Response</div>
          </div>
          <div className="analytics-card">
            <div className="card-value">{analytics.satisfactionRating || '0.0'}</div>
            <div className="card-label">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
          >
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
          <select
            value={filters.assignedAgent}
            onChange={(e) => setFilters({...filters, assignedAgent: e.target.value})}
          >
            <option value="all">All Agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map(agent => (
              <option key={agent._id} value={agent._id}>
                {agent.userId?.firstName} {agent.userId?.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-support-content">
        {/* Tickets List */}
        {showSidebar && (
          <div className={`admin-tickets-sidebar ${isMobile ? 'mobile-overlay' : ''}`} style={isMobile ? { position: 'fixed', top: 0, left: 0, zIndex: 60, height: '100vh', overflow: 'auto' } : {}}>
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1rem', borderBottom: '1px solid #e9ecef', background: '#fff' }}>
                <button onClick={() => setShowSidebar(false)} aria-label="Close tickets" className="p-2 rounded bg-gray-100">Close</button>
              </div>
            )}
          <div className="tickets-count">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </div>
          <div className="admin-tickets-list">
            {tickets.length === 0 ? (
              <div className="no-tickets">
                <p>No tickets found</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket._id}
                  className={`admin-ticket-item ${selectedTicket?._id === ticket._id ? 'active' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="admin-ticket-header">
                    <span className="ticket-id">#{ticket.ticketId}</span>
                    <div className="ticket-badges">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                      >
                        {ticket.priority}
                      </span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <h4 className="admin-ticket-subject">{ticket.subject}</h4>
                  <div className="admin-ticket-meta">
                    <div className="ticket-user">
                      {ticket.userId?.firstName} {ticket.userId?.lastName}
                    </div>
                    <div className="ticket-category">{ticket.category}</div>
                    <div className="ticket-date">{formatDate(ticket.createdAt)}</div>
                    {ticket.assignedAgent && (
                      <div className="assigned-agent">
                        Assigned to: {ticket.assignedAgent.firstName} {ticket.assignedAgent.lastName}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="admin-chat-area">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="admin-ticket-header-detail">
                <div className="ticket-info">
                  <h3>#{selectedTicket.ticketId} - {selectedTicket.subject}</h3>
                  <div className="ticket-user-info">
                    <strong>Customer:</strong> {selectedTicket.userId?.firstName} {selectedTicket.userId?.lastName} 
                    ({selectedTicket.userId?.email})
                  </div>
                  <div className="ticket-description">
                    {selectedTicket.description}
                  </div>
                </div>
                <div className="ticket-actions">
                  <div className="action-group">
                    <label>Status:</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicketStatus(selectedTicket._id, e.target.value)}
                    >
                      {statuses.slice(1).map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="action-group">
                    <label>Assign to:</label>
                    <select
                      value={selectedTicket.assignedAgent?._id || ''}
                      onChange={(e) => assignTicket(selectedTicket._id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {agents.map(agent => (
                        <option key={agent._id} value={agent._id}>
                          {agent.userId?.firstName} {agent.userId?.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="admin-messages-container">
                {messages.map(message => (
                  <div 
                    key={message._id}
                    className={`admin-message ${message.senderType === 'user' ? 'customer-message' : 'agent-message'}`}
                  >
                    <div className="admin-message-header">
                      <span className="sender">
                        {message.senderType === 'user' 
                          ? `${selectedTicket.userId?.firstName} ${selectedTicket.userId?.lastName}` 
                          : `${message.senderId?.firstName} ${message.senderId?.lastName} (Agent)`
                        }
                      </span>
                      <span className="timestamp">{formatDate(message.createdAt)}</span>
                    </div>
                    <div className="admin-message-content">
                      {message.content}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="admin-message-attachments">
                          {message.attachments.map(attachment => (
                            <div key={attachment._id} className="admin-attachment">
                              <a 
                                href={`/api/support/attachments/${attachment._id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-attachment-link"
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
                <form onSubmit={sendMessage} className="admin-message-form">
                  {attachments.length > 0 && (
                    <div className="admin-attachments-preview">
                      {attachments.map((file, index) => (
                        <div key={index} className="admin-attachment-preview">
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
                  <div className="admin-message-input-container">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your response..."
                      className="admin-message-input"
                      rows="3"
                    />
                    <div className="admin-message-actions">
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
                        {loading ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="no-ticket-selected">
              <h3>Select a ticket to view details</h3>
              <p>Choose a ticket from the list to start managing the conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportChat;