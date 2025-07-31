// src/utils/simulateData.js

// Generate a random ROI within a range
export function simulateROI(min = 5, max = 12) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

// Generate fake monthly performance data
export function simulatePerformance(months = 12, min = 5, max = 12) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      roi: simulateROI(min, max)
    };
  });
}

// Generate fake testimonials
export function simulateTestimonials(count = 3) {
  const names = ['John D.', 'Sophia L.', 'Michael B.', 'Ava R.', 'Lucas W.'];
  const comments = [
    'LUXHEDGE made investing effortless and rewarding!',
    'My portfolio has never looked better. Highly recommend!',
    'The simulated returns are impressive and the UI is stunning.',
    'I love the fund variety and the luxury experience.',
    'Support is fast and the platform feels exclusive.'
  ];
  return Array.from({ length: count }, () => ({
    name: names[Math.floor(Math.random() * names.length)],
    comment: comments[Math.floor(Math.random() * comments.length)],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
  }));
}

// Generate fake activity feed
export function simulateActivity(count = 5) {
  const actions = ['Deposit', 'Withdrawal', 'ROI', 'Investment', 'Rebalance'];
  const funds = ['Spot Market', 'Yield Farming', 'NFT Fund', 'Arbitrage', 'Derivatives'];
  return Array.from({ length: count }, () => ({
    type: actions[Math.floor(Math.random() * actions.length)],
    fund: funds[Math.floor(Math.random() * funds.length)],
    amount: `$${(Math.random() * 10000 + 500).toFixed(2)}`,
    date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: 'Completed'
  }));
}
