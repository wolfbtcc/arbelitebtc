import React from 'react';
import { Navigate } from 'react-router-dom';
import { Wallet, ArrowDownCircle, ExternalLink, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import Navbar from '../components/layout/Navbar';

const InvestmentWalletPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { balance, totalProfit } = useWallet();
  
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

  const totalWalletValue = balance + totalProfit;
  const withdrawalFeeRate = 0.28; // 28%
  const feeAmount = totalWalletValue * withdrawalFeeRate;
  const netAmount = totalWalletValue - feeAmount;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleWhatsAppRedirect = () => {
    const whatsappUrl = 'https://api.whatsapp.com/send?phone=5517981401941&text=Ola%2C%20quero%20sacar%20meu%20investimento%3F';
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
              <Shield size={24} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">🔐 Minha Wallet</h1>
              <p className="text-white/70">Gerencie seus investimentos e saques</p>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Wallet className="text-blue-500 mr-3" size={24} />
                <h2 className="text-xl font-semibold">Saldo da Carteira</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg p-4 border border-blue-500/30">
                <p className="text-sm text-blue-300 mb-1">Saldo Disponível</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(balance)}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-lg p-4 border border-green-500/30">
                <p className="text-sm text-green-300 mb-1">Lucro Acumulado</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-lg p-4 border border-purple-500/30">
              <p className="text-sm text-purple-300 mb-1">Valor Total da Carteira</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(totalWalletValue)}
              </p>
            </div>
          </div>

          {/* Withdrawal Simulation Card */}
          <div className="card mb-6">
            <div className="flex items-center mb-6">
              <ArrowDownCircle className="text-purple-500 mr-3" size={24} />
              <h2 className="text-xl font-semibold">Simulação de Saque de Investimento</h2>
            </div>

            <div className="space-y-4">
              {/* Available Amount */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Você tem disponível:</span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(totalWalletValue)}
                  </span>
                </div>
              </div>

              {/* Fee Rate */}
              <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-500/50">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-200">Taxa de saque:</span>
                  <span className="text-xl font-bold text-yellow-400">
                    28%
                  </span>
                </div>
              </div>

              {/* Net Amount */}
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/50">
                <div className="flex justify-between items-center">
                  <span className="text-green-200">Valor líquido que você vai receber:</span>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(netAmount)}
                  </span>
                </div>
              </div>

              {/* Fee Amount */}
              <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/50">
                <div className="flex justify-between items-center">
                  <span className="text-red-200">Valor descontado da taxa:</span>
                  <span className="text-xl font-bold text-red-400">
                    {formatCurrency(feeAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="mt-6 bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                <strong>📋 Informações importantes:</strong>
              </p>
              <ul className="text-xs text-blue-200/80 mt-2 space-y-1">
                <li>• A taxa de 28% é aplicada automaticamente sobre o valor total</li>
                <li>• O saque será processado em até 48 horas úteis</li>
                <li>• Você receberá uma confirmação via WhatsApp</li>
                <li>• Valores mínimos e máximos podem se aplicar</li>
              </ul>
            </div>
          </div>

          {/* WhatsApp Button */}
          <div className="text-center">
            <button
              onClick={handleWhatsAppRedirect}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center mx-auto"
            >
              <ExternalLink size={20} className="mr-2" />
              📲 Solicitar Saque de Investimento
            </button>
            
            <p className="text-xs text-white/50 mt-3">
              Você será redirecionado para o WhatsApp do nosso suporte
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-8 bg-slate-800/30 border border-slate-600/50 rounded-lg p-4">
            <div className="flex items-start">
              <Shield size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-white/80">
                  <strong>🔒 Segurança:</strong> Todos os saques são processados manualmente por nossa equipe de segurança para garantir a proteção dos seus fundos. Mantenha seus dados de contato atualizados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentWalletPage;