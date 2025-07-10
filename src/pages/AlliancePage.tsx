import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Copy, Users, DollarSign, TrendingUp, CheckCircle, Calendar, Activity, ExternalLink, AlertCircle, UserCheck, UserX, CreditCard, BarChart3, Target, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useReferral } from '../contexts/ReferralContext';
import Navbar from '../components/layout/Navbar';

const AlliancePage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { 
    getReferralLink, 
    referredUsers, 
    commissions,
    totalCommission, 
    availableCommission,
    withdrawCommission,
    getCommissionStats
  } = useReferral();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'commissions'>('overview');
  
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

  const referralLink = getReferralLink();
  const stats = getCommissionStats();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    
    // Show success notification
    showNotification('🎉 Link copiado com sucesso! Compartilhe e comece a ganhar comissões!', 'success');
    
    // Reset button state after 3 seconds
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWithdrawCommission = () => {
    withdrawCommission();
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck size={16} className="text-green-500" />;
      case 'inactive':
        return <UserX size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo (fez depósitos)';
      case 'inactive':
        return 'Inativo';
      default:
        return 'Novo (sem depósitos)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20';
      case 'inactive':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <Users size={32} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                🔗 Aliança ArbElite
              </h1>
            </div>
            
            <p className="text-xl text-white/80 mb-4">
              Sistema de Comissões por Indicação - Ganhe 10% sobre cada depósito dos seus indicados!
            </p>
            <p className="text-lg text-blue-400 font-medium">
              💰 Comissão automática e instantânea a cada depósito confirmado
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800/50 rounded-lg p-1 flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 size={16} className="inline mr-2" />
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === 'referrals' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users size={16} className="inline mr-2" />
                Indicados ({referredUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('commissions')}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === 'commissions' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <DollarSign size={16} className="inline mr-2" />
                Comissões ({commissions.length})
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Commission Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card text-center hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <DollarSign size={24} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Comissão Total</h3>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(totalCommission)}
                  </p>
                </div>
                
                <div className="card text-center hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={24} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Disponível</h3>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatCurrency(availableCommission)}
                  </p>
                </div>
                
                <div className="card text-center hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users size={24} className="text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Total Indicados</h3>
                  <p className="text-2xl font-bold text-purple-500">
                    {stats.totalReferrals}
                  </p>
                </div>

                <div className="card text-center hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Target size={24} className="text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Indicados Ativos</h3>
                  <p className="text-2xl font-bold text-orange-500">
                    {stats.activeReferrals}
                  </p>
                </div>
              </div>

              {/* Referral Link Section */}
              <div className="card mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    💰 Seu Link de Indicação Personalizado
                  </h2>
                  <p className="text-white/70">
                    Compartilhe seu link e ganhe 10% de comissão automática sobre cada depósito!
                  </p>
                </div>

                <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg p-6 border border-slate-600/50 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-center flex items-center justify-center">
                    <Copy size={20} className="mr-2 text-blue-400" />
                    Seu link de indicação:
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="w-full bg-slate-800/60 border border-slate-600 text-white rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 select-all"
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </div>
                    
                    <button
                      onClick={handleCopyLink}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center min-w-[140px] ${
                        copied 
                          ? 'bg-green-600 hover:bg-green-700 text-white scale-105' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:scale-105 shadow-lg hover:shadow-blue-500/25'
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle size={18} className="mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={18} className="mr-2" />
                          Copiar Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Withdraw Commission Button */}
                {availableCommission > 0 && (
                  <div className="text-center">
                    <button
                      onClick={handleWithdrawCommission}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center mx-auto"
                    >
                      <ExternalLink size={20} className="mr-2" />
                      💸 Sacar Comissão ({formatCurrency(availableCommission)})
                    </button>
                    <p className="text-xs text-white/50 mt-2">
                      Você será redirecionado para o WhatsApp do nosso suporte
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <Users size={24} className="mr-2 text-purple-500" />
                  Painel de Indicados
                </h3>
                {referredUsers.length > 0 && (
                  <div className="text-sm text-white/70">
                    Total: {referredUsers.length} indicados
                  </div>
                )}
              </div>
              
              {referredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users size={48} className="text-purple-500" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Nenhum usuário indicado ainda</h4>
                  <p className="text-white/50 mb-4">
                    Compartilhe seu link para começar a ganhar comissões!
                  </p>
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-200">
                      💡 <strong>Dica:</strong> Cada pessoa que se cadastrar usando seu link e fizer depósitos gerará 10% de comissão para você automaticamente!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 px-4 text-left text-sm font-medium text-white/70">Indicado</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-white/70">Cadastro</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-white/70">Status</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-white/70">Depósitos</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-white/70">Total Depositado</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-white/70">Comissão Gerada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-white/50">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm">
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-2 text-white/50" />
                              {user.registrationDate.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                {getStatusIcon(user.status)}
                                <span className="ml-1">{getStatusText(user.status)}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <Activity size={14} className="mr-1 text-white/50" />
                              <span className="text-sm font-medium">{user.depositsCount}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-blue-400 font-bold">
                              {formatCurrency(user.totalDeposits)}
                            </span>
                            {user.lastDepositDate && (
                              <p className="text-xs text-white/50 mt-1">
                                Último: {user.lastDepositDate.toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-green-500 font-bold">
                              {formatCurrency(user.commissionGenerated)}
                            </span>
                            {user.lastActivity && (
                              <p className="text-xs text-white/50 mt-1">
                                Última atividade: {user.lastActivity.toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <DollarSign size={24} className="mr-2 text-green-500" />
                  Histórico de Comissões
                </h3>
                {commissions.length > 0 && (
                  <div className="text-sm text-white/70">
                    Total: {commissions.length} comissões
                  </div>
                )}
              </div>
              
              {commissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <DollarSign size={48} className="text-green-500" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Nenhuma comissão gerada ainda</h4>
                  <p className="text-white/50 mb-4">
                    As comissões aparecerão aqui quando seus indicados fizerem depósitos
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 px-4 text-left text-sm font-medium text-white/70">Data</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-white/70">Indicado</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-white/70">Valor do Depósito</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-white/70">Comissão (10%)</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-white/70">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((commission) => (
                        <tr key={commission.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 text-sm">
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-2 text-white/50" />
                              {commission.date.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium">{commission.referredUserName}</p>
                            <p className="text-sm text-white/50">{commission.referredUserId}</p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-blue-400 font-bold">
                              {formatCurrency(commission.depositAmount)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-green-500 font-bold text-lg">
                              +{formatCurrency(commission.commissionAmount)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              <CheckCircle size={12} className="mr-1" />
                              Confirmada
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* How it Works Section */}
          <div className="card mt-8">
            <h3 className="text-xl font-semibold mb-6 text-center">🚀 Como Funciona o Sistema de Comissões</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h4 className="font-semibold mb-2">📤 Compartilhe</h4>
                <p className="text-white/70 text-sm">
                  Envie seu link personalizado para amigos e nas redes sociais
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h4 className="font-semibold mb-2">👥 Cadastro</h4>
                <p className="text-white/70 text-sm">
                  Quando alguém se registra com seu link, fica vinculado à sua conta
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h4 className="font-semibold mb-2">💳 Depósito</h4>
                <p className="text-white/70 text-sm">
                  Quando seu indicado faz um depósito, você ganha 10% automaticamente
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h4 className="font-semibold mb-2">💰 Receba</h4>
                <p className="text-white/70 text-sm">
                  Comissão creditada instantaneamente e disponível para saque
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="card text-center hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign size={24} className="text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">10% de Comissão</h3>
              <p className="text-white/70">
                Receba 10% de comissão sobre cada depósito realizado pelos seus indicados.
              </p>
            </div>
            
            <div className="card text-center hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Automático</h3>
              <p className="text-white/70">
                A comissão é creditada automaticamente quando o depósito é confirmado.
              </p>
            </div>
            
            <div className="card text-center hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sem Limites</h3>
              <p className="text-white/70">
                Indique quantas pessoas quiser e ganhe comissão de todas elas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlliancePage;