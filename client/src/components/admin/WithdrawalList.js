// src/components/admin/WithdrawalList.js
import React from 'react';
import { FiDownload } from 'react-icons/fi';

const statusColors = {
  pending: 'bg-yellow-500 bg-opacity-20 text-yellow-400',
  completed: 'bg-green-500 bg-opacity-20 text-green-400',
  rejected: 'bg-red-500 bg-opacity-20 text-red-400'
};

const WithdrawalList = ({ withdrawals = [], onSelect, onExport }) => {
  return (
    <div className="w-full p-0 md:p-2 bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl border border-gray-800">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4 flex-wrap">
        <h2 className="text-xl font-bold text-gold tracking-tight whitespace-nowrap">Withdrawals</h2>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black font-semibold rounded-lg shadow hover:bg-yellow-400 transition whitespace-nowrap"
        >
          <FiDownload /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800 text-left">
              <th className="py-4 px-4 font-semibold text-gray-300">ID</th>
              <th className="py-4 px-4 font-semibold text-gray-300">User</th>
              <th className="py-4 px-4 font-semibold text-gray-300">Amount</th>
              <th className="py-4 px-4 font-semibold text-gray-300">Network</th>
              <th className="py-4 px-4 font-semibold text-gray-300">Wallet</th>
              <th className="py-4 px-4 font-semibold text-gray-300">Date</th>
              <th className="py-4 px-4 font-semibold text-gray-300">Status</th>
              <th className="py-4 px-4 font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500 text-lg">No withdrawals found.</td>
              </tr>
            ) : (
              withdrawals.map(wd => (
                <tr key={wd.id} className="border-b border-gray-800 hover:bg-gray-900 transition">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500 max-w-[120px] truncate">{wd.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-100">{wd.userId}</div>
                    {wd.userFullName && (
                      <div className="text-xs text-gray-400">{wd.userFullName}</div>
                    )}
                    <div className="text-xs text-gray-400">{wd.userEmail}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gold font-bold">
                    {Number(wd.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {wd.currency}
                    {wd.type === 'roi' && (
                      <span className="ml-2 px-2 py-1 rounded bg-purple-700 text-white text-xs font-bold">ROI</span>
                    )}
                  </td>
                  <td className="py-3 px-4 uppercase text-gray-300">{wd.network}</td>
                  <td className={`py-3 px-4 font-mono text-xs truncate max-w-xs ${wd.walletAddress === 'DEFAULT_ADDRESS' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{wd.walletAddress}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{new Date(wd.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[wd.status]}`}>{wd.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    {wd.status === 'pending' ? (
                      <button
                        onClick={() => onSelect(wd)}
                        className="px-4 py-1 bg-gold text-black rounded-lg font-semibold shadow hover:bg-yellow-400 transition"
                      >
                        Review
                      </button>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WithdrawalList;