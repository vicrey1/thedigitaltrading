import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function BlockchainTransactions({ walletAddresses = [] }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTxs() {
      setLoading(true);
      try {
        // Example: fetch ETH transactions for the first wallet using Etherscan API (replace with your API key)
        if (walletAddresses.length > 0) {
          const address = walletAddresses[0];
          const res = await axios.get(
            `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=YourApiKeyToken`
          );
          setTxs(res.data.result.slice(0, 5));
        } else {
          setTxs([]);
        }
      } catch {
        setTxs([]);
      }
      setLoading(false);
    }
    fetchTxs();
  }, [walletAddresses]);

  return (
    <div className="glass-card p-6 rounded-xl mb-6 shadow-lg">
      <h3 className="font-bold text-lg mb-4">Recent Blockchain Transactions</h3>
      {loading ? <div>Loading...</div> : txs.length === 0 ? <div>No transactions found.</div> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gold">
              <th>Hash</th>
              <th>Value (ETH)</th>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {txs.map(tx => (
              <tr key={tx.hash}>
                <td className="truncate max-w-xs">{tx.hash.slice(0, 10)}...</td>
                <td>{(parseFloat(tx.value) / 1e18).toFixed(4)}</td>
                <td className="truncate max-w-xs">{tx.from.slice(0, 8)}...</td>
                <td className="truncate max-w-xs">{tx.to.slice(0, 8)}...</td>
                <td>{new Date(tx.timeStamp * 1000).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
