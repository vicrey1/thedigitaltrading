import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../services/leaderboardAPI';
import { FiTrendingUp, FiAward, FiUser, FiBarChart2 } from 'react-icons/fi';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchLeaderboard();
        setLeaders(data.leaders || []);
      } catch (err) {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  return (
    <div className="glassmorphic p-8 rounded-xl text-center max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gold mb-6 flex items-center justify-center gap-2">
        <FiAward className="text-gold" /> Fund Leaderboard
      </h2>
      {loading ? (
        <div className="text-gray-400 animate-pulse">Loading leaderboard...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-gray-900 rounded-lg shadow-lg">
            <thead>
              <tr className="text-gold text-lg">
                <th className="p-3">Rank</th>
                <th className="p-3">Investor</th>
                <th className="p-3">Country</th>
                <th className="p-3">Total ROI</th>
                <th className="p-3">Best Fund</th>
                <th className="p-3">Performance</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((user, idx) => (
                <tr key={user.id || idx} className={`border-b border-gray-800 ${idx < 3 ? 'bg-gold bg-opacity-10' : ''}`}>
                  <td className="p-3 font-bold flex items-center gap-2">
                    {idx === 0 && <FiAward className="text-yellow-400 animate-bounce" />}#{idx + 1}
                  </td>
                  <td className="p-3 flex items-center gap-2">
                    <FiUser className="text-gold" />
                    <span className="font-semibold">{user.username}</span>
                  </td>
                  <td className="p-3">{user.country}</td>
                  <td className="p-3 text-gold font-bold">{user.roi}%</td>
                  <td className="p-3">{user.bestFund}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <FiTrendingUp className="text-green-400" />
                      <span className="font-mono">{user.performance}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-6 text-gray-400 text-sm flex items-center justify-center gap-2">
        <FiBarChart2 className="text-gold" />
        Live leaderboard updates every minute. Data is simulated for demo.
      </div>
    </div>
  );
};

export default Leaderboard;
