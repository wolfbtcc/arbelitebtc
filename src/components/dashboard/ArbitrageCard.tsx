import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Bot, Cloud } from 'lucide-react';
import { useArbitrage } from '../../contexts/ArbitrageContext';
import { useWallet } from '../../contexts/WalletContext';

const ArbitrageCard: React.FC = () => {
  const { 
    currentOpportunity, 
    refreshOpportunity, 
    executeArbitrage,
    operationsToday,
    maxOperationsPerDay,
    refreshCountdown,
    syncing
  } = useArbitrage();
  const { balance } = useWallet();
  
  const [investAmount, setInvestAmount] = useState('');
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [btcEquivalent, setBtcEquivalent] = useState('0.00000000');
  const [bitcoinPrice, setBitcoinPrice] = useState(0);
  const [priceAnimating, setPriceAnimating] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [priceError, setPriceError] = useState(false);
  
  // Fetch Bitcoin price from Binance API
  const fetchBitcoinPrice = async () => {
    try {
      setPriceError(false);
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCBRL');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.price) {
        const newPrice = parseFloat(data.price);
        
        // Only trigger animation if price changed significantly (more than R$ 100)
        if (bitcoinPrice > 0 && Math.abs(newPrice - bitcoinPrice) > 100) {
          setPriceAnimating(true);
          setTimeout(() => {
            setBitcoinPrice(newPrice);
            setLastPriceUpdate(new Date());
            setTimeout(() => setPriceAnimating(false), 800);
          }, 200);
        } else {
          setBitcoinPrice(newPrice);
          setLastPriceUpdate(new Date());
        }
        
        setPriceLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      setPriceError(true);
      
      // Only set fallback price if we don't have any price yet
      if (bitcoinPrice === 0) {
        setBitcoinPrice(598940.94);
        setLastPriceUpdate(new Date());
        setPriceLoading(false);
      }
    }
  };

  // Initial price fetch and setup hourly updates
  useEffect(() => {
    // Fetch price immediately on component mount
    fetchBitcoinPrice();
    
    // Set up interval to fetch price every hour (3600000 ms = 1 hour)
    const priceInterval = setInterval(() => {
      console.log('Atualizando preço do Bitcoin automaticamente...');
      fetchBitcoinPrice();
    }, 3600000);
    
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if (currentOpportunity && investAmount && bitcoinPrice > 0) {
      const amount = parseFloat(investAmount.replace(',', '.'));
      if (!isNaN(amount)) {
        const profit = parseFloat((amount * (currentOpportunity.spread / 100)).toFixed(2));
        setEstimatedProfit(profit);
        
        const btcAmount = amount / bitcoinPrice;
        setBtcEquivalent(btcAmount.toFixed(8));
      } else {
        setEstimatedProfit(0);
        setBtcEquivalent('0.00000000');
      }
    } else {
      setEstimatedProfit(0);
      setBtcEquivalent('0.00000000');
    }
  }, [investAmount, currentOpportunity, bitcoinPrice]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    refreshOpportunity();
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const handleMaxAmount = () => {
    setInvestAmount(balance.toFixed(2).replace('.', ','));
  };
  
  const handleInvestAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d,]/g, '');
    
    // Handle decimal separator
    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts[1];
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].slice(0, 2);
    }
    
    setInvestAmount(value);
  };
  
  const handleExecuteArbitrage = () => {
    if (!investAmount) return;
    
    const amount = parseFloat(investAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;
    
    executeArbitrage(amount);
    setInvestAmount('');
  };

  const formatLastUpdate = () => {
    if (!lastPriceUpdate) return '';
    return lastPriceUpdate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatBitcoinPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleManualPriceRefresh = () => {
    fetchBitcoinPrice();
  };

  return (
    <div className="card relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Oportunidade de Arbitragem</h2>
        <div className="flex items-center space-x-2">
          {syncing && (
            <div className="flex items-center text-blue-400">
              <Cloud size={14} className="mr-1 animate-pulse" />
              <span className="text-xs">Sync</span>
            </div>
          )}
          <div className="flex items-center">
            <RefreshCw size={16} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs text-white/70">
              Atualiza em {refreshCountdown}s
            </span>
          </div>
        </div>
      </div>
      
      {currentOpportunity && (
        <>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-white/70 mb-1">Comprar de</p>
              <p className="text-lg font-medium">{currentOpportunity.buyExchange}</p>
              
              <div className="mt-3 mb-1">
                <div className="flex items-center mb-1">
                  <Bot size={14} className="text-green-400 mr-1 animate-pulse" />
                  <p className="text-xs text-green-400 font-medium">
                    Preço do Bitcoin
                  </p>
                  <button
                    onClick={handleManualPriceRefresh}
                    className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                    title="Atualizar preço manualmente"
                  >
                    <RefreshCw size={12} className="text-green-400" />
                  </button>
                </div>
              </div>
              
              <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 p-3 ${priceAnimating ? 'animate-pulse-glow' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 animate-shimmer"></div>
                <div className="relative z-10">
                  {priceLoading ? (
                    <div className="flex items-center">
                      <RefreshCw size={16} className="animate-spin text-green-400 mr-2" />
                      <p className="text-lg font-bold text-green-400">Carregando...</p>
                    </div>
                  ) : (
                    <p className={`text-lg font-bold text-green-400 transition-all duration-500 animate-neon-pulse ${priceAnimating ? 'scale-105' : ''}`}>
                      {formatBitcoinPrice(bitcoinPrice)}
                    </p>
                  )}
                  {lastPriceUpdate && !priceLoading && (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-green-300/70">
                        Atualizado às {formatLastUpdate()}
                      </p>
                      {priceError && (
                        <p className="text-xs text-yellow-400">
                          ⚠️ Offline
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Animated particles */}
                <div className="absolute top-1 right-1 w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 bg-emerald-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/70 mb-1">Vender para</p>
              <p className="text-lg font-medium">{currentOpportunity.sellExchange}</p>
              
              <p className="text-sm text-white/70 mt-3 mb-1">Spread</p>
              <p className="text-lg font-medium text-green-500">
                +{currentOpportunity.spread}%
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="investAmount" className="block text-sm text-white/70 mb-1">
              Valor a investir (R$)
            </label>
            <input
              id="investAmount"
              type="text"
              className="input-field"
              placeholder="0,00"
              value={investAmount}
              onChange={handleInvestAmountChange}
            />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-white/50">
                Equivalente a {btcEquivalent} BTC
              </span>
              <span className="text-white/50">
                Saldo: R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <div className="bg-slate-800/40 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Lucro estimado:</span>
              <span className="text-xl font-medium text-green-500 transition-all duration-300">
                R$ {estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleMaxAmount}
              className="btn-secondary flex-1"
              disabled={balance <= 0}
            >
              Usar 100% da banca
            </button>
            
            <button 
              onClick={handleExecuteArbitrage}
              disabled={
                !investAmount || 
                parseFloat(investAmount.replace(',', '.')) <= 0 || 
                parseFloat(investAmount.replace(',', '.')) > balance ||
                operationsToday >= maxOperationsPerDay ||
                syncing
              }
              className="btn-primary flex-1 justify-center items-center"
            >
              {syncing ? (
                <>
                  <RefreshCw size={16} className="mr-1 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  Fazer Operação
                  <ArrowRight size={16} className="ml-1" />
                </>
              )}
            </button>
          </div>
          
          {operationsToday >= maxOperationsPerDay && (
            <p className="text-xs text-yellow-500 mt-2 text-center">
              Você atingiu o limite de {maxOperationsPerDay} operações hoje. Volte amanhã para novas oportunidades.
            </p>
          )}
          
          <p className="text-xs text-white/50 mt-2 text-center">
            {operationsToday} de {maxOperationsPerDay} operações realizadas hoje
          </p>
        </>
      )}

      {/* Sync Status Indicator */}
      <div className="absolute top-2 right-2">
        {syncing ? (
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" title="Sincronizando operações" />
        ) : (
          <div className="w-2 h-2 bg-green-400 rounded-full" title="Operações sincronizadas" />
        )}
      </div>
    </div>
  );
};

export default ArbitrageCard;