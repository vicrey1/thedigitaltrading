import React from 'react';

export default function FundProspectus() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-gold">Fund Prospectus</h1>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">About Our Funds</h2>
        <p className="mb-2">LUXYIELD offers a range of simulated investment funds, each with a unique strategy and risk profile. Our prospectus provides an overview of each fund, its objectives, and how simulated returns are generated for demo purposes.</p>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-bold">Spot Market Fund</h3>
        <p>Long-term holding of top market cap cryptocurrencies with quarterly rebalancing. Simulated to reflect market trends and volatility.</p>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-bold">Derivatives Fund</h3>
        <p>Simulated options strategies and leveraged positions with dynamic risk management. Returns are based on hypothetical market scenarios.</p>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-bold">Yield Farming Fund</h3>
        <p>Automated yield optimization across DeFi protocols with compound interest simulation. Yields are for demonstration and do not reflect real DeFi returns.</p>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-bold">NFT Index Fund</h3>
        <p>Exposure to a basket of top NFT projects, with simulated price tracking and periodic rebalancing.</p>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-bold">Stablecoin Vault</h3>
        <p>Low-risk simulated returns based on stablecoin lending and liquidity provision.</p>
      </div>
      <div className="mt-8 text-gray-400 text-sm">
        <p><b>Disclaimer:</b> All returns and strategies on this platform are simulated for demonstration purposes only and do not represent real financial products or advice.</p>
      </div>
    </div>
  );
}
