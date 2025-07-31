import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function CryptoNewsFeed() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        // Example: fetch news from CryptoPanic API (public, but you can use your own API key for more features)
        const res = await axios.get('https://cryptopanic.com/api/v1/posts/?auth_token=demo&public=true');
        setNews(res.data.results.slice(0, 6));
      } catch {
        setNews([]);
      }
      setLoading(false);
    }
    fetchNews();
  }, []);

  return (
    <div className="glass-card p-6 rounded-xl mb-6 shadow-lg">
      <h3 className="font-bold text-lg mb-4">Live Crypto News</h3>
      {loading ? <div>Loading...</div> : news.length === 0 ? <div>No news found.</div> : (
        <ul className="space-y-3">
          {news.map(item => (
            <li key={item.id}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline font-semibold">
                {item.title || item.domain}
              </a>
              <div className="text-xs text-gray-400">{item.published_at ? new Date(item.published_at).toLocaleString() : ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
