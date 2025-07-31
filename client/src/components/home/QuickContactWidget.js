import React, { useState } from 'react';

export default function QuickContactWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2000);
    setForm({ name: '', email: '', message: '' });
  };
  return (
    <div className="fixed bottom-8 left-8 z-50">
      <button onClick={() => setOpen(o => !o)} className="bg-gold text-black rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg focus:outline-none border-2 border-gold/40">
        <span role="img" aria-label="contact">📞</span>
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-2 bg-black bg-opacity-95 border border-gold/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-3 min-w-[260px]">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Your Name" className="px-3 py-2 rounded bg-gray-900 text-white border border-gold/10 focus:outline-none" required />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Your Email" type="email" className="px-3 py-2 rounded bg-gray-900 text-white border border-gold/10 focus:outline-none" required />
          <textarea name="message" value={form.message} onChange={handleChange} placeholder="Message" className="px-3 py-2 rounded bg-gray-900 text-white border border-gold/10 focus:outline-none" required />
          <button type="submit" className="bg-gold text-black font-bold rounded-lg px-4 py-2 mt-2 hover:bg-yellow-400 transition">{sent ? 'Sent!' : 'Send'}</button>
        </form>
      )}
    </div>
  );
}
