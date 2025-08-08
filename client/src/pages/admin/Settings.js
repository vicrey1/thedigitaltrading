import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
import { updateAdminProfile, changeAdminPassword, updateAdminNotificationPrefs } from '../../services/adminAuthAPI';

const Settings = () => {
  const { admin, setAdmin } = useAdminAuth();
  const [profile, setProfile] = useState({ name: '', phone: '', country: '' });
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(profile);
  const [profileMsg, setProfileMsg] = useState('');

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: false, push: true });
  const [notifMsg, setNotifMsg] = useState('');

  useEffect(() => {
    if (admin) {
      setProfile({ name: admin.name || '', phone: admin.phone || '', country: admin.country || '' });
      setForm({ name: admin.name || '', phone: admin.phone || '', country: admin.country || '' });
      setNotifPrefs(admin.notificationPrefs || { email: true, sms: false, push: true });
    }
  }, [admin]);

  const handleSaveProfile = async () => {
    setProfileMsg('');
    try {
      const res = await updateAdminProfile(form);
      setProfile(res.admin);
      setAdmin(res.admin);
      setEdit(false);
      setProfileMsg('Profile updated!');
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg('');
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordMsg('All fields are required.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    try {
      await changeAdminPassword(passwords.current, passwords.new);
      setPasswords({ current: '', new: '', confirm: '' });
      setPasswordMsg('Password changed successfully!');
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to change password.');
    }
  };

  const handleSaveNotifPrefs = async () => {
    setNotifMsg('');
    try {
      const res = await updateAdminNotificationPrefs(notifPrefs);
      setNotifPrefs(res.notificationPrefs);
      setNotifMsg('Notification preferences updated!');
    } catch (err) {
      setNotifMsg(err.response?.data?.message || 'Failed to update notification preferences.');
    }
  };

  return (
    <div className="max-w-full sm:max-w-2xl mx-auto p-2 sm:p-6 md:p-8 bg-black bg-opacity-60 rounded-xl shadow-lg text-white overflow-x-auto">
      <h1 className="text-3xl font-bold mb-8 text-gold">Account Settings</h1>
      {/* Profile Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="grid grid-cols-1 gap-4 mb-2">
          <input className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" disabled={!edit} value={edit ? form.name : profile.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" />
          <input className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" disabled={!edit} value={edit ? form.phone : profile.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
          <input className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" disabled={!edit} value={edit ? form.country : profile.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Country" />
        </div>
        <div className="flex gap-2 mt-2">
          {edit ? (
            <>
              <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition" onClick={handleSaveProfile}>Save</button>
              <button className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition" onClick={() => setEdit(false)}>Cancel</button>
            </>
          ) : (
            <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition" onClick={() => setEdit(true)}>Edit</button>
          )}
        </div>
        {profileMsg && <div className="mt-2 text-blue-400">{profileMsg}</div>}
      </div>
      {/* Password Change Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <div className="grid grid-cols-1 gap-4 mb-2">
          <input type="password" className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} placeholder="Current Password" />
          <input type="password" className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} placeholder="New Password" />
          <input type="password" className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Confirm New Password" />
        </div>
        <button className="bg-gold text-black px-4 py-2 rounded-lg hover:bg-yellow-400" onClick={handleChangePassword}>Change Password</button>
        {passwordMsg && <div className="mt-2 text-green-400">{passwordMsg}</div>}
      </div>
      {/* Notification Preferences */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notifPrefs.email} onChange={e => setNotifPrefs(p => ({ ...p, email: e.target.checked }))} /> Email
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notifPrefs.sms} onChange={e => setNotifPrefs(p => ({ ...p, sms: e.target.checked }))} /> SMS
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notifPrefs.push} onChange={e => setNotifPrefs(p => ({ ...p, push: e.target.checked }))} /> Push
          </label>
        </div>
        <button className="bg-gold text-black px-4 py-2 rounded-lg hover:bg-yellow-400" onClick={handleSaveNotifPrefs}>Save Preferences</button>
        {notifMsg && <div className="mt-2 text-green-400">{notifMsg}</div>}
      </div>
    </div>
  );
};

export default Settings;
