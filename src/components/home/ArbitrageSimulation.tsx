import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface ArbitrageData {
  sourceExchange: string;
  targetExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  estimatedProfit: number;
}

const ArbitrageSimulation: React.FC = () => {
  const [arbitrageData, setArbitrageData] = useState<ArbitrageData>({
    sourceExchange: 'Binance',
    targetExchange: 'Bitso',
    buyPrice: 349856.42,
    sellPrice: 350856.42,
    spread: 0.29,
    estimatedProfit: 290.00
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [valueUpdated, setValueUpdated] = useState(false);

  // Simulate data updates every 11 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updateArbitrageData();
    }, 11000);
    
    return () => clearInterval(interval);
  }, []);

  const updateArbitrageData = () => {
    setRefreshing(true);
    
    setTimeout(() => {
      // Generate varied spread values between 0.11% and 0.30%
      const spreadOptions = [
        0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20,
        0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30
      ];
      
      // Select a random spread from the options
      const randomSpread = spreadOptions[Math.floor(Math.random() * spreadOptions.length)];
      
      const buyPrice = 345000 + Math.random() * 10000;
      const spreadMultiplier = 1 + randomSpread / 100;
      const sellPrice = buyPrice * spreadMultiplier;
      const profit = (sellPrice - buyPrice) * 0.1;
      
      // Randomize exchanges sometimes
      const exchanges = [
        ['Binance', 'Bitso'],
        ['KuCoin', 'OKX'],
        ['Binance', 'Mercado Bitcoin'],
        ['Bybit', 'OKX']
      ];
      
      const randomExchangePair = exchanges[Math.floor(Math.random() * exchanges.length)];
      
      setArbitrageData({
        sourceExchange: randomExchangePair[0],
        targetExchange: randomExchangePair[1],
        buyPrice: parseFloat(buyPrice.toFixed(2)),
        sellPrice: parseFloat(sellPrice.toFixed(2)),
        spread: randomSpread,
        estimatedProfit: parseFloat(profit.toFixed(2))
      });
      
      setValueUpdated(true);
      setTimeout(() => setValueUpdated(false), 1000);
      setRefreshing(false);
    }, 800);
  };

  return (
    <div className="arbitrage-card w-full max-w-md backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Oportunidade em tempo real</h3>
        <div className="flex items-center">
          <RefreshCw 
            size={16} 
            className={`mr-1 ${refreshing ? 'animate-spin' : ''}`}
          />
          <span className="text-xs text-white/70">Atualiza em 11s</span>
        </div>
      </div>
      
      <div className="text-xl font-semibold flex items-center mb-4">
        <span>{arbitrageData.sourceExchange}</span>
        <ArrowRight size={20} className="mx-2 text-blue-500" />
        <span>{arbitrageData.targetExchange}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-white/70 mb-1">Preço de compra</p>
          <p className={`text-lg font-medium ${valueUpdated ? 'animate-value-change' : ''}`}>
            R$ {arbitrageData.buyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-white/70 mb-1">Preço de venda</p>
          <p className={`text-lg font-medium ${valueUpdated ? 'animate-value-change' : ''}`}>
            R$ {arbitrageData.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      <div className="bg-slate-800/40 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/70">Lucro estimado (10k):</span>
          <span className={`text-xl font-medium text-green-500 ${valueUpdated ? 'animate-value-change' : ''}`}>
            R$ {arbitrageData.estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
      <button 
        className="btn-primary w-full"
        onClick={() => updateArbitrageData()}
      >
        Executar arbitragem
      </button>
    </div>
  );
};

export default ArbitrageSimulation;