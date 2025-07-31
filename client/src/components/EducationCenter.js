import React, { useState } from 'react';
import { FiBookOpen, FiPlayCircle, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const resources = [
  {
    id: 1,
    type: 'Article',
    title: 'What is a Crypto Hedge Fund?',
    description: 'A crypto hedge fund is a pooled investment vehicle managed by professionals who invest in a diversified portfolio of digital assets. These funds use advanced strategies such as long/short positions, arbitrage, and algorithmic trading to maximize returns and manage risk. Investors benefit from expert management, diversification, and access to opportunities that may not be available to individual investors. Crypto hedge funds are regulated and require KYC for participation, ensuring compliance and security.',
    tags: ['Basics', 'Crypto', 'Funds'],
    color: 'from-blue-500 to-green-400',
  },
  {
    id: 3,
    type: 'Article',
    title: 'How KYC & Security Work on LUXHEDGE',
    description: 'KYC, or Know Your Customer, is a process required by law to verify the identity of users and prevent financial crimes such as fraud and money laundering. On LUXHEDGE, you will be asked to provide personal information and upload identification documents. The process is secure and usually takes less than 24 hours. Security is a top priority at LUXHEDGE, with advanced encryption, two-factor authentication, and continuous monitoring to protect your data and funds. For your safety, always use strong, unique passwords and enable all available security features.',
    tags: ['KYC', 'Security'],
    color: 'from-purple-500 to-indigo-400',
  },
  {
    id: 4,
    type: 'Article',
    title: 'Glossary: Key Investment Terms',
    description: 'This glossary explains essential investment terms such as asset allocation, diversification, liquidity, volatility, and more. Understanding these terms will help you make informed investment decisions and communicate effectively with financial professionals.',
    tags: ['Glossary', 'Terms'],
    color: 'from-green-400 to-blue-500',
  },
  {
    id: 5,
    type: 'Video',
    title: 'Luxury Investing: The LUXHEDGE Philosophy',
    description: 'Luxury investing at LUXYIELD combines exclusive opportunities, expert management, and a focus on long-term value. Our philosophy emphasizes transparency, client education, and a commitment to helping you achieve your financial goals in the world of digital assets. We believe in building trust and delivering exceptional results for our clients.',
    tags: ['Luxury', 'Philosophy', 'Video'],
    color: 'from-pink-400 to-yellow-400',
  },
  {
    id: 6,
    type: 'Article',
    title: 'Risk Management in Crypto Funds',
    description: 'Risk management involves identifying, assessing, and controlling threats to your investments. Crypto funds use techniques such as diversification, stop-loss orders, and regular portfolio reviews to minimize potential losses. At LUXHEDGE, we prioritize risk management to help protect your capital in volatile markets and ensure long-term growth.',
    tags: ['Risk', 'Management', 'Crypto'],
    color: 'from-red-400 to-yellow-300',
  },
  {
    id: 7,
    type: 'Article',
    title: 'How to Read a Fund Performance Chart',
    description: 'A fund performance chart shows how an investment has performed over time. Key elements include net asset value (NAV), returns, drawdowns, and benchmarks. By analyzing these charts, you can assess the consistency, risk, and growth potential of a fund before investing. Understanding these metrics helps you make better investment choices.',
    tags: ['Performance', 'Charts', 'Guide'],
    color: 'from-blue-400 to-purple-400',
  },
  {
    id: 8,
    type: 'Video',
    title: 'The Power of Compound Interest',
    description: 'Compound interest means that the returns you earn on an investment are reinvested to generate additional earnings over time. This process can significantly increase your wealth, especially when you invest for the long term. The earlier you start, the more you benefit from compounding, making it a powerful tool for building wealth.',
    tags: ['Compound', 'Interest', 'Growth', 'Video'],
    color: 'from-green-300 to-yellow-400',
  },
  {
    id: 9,
    type: 'Article',
    title: 'Tax Considerations for Crypto Investors',
    description: 'Crypto investments may be subject to capital gains tax, income tax, or other regulations depending on your country. It is important to keep accurate records of your transactions and consult a tax professional to ensure compliance and optimize your tax strategy. Staying informed about tax laws helps you avoid penalties and make the most of your investments.',
    tags: ['Tax', 'Compliance', 'Crypto'],
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 10,
    type: 'Article',
    title: 'Diversification: Why It Matters',
    description: 'Diversification means spreading your investments across different assets to reduce risk. By not putting all your eggs in one basket, you can protect your portfolio from large losses if one investment performs poorly. Diversification is a key principle of sound investing and helps achieve more stable returns over time.',
    tags: ['Diversification', 'Portfolio'],
    color: 'from-teal-400 to-blue-500',
  },
  {
    id: 11,
    type: 'Video',
    title: 'How to Set Realistic Investment Goals',
    description: 'Setting realistic investment goals involves assessing your financial situation, defining clear objectives, and creating a plan to achieve them. Track your progress regularly and adjust your strategy as needed to stay on course. Clear goals help you stay motivated and focused on long-term success.',
    tags: ['Goals', 'Planning', 'Video'],
    color: 'from-yellow-300 to-orange-400',
  },
  {
    id: 12,
    type: 'Article',
    title: 'Understanding DeFi and Its Risks',
    description: 'DeFi, or Decentralized Finance, refers to financial services built on blockchain technology that operate without traditional intermediaries. While DeFi offers innovation and accessibility, it also comes with risks such as smart contract bugs, hacking, and regulatory uncertainty. Always research projects thoroughly before participating and never invest more than you can afford to lose.',
    tags: ['DeFi', 'Risks', 'Crypto'],
    color: 'from-pink-500 to-purple-400',
  },
  {
    id: 13,
    type: 'Article',
    title: 'How to Spot Investment Scams',
    description: 'Investment scams often promise high returns with little risk. Be cautious of unsolicited offers, pressure to act quickly, and requests for personal information or money. Always verify the legitimacy of any investment opportunity and consult trusted sources before committing funds. Protect yourself by staying informed and skeptical of offers that seem too good to be true.',
    tags: ['Scams', 'Security', 'Guide'],
    color: 'from-red-500 to-yellow-200',
  },
];

export default function EducationCenter() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center mb-8">
        <FiBookOpen className="text-gold text-3xl mr-3" />
        <h1 className="text-3xl font-bold text-gold-gradient">Education Center</h1>
      </div>
      <div className="mb-6 flex items-center gap-2">
        <FiSearch className="text-gray-400 text-xl" />
        <input
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
          placeholder="Search articles, videos, or topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.length === 0 && (
          <div className="col-span-2 text-center text-gray-400">No resources found.</div>
        )}
        {filtered.map((res) => (
          <div
            key={res.id}
            className={`glass-card p-6 rounded-xl shadow-lg flex flex-col gap-3 border-l-8 ${expanded === res.id ? 'bg-black' : 'bg-white'} ${expanded === res.id ? 'text-white' : 'text-black'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {res.type === 'Video' ? <FiPlayCircle className={expanded === res.id ? 'text-yellow-300' : 'text-yellow-600'} /> : <FiBookOpen className={expanded === res.id ? 'text-blue-300' : 'text-blue-600'} />}
                <h2 className="text-lg font-semibold">{res.title}</h2>
              </div>
              <button onClick={() => setExpanded(expanded === res.id ? null : res.id)} className="text-gold text-xl">
                {expanded === res.id ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {res.tags.map(tag => (
                <span key={tag} className={`px-2 py-1 rounded text-xs font-semibold ${expanded === res.id ? 'bg-white text-black' : 'bg-black text-white'}`}>{tag}</span>
              ))}
            </div>
            {expanded === res.id && (
              <div className="mb-2 animate-fade-in">
                {res.description}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 text-gray-400 text-center">More articles and videos coming soon.</div>
    </div>
  );
}
