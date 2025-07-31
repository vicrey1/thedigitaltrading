import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function EventsWebinarsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 4;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/events?page=${page}&limit=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || data); // fallback for old API
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load events.');
        setLoading(false);
      });
  }, [page]);

  if (loading) return <div className="text-white text-center">Loading...</div>;
  if (error) return <div className="text-red-400 text-center">{error}</div>;

  return (
    <section className="py-20 bg-transparent">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center font-serif">Events & Webinars</h2>
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {events.map(e => (
          <Link key={e.slug} to={`/events/${e.slug}`} className="block bg-black bg-opacity-80 rounded-2xl shadow-glass border border-gold/20 p-6 hover:border-gold transition">
            <div className="text-gold font-bold mb-2">{e.date ? new Date(e.date).toLocaleDateString() : ''}</div>
            <div className="text-white text-lg font-serif mb-2">{e.title}</div>
            <div className="text-gold underline text-sm">Register</div>
          </Link>
        ))}
      </div>
      <div className="flex justify-center mt-8 gap-2">
        <button onClick={() => setPage(page-1)} disabled={page===1} className="px-4 py-2 rounded bg-black/70 border border-gold text-gold disabled:opacity-40">Prev</button>
        <span className="text-white px-4">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page+1)} disabled={page===totalPages} className="px-4 py-2 rounded bg-black/70 border border-gold text-gold disabled:opacity-40">Next</button>
      </div>
    </section>
  );
}
