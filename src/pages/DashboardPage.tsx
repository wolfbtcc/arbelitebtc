import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WalletCard from '../components/dashboard/WalletCard';
import DepositCard from '../components/dashboard/DepositCard';
import ArbitrageCard from '../components/dashboard/ArbitrageCard';
import OrderHistoryCard from '../components/dashboard/OrderHistoryCard';
import WithdrawalHistoryCard from '../components/dashboard/WithdrawalHistoryCard';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { isAuthenticated, user, userProfile, loading } = useAuth();
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hours = new Date().getHours();
    let newGreeting;
    
    if (hours < 12) {
      newGreeting = 'Bom dia';
    } else if (hours < 18) {
      newGreeting = 'Boa tarde';
    } else {
      newGreeting = 'Boa noite';
    }
    
    setGreeting(newGreeting);
  }, []);
  
  // Show minimal loading for dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getUserDisplayName = () => {
    return userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto py-6 px-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">
            {greeting}, {getUserDisplayName()}
          </h1>
          <p className="text-white/70">
            Confira as oportunidades de arbitragem disponíveis hoje
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <WalletCard />
          </div>
          <div>
            <DepositCard />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <ArbitrageCard />
          </div>
          <div>
            <OrderHistoryCard />
          </div>
        </div>

        <div className="mt-4">
          <WithdrawalHistoryCard />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;