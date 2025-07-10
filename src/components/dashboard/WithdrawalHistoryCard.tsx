import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, CreditCard } from 'lucide-react';
import { useWithdrawal } from '../../contexts/WithdrawalContext';
import { useAuth } from '../../contexts/AuthContext';

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

const WithdrawalHistoryCard: React.FC = () => {
  const { withdrawalOrders } = useWithdrawal();
  const { user } = useAuth();
  const [usdtWithdrawals, setUsdtWithdrawals] = useState<UsdtWithdrawalOrder[]>([]);

  // Load USDT withdrawals from localStorage
  useEffect(() => {
    if (user?.email) {
      const storedUsdtWithdrawals = localStorage.getItem(`usdt_withdrawals_${user.email}`);
      if (storedUsdtWithdrawals) {
        const parsedWithdrawals = JSON.parse(storedUsdtWithdrawals).map((withdrawal: any) => ({
          ...withdrawal,
          createdAt: new Date(withdrawal.createdAt)
        }));
        setUsdtWithdrawals(parsedWithdrawals);
      }
    } else {
      setUsdtWithdrawals([]);
    }
  }, [user?.email]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Combine PIX and USDT withdrawals and sort by date
  const allWithdrawals = [
    ...withdrawalOrders.map(order => ({ ...order, type: 'pix' as const })),
    ...usdtWithdrawals
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getWithdrawalIcon = (type: string) => {
    return type === 'usdt' ? (
      <DollarSign size={16} className="text-yellow-500" />
    ) : (
      <CreditCard size={16} className="text-blue-500" />
    );
  };

  const getWithdrawalTypeLabel = (type: string) => {
    return type === 'usdt' ? 'USDT (BEP20)' : 'PIX';
  };

  const getWithdrawalDetails = (withdrawal: any) => {
    if (withdrawal.type === 'usdt') {
      return (
        <div className="text-xs text-white/50 mt-1">
          <p>Endereço: {withdrawal.usdtAddress.slice(0, 10)}...{withdrawal.usdtAddress.slice(-6)}</p>
          <p>Taxa: {formatCurrency(withdrawal.fee)} | Líquido: {formatCurrency(withdrawal.netAmount)}</p>
        </div>
      );
    } else {
      return (
        <div className="text-xs text-white/50 mt-1">
          <p>PIX: {withdrawal.pixKey}</p>
        </div>
      );
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Histórico de Saques</h2>
        <Clock size={16} className="text-white/70" />
      </div>
      
      {allWithdrawals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/50">Nenhum saque realizado ainda</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 px-4 text-left text-xs font-medium text-white/70">Data</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-white/70">Tipo</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-white/70">Detalhes</th>
                <th className="py-2 px-4 text-right text-xs font-medium text-white/70">Valor</th>
                <th className="py-2 px-4 text-center text-xs font-medium text-white/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {allWithdrawals.map((withdrawal, index) => (
                <tr key={withdrawal.id || index} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-sm">
                    {new Date(withdrawal.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center">
                      {getWithdrawalIcon(withdrawal.type)}
                      <span className="ml-2">{getWithdrawalTypeLabel(withdrawal.type)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {withdrawal.type === 'pix' ? (
                      <div>
                        <p className="font-medium">{withdrawal.fullName}</p>
                        <p className="text-white/70">{withdrawal.pixKey}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Carteira USDT</p>
                        <p className="text-white/70 font-mono text-xs">
                          {withdrawal.usdtAddress.slice(0, 10)}...{withdrawal.usdtAddress.slice(-6)}
                        </p>
                        <p className="text-xs text-yellow-400 mt-1">
                          Taxa: {formatCurrency(withdrawal.fee)} | Líquido: {formatCurrency(withdrawal.netAmount)}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    {formatCurrency(withdrawal.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">
                      {withdrawal.status === 'pending' ? 'Pendente' : 'Concluído'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistoryCard;