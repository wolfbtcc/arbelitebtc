import React from 'react';
import { Clock } from 'lucide-react';
import { useArbitrage } from '../../contexts/ArbitrageContext';

const OrderHistoryCard: React.FC = () => {
  const { orderHistory } = useArbitrage();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Histórico de Operações</h2>
        <Clock size={16} className="text-white/70" />
      </div>
      
      {orderHistory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/50">Nenhuma operação realizada ainda</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 px-4 text-left text-xs font-medium text-white/70">Data</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-white/70">Exchanges</th>
                <th className="py-2 px-4 text-right text-xs font-medium text-white/70">Valor</th>
                <th className="py-2 px-4 text-right text-xs font-medium text-white/70">Spread</th>
                <th className="py-2 px-4 text-right text-xs font-medium text-white/70">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-sm">
                    {order.date}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center">
                      {order.sourceExchange}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-2 text-blue-500">
                        <path d="M5 12h14"></path>
                        <path d="M12 5l7 7-7 7"></path>
                      </svg>
                      {order.targetExchange}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    {formatCurrency(order.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-blue-400">
                    {order.spread}%
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-green-500">
                    +{formatCurrency(order.profit)}
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

export default OrderHistoryCard;