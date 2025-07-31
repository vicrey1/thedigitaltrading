import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function BlogInsightsSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/blogs?page=${page}&limit=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        setPosts(data.blogs || data); // fallback for old API
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load blog posts.');
        setLoading(false);
      });
  }, [page]);

  if (loading) return <div className="text-white text-center">Loading...</div>;
  if (error) return <div className="text-red-400 text-center">{error}</div>;

  return (
    <section className="py-20 bg-transparent">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gold text-center font-serif">Insights & Research</h2>
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map(p => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="block bg-black bg-opacity-80 rounded-2xl shadow-glass border border-gold/20 p-6 hover:border-gold transition">
            <div className="text-gold font-bold mb-2">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}</div>
            <div className="text-white text-lg font-serif mb-2">{p.title}</div>
            <div className="text-gold underline text-sm">Read More</div>
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
