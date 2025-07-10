import React, { useState } from 'react';
import { Wallet, RefreshCw, Cloud, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';

const WalletCard: React.FC = () => {
  const { balance, totalProfit, loading, pendingDeposit, confirmDeposit, syncing, syncData } = useWallet();
  const { isSupabaseReady } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleConfirmDeposit = () => {
    confirmDeposit();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getSyncStatusIcon = () => {
    if (syncing) {
      return <Cloud size={14} className="mr-1 animate-pulse text-blue-400" />;
    }
    if (isSupabaseReady) {
      return <Cloud size={14} className="mr-1 text-green-400" />;
    }
    return null;
  };

  const getSyncStatusText = () => {
    if (syncing) {
      return 'Sincronizando...';
    }
    if (isSupabaseReady) {
      return 'Sincronizado';
    }
    return null;
  };

  const getSyncStatusColor = () => {
    if (syncing) {
      return 'text-blue-400';
    }
    if (isSupabaseReady) {
      return 'text-green-400';
    }
    return '';
  };

  return (
    <div className="card overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Wallet className="text-blue-500 mr-2" size={20} />
          <h2 className="text-xl font-semibold">Minha Carteira</h2>
        </div>
        <div className="flex items-center space-x-3">
          {/* Multi-device sync status */}
          {getSyncStatusText() && (
            <div className={`flex items-center ${getSyncStatusColor()}`}>
              {getSyncStatusIcon()}
              <span className="text-xs font-medium">{getSyncStatusText()}</span>
            </div>
          )}
          
          {/* Refresh button */}
          <button 
            onClick={handleRefresh}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            disabled={refreshing || syncing}
            title="Sincronizar dados entre dispositivos"
          >
            <RefreshCw size={16} className={refreshing || syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Multi-device indicator */}
      {isSupabaseReady && (
        <div className="mb-4 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex space-x-1 mr-3">
                <Smartphone size={14} className="text-green-400" />
                <Tablet size={14} className="text-green-400" />
                <Monitor size={14} className="text-green-400" />
              </div>
              <span className="text-sm text-green-300 font-medium">
                Multi-Dispositivos Ativo
              </span>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs text-green-200/80 mt-1">
            Seus dados estão sincronizados em tempo real entre todos os dispositivos
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-white/70 mb-1">Saldo disponível</p>
          <p className="text-2xl font-bold">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              formatCurrency(balance)
            )}
          </p>
          {isSupabaseReady && (
            <p className="text-xs text-green-400 mt-1">
              ✓ Sincronizado
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-white/70 mb-1">Lucro total</p>
          <p className="text-2xl font-bold text-green-500">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              formatCurrency(totalProfit)
            )}
          </p>
          {isSupabaseReady && (
            <p className="text-xs text-green-400 mt-1">
              ✓ Sincronizado
            </p>
          )}
        </div>
      </div>

      {pendingDeposit && (
        <div className="mt-4">
          <button
            onClick={handleConfirmDeposit}
            className="btn-primary w-full"
          >
            Confirmar Depósito de {formatCurrency(pendingDeposit)}
          </button>
        </div>
      )}

      {/* Sync Status Indicator */}
      <div className="absolute top-2 right-2">
        {syncing ? (
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" title="Sincronizando dados entre dispositivos" />
        ) : isSupabaseReady ? (
          <div className="w-2 h-2 bg-green-400 rounded-full" title="Dados sincronizados entre todos os dispositivos" />
        ) : null}
      </div>
    </div>
  );
};

export default WalletCard;