import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { useAuth } from './AuthContext';
import { useReferral } from './ReferralContext';
import { 
  saveArbitrageOperation, 
  loadArbitrageHistory, 
  isSupabaseConfigured 
} from '../lib/supabase';

interface ArbitrageOpportunity {
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
}

interface Order {
  date: string;
  sourceExchange: string;
  targetExchange: string;
  amount: number;
  profit: number;
  spread: number;
  // Internal tracking for platform fee
  originalProfit: number;
  platformFee: number;
  netProfit: number;
}

interface ArbitrageContextData {
  currentOpportunity: ArbitrageOpportunity | null;
  orderHistory: Order[];
  operationsToday: number;
  maxOperationsPerDay: number;
  refreshCountdown: number;
  syncing: boolean;
  refreshOpportunity: () => void;
  executeArbitrage: (amount: number) => void;
  syncData: () => Promise<void>;
}

const ArbitrageContext = createContext<ArbitrageContextData>({} as ArbitrageContextData);

export const ArbitrageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { subtractFromBalance, addProfit } = useWallet();
  const { updateUserActivity } = useReferral();
  
  const [currentOpportunity, setCurrentOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [operationsToday, setOperationsToday] = useState(0);
  const [maxOperationsPerDay] = useState(3);
  const [refreshCountdown, setRefreshCountdown] = useState(11);
  const [syncing, setSyncing] = useState(false);
  
  // Platform fee configuration
  const PLATFORM_FEE_RATE = 0.30; // 30%
  const USER_PROFIT_RATE = 0.70; // 70%
  
  // Load stored data
  useEffect(() => {
    if (user?.id) {
      loadUserArbitrageData();
      
      // Generate initial opportunity
      generateOpportunity();
      
      // Reset operations counter at midnight
      checkForNewDay();
    } else {
      // Reset state when user logs out
      setOrderHistory([]);
      setOperationsToday(0);
    }
    
    // Countdown timer for refresh (11 seconds)
    const intervalId = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          generateOpportunity();
          return 11;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [user?.id]);

  const loadUserArbitrageData = async () => {
    if (!user?.id || !user?.email) return;
    
    try {
      // Load from Supabase if available
      if (isSupabaseConfigured()) {
        console.log('🔄 Carregando histórico de arbitragem do Supabase...');
        const supabaseHistory = await loadArbitrageHistory(user.id);
        
        if (supabaseHistory.length > 0) {
          // Convert Supabase data to local format
          const convertedHistory = supabaseHistory.map(op => {
            const originalProfit = Number(op.profit) / USER_PROFIT_RATE;
            const platformFee = originalProfit * PLATFORM_FEE_RATE;
            
            return {
              date: new Date(op.created_at).toLocaleDateString('pt-BR', { 
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
              sourceExchange: op.source_exchange,
              targetExchange: op.target_exchange,
              amount: Number(op.amount),
              profit: Number(op.profit),
              spread: Number(op.spread),
              originalProfit,
              platformFee,
              netProfit: Number(op.profit)
            };
          });
          
          setOrderHistory(convertedHistory);
          console.log('✅ Histórico carregado do Supabase:', convertedHistory.length, 'operações');
          
          // Update localStorage cache
          localStorage.setItem(`arbitrage_history_${user.email}`, JSON.stringify(convertedHistory));
        } else {
          // Try to migrate from localStorage
          await migrateFromLocalStorage();
        }
      } else {
        // Load from localStorage
        loadLocalArbitrageData();
      }
      
      // Load operations counter
      const storedOpsToday = localStorage.getItem(`operations_today_${user.email}`);
      if (storedOpsToday) {
        setOperationsToday(parseInt(storedOpsToday, 10));
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados de arbitragem:', error);
      loadLocalArbitrageData();
    }
  };

  const migrateFromLocalStorage = async () => {
    if (!user?.id || !user?.email) return;
    
    const storedHistory = localStorage.getItem(`arbitrage_history_${user.email}`);
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        console.log('🔄 Migrando histórico de arbitragem para Supabase:', parsedHistory.length, 'operações');
        
        // Migrate each operation to Supabase
        for (const order of parsedHistory) {
          await saveArbitrageOperation(
            user.id,
            order.amount,
            order.netProfit || order.profit,
            order.spread,
            order.sourceExchange,
            order.targetExchange
          );
        }
        
        setOrderHistory(parsedHistory);
        console.log('✅ Histórico migrado com sucesso para Supabase');
      } catch (error) {
        console.error('❌ Erro na migração do histórico:', error);
        setOrderHistory([]);
      }
    }
  };

  const loadLocalArbitrageData = () => {
    if (!user?.email) return;
    
    const storedHistory = localStorage.getItem(`arbitrage_history_${user.email}`);
    if (storedHistory) {
      const parsedHistory = JSON.parse(storedHistory);
      // Ensure backward compatibility with existing data
      const updatedHistory = parsedHistory.map((order: any) => ({
        ...order,
        originalProfit: order.originalProfit || order.profit / USER_PROFIT_RATE,
        platformFee: order.platformFee || (order.profit / USER_PROFIT_RATE) * PLATFORM_FEE_RATE,
        netProfit: order.netProfit || order.profit
      }));
      setOrderHistory(updatedHistory);
    } else {
      setOrderHistory([]);
    }
  };

  const checkForNewDay = () => {
    if (!user?.email) return;
    
    const lastOpDate = localStorage.getItem(`last_operation_date_${user.email}`);
    const today = new Date().toDateString();
    
    if (lastOpDate !== today) {
      setOperationsToday(0);
      localStorage.setItem(`last_operation_date_${user.email}`, today);
      localStorage.setItem(`operations_today_${user.email}`, '0');
    }
  };

  // Save order history when it changes
  useEffect(() => {
    if (user?.email && orderHistory.length > 0) {
      localStorage.setItem(`arbitrage_history_${user.email}`, JSON.stringify(orderHistory));
    }
  }, [orderHistory, user?.email]);
  
  // Save operations counter when it changes
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`operations_today_${user.email}`, operationsToday.toString());
    }
  }, [operationsToday, user?.email]);
  
  const generateOpportunity = () => {
    const exchanges = [
      ['Binance', 'Bitso'],
      ['KuCoin', 'OKX'],
      ['Bybit', 'Mercado Bitcoin'],
      ['Binance', 'FTX'],
      ['Kraken', 'Huobi']
    ];
    
    const randomExchangePair = exchanges[Math.floor(Math.random() * exchanges.length)];
    
    // Generate varied spread values between 0.11% and 0.30%
    const spreadOptions = [
      0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20,
      0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30
    ];
    
    // Select a random spread from the options
    const spread = spreadOptions[Math.floor(Math.random() * spreadOptions.length)];
    
    const basePrice = 345000 + Math.random() * 10000;
    const spreadMultiplier = 1 + spread / 100;
    
    setCurrentOpportunity({
      buyExchange: randomExchangePair[0],
      sellExchange: randomExchangePair[1],
      buyPrice: parseFloat(basePrice.toFixed(2)),
      sellPrice: parseFloat((basePrice * spreadMultiplier).toFixed(2)),
      spread
    });
  };
  
  const refreshOpportunity = () => {
    generateOpportunity();
    setRefreshCountdown(11);
  };
  
  const executeArbitrage = async (amount: number) => {
    if (!currentOpportunity || operationsToday >= maxOperationsPerDay || !user?.id || !user?.email) {
      return;
    }
    
    // Calculate original profit (what would be shown to user)
    const originalProfit = amount * (currentOpportunity.spread / 100);
    
    // Apply platform fee automatically
    const platformFee = originalProfit * PLATFORM_FEE_RATE;
    const netProfit = originalProfit * USER_PROFIT_RATE;
    
    // User only receives 70% of the calculated profit
    await addProfit(netProfit);
    
    // Update referral activity for commission calculation
    updateUserActivity(user.email, originalProfit);
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const newOrder: Order = {
      date: formattedDate,
      sourceExchange: currentOpportunity.buyExchange,
      targetExchange: currentOpportunity.sellExchange,
      amount,
      profit: netProfit, // Display the net profit to user
      spread: currentOpportunity.spread,
      // Internal tracking
      originalProfit,
      platformFee,
      netProfit
    };
    
    setOrderHistory(prev => [newOrder, ...prev]);
    setOperationsToday(prev => prev + 1);
    localStorage.setItem(`last_operation_date_${user.email}`, new Date().toDateString());
    
    // Save to Supabase
    if (isSupabaseConfigured()) {
      try {
        setSyncing(true);
        await saveArbitrageOperation(
          user.id,
          amount,
          netProfit,
          currentOpportunity.spread,
          currentOpportunity.buyExchange,
          currentOpportunity.sellExchange
        );
        console.log('✅ Operação de arbitragem salva no Supabase');
      } catch (error) {
        console.error('❌ Erro ao salvar operação no Supabase:', error);
      } finally {
        setSyncing(false);
      }
    }
    
    // Store platform fee data for internal tracking (optional)
    const platformData = {
      userId: user.email,
      operationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      originalAmount: amount,
      originalProfit,
      platformFee,
      netProfit,
      feeRate: PLATFORM_FEE_RATE
    };
    
    // Store platform fee data in separate storage for internal tracking
    const existingPlatformData = JSON.parse(localStorage.getItem('platform_fees') || '[]');
    existingPlatformData.push(platformData);
    localStorage.setItem('platform_fees', JSON.stringify(existingPlatformData));
    
    refreshOpportunity();
  };

  const syncData = async (): Promise<void> => {
    if (!user?.id || !isSupabaseConfigured()) return;
    
    setSyncing(true);
    
    try {
      console.log('🔄 Sincronizando dados de arbitragem...');
      const supabaseHistory = await loadArbitrageHistory(user.id);
      
      if (supabaseHistory.length > 0) {
        // Convert Supabase data to local format
        const convertedHistory = supabaseHistory.map(op => {
          const originalProfit = Number(op.profit) / USER_PROFIT_RATE;
          const platformFee = originalProfit * PLATFORM_FEE_RATE;
          
          return {
            date: new Date(op.created_at).toLocaleDateString('pt-BR', { 
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            sourceExchange: op.source_exchange,
            targetExchange: op.target_exchange,
            amount: Number(op.amount),
            profit: Number(op.profit),
            spread: Number(op.spread),
            originalProfit,
            platformFee,
            netProfit: Number(op.profit)
          };
        });
        
        setOrderHistory(convertedHistory);
        
        // Update localStorage cache
        if (user.email) {
          localStorage.setItem(`arbitrage_history_${user.email}`, JSON.stringify(convertedHistory));
        }
        
        console.log('✅ Dados de arbitragem sincronizados com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro na sincronização de arbitragem:', error);
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <ArbitrageContext.Provider value={{
      currentOpportunity,
      orderHistory,
      operationsToday,
      maxOperationsPerDay,
      refreshCountdown,
      syncing,
      refreshOpportunity,
      executeArbitrage,
      syncData
    }}>
      {children}
    </ArbitrageContext.Provider>
  );
};

export const useArbitrage = (): ArbitrageContextData => {
  const context = useContext(ArbitrageContext);
  
  if (!context) {
    throw new Error('useArbitrage must be used within an ArbitrageProvider');
  }
  
  return context;
};