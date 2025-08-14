import React, { useState, useEffect } from 'react';
import { FiCopy, FiUsers, FiGift, FiBarChart2 } from 'react-icons/fi';
import { getReferralStats } from '../services/referralAPI';
import { useUser } from '../contexts/UserContext';
import { toast } from 'react-toastify';

export default function InviteFriends() {
  const { user } = useUser();
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const referralCode = referralStats?.referralCode || '';
  const referralLink = referralStats?.referralLink || `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getReferralStats();
        setReferralStats(stats);
      } catch (err) {
        toast.error('Failed to fetch referral stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="mb-6">
      <span className="font-semibold text-yellow-200">Referral Stats:</span>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : referralStats ? (
        <>
          {/* Desktop stats */}
          <div className="hidden md:flex flex-col md:flex-row gap-2 sm:gap-4 mt-4 w-full min-w-0">
            <div className="flex flex-col items-center bg-gray-800 bg-opacity-60 rounded-xl p-4 shadow border border-gray-700 min-w-[140px]">
              <FiUsers className="text-3xl text-blue-400 mb-1" />
              <div className="text-lg font-bold text-white">{referralStats.totalInvited}</div>
              <div className="text-xs text-gray-400">Total Invited</div>
            </div>
            <div className="flex flex-col items-center bg-gray-800 bg-opacity-60 rounded-xl p-4 shadow border border-gray-700 min-w-[140px]">
              <FiBarChart2 className="text-3xl text-green-400 mb-1" />
              <div className="text-lg font-bold text-green-400">${referralStats.totalRewards}</div>
              <div className="text-xs text-gray-400">Total Rewards</div>
            </div>
            <div className="flex flex-col items-center bg-gray-800 bg-opacity-60 rounded-xl p-4 shadow border border-gray-700 min-w-[140px]">
              <FiGift className="text-3xl text-yellow-400 mb-1" />
              <div className="text-lg font-bold text-yellow-400">{referralStats.activeReferrals}</div>
              <div className="text-xs text-gray-400">Active Referrals</div>
            </div>
          </div>
          {/* Mobile stats */}
          <div className="md:hidden space-y-2 mt-4">
            <div className="bg-gray-800 bg-opacity-60 rounded-xl p-3 shadow border border-gray-700 flex flex-col items-center">
              <FiUsers className="text-2xl text-blue-400 mb-1" />
              <div className="text-base font-bold text-white">{referralStats.totalInvited}</div>
              <div className="text-xs text-gray-400">Total Invited</div>
            </div>
            <div className="bg-gray-800 bg-opacity-60 rounded-xl p-3 shadow border border-gray-700 flex flex-col items-center">
              <FiBarChart2 className="text-2xl text-green-400 mb-1" />
              <div className="text-base font-bold text-green-400">${referralStats.totalRewards}</div>
              <div className="text-xs text-gray-400">Total Rewards</div>
            </div>
            <div className="bg-gray-800 bg-opacity-60 rounded-xl p-3 shadow border border-gray-700 flex flex-col items-center">
              <FiGift className="text-2xl text-yellow-400 mb-1" />
              <div className="text-base font-bold text-yellow-400">{referralStats.activeReferrals}</div>
              <div className="text-xs text-gray-400">Active Referrals</div>
            </div>
          </div>
          <div className="mt-8">
            <span className="font-semibold text-yellow-200">Referred Users:</span>
            {/* Desktop table */}
            {referralStats.referredDetails && referralStats.referredDetails.length > 0 ? (
              <>
                <div className="hidden md:block overflow-x-auto mt-4 rounded-xl border border-gray-800 shadow-lg w-full min-w-0">
                  <table className="min-w-0 w-full text-xs sm:text-sm bg-gray-900 rounded-lg">
                    <thead>
                      <tr className="text-gold bg-gray-800">
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-right">Total Invested</th>
                        <th className="p-3 text-right">Total Profit</th>
                        <th className="p-3 text-right">Your 10% Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralStats.referredDetails.map((ref, idx) => (
                        <tr key={idx} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/60 transition">
                          <td className="p-3 font-semibold text-white">{ref.name}</td>
                          <td className="p-3 text-blue-300">{ref.email}</td>
                          <td className="p-3 text-right font-mono text-yellow-200">${ref.totalInvested}</td>
                          <td className="p-3 text-right font-mono text-green-400">${ref.totalProfit}</td>
                          <td className="p-3 text-right font-mono text-yellow-400">${ref.reward.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile card layout for referred users */}
                <div className="md:hidden space-y-2 mt-4">
                  {referralStats.referredDetails.map((ref, idx) => (
                    <div key={idx} className="bg-gray-900 rounded-lg p-3 border border-gray-800 shadow">
                      <div className="font-bold text-white mb-1">{ref.name}</div>
                      <div className="text-xs text-blue-300 mb-1">{ref.email}</div>
                      <div className="text-xs text-yellow-200 mb-1">Invested: ${ref.totalInvested}</div>
                      <div className="text-xs text-green-400 mb-1">Profit: ${ref.totalProfit}</div>
                      <div className="text-xs text-yellow-400">Reward: ${ref.reward.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-gray-400 mt-2">No referred users yet.</div>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-8 bg-gray-800 bg-opacity-60 rounded-lg p-4 border border-gray-700">
            <b className="text-yellow-300">How it works:</b> Share your link, get friends to sign up and invest, and earn a percentage of their first investment as a bonus. The more you invite, the more you earn!
          </div>
        </>
      ) : (
        <div className="text-gray-400">No referral stats found.</div>
      )}
    </div>
  );
}
