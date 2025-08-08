import React, { useState } from 'react';
import { sendAdminEmail } from '../../services/adminAPI';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminSendEmail = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Welcome Email');
  const [richMessage, setRichMessage] = useState('');

  const templates = [
    {
      label: 'Welcome Email',
      subject: 'Welcome to LUXYIELD!',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <div style="font-family:sans-serif; font-size:2.5rem; font-weight:bold; letter-spacing:2px; margin-bottom:24px;">
          <span style="color:#FFD700;">LUX</span><span style="color:#fff;">HEDGE</span>
        </div>
        <h2 style="color:#FFD700;">Welcome to LUXYIELD!</h2>
        <p>We’re excited to have you on board. Explore investment opportunities and grow your wealth with us!</p>
      </div>`
    },
    {
      label: 'KYC Approved',
      subject: 'Your KYC is Approved!',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <div style="font-family:sans-serif; font-size:2.5rem; font-weight:bold; letter-spacing:2px; margin-bottom:24px;">
          <span style="color:#FFD700;">LUX</span><span style="color:#fff;">HEDGE</span>
        </div>
        <h2 style="color:#FFD700;">KYC Approved</h2>
        <p>Your KYC verification is complete. You now have full access to all features!</p>
      </div>`
    },
    {
      label: 'Custom',
      subject: '',
      html: ''
    }
  ];

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    let finalHtml = html;
    if (selectedTemplate === 'Custom' && richMessage) {
      finalHtml = `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <div style="font-family:sans-serif; font-size:2.5rem; font-weight:bold; letter-spacing:2px; margin-bottom:24px;">
          <span style="color:#FFD700;">LUX</span><span style="color:#fff;">HEDGE</span>
        </div>
        <div style="font-size:1.1rem; color:#fff; margin:24px 0;">${richMessage}</div>
      </div>`;
    }
    try {
      await sendAdminEmail({ to, subject, html: finalHtml });
      setMessage('✅ Email sent successfully!');
      setTo(''); setSubject(''); setHtml(''); setRichMessage('');
    } catch (err) {
      setMessage('❌ Failed to send email: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const template = templates.find(t => t.label === e.target.value);
    setSelectedTemplate(template.label);
    setSubject(template.subject);
    setHtml(template.html);
  };

  return (
    <div className="glassmorphic p-2 sm:p-6 md:p-8 rounded-xl max-w-full sm:max-w-lg mx-auto mt-4 sm:mt-12 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Send Email to User</h2>
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block mb-1">To (User Email)</label>
          <input type="email" className="w-full p-2 rounded bg-dark border border-gray-700" value={to} onChange={e => setTo(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Subject</label>
          <input type="text" className="w-full p-2 rounded bg-dark border border-gray-700" value={subject} onChange={e => setSubject(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Template</label>
          <select className="w-full p-2 rounded bg-dark border border-gray-700" value={selectedTemplate} onChange={handleTemplateChange}>
            {templates.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </select>
        </div>
        {selectedTemplate === 'Custom' && (
          <div>
            <label className="block mb-1">Rich Message</label>
            <ReactQuill theme="snow" value={richMessage} onChange={setRichMessage} className="bg-dark text-white" />
          </div>
        )}
        {selectedTemplate !== 'Custom' && (
          <div>
            <label className="block mb-1">HTML Message</label>
            <textarea className="w-full p-2 rounded bg-dark border border-gray-700 min-h-[120px]" value={html} onChange={e => setHtml(e.target.value)} required />
          </div>
        )}
        <button type="submit" className="w-full py-3 rounded-lg font-bold bg-gold text-black hover:bg-yellow-600 transition" disabled={loading}>
          {loading ? 'Sending...' : 'Send Email'}
        </button>
        {message && <div className="text-center mt-2">{message}</div>}
      </form>
    </div>
  );
};

export default AdminSendEmail;
