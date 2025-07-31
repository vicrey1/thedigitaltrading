import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function EventDetailPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/events/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Event not found.');
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (error) return <div className="text-red-400 p-8">{error}</div>;
  if (!event) return null;

  return (
    <div className="max-w-3xl mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-4 text-gold">{event.title}</h1>
      <div className="mb-2 text-lg text-gray-400">{event.date ? new Date(event.date).toLocaleDateString() : ''}</div>
      <div className="mb-8 text-base text-white/90">{event.description || event.content}</div>
      <Link to="/" className="text-gold underline">Back to Home</Link>
    </div>
  );
}
