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
      } catch {
        setReferralStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  return (
    <div className="w-full px-2 sm:px-4 py-6 min-h-screen overflow-x-hidden overflow-y-auto box-border space-y-6">
      <div className="glass-card p-4 sm:p-8 rounded-2xl mb-8 shadow-2xl border border-yellow-700 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden w-full">
        <div className="absolute -top-10 -right-10 opacity-10 rotate-12 pointer-events-none select-none">
          <FiGift size={120} className="text-gold" />
        </div>
        <div className="flex flex-col gap-4 mb-6 w-full">
          <div className="flex items-center gap-4">
            <FiGift className="text-3xl text-gold drop-shadow-lg" />
            <span className="font-extrabold text-2xl tracking-wide text-yellow-300">Invite Friends & Earn Rewards</span>
          </div>
        </div>
        <div className="mb-6 flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2 w-full">
            <span className="font-mono bg-black bg-opacity-30 px-3 py-2 rounded-lg text-gold text-lg border border-yellow-700 shadow-inner w-full">{referralCode}</span>
            <button onClick={handleCopyCode} className="flex items-center gap-1 text-blue-400 hover:text-blue-600 bg-gray-900 border border-blue-400 px-3 py-2 rounded-lg font-semibold shadow transition w-full">
              <FiCopy /> Copy Code
            </button>
            <button onClick={handleCopy} className="flex items-center gap-1 text-blue-400 hover:text-blue-600 bg-gray-900 border border-blue-400 px-3 py-2 rounded-lg font-semibold shadow transition w-full">
              <FiCopy /> Copy Link
            </button>
          </div>
          <div className="text-sm text-gray-400 mt-1 w-full">Share your code and earn bonuses when friends join and invest!</div>
        </div>
        <div className="mb-6 w-full space-y-4">
          <span className="font-semibold text-yellow-200">Your Referral Link:</span>
          <div className="flex flex-col gap-2 mt-2 w-full">
            <input type="text" value={referralLink} readOnly className="w-full p-3 rounded-lg bg-gray-800 text-white border-2 border-yellow-700 focus:border-gold outline-none font-mono text-base shadow-inner" />
            <button onClick={handleCopy} className="flex items-center gap-1 text-blue-400 hover:text-blue-600 bg-gray-900 border border-blue-400 px-3 py-2 rounded-lg font-semibold shadow transition w-full"><FiCopy /></button>
          </div>
        </div>
        <div className="mb-6 w-full space-y-4">
          <span className="font-semibold text-yellow-200">Referral Stats:</span>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : referralStats ? (
            <>
              {/* Desktop/Tablet Stats */}
              <div className="hidden md:flex flex-col md:flex-row gap-6 mt-4 w-full">
                <div className="flex flex-col items-center bg-gray-800 bg-opacity-60 rounded-xl p-4 shadow border border-gray-700">
                  <FiUsers className="text-3xl text-blue-400 mb-1" />
                  <div className="text-lg font-bold text-white">{referralStats.totalInvited}</div>
                  <div className="text-xs text-gray-400">Total Invited</div>
                </div>
                <div className="flex flex-col items-center bg-gray-800 bg-opacity-60 rounded-xl p-4 shadow border border-gray-700">
                  <FiBarChart2 className="text-3xl text-green-400 mb-1" />
                  <div className="text-lg font-bold text-green-400">${referralStats.totalRewards}</div>
                  <div className="text-xs text-gray-400">Total Rewards</div>
                </div>
                <div className="flex flex-col items-center bg-gray-800 bg-opacity-60 rounded-xl p-4 shadow border border-gray-700">
                  <FiGift className="text-3xl text-yellow-400 mb-1" />
                  <div className="text-lg font-bold text-yellow-400">{referralStats.activeReferrals}</div>
                  <div className="text-xs text-gray-400">Active Referrals</div>
                </div>
              </div>
              {/* Mobile Stats */}
              <div className="md:hidden flex flex-col gap-4 mt-4 w-full">
                <div className="flex flex-col items-start p-3 rounded-xl bg-gray-800 bg-opacity-60 shadow border border-gray-700">
                  <FiUsers className="text-2xl text-blue-400 mb-1" />
                  <div className="text-base font-bold text-white">{referralStats.totalInvited}</div>
                  <div className="text-xs text-gray-400">Total Invited</div>
                </div>
                <div className="flex flex-col items-start p-3 rounded-xl bg-gray-800 bg-opacity-60 shadow border border-gray-700">
                  <FiBarChart2 className="text-2xl text-green-400 mb-1" />
                  <div className="text-base font-bold text-green-400">${referralStats.totalRewards}</div>
                  <div className="text-xs text-gray-400">Total Rewards</div>
                </div>
                <div className="flex flex-col items-start p-3 rounded-xl bg-gray-800 bg-opacity-60 shadow border border-gray-700">
                  <FiGift className="text-2xl text-yellow-400 mb-1" />
                  <div className="text-base font-bold text-yellow-400">{referralStats.activeReferrals}</div>
                  <div className="text-xs text-gray-400">Active Referrals</div>
                </div>
              </div>
              <div className="mt-8 w-full space-y-4">
                <span className="font-semibold text-yellow-200">Referred Users:</span>
                {referralStats.referredDetails && referralStats.referredDetails.length > 0 ? (
                  <>
                    {/* Desktop/Tablet Table */}
                    <div className="hidden md:block overflow-x-auto mt-4 rounded-xl border border-gray-800 shadow-lg w-full">
                      <table className="w-full text-sm bg-gray-900 rounded-lg">
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
                    {/* Mobile Card Layout */}
                    <div className="md:hidden flex flex-col gap-4 mt-4 w-full">
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
            </>
          ) : (
            <div className="text-gray-400">No referral stats found.</div>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-8 bg-gray-800 bg-opacity-60 rounded-lg p-4 border border-gray-700 w-full">
          <b className="text-yellow-300">How it works:</b> Share your link, get friends to sign up and invest, and earn a percentage of their first investment as a bonus. The more you invite, the more you earn!
        </div>
      </div>
    </div>
  );
}
