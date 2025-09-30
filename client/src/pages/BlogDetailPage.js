import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { isDarkMode } = useTheme(); // Only using isDarkMode
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/blogs/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Blog post not found.');
        setLoading(false);
      });
  }, [slug]);

  if (loading) return (
    <div className={`p-8 min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      Loading...
    </div>
  );
  
  if (error) return (
    <div className={`p-8 min-h-screen ${isDarkMode ? 'bg-gray-900 text-red-400' : 'bg-white text-red-600'}`}>
      {error}
    </div>
  );
  
  if (!post) return null;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto p-8">
        <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-crypto-orange' : 'text-crypto-orange-dark'}`}>
          {post.title}
        </h1>
        <div className={`mb-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
        </div>
        <div className={`mb-8 text-base ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`}>
          {post.content}
        </div>
        <Link 
          to="/" 
          className={`${isDarkMode ? 'text-crypto-orange hover:text-crypto-orange/80' : 'text-crypto-orange-dark hover:text-crypto-orange'} underline transition-colors`}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
