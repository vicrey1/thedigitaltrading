import React, { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
// You must have a socket context or hook that provides the socket instance
import { useSocket } from '../hooks/useSocket';

export default function NotificationProvider({ children }) {
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      // Only show notification if not on support chat page
      if (!location.pathname.includes('/dashboard/support')) {
        toast.info(
          <div>
            <strong>{data.title}</strong>
            <div>{data.message}</div>
            <button
              style={{ marginTop: 8, color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                navigate('/dashboard/support');
                toast.dismiss();
              }}
            >
              Open Chat
            </button>
          </div>,
          {
            position: 'top-right',
            autoClose: 10000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            hideProgressBar: false,
          }
        );
      }
    };
    socket.on('supportNotification', handler);
    return () => socket.off('supportNotification', handler);
  }, [socket, location, navigate]);

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
