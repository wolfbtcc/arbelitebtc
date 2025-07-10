import React, { useState } from 'react';
import { Copy, SendHorizontal, Clock, CheckCircle, AlertCircle, RefreshCw, Zap, DollarSign } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { usePayment } from '../../contexts/PaymentContext';

const DepositCard: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [showUsdtInfo, setShowUsdtInfo] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const { addPendingDeposit } = useWallet();
  const { addPendingPayment, pendingPayments, isMonitoring } = usePayment();

  const usdtAddress = '0x4d286e0a69876b2bdbe0654a56a24986aa1d7694';
  const minimumAmount = 50;

  const handleGenerateUsdt = () => {
    const amountValue = parseFloat(amount);
    
    if (!amount || amountValue <= 0) {
      return;
    }

    if (amountValue < minimumAmount) {
      alert(`Valor mínimo R$${minimumAmount.toFixed(2)}`);
      return;
    }

    setShowUsdtInfo(true);
  };

  const copyUsdtAddress = () => {
    navigator.clipboard.writeText(usdtAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = () => {
    if (!txHash.trim()) {
      alert('Por favor, insira o hash da transação');
      return;
    }

    // Validate transaction hash format
    const cleanHash = txHash.trim();
    if (!cleanHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      alert('Hash da transação inválido. Deve começar com 0x e ter 66 caracteres no total.');
      return;
    }

    const amountValue = parseFloat(amount);
    addPendingPayment(cleanHash, amountValue);
    
    setAmount('');
    setTxHash('');
    setShowUsdtInfo(false);
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
      case 'confirmed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <RefreshCw size={16} className="text-blue-400 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Creditado';
      case 'failed':
        return 'Falhou';
      default:
        return 'Verificando...';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'border-green-500/50 bg-green-500/20';
      case 'failed':
        return 'border-red-500/50 bg-red-500/20';
      default:
        return 'border-blue-500/50 bg-blue-500/20';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Fazer Depósito</h2>
        {isMonitoring && (
          <div className="flex items-center text-blue-400">
            <Zap size={16} className="mr-1 animate-pulse" />
            <span className="text-xs">Verificação Instantânea</span>
          </div>
        )}
      </div>

      {/* Instant Verification Notice */}
      {isMonitoring && (
        <div className="mb-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <Zap size={16} className="text-blue-400 mr-2 animate-pulse" />
            <span className="text-sm font-medium text-blue-300">Sistema de Verificação Instantânea Ativo</span>
          </div>
          <p className="text-xs text-blue-200">
            Suas transações USDT são verificadas automaticamente a cada 5 segundos e o valor exato da blockchain é creditado instantaneamente após confirmação.
          </p>
        </div>
      )}

      {/* Pending Payments Status */}
      {pendingPayments.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-medium text-white/80 mb-2 flex items-center">
            <Clock size={14} className="mr-2" />
            Status das Transações USDT
          </h3>
          {pendingPayments.map((payment) => (
            <div key={payment.id} className={`border rounded-lg p-3 ${getStatusColor(payment.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    {getStatusIcon(payment.status)}
                    <span className="text-sm font-medium ml-2">
                      {getStatusText(payment.status)}
                    </span>
                    {payment.status === 'pending' && (
                      <div className="ml-2 flex items-center">
                        <Zap size={12} className="text-yellow-400 animate-pulse" />
                        <span className="text-xs text-yellow-400 ml-1">Verificação a cada 5s</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/70">
                    Hash: {payment.txHash.slice(0, 10)}...{payment.txHash.slice(-6)}
                  </p>
                  {payment.blockchainAmount && (
                    <p className="text-xs text-green-400 font-medium mt-1">
                      <DollarSign size={10} className="inline mr-1" />
                      Valor da blockchain: {formatCurrency(payment.blockchainAmount)}
                    </p>
                  )}
                  <p className="text-xs text-white/50 mt-1">
                    {payment.timestamp.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  {payment.status === 'pending' && (
                    <div className="text-xs text-white/50">
                      <p className="flex items-center">
                        <RefreshCw size={10} className="mr-1 animate-spin" />
                        {payment.retryCount > 0 && `${payment.retryCount} verificações`}
                      </p>
                      <p className="text-blue-400 font-medium mt-1">
                        ⚡ Detecção Automática
                      </p>
                    </div>
                  )}
                  {payment.status === 'confirmed' && (
                    <p className="text-xs text-green-400 font-medium">
                      ✅ Valor Exato Creditado
                    </p>
                  )}
                  {payment.status === 'failed' && (
                    <p className="text-xs text-red-400 font-medium">
                      ❌ Erro na Verificação
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showUsdtInfo ? (
        <>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm text-white/70 mb-1">
              Valor a depositar (R$)
            </label>
            <input
              id="amount"
              type="number"
              className="input-field"
              placeholder="0.00"
              min={minimumAmount}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-white/50 mt-1">
              Valor mínimo: R$ {minimumAmount.toFixed(2)}
            </p>
          </div>

          <button 
            className="btn-primary w-full flex items-center justify-center"
            onClick={handleGenerateUsdt}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            <Zap size={20} className="mr-2 animate-pulse" />
            Depositar via USDT (Detecção Automática)
          </button>
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <p className="mb-1 text-sm text-white/70">Envie USDT para o endereço abaixo</p>
            <p className="text-xs text-yellow-400 mb-3">BNB Smart Chain (BEP20)</p>
            <p className="text-lg font-semibold text-green-400">
              Valor estimado: {formatCurrency(parseFloat(amount))}
            </p>
            <p className="text-xs text-blue-300 mt-1">
              💡 O valor exato da blockchain será creditado automaticamente
            </p>
          </div>

          {/* Instant Credit Notice */}
          <div className="mb-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Zap size={16} className="text-green-400 mr-2 animate-pulse" />
              <span className="text-sm font-medium text-green-300">⚡ Detecção Automática da Blockchain</span>
            </div>
            <p className="text-xs text-green-200">
              Após inserir o hash da transação, nosso sistema detectará automaticamente o valor exato da blockchain e creditará instantaneamente quando confirmado (apenas 1 confirmação necessária).
            </p>
          </div>
          
          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <img 
              src="https://i.imgur.com/jbBVJ80.png" 
              alt="QR Code USDT Address"
              className="w-48 h-48 rounded-lg border border-white/20"
            />
          </div>
          
          <div className="relative mb-4">
            <label className="block text-sm text-white/70 mb-1">
              Endereço USDT (BEP20)
            </label>
            <input
              type="text"
              value={usdtAddress}
              readOnly
              className="input-field pr-12 text-sm"
            />
            <button 
              onClick={copyUsdtAddress}
              className="absolute right-2 top-8 p-2 text-white/70 hover:text-white"
              title="Copiar endereço"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-1">
              Hash da Transação (após enviar USDT)
            </label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
            />
            <p className="text-xs text-white/50 mt-1">
              Cole aqui o hash da transação após enviar o USDT
            </p>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-200">
              <strong>Importante:</strong> Envie apenas USDT na rede BNB Smart Chain (BEP20) para o endereço acima. 
              Outros tokens ou redes resultarão em perda dos fundos.
            </p>
          </div>

          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4">
            <div className="flex items-center mb-2">
              <Zap size={16} className="text-green-400 mr-2 animate-pulse" />
              <span className="text-sm font-medium text-green-300">Sistema de Detecção Automática</span>
            </div>
            <p className="text-xs text-green-200">
              <strong>Verificação Automática:</strong> Após inserir o hash, nosso sistema verificará automaticamente a transação a cada 5 segundos. 
              O valor exato detectado na blockchain será creditado instantaneamente quando a transação for confirmada (apenas 1 confirmação necessária).
            </p>
          </div>
          
          <button 
            onClick={handleConfirmPayment}
            className="btn-primary w-full mb-3 flex items-center justify-center"
            disabled={!txHash.trim()}
          >
            <Zap size={18} className="mr-2 animate-pulse" />
            Iniciar Detecção Automática
          </button>

          <button
            onClick={() => setShowUsdtInfo(false)}
            className="btn-secondary w-full mb-3 flex items-center justify-center"
          >
            ← Voltar
          </button>

          <a 
            href="https://wa.me/5511999999999?text=Comprovante%20de%20pagamento%20USDT%20ArbElite"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full flex items-center justify-center"
          >
            <SendHorizontal size={18} className="mr-2" />
            Enviar Comprovante via WhatsApp
          </a>
          
          <p className="text-xs text-blue-400 mt-4 text-center">
            ⚡ Verificação automática a cada 5 segundos. Valor exato da blockchain creditado após 1 confirmação.
          </p>
        </>
      )}
    </div>
  );
};

export default DepositCard;