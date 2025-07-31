import React, { useEffect, useState } from 'react';

const FUNDS = ['Alpha Hedge', 'Quantum Arbitrage', 'DeFi Yield', 'NFT Index', 'Stablecoin Vault'];
const ACTIONS = ['Bought', 'Sold', 'Rebalanced', 'Shorted', 'Longed'];

function randomTx() {
  const fund = FUNDS[Math.floor(Math.random() * FUNDS.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const amount = (Math.random() * 10000 + 100).toFixed(2);
  return {
    fund,
    action,
    amount,
    time: new Date().toLocaleTimeString()
  };
}

export default function FakeTransactionLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setLogs([randomTx(), randomTx(), randomTx()]);
    const interval = setInterval(() => {
      setLogs(l => [randomTx(), ...l.slice(0, 9)]);
    }, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4 mb-4">
      <div className="font-bold mb-2">Automated Hedge Fund Trades</div>
      <ul className="text-sm space-y-1">
        {logs.map((log, i) => (
          <li key={i}>
            <span className="text-gold">[{log.time}]</span> {log.action} <span className="font-semibold">${log.amount}</span> in <span className="font-semibold">{log.fund}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
