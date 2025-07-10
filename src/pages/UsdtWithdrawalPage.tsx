import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { DollarSign, AlertCircle, CheckCircle, Wallet, ExternalLink, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useWithdrawal } from '../contexts/WithdrawalContext';
import Navbar from '../components/layout/Navbar';

interface UsdtWithdrawalOrder {
  id: string;
  amount: number;
  netAmount: number;
  fee: number;
  usdtAddress: string;
  status: 'pending' | 'completed';
  createdAt: Date;
  type: 'usdt';
}

const UsdtWithdrawalPage: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const { totalProfit, subtractFromBalance, updateProfit } = useWallet();
  const { withdrawalOrders, setWithdrawalOrders } = useWithdrawal();
  
  const [amount, setAmount] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const USDT_FEE_RATE = 0.03; // 3%
  const MIN_WITHDRAWAL_AMOUNT = 100;
  
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculateNetAmount = (withdrawalAmount: number) => {
    const fee = withdrawalAmount * USDT_FEE_RATE;
    const netAmount = withdrawalAmount - fee;
    return { fee, netAmount };
  };

  const validateUsdtAddress = (address: string) => {
    // Basic validation for BEP20 address format
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setError('');
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdtAddress(value);
    setError('');
  };

  const handleWithdrawal = async () => {
    setError('');
    setSuccess('');
    
    // Validações
    if (!amount || !usdtAddress) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    const withdrawalAmount = parseFloat(amount);
    
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError('Valor inválido');
      return;
    }
    
    if (withdrawalAmount < MIN_WITHDRAWAL_AMOUNT) {
      setError(`Valor mínimo para saque é ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}`);
      return;
    }
    
    if (withdrawalAmount > totalProfit) {
      setError('Valor maior que o lucro disponível');
      return;
    }
    
    if (!validateUsdtAddress(usdtAddress)) {
      setError('Endereço USDT inválido. Deve ser um endereço BEP20 válido (0x...)');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { fee, netAmount } = calculateNetAmount(withdrawalAmount);
      
      // Criar ordem de saque USDT
      const newUsdtOrder: UsdtWithdrawalOrder = {
        id: `usdt-withdrawal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: withdrawalAmount,
        netAmount,
        fee,
        usdtAddress,
        status: 'pending',
        createdAt: new Date(),
        type: 'usdt'
      };
      
      // Salvar no localStorage
      const existingOrders = JSON.parse(localStorage.getItem(`usdt_withdrawals_${user?.email}`) || '[]');
      existingOrders.unshift(newUsdtOrder);
      localStorage.setItem(`usdt_withdrawals_${user?.email}`, JSON.stringify(existingOrders));
      
      // Atualizar estado da carteira
      await subtractFromBalance(withdrawalAmount);
      await updateProfit(totalProfit - withdrawalAmount);
      
      // Mostrar mensagem de sucesso
      setSuccess(`Seu pedido de saque foi enviado com sucesso. O valor líquido de ${formatCurrency(netAmount)} será creditado em sua carteira USDT em até 72 horas úteis.`);
      
      // Limpar campos
      setAmount('');
      setUsdtAddress('');
      
      // Scroll para o topo para mostrar a mensagem
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err) {
      console.error('Erro ao processar saque USDT:', err);
      setError('Não foi possível processar o saque no momento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentAmount = parseFloat(amount) || 0;
  const { fee, netAmount } = calculateNetAmount(currentAmount);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                <DollarSign size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
              💰 Sacar em USDT
            </h1>
            <p className="text-white/70 text-lg">
              Receba seus lucros diretamente em sua carteira USDT (BEP20)
            </p>
          </div>

          {/* Available Balance */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Wallet className="text-green-500 mr-3" size={24} />
                <h2 className="text-xl font-semibold">Lucro Disponível</h2>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-lg p-6 border border-green-500/30 text-center">
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(totalProfit)}
              </p>
              <p className="text-green-300/70 mt-2">
                Disponível para saque
              </p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-white px-6 py-4 rounded-lg mb-6 flex items-start">
              <CheckCircle size={20} className="mr-3 mt-0.5 flex-shrink-0 text-green-400" />
              <div>
                <p className="font-medium mb-2">✅ Saque Solicitado com Sucesso!</p>
                <p className="text-sm text-green-200">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white px-6 py-4 rounded-lg mb-6 flex items-start">
              <AlertCircle size={20} className="mr-3 mt-0.5 flex-shrink-0 text-red-400" />
              <div>
                <p className="font-medium mb-1">❌ Erro</p>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Withdrawal Form */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-6">Dados do Saque</h2>
            
            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Valor do saque (R$)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="100.00"
                  min={MIN_WITHDRAWAL_AMOUNT}
                  step="0.01"
                  value={amount}
                  onChange={handleAmountChange}
                  disabled={isProcessing}
                />
                <p className="text-xs text-white/50 mt-1">
                  Valor mínimo: {formatCurrency(MIN_WITHDRAWAL_AMOUNT)}
                </p>
              </div>

              {/* USDT Address Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Endereço da Carteira USDT (BEP20)
                </label>
                <input
                  type="text"
                  className="input-field font-mono text-sm"
                  placeholder="0x... (Endereço BNB Smart Chain - BEP20)"
                  value={usdtAddress}
                  onChange={handleAddressChange}
                  disabled={isProcessing}
                />
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ Importante: Use apenas endereços da rede BNB Smart Chain (BEP20)
                </p>
              </div>

              {/* Fee Calculation */}
              {currentAmount >= MIN_WITHDRAWAL_AMOUNT && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50">
                  <h3 className="text-lg font-medium mb-4">💰 Cálculo do Saque</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Valor solicitado:</span>
                      <span className="font-bold text-white">
                        {formatCurrency(currentAmount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Taxa (3%):</span>
                      <span className="font-bold text-red-400">
                        -{formatCurrency(fee)}
                      </span>
                    </div>
                    
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-300 font-medium">Valor líquido a receber:</span>
                        <span className="text-xl font-bold text-green-400">
                          {formatCurrency(netAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                onClick={handleWithdrawal}
                disabled={
                  isProcessing || 
                  !amount || 
                  !usdtAddress || 
                  currentAmount < MIN_WITHDRAWAL_AMOUNT || 
                  currentAmount > totalProfit
                }
                className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processando saque...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <DollarSign size={20} className="mr-2" />
                    Fazer Saque em USDT
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Important Information */}
          <div className="card">
            <div className="flex items-start mb-4">
              <Shield size={20} className="text-blue-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-3">
                  📋 Informações Importantes
                </h3>
                
                <div className="space-y-3 text-sm text-white/80">
                  <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
                    <p className="text-yellow-200 font-medium mb-2">⚠️ Atenção:</p>
                    <p className="text-yellow-100">
                      Todos os saques realizados na plataforma, seja via PIX ou USDT, estão sujeitos a uma taxa de 3%. 
                      O valor líquido será creditado em até 72 horas úteis.
                    </p>
                  </div>
                  
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Use apenas endereços da rede BNB Smart Chain (BEP20)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Verifique cuidadosamente o endereço antes de confirmar</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Saques são processados em até 72 horas úteis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Você receberá uma confirmação quando o saque for processado</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Em caso de dúvidas, entre em contato com nosso suporte</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Support Contact */}
          <div className="text-center mt-6">
            <p className="text-white/50 text-sm mb-3">
              Precisa de ajuda? Entre em contato com nosso suporte
            </p>
            <a
              href="https://api.whatsapp.com/send?phone=5517981401941&text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20saque%20em%20USDT"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center"
            >
              <ExternalLink size={16} className="mr-2" />
              Suporte via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsdtWithdrawalPage;