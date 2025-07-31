import React from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 rounded-xl shadow-xl p-8 max-w-sm w-full text-center border-2 border-red-500">
        <h2 className="text-xl font-bold mb-4 text-red-400">{title}</h2>
        <p className="mb-6 text-gray-200">{message}</p>
        <div className="flex gap-4 justify-center">
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-2 px-6 rounded-lg shadow"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
