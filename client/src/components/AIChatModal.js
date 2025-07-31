import React, { useState } from 'react';

const AIChatModal = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(msgs => [...msgs, { from: 'ai', text: data.reply }]);
      } else {
        setError('No response from AI.');
      }
    } catch (e) {
      setError('Failed to contact AI.');
    }
    setInput('');
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-lg font-semibold mb-2">Ask LuxHedge AI</h2>
        <div className="h-64 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
          {messages.length === 0 && <div className="text-gray-400 text-center">Start a conversation with LuxHedge AI.</div>}
          {messages.map((msg, i) => (
            <div key={i} className={`mb-2 flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{msg.text}</div>
            </div>
          ))}
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your question..."
            disabled={loading}
          />
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
