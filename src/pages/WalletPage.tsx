import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useWithdrawal } from '../contexts/WithdrawalContext';
import Navbar from '../components/layout/Navbar';

const WalletPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { totalProfit } = useWallet();
  const {
    minimumWithdrawalAmount,
    canWithdraw,
    daysUntilNextWithdrawal,
    createWithdrawalOrder,
    reinvestProfit,
    withdrawalOrders
  } = useWithdrawal();
  
  const [amount, setAmount] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [pixKey, setPixKey] = React.useState('');
  const [loadingWithdrawal, setLoadingWithdrawal] = React.useState(false);
  const [error, setError] = React.useState('');
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleWithdrawal = async () => {
    setError('');
    
    if (!amount || !fullName || !pixKey) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError('Valor inválido');
      return;
    }
    
    if (withdrawalAmount > totalProfit) {
      setError('Valor maior que o lucro disponível');
      return;
    }
    
    setLoadingWithdrawal(true);
    
    try {
      await createWithdrawalOrder({
        amount: withdrawalAmount,
        fullName,
        pixKey
      });
      
      setAmount('');
      setFullName('');
      setPixKey('');
    } catch (err) {
      setError('Não foi possível processar o saque no momento');
    } finally {
      setLoadingWithdrawal(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const isFirstWithdrawal = withdrawalOrders.length === 0;
  const minAmount = isFirstWithdrawal ? 20 : 100;
  const canWithdrawNow = isFirstWithdrawal 
    ? totalProfit >= 20 
    : totalProfit >= 100 && daysUntilNextWithdrawal === 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Wallet / Saque</h2>
            
            <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-white/70">Lucro disponível para saque</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(totalProfit)}
              </p>
            </div>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Sua chave PIX"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valor do saque
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            
            {!isFirstWithdrawal && daysUntilNextWithdrawal > 0 && (
              <div className="mt-4 text-center text-sm text-yellow-500">
                Saque disponível em {daysUntilNextWithdrawal} dias
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <button
                className="btn-primary w-full"
                onClick={handleWithdrawal}
                disabled={!canWithdrawNow || loadingWithdrawal || !amount || parseFloat(amount) < minAmount}
              >
                {loadingWithdrawal ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                ) : (
                  'Sacar'
                )}
              </button>
              
              <button
                className="btn-secondary w-full"
                onClick={reinvestProfit}
                disabled={totalProfit <= 0}
              >
                Reinvestir Lucro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;