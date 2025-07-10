import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  registrationDate: Date;
  status: 'new' | 'active' | 'inactive';
  totalDeposits: number;
  depositsCount: number;
  commissionGenerated: number;
  lastActivity?: Date;
  lastDepositDate?: Date;
}

interface Commission {
  id: string;
  referredUserId: string;
  referredUserName: string;
  depositAmount: number;
  commissionAmount: number;
  date: Date;
  status: 'pending' | 'confirmed';
}

interface ReferralContextData {
  referralCode: string;
  referredUsers: ReferredUser[];
  commissions: Commission[];
  totalCommission: number;
  availableCommission: number;
  pendingCommission: number;
  getReferralLink: () => string;
  trackReferral: (referralCode: string) => void;
  registerReferredUser: (userData: { name: string; email: string }) => void;
  processDepositCommission: (userId: string, depositAmount: number) => void;
  withdrawCommission: () => void;
  getCommissionStats: () => {
    totalReferrals: number;
    activeReferrals: number;
    totalDepositsFromReferrals: number;
    averageDepositPerReferral: number;
  };
  updateUserActivity: (userId: string, amount: number) => void;
}

const ReferralContext = createContext<ReferralContextData>({} as ReferralContextData);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [availableCommission, setAvailableCommission] = useState(0);
  const [pendingCommission, setPendingCommission] = useState(0);
  const [pendingReferral, setPendingReferral] = useState<string | null>(null);

  // Commission rate (10%)
  const COMMISSION_RATE = 0.10;

  // Generate referral code based on user
  useEffect(() => {
    if (user?.email) {
      // Create a simple referral code from user email
      const code = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + user.id.slice(-4);
      setReferralCode(code);
      
      // Load user's referral data
      loadReferralData(user.email);
    } else {
      setReferralCode('');
      setReferredUsers([]);
      setCommissions([]);
      setTotalCommission(0);
      setAvailableCommission(0);
      setPendingCommission(0);
    }
  }, [user]);

  // Check for referral parameter on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    if (refParam) {
      trackReferral(refParam);
      // Clean URL after capturing referral
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const loadReferralData = (userEmail: string) => {
    const storedData = localStorage.getItem(`referral_data_${userEmail}`);
    if (storedData) {
      const data = JSON.parse(storedData);
      
      // Load referred users
      setReferredUsers((data.referredUsers || []).map((user: any) => ({
        ...user,
        registrationDate: new Date(user.registrationDate),
        lastActivity: user.lastActivity ? new Date(user.lastActivity) : undefined,
        lastDepositDate: user.lastDepositDate ? new Date(user.lastDepositDate) : undefined
      })));
      
      // Load commissions
      setCommissions((data.commissions || []).map((commission: any) => ({
        ...commission,
        date: new Date(commission.date)
      })));
      
      setTotalCommission(data.totalCommission || 0);
      setAvailableCommission(data.availableCommission || 0);
      setPendingCommission(data.pendingCommission || 0);
    }
  };

  const saveReferralData = () => {
    if (user?.email) {
      const data = {
        referredUsers,
        commissions,
        totalCommission,
        availableCommission,
        pendingCommission
      };
      localStorage.setItem(`referral_data_${user.email}`, JSON.stringify(data));
    }
  };

  // Save data whenever it changes
  useEffect(() => {
    if (user?.email) {
      saveReferralData();
    }
  }, [referredUsers, commissions, totalCommission, availableCommission, pendingCommission, user?.email]);

  const getReferralLink = (): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?ref=${referralCode}`;
  };

  const trackReferral = (refCode: string) => {
    // Store referral code in localStorage for later use during registration
    localStorage.setItem('pending_referral', refCode);
    setPendingReferral(refCode);
    
    // Also store in sessionStorage as backup
    sessionStorage.setItem('referral_code', refCode);
    
    console.log('Referral tracked:', refCode);
  };

  const registerReferredUser = (userData: { name: string; email: string }) => {
    const storedReferral = localStorage.getItem('pending_referral') || sessionStorage.getItem('referral_code');
    
    if (!storedReferral) {
      console.log('No referral code found during registration');
      return;
    }

    // Find the referrer by referral code
    const referrerData = findReferrerByCode(storedReferral);
    if (!referrerData) {
      console.log('Referrer not found for code:', storedReferral);
      return;
    }

    console.log('Processing referral for:', userData.email, 'referred by:', referrerData.email);

    // Create new referred user
    const newReferredUser: ReferredUser = {
      id: userData.email, // Use email as ID for easier tracking
      name: userData.name,
      email: userData.email,
      registrationDate: new Date(),
      status: 'new',
      totalDeposits: 0,
      depositsCount: 0,
      commissionGenerated: 0
    };

    // Add to referrer's list
    const referrerEmail = referrerData.email;
    const existingData = JSON.parse(localStorage.getItem(`referral_data_${referrerEmail}`) || '{"referredUsers": [], "commissions": [], "totalCommission": 0, "availableCommission": 0, "pendingCommission": 0}');
    
    // Check if user is already in the list
    const existingUserIndex = existingData.referredUsers.findIndex((u: any) => u.email === userData.email);
    if (existingUserIndex === -1) {
      existingData.referredUsers.push(newReferredUser);
      localStorage.setItem(`referral_data_${referrerEmail}`, JSON.stringify(existingData));
      
      console.log('User added to referrer list:', userData.email);
    }

    // Store referrer info for the new user
    localStorage.setItem(`referred_by_${userData.email}`, referrerEmail);

    // Clear pending referral
    localStorage.removeItem('pending_referral');
    sessionStorage.removeItem('referral_code');
    setPendingReferral(null);

    // If current user is the referrer, update state
    if (user && referrerEmail === user.email) {
      setReferredUsers(prev => {
        const existingIndex = prev.findIndex(u => u.email === userData.email);
        if (existingIndex === -1) {
          return [...prev, newReferredUser];
        }
        return prev;
      });
    }
  };

  const processDepositCommission = (userId: string, depositAmount: number) => {
    if (!user?.email) return;

    // Check if this user was referred by current user
    const referredByKey = `referred_by_${userId}`;
    const referrerEmail = localStorage.getItem(referredByKey);
    
    if (referrerEmail === user.email) {
      // Calculate 10% commission
      const commissionAmount = depositAmount * COMMISSION_RATE;
      
      console.log('Processing deposit commission for referred user:', userId, 'Deposit:', depositAmount, 'Commission:', commissionAmount);
      
      // Create commission record
      const newCommission: Commission = {
        id: `commission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        referredUserId: userId,
        referredUserName: referredUsers.find(u => u.email === userId)?.name || 'Usuário',
        depositAmount,
        commissionAmount,
        date: new Date(),
        status: 'confirmed'
      };

      // Update referred user data
      setReferredUsers(prev => prev.map(refUser => {
        if (refUser.email === userId) {
          return {
            ...refUser,
            status: 'active',
            totalDeposits: refUser.totalDeposits + depositAmount,
            depositsCount: refUser.depositsCount + 1,
            commissionGenerated: refUser.commissionGenerated + commissionAmount,
            lastActivity: new Date(),
            lastDepositDate: new Date()
          };
        }
        return refUser;
      }));

      // Add commission to list
      setCommissions(prev => [newCommission, ...prev]);

      // Update commission totals
      setTotalCommission(prev => prev + commissionAmount);
      setAvailableCommission(prev => prev + commissionAmount);

      // Show notification
      showNotification(
        `💰 Nova comissão recebida! R$ ${commissionAmount.toFixed(2)} de ${newCommission.referredUserName}`,
        'success'
      );
    }
  };

  const updateUserActivity = (userId: string, amount: number) => {
    // This function can be used to track user activity for commission purposes
    // For now, it's a placeholder that could be expanded
    console.log('User activity updated:', userId, amount);
  };

  const findReferrerByCode = (refCode: string) => {
    // Search through all stored user data to find the referrer
    const allUsers = getAllStoredUsers();
    return allUsers.find(userData => {
      const userCode = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + userData.id.slice(-4);
      return userCode === refCode;
    });
  };

  const getAllStoredUsers = () => {
    // Get all users from localStorage (simplified approach)
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('@ArbElite:user')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key) || '');
          users.push(userData);
        } catch (e) {
          // Skip invalid data
        }
      }
    }
    return users;
  };

  const withdrawCommission = () => {
    if (availableCommission > 0) {
      // Reset available commission (it would be processed via WhatsApp)
      setAvailableCommission(0);
      
      // Open WhatsApp
      const whatsappUrl = `https://api.whatsapp.com/send?phone=5517981401941&text=Ol%C3%A1%2C%20quero%20sacar%20minhas%20comiss%C3%B5es%20da%20Alian%C3%A7a%20ArbElite.%20Valor%20dispon%C3%ADvel%3A%20R%24%20${availableCommission.toFixed(2)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const getCommissionStats = () => {
    const totalReferrals = referredUsers.length;
    const activeReferrals = referredUsers.filter(u => u.status === 'active').length;
    const totalDepositsFromReferrals = referredUsers.reduce((sum, u) => sum + u.totalDeposits, 0);
    const averageDepositPerReferral = totalReferrals > 0 ? totalDepositsFromReferrals / totalReferrals : 0;

    return {
      totalReferrals,
      activeReferrals,
      totalDepositsFromReferrals,
      averageDepositPerReferral
    };
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    // Create a notification system
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

  return (
    <ReferralContext.Provider value={{
      referralCode,
      referredUsers,
      commissions,
      totalCommission,
      availableCommission,
      pendingCommission,
      getReferralLink,
      trackReferral,
      registerReferredUser,
      processDepositCommission,
      withdrawCommission,
      getCommissionStats,
      updateUserActivity
    }}>
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferral = (): ReferralContextData => {
  const context = useContext(ReferralContext);
  
  if (!context) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  
  return context;
};