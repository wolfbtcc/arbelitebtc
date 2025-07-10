import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useWithdrawal } from '../../contexts/WithdrawalContext';
import { useWallet } from '../../contexts/WalletContext';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose }) => {
  const { totalProfit } = useWallet();
  const {
    minimumWithdrawalAmount,
    canWithdraw,
    daysUntilNextWithdrawal,
    createWithdrawalOrder,
    reinvestProfit,
    withdrawalOrders
  } = useWithdrawal();
  
  const [amount, setAmount] = useState('');
  const [fullName, setFullName] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
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
    
    if (withdrawalAmount < minimumWithdrawalAmount) {
      setError(`Valor mínimo para saque é ${formatCurrency(minimumWithdrawalAmount)}`);
      return;
    }
    
    setLoading(true);
    
    try {
      await createWithdrawalOrder({
        amount: withdrawalAmount,
        fullName,
        pixKey
      });
      
      onClose();
    } catch (err) {
      setError('Não foi possível processar o saque no momento');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReinvestProfit = () => {
    reinvestProfit();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 rounded-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <div className="p-6">
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
          </div>
          
          {!canWithdraw && totalProfit < minimumWithdrawalAmount && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-md p-3 mt-6 text-center">
              <p className="text-sm">
                ⚠️ Você precisa acumular pelo menos {formatCurrency(minimumWithdrawalAmount)} de lucro
                para liberar seu {withdrawalOrders?.length === 0 ? 'primeiro' : 'próximo'} saque.
              </p>
            </div>
          )}
          
          {!canWithdraw && daysUntilNextWithdrawal > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-md p-3 mt-6 text-center">
              <p className="text-sm text-yellow-200">
                Aguarde {daysUntilNextWithdrawal} dias para realizar o próximo saque
              </p>
            </div>
          )}
          
          <div className="mt-6 space-y-3">
            <button
              className="btn-primary w-full"
              onClick={handleWithdrawal}
              disabled={!canWithdraw || loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Processando...
                </span>
              ) : (
                'Sacar'
              )}
            </button>
            
            <button
              className="btn-secondary w-full"
              onClick={handleReinvestProfit}
              disabled={totalProfit <= 0}
            >
              <RefreshCw size={18} className="mr-2" />
              Reinvestir Lucro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalModal;