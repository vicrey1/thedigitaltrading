import React from 'react';

const MobileAppPreview = () => (
  <div className="glassmorphic p-8 rounded-xl text-center">
    <h2 className="text-2xl font-bold text-gold mb-4">Mobile App Preview</h2>
    <p className="text-white mb-4">Experience LUXHEDGE on the go. Our luxury mobile app is coming soon for iOS and Android.</p>
    <div className="flex justify-center gap-4">
      <div className="bg-black bg-opacity-40 rounded-lg p-4">
        <img src="/app-preview-ios.png" alt="iOS Preview" className="h-48 mx-auto mb-2 rounded-lg shadow-lg" />
        <div className="text-gold">iOS Preview</div>
      </div>
      <div className="bg-black bg-opacity-40 rounded-lg p-4">
        <img src="/app-preview-android.png" alt="Android Preview" className="h-48 mx-auto mb-2 rounded-lg shadow-lg" />
        <div className="text-gold">Android Preview</div>
      </div>
    </div>
    <div className="mt-6 text-gray-400">Download links coming soon.</div>
  </div>
);

export default MobileAppPreview;
