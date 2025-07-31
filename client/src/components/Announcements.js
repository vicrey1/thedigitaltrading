import React from 'react';

const Announcements = () => (
  <div className="glassmorphic p-8 rounded-xl text-center">
    <h2 className="text-2xl font-bold text-gold mb-4">Announcements</h2>
    <ul className="text-left mx-auto max-w-xl text-white list-disc pl-6">
      <li>Platform update: New funds and features added!</li>
      <li>Quarterly report PDF now available for all users.</li>
      <li>Security tip: Enable 2FA for enhanced protection.</li>
    </ul>
  </div>
);

export default Announcements;
