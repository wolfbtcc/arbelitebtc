import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { useAuth } from './AuthContext';

interface WithdrawalOrder {
  id: string;
  fullName: string;
  pixKey: string;
  amount: number;
  status: 'pending' | 'completed';
  createdAt: Date;
}

interface WithdrawalContextData {
  withdrawalOrders: WithdrawalOrder[];
  lastWithdrawalDate: Date | null;
  minimumWithdrawalAmount: number;
  canWithdraw: boolean;
  daysUntilNextWithdrawal: number;
  createWithdrawalOrder: (data: Omit<WithdrawalOrder, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  reinvestProfit: () => void;
  isWithdrawalModalOpen: boolean;
  setIsWithdrawalModalOpen: (isOpen: boolean) => void;
}

const WithdrawalContext = createContext<WithdrawalContextData>({} as WithdrawalContextData);

export const WithdrawalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { totalProfit, subtractFromBalance, addProfit, updateProfit } = useWallet();
  const [withdrawalOrders, setWithdrawalOrders] = useState<WithdrawalOrder[]>([]);
  const [lastWithdrawalDate, setLastWithdrawalDate] = useState<Date | null>(null);
  const [minimumWithdrawalAmount, setMinimumWithdrawalAmount] = useState(20);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [lastReinvestDate, setLastReinvestDate] = useState<Date | null>(null);
  
  useEffect(() => {
    if (user?.email) {
      const storedOrders = localStorage.getItem(`withdrawal_orders_${user.email}`);
      const storedLastWithdrawal = localStorage.getItem(`last_withdrawal_${user.email}`);
      const storedLastReinvest = localStorage.getItem(`last_reinvest_${user.email}`);
      
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        setWithdrawalOrders(orders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt)
        })));
        
        if (orders.length > 0) {
          setMinimumWithdrawalAmount(100);
        }
      } else {
        setWithdrawalOrders([]);
        setMinimumWithdrawalAmount(20);
      }
      
      if (storedLastWithdrawal) {
        setLastWithdrawalDate(new Date(storedLastWithdrawal));
      } else {
        setLastWithdrawalDate(null);
      }
      
      if (storedLastReinvest) {
        setLastReinvestDate(new Date(storedLastReinvest));
      } else {
        setLastReinvestDate(null);
      }
    } else {
      // Reset state when user logs out
      setWithdrawalOrders([]);
      setLastWithdrawalDate(null);
      setLastReinvestDate(null);
      setMinimumWithdrawalAmount(20);
    }
  }, [user?.email]);
  
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`withdrawal_orders_${user.email}`, JSON.stringify(withdrawalOrders));
      if (lastWithdrawalDate) {
        localStorage.setItem(`last_withdrawal_${user.email}`, lastWithdrawalDate.toISOString());
      }
      if (lastReinvestDate) {
        localStorage.setItem(`last_reinvest_${user.email}`, lastReinvestDate.toISOString());
      }
    }
  }, [withdrawalOrders, lastWithdrawalDate, lastReinvestDate, user?.email]);
  
  const getDaysUntilNextWithdrawal = (): number => {
    if (!lastWithdrawalDate) return 0;
    
    const today = new Date();
    const daysSinceLastWithdrawal = Math.floor(
      (today.getTime() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return Math.max(0, 15 - daysSinceLastWithdrawal);
  };
  
  const canWithdraw = (): boolean => {
    if (withdrawalOrders.length === 0) {
      return totalProfit >= 20;
    }
    
    return totalProfit >= 100 && getDaysUntilNextWithdrawal() === 0;
  };
  
  const canReinvestToday = (): boolean => {
    const now = new Date();
    const isMonday = now.getDay() === 1;
    const isBusinessHours = now.getHours() >= 8 && now.getHours() < 17;
    
    if (!isMonday || !isBusinessHours) return false;
    
    if (!lastReinvestDate) return true;
    
    const lastReinvestDay = lastReinvestDate.getDate();
    const today = now.getDate();
    
    return lastReinvestDay !== today;
  };
  
  const createWithdrawalOrder = async (data: Omit<WithdrawalOrder, 'id' | 'status' | 'createdAt'>) => {
    if (!canWithdraw() || !user?.email) {
      throw new Error('Withdrawal not allowed at this time');
    }
    
    const newOrder: WithdrawalOrder = {
      ...data,
      id: `withdrawal-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date()
    };
    
    setWithdrawalOrders(prev => [newOrder, ...prev]);
    setLastWithdrawalDate(new Date());
    subtractFromBalance(data.amount);
    updateProfit(totalProfit - data.amount);
  };
  
  const reinvestProfit = () => {
    if (totalProfit > 0 && canReinvestToday() && user?.email) {
      addProfit(totalProfit);
      setLastReinvestDate(new Date());
    }
  };
  
  return (
    <WithdrawalContext.Provider value={{
      withdrawalOrders,
      lastWithdrawalDate,
      minimumWithdrawalAmount,
      canWithdraw: canWithdraw(),
      daysUntilNextWithdrawal: getDaysUntilNextWithdrawal(),
      createWithdrawalOrder,
      reinvestProfit,
      isWithdrawalModalOpen,
      setIsWithdrawalModalOpen
    }}>
      {children}
    </WithdrawalContext.Provider>
  );
};

export const useWithdrawal = (): WithdrawalContextData => {
  const context = useContext(WithdrawalContext);
  
  if (!context) {
    throw new Error('useWithdrawal must be used within a WithdrawalProvider');
  }
  
  return context;
};