import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiTrash2, FiInfo, FiClock } from 'react-icons/fi';
import '../Announcements.css';

const AdminAnnouncements = () => {
  console.log('AdminAnnouncements rendered');
  const [title, setTitle] = useState('');
  const [richMessage, setRichMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const quillRef = useRef();

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get('/api/admin/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched announcements:', res.data.announcements);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('/api/admin/announcements', { title, message: richMessage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Announcement posted!');
      setTitle('');
      setRichMessage('');
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  // Delete announcement
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setDeletingId(id);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/admin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAnnouncements(); // Always re-fetch after delete
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete announcement');
    } finally {
      setDeletingId(null);
    }
  };

  // Add a custom toolbar with image button
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const handleExternalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('adminToken');
      console.log('adminToken for image upload:', token);
      try {
        const res = await axios.post('/api/upload-announcement-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        if (!res.data.url) throw new Error('No image URL returned');
        const imageUrl = res.data.url.startsWith('http')
          ? res.data.url
          : `${window.location.origin.replace(':3000', ':5001')}${res.data.url}`;
        if (!quillRef.current) return;
        const quill = quillRef.current.getEditor();
        quill.focus();
        setTimeout(() => {
          let range = quill.getSelection();
          if (!range) {
            range = { index: quill.getLength() - 1 };
          }
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1, 0);
        }, 0);
        e.target.value = '';
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Image upload failed');
      }
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-full sm:max-w-3xl mx-auto overflow-x-auto">
      <h2 className="text-3xl font-bold text-gold mb-6 text-center">Admin Announcements</h2>
      {/* Post form */}
      <div className="glassmorphic p-2 sm:p-6 md:p-8 rounded-xl mb-6 sm:mb-10 overflow-x-auto">
        <h3 className="text-2xl font-bold mb-6 text-center">Post Announcement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Title</label>
            <input type="text" className="w-full p-2 rounded bg-dark border border-gray-700" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1">Message</label>
            <ReactQuill 
              theme="snow" 
              value={richMessage} 
              onChange={setRichMessage} 
              className="bg-dark text-white" 
              modules={quillModules}
              ref={quillRef}
            />
            <label className="block mt-2">Insert Image:</label>
            <input type="file" accept="image/*" onChange={handleExternalImageUpload} className="mt-1" onClick={e => e.stopPropagation()} />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg font-bold bg-gold text-black hover:bg-yellow-600 transition" disabled={loading}>
            {loading ? 'Posting...' : 'Post Announcement'}
          </button>
          {success && <div className="text-green-400 text-center mt-2">{success}</div>}
          {error && <div className="text-red-400 text-center mt-2">{error}</div>}
        </form>
      </div>
      {/* Announcements list */}
      <div className="space-y-4 sm:space-y-6">
        {announcements.filter(a => a._id).map((a) => (
          <div key={a._id} className="glassmorphic p-2 sm:p-4 md:p-6 rounded-xl relative overflow-x-auto">
            <div className="flex items-center mb-2">
              <FiInfo className="text-gold mr-2" />
              <span className="font-bold text-lg text-gold">{a.title}</span>
              {a._id && (
                <button
                  className="ml-auto text-red-400 hover:text-red-600"
                  title="Delete announcement"
                  onClick={() => handleDelete(a._id)}
                  disabled={deletingId === a._id}
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
            <div className="text-white mb-2 announcement-message" dangerouslySetInnerHTML={{ __html: a.message }} />
            <div className="flex items-center text-gray-400 text-sm">
              <FiClock className="mr-1" />
              {a.date ? (new Date(a.date)).toLocaleString() : ''}
            </div>
          </div>
        ))}
        {announcements.filter(a => a._id).length === 0 && <div className="text-center text-gray-400">No announcements yet.</div>}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
