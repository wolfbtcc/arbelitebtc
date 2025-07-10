import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  saveWalletData, 
  loadWalletData, 
  saveDepositRecord, 
  loadDepositHistory,
  isSupabaseConfigured 
} from '../lib/supabase';

interface WalletData {
  balance: number;
  totalProfit: number;
  lastUpdated: string;
}

interface WalletContextData {
  balance: number;
  totalProfit: number;
  pendingDeposit: number | null;
  loading: boolean;
  syncing: boolean;
  addPendingDeposit: (amount: number) => void;
  confirmDeposit: (amount?: number) => void;
  addProfit: (amount: number) => void;
  updateProfit: (newProfit: number) => void;
  subtractFromBalance: (amount: number) => void;
  syncData: () => Promise<void>;
}

const WalletContext = createContext<WalletContextData>({} as WalletContextData);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSupabaseReady } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [pendingDeposit, setPendingDeposit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Load user's wallet data on login
  useEffect(() => {
    if (user?.id) {
      loadUserWalletData();
    } else {
      // Reset state when user logs out
      setBalance(0);
      setTotalProfit(0);
      setPendingDeposit(null);
      setLoading(false);
    }
  }, [user?.id]);

  // Listen for Supabase sync events
  useEffect(() => {
    const handleSupabaseSync = async (event: CustomEvent) => {
      if (event.detail.userId === user?.id) {
        console.log('🔄 Sincronizando carteira entre todos os dispositivos...');
        await syncData();
      }
    };

    const handleRealtimeUpdate = async (event: CustomEvent) => {
      if (event.detail.userId === user?.id) {
        console.log('📱 Dados da carteira atualizados em tempo real em outro dispositivo');
        await syncData();
        showSyncNotification('🔄 Carteira atualizada em outro dispositivo');
      }
    };

    window.addEventListener('supabase-user-sync', handleSupabaseSync as EventListener);
    window.addEventListener('supabase-realtime-update', handleRealtimeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('supabase-user-sync', handleSupabaseSync as EventListener);
      window.removeEventListener('supabase-realtime-update', handleRealtimeUpdate as EventListener);
    };
  }, [user?.id]);

  // Auto-sync every 30 seconds when user is active
  useEffect(() => {
    if (!user?.id || !isSupabaseReady) return;

    const interval = setInterval(async () => {
      // Only sync if it's been more than 25 seconds since last sync
      const now = Date.now();
      if (now - lastSyncTime > 25000) {
        await syncData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, isSupabaseReady, lastSyncTime]);

  // Sync when page becomes visible (user switches back to tab/app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user?.id && isSupabaseReady) {
        console.log('📱 App ficou visível - Sincronizando dados da carteira...');
        await syncData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, isSupabaseReady]);

  // Listen for cross-device sync triggers
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'wallet_update_trigger' && user?.id && isSupabaseReady) {
        console.log('🔄 Detectada atualização de carteira em outro dispositivo - Sincronizando...');
        // Small delay to avoid race conditions
        setTimeout(async () => {
          await syncData();
        }, 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?.id, isSupabaseReady]);

  const loadUserWalletData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      // Try to load from Supabase first for latest data
      if (isSupabaseConfigured() && isSupabaseReady) {
        console.log('🔄 Carregando dados da carteira do Supabase (multi-dispositivos)...');
        const supabaseData = await loadWalletData(user.id);
        
        if (supabaseData) {
          console.log('✅ Dados carregados do Supabase e sincronizados entre dispositivos:', supabaseData);
          const newBalance = Number(supabaseData.balance);
          const newTotalProfit = Number(supabaseData.total_profit);
          
          setBalance(newBalance);
          setTotalProfit(newTotalProfit);
          
          // Update localStorage cache
          saveLocalWalletData(newBalance, newTotalProfit);
          setLastSyncTime(Date.now());
          
          showSyncNotification('✅ Carteira sincronizada entre dispositivos');
        } else {
          // No data in Supabase, check localStorage and migrate
          console.log('📦 Nenhum dado no Supabase, verificando localStorage...');
          await migrateFromLocalStorage();
        }
      } else {
        // Fallback to localStorage if Supabase is not ready
        console.log('📦 Supabase não disponível, usando localStorage...');
        loadLocalWalletData();
      }
      
      // Load pending deposit if exists
      const storedPendingDeposit = localStorage.getItem(`pending_deposit_${user.email}`);
      if (storedPendingDeposit) {
        setPendingDeposit(parseFloat(storedPendingDeposit));
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados da carteira:', error);
      // Fallback to localStorage
      loadLocalWalletData();
    } finally {
      setLoading(false);
    }
  };

  const migrateFromLocalStorage = async () => {
    if (!user?.id || !user?.email) return;
    
    const storedData = localStorage.getItem(`wallet_${user.email}`);
    
    if (storedData) {
      try {
        const data: WalletData = JSON.parse(storedData);
        console.log('🔄 Migrando dados do localStorage para Supabase:', data);
        
        setBalance(data.balance);
        setTotalProfit(data.totalProfit);
        
        // Save to Supabase for multi-device sync
        const success = await saveWalletData(user.id, data.balance, data.totalProfit);
        if (success) {
          console.log('✅ Dados migrados com sucesso para Supabase - Multi-dispositivos ativo');
          setLastSyncTime(Date.now());
          showSyncNotification('✅ Dados migrados para a nuvem - Disponível em todos os dispositivos');
        }
      } catch (error) {
        console.error('❌ Erro na migração:', error);
        // Initialize with default values
        setBalance(0);
        setTotalProfit(0);
        if (isSupabaseReady) {
          await saveWalletData(user.id, 0, 0);
        }
      }
    } else {
      // Initialize new user
      console.log('🆕 Inicializando novo usuário');
      setBalance(0);
      setTotalProfit(0);
      if (isSupabaseReady) {
        await saveWalletData(user.id, 0, 0);
      }
    }
  };

  const loadLocalWalletData = () => {
    if (!user?.email) return;
    
    const storedData = localStorage.getItem(`wallet_${user.email}`);
    
    if (storedData) {
      const data: WalletData = JSON.parse(storedData);
      setBalance(data.balance);
      setTotalProfit(data.totalProfit);
    } else {
      // Initialize new user data
      setBalance(0);
      setTotalProfit(0);
      saveLocalWalletData(0, 0);
    }
  };

  // Save wallet data to both Supabase and localStorage
  const saveUserWalletData = async (newBalance: number, newTotalProfit: number) => {
    if (!user?.id || !user?.email) return;

    // Save to localStorage immediately (for offline support)
    saveLocalWalletData(newBalance, newTotalProfit);

    // Save to Supabase (for cross-device sync)
    if (isSupabaseConfigured() && isSupabaseReady) {
      try {
        setSyncing(true);
        const success = await saveWalletData(user.id, newBalance, newTotalProfit);
        if (success) {
          console.log('✅ Dados sincronizados com Supabase - Disponível em todos os dispositivos');
          setLastSyncTime(Date.now());
          
          // Notify other tabs/windows of the update
          localStorage.setItem('wallet_update_trigger', Date.now().toString());
          
          showSyncNotification('✅ Carteira sincronizada em todos os dispositivos');
        } else {
          console.warn('⚠️ Falha na sincronização com Supabase');
        }
      } catch (error) {
        console.error('❌ Erro na sincronização:', error);
      } finally {
        setSyncing(false);
      }
    }
  };

  const saveLocalWalletData = (newBalance: number, newTotalProfit: number) => {
    if (user?.email) {
      const data: WalletData = {
        balance: newBalance,
        totalProfit: newTotalProfit,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`wallet_${user.email}`, JSON.stringify(data));
    }
  };

  const addPendingDeposit = (amount: number): void => {
    if (user?.email) {
      setPendingDeposit(amount);
      localStorage.setItem(`pending_deposit_${user.email}`, amount.toString());
      console.log(`💰 Depósito pendente adicionado: R$ ${amount.toFixed(2)}`);
    }
  };

  const confirmDeposit = async (amount?: number): Promise<void> => {
    const depositAmount = amount || pendingDeposit;
    
    if (depositAmount && user?.id && user?.email) {
      const newBalance = balance + depositAmount;
      setBalance(newBalance);
      
      // Clear pending deposit only if no specific amount was provided
      if (!amount) {
        setPendingDeposit(null);
        localStorage.removeItem(`pending_deposit_${user.email}`);
      }
      
      // Save to both localStorage and Supabase
      await saveUserWalletData(newBalance, totalProfit);
      
      // Record the deposit in database
      if (isSupabaseConfigured() && isSupabaseReady) {
        await saveDepositRecord(user.id, depositAmount);
      }
      
      console.log(`✅ Depósito confirmado: R$ ${depositAmount.toFixed(2)} - Sincronizado entre dispositivos`);
      
      // Show success notification
      showNotification(`💰 Depósito confirmado! R$ ${depositAmount.toFixed(2)} foi creditado em sua conta e está disponível em todos os seus dispositivos.`, 'success');
    }
  };

  const addProfit = async (amount: number): Promise<void> => {
    if (user?.id) {
      const newBalance = balance + amount;
      const newTotalProfit = totalProfit + amount;
      
      setBalance(newBalance);
      setTotalProfit(newTotalProfit);
      
      await saveUserWalletData(newBalance, newTotalProfit);
      
      console.log(`✅ Lucro adicionado: R$ ${amount.toFixed(2)} - Sincronizado entre dispositivos`);
    }
  };

  const updateProfit = async (newProfit: number): Promise<void> => {
    if (user?.id) {
      setTotalProfit(newProfit);
      await saveUserWalletData(balance, newProfit);
      console.log(`✅ Lucro atualizado: R$ ${newProfit.toFixed(2)} - Sincronizado entre dispositivos`);
    }
  };

  const subtractFromBalance = async (amount: number): Promise<void> => {
    if (user?.id) {
      const newBalance = Math.max(0, balance - amount);
      setBalance(newBalance);
      await saveUserWalletData(newBalance, totalProfit);
      console.log(`✅ Valor subtraído: R$ ${amount.toFixed(2)} - Sincronizado entre dispositivos`);
    }
  };

  const syncData = async (): Promise<void> => {
    if (!user?.id || !isSupabaseConfigured() || !isSupabaseReady) return;
    
    // Prevent too frequent syncs
    const now = Date.now();
    if (now - lastSyncTime < 5000) {
      return;
    }
    
    setSyncing(true);
    
    try {
      console.log('🔄 Sincronizando dados da carteira entre todos os dispositivos...');
      const supabaseData = await loadWalletData(user.id);
      
      if (supabaseData) {
        const newBalance = Number(supabaseData.balance);
        const newTotalProfit = Number(supabaseData.total_profit);
        
        // Only update if data is different
        if (newBalance !== balance || newTotalProfit !== totalProfit) {
          setBalance(newBalance);
          setTotalProfit(newTotalProfit);
          
          // Update localStorage cache
          saveLocalWalletData(newBalance, newTotalProfit);
          
          console.log('✅ Dados da carteira sincronizados com sucesso entre todos os dispositivos');
          showSyncNotification('✅ Carteira atualizada e sincronizada');
        }
        
        setLastSyncTime(now);
      }
    } catch (error) {
      console.error('❌ Erro na sincronização da carteira:', error);
    } finally {
      setSyncing(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-500 transform translate-x-full max-w-sm ${
      type === 'success' ? 'bg-green-600 border-l-4 border-green-400' : 
      type === 'error' ? 'bg-red-600 border-l-4 border-red-400' : 
      'bg-blue-600 border-l-4 border-blue-400'
    } text-white`;
    
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <button class="ml-2 text-white/70 hover:text-white" onclick="this.parentElement.parentElement.remove()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, 5000);
  };

  const showSyncNotification = (message: string) => {
    // Create a subtle notification for sync status
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 z-40 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-xs transition-all duration-300 transform translate-x-full';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 2 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  };

  return (
    <WalletContext.Provider value={{
      balance,
      totalProfit,
      pendingDeposit,
      loading,
      syncing,
      addPendingDeposit,
      confirmDeposit,
      addProfit,
      updateProfit,
      subtractFromBalance,
      syncData
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextData => {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
};