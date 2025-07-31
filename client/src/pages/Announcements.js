import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiBell, FiClock, FiInfo } from 'react-icons/fi';
import './Announcements.css';

const Announcements = ({ onNewAnnouncement }) => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // Fetch announcements from backend
    axios.get('/api/admin/announcements').then(res => {
      setAnnouncements(res.data.announcements || []);
      console.log('Fetched announcements array:', res.data.announcements);
      if (onNewAnnouncement && res.data.announcements?.some(a => a.isNew)) {
        onNewAnnouncement(true);
      }
    }).catch(() => {
      setAnnouncements([]);
    });
  }, [onNewAnnouncement]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gold mb-6 flex items-center"><FiBell className="mr-2" /> Announcements</h2>
      <div className="space-y-6">
        {announcements.filter(a => a._id).map((a) => {
          console.log('Announcement HTML:', a.message);
          return (
            <div key={a._id} className={`glassmorphic p-6 rounded-xl ${a.isNew ? 'border-2 border-gold' : ''}`}>
              <div className="flex items-center mb-2">
                <FiInfo className="text-gold mr-2" />
                <span className="font-bold text-lg text-gold">{a.title}</span>
                {a.isNew && <span className="ml-3 px-2 py-1 bg-gold text-black text-xs rounded">NEW</span>}
              </div>
              <div className="text-white mb-2 announcement-message banner" dangerouslySetInnerHTML={{ __html: a.message }} />
              <div className="flex items-center text-gray-400 text-sm">
                <FiClock className="mr-1" />
                {a.date ? (new Date(a.date)).toLocaleString() : ''}
              </div>
            </div>
          );
        })}
        {announcements.filter(a => a._id).length === 0 && <div className="text-center text-gray-400">No announcements yet.</div>}
      </div>
    </div>
  );
};

export default Announcements;
