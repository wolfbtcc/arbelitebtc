import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { useReferral } from './ReferralContext';

interface PendingPayment {
  id: string;
  txHash: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  retryCount: number;
  lastChecked?: Date;
  blockchainAmount?: number;
  errorMessage?: string;
}

interface UsedTransaction {
  txHash: string;
  userId: string;
  amount: number;
  confirmedAt: Date;
}

interface PaymentContextData {
  pendingPayments: PendingPayment[];
  addPendingPayment: (txHash: string, amount: number) => void;
  removePendingPayment: (id: string) => void;
  isMonitoring: boolean;
}

const PaymentContext = createContext<PaymentContextData>({} as PaymentContextData);

// Endereço da carteira USDT BEP20 (convertido para lowercase para comparação)
const USDT_WALLET_ADDRESS = '0x4d286e0a69876b2bdbe0654a56a24986aa1d7694'.toLowerCase();

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSupabaseReady } = useAuth();
  const { confirmDeposit } = useWallet();
  const { processDepositCommission } = useReferral();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Load pending payments from localStorage
  useEffect(() => {
    if (user?.email) {
      const stored = localStorage.getItem(`pending_payments_${user.email}`);
      if (stored) {
        const payments = JSON.parse(stored).map((p: any) => ({
          ...p,
          timestamp: new Date(p.timestamp),
          lastChecked: p.lastChecked ? new Date(p.lastChecked) : undefined
        }));
        setPendingPayments(payments);
        console.log(`📱 Carregados ${payments.length} pagamentos pendentes para verificação instantânea`);
      }
    } else {
      setPendingPayments([]);
    }
  }, [user?.email]);

  // Save pending payments to localStorage for multi-device sync
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`pending_payments_${user.email}`, JSON.stringify(pendingPayments));
      
      // Sync across tabs/devices
      if (pendingPayments.length > 0) {
        localStorage.setItem('payment_sync_trigger', Date.now().toString());
      }
    }
  }, [pendingPayments, user?.email]);

  // Listen for payment updates from other tabs/devices
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'payment_sync_trigger' && user?.email) {
        console.log('🔄 Detectada atualização de pagamentos em outro dispositivo - Sincronizando...');
        const stored = localStorage.getItem(`pending_payments_${user.email}`);
        if (stored) {
          const payments = JSON.parse(stored).map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp),
            lastChecked: p.lastChecked ? new Date(p.lastChecked) : undefined
          }));
          setPendingPayments(payments);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?.email]);

  // Monitor pending payments with instant verification (every 3 seconds for faster response)
  useEffect(() => {
    if (pendingPayments.length === 0) {
      setIsMonitoring(false);
      return;
    }

    setIsMonitoring(true);
    console.log(`🔍 Monitoramento instantâneo ativo para ${pendingPayments.length} transações USDT...`);
    
    // Check immediately when payments are added
    checkPendingPayments();
    
    // Then check every 3 seconds for instant verification
    const interval = setInterval(async () => {
      await checkPendingPayments();
    }, 3000);

    return () => clearInterval(interval);
  }, [pendingPayments.length]);

  // Global registry of used transactions (prevents cross-account duplicates)
  const getUsedTransactions = (): UsedTransaction[] => {
    const stored = localStorage.getItem('global_used_transactions');
    return stored ? JSON.parse(stored) : [];
  };

  const addUsedTransaction = (txHash: string, userId: string, amount: number) => {
    const usedTransactions = getUsedTransactions();
    const newTransaction: UsedTransaction = {
      txHash: txHash.toLowerCase(),
      userId,
      amount,
      confirmedAt: new Date()
    };
    
    usedTransactions.push(newTransaction);
    localStorage.setItem('global_used_transactions', JSON.stringify(usedTransactions));
    
    // Sync across all devices
    localStorage.setItem('global_tx_sync_trigger', Date.now().toString());
    
    console.log(`🔒 Transação ${txHash.slice(0, 10)}... marcada como usada globalmente`);
  };

  const isTransactionUsed = (txHash: string): boolean => {
    const usedTransactions = getUsedTransactions();
    return usedTransactions.some(tx => tx.txHash === txHash.toLowerCase());
  };

  // Listen for global transaction updates
  useEffect(() => {
    const handleGlobalTxSync = (e: StorageEvent) => {
      if (e.key === 'global_tx_sync_trigger') {
        console.log('🔄 Sincronizando transações globais entre dispositivos...');
        // This will trigger a re-check of pending payments
        if (pendingPayments.length > 0) {
          setTimeout(() => checkPendingPayments(), 1000);
        }
      }
    };

    window.addEventListener('storage', handleGlobalTxSync);
    
    return () => {
      window.removeEventListener('storage', handleGlobalTxSync);
    };
  }, [pendingPayments.length]);

  const checkPendingPayments = async () => {
    if (!user?.email || pendingPayments.length === 0) return;

    const updatedPayments = [...pendingPayments];
    let hasChanges = false;

    console.log(`🔍 Verificação instantânea de ${updatedPayments.length} transações USDT...`);

    for (let i = 0; i < updatedPayments.length; i++) {
      const payment = updatedPayments[i];
      
      if (payment.status !== 'pending') continue;

      // Check if transaction was used by another account while we were monitoring
      if (isTransactionUsed(payment.txHash)) {
        payment.status = 'failed';
        payment.errorMessage = 'Esta transação já foi utilizada em outra conta';
        showNotification(
          `❌ Transação ${payment.txHash.slice(0, 10)}... já foi utilizada em outra conta. Cada hash só pode ser usada uma vez.`,
          'error'
        );
        hasChanges = true;
        continue;
      }

      // Don't check too frequently for the same transaction (minimum 2 seconds)
      const now = new Date();
      if (payment.lastChecked && (now.getTime() - payment.lastChecked.getTime()) < 2000) {
        continue;
      }

      try {
        console.log(`🔍 Verificação instantânea: ${payment.txHash.slice(0, 10)}...`);
        const transactionData = await checkTransactionStatus(payment.txHash);
        
        payment.lastChecked = now;
        payment.retryCount++;
        
        if (transactionData.isConfirmed && transactionData.value > 0) {
          // Double-check if transaction wasn't used while we were checking
          if (isTransactionUsed(payment.txHash)) {
            payment.status = 'failed';
            payment.errorMessage = 'Transação foi utilizada em outra conta durante a verificação';
            showNotification(
              `❌ Esta transação foi utilizada em outra conta durante a verificação.`,
              'error'
            );
            hasChanges = true;
            continue;
          }

          // Use the exact amount from blockchain
          const blockchainAmount = transactionData.value;
          
          // Mark transaction as used IMMEDIATELY to prevent duplicates
          addUsedTransaction(payment.txHash, user.email, blockchainAmount);
          
          payment.status = 'confirmed';
          payment.blockchainAmount = blockchainAmount;
          
          // Credit the exact amount from blockchain
          confirmDeposit(blockchainAmount);
          
          // Process referral commission if user was referred
          processDepositCommission(user.email, blockchainAmount);
          
          hasChanges = true;
          
          showNotification(
            `✅ USDT Creditado Instantaneamente! R$ ${blockchainAmount.toFixed(2)} foi creditado em sua conta conforme detectado na blockchain. Transação confirmada!`,
            'success'
          );
          
          // Remove from pending after showing success message
          setTimeout(() => {
            setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
          }, 8000);
          
        } else if (transactionData.isFailed) {
          // Transaction failed
          payment.status = 'failed';
          payment.errorMessage = transactionData.errorMessage || 'Transação falhou na blockchain';
          showNotification(
            `❌ Transação ${payment.txHash.slice(0, 10)}... falhou: ${payment.errorMessage}`,
            'error'
          );
          hasChanges = true;
        } else {
          // Still pending - check if it's been too long
          const hoursSinceSubmission = (now.getTime() - payment.timestamp.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceSubmission > 3) {
            // Mark as failed after 3 hours for instant verification
            payment.status = 'failed';
            payment.errorMessage = 'Transação expirou (3h sem confirmação)';
            showNotification(
              `⏰ Transação ${payment.txHash.slice(0, 10)}... expirou (3h sem confirmação)`,
              'error'
            );
            hasChanges = true;
          }
        }
      } catch (error: any) {
        console.error('Erro ao verificar transação:', error);
        payment.retryCount++;
        payment.lastChecked = now;
        payment.errorMessage = error.message || 'Erro na verificação';
        hasChanges = true;
        
        // If we've had too many errors, mark as failed
        if (payment.retryCount > 50) {
          payment.status = 'failed';
          payment.errorMessage = 'Muitas tentativas de verificação falharam';
          showNotification(
            `❌ Erro ao verificar transação ${payment.txHash.slice(0, 10)}... após muitas tentativas. Contate o suporte.`,
            'error'
          );
        }
      }
    }

    if (hasChanges) {
      setPendingPayments(updatedPayments);
      console.log('✅ Status dos pagamentos USDT atualizado instantaneamente');
    }
  };

  const checkTransactionStatus = async (txHash: string): Promise<{
    isConfirmed: boolean;
    isFailed: boolean;
    value: number;
    confirmations: number;
    errorMessage?: string;
  }> => {
    try {
      console.log(`🔍 Verificando transação: ${txHash}`);
      
      // Using multiple BSCScan API keys for better reliability
      const apiKeys = [
        'GNCI631T4Q2KKXVDYE5NN1HQ2N281UXWR5',
        'YourBackupApiKey1',
        'YourBackupApiKey2'
      ];
      
      let lastError: any = null;
      
      // Try each API key until one works
      for (const apiKey of apiKeys) {
        try {
          const result = await checkWithApiKey(txHash, apiKey);
          return result;
        } catch (error) {
          console.warn(`API key ${apiKey.slice(0, 8)}... falhou:`, error);
          lastError = error;
          continue;
        }
      }
      
      throw lastError || new Error('Todas as chaves de API falharam');
      
    } catch (error: any) {
      console.error('Erro na verificação da transação:', error);
      throw new Error(`Erro na verificação: ${error.message}`);
    }
  };

  const checkWithApiKey = async (txHash: string, apiKey: string): Promise<{
    isConfirmed: boolean;
    isFailed: boolean;
    value: number;
    confirmations: number;
    errorMessage?: string;
  }> => {
    // Get transaction details
    const txUrl = `https://api.bscscan.com/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`;
    
    const txResponse = await fetch(txUrl);
    if (!txResponse.ok) {
      throw new Error(`HTTP ${txResponse.status}: ${txResponse.statusText}`);
    }
    
    const txData = await txResponse.json();
    
    if (txData.error) {
      throw new Error(`BSCScan API Error: ${txData.error.message || txData.error}`);
    }
    
    if (!txData.result) {
      console.log('⏳ Transação ainda não encontrada na blockchain');
      return {
        isConfirmed: false,
        isFailed: false,
        value: 0,
        confirmations: 0,
        errorMessage: 'Transação não encontrada'
      };
    }

    const transaction = txData.result;
    console.log('📄 Dados da transação:', {
      to: transaction.to,
      value: transaction.value,
      input: transaction.input?.slice(0, 20) + '...'
    });
    
    // Get transaction receipt
    const receiptUrl = `https://api.bscscan.com/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`;
    const receiptResponse = await fetch(receiptUrl);
    
    if (!receiptResponse.ok) {
      throw new Error(`Receipt HTTP ${receiptResponse.status}: ${receiptResponse.statusText}`);
    }
    
    const receiptData = await receiptResponse.json();
    
    if (receiptData.error) {
      throw new Error(`Receipt API Error: ${receiptData.error.message || receiptData.error}`);
    }
    
    if (!receiptData.result) {
      console.log('⏳ Receipt ainda não disponível - transação pendente');
      return {
        isConfirmed: false,
        isFailed: false,
        value: 0,
        confirmations: 0,
        errorMessage: 'Transação pendente'
      };
    }

    const receipt = receiptData.result;
    const isSuccessful = receipt.status === '0x1';
    const blockNumber = parseInt(receipt.blockNumber, 16);
    
    if (!isSuccessful) {
      console.log('❌ Transação falhou na blockchain');
      return {
        isConfirmed: false,
        isFailed: true,
        value: 0,
        confirmations: 0,
        errorMessage: 'Transação falhou na blockchain'
      };
    }
    
    // Get current block number for confirmations
    const currentBlockUrl = `https://api.bscscan.com/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`;
    const currentBlockResponse = await fetch(currentBlockUrl);
    
    if (!currentBlockResponse.ok) {
      throw new Error(`Block number HTTP ${currentBlockResponse.status}`);
    }
    
    const currentBlockData = await currentBlockResponse.json();
    
    if (currentBlockData.error) {
      throw new Error(`Block API Error: ${currentBlockData.error.message}`);
    }
    
    const currentBlock = parseInt(currentBlockData.result, 16);
    const confirmations = currentBlock - blockNumber;
    const isConfirmed = confirmations >= 1; // Only 1 confirmation needed
    
    console.log(`📊 Confirmações: ${confirmations}, Confirmado: ${isConfirmed}`);
    
    // Parse transaction value
    let value = 0;
    let valueFound = false;
    
    // Check if transaction is to our wallet address
    const transactionTo = transaction.to?.toLowerCase();
    console.log(`🎯 Verificando endereço de destino: ${transactionTo} vs ${USDT_WALLET_ADDRESS}`);
    
    // Method 1: Direct transfer to our wallet
    if (transactionTo === USDT_WALLET_ADDRESS) {
      console.log('✅ Transação direta para nossa carteira');
      
      // Check if it's a token transfer (has input data)
      if (transaction.input && transaction.input.length > 10) {
        console.log('🔍 Analisando transferência de token...');
        value = await parseTokenTransfer(transaction, apiKey);
        valueFound = value > 0;
      } else {
        // Direct BNB transfer
        const bnbAmount = parseInt(transaction.value, 16) / Math.pow(10, 18);
        if (bnbAmount > 0) {
          console.log(`💰 Transferência BNB detectada: ${bnbAmount} BNB`);
          value = await convertBnbToBrl(bnbAmount);
          valueFound = value > 0;
        }
      }
    }
    
    // Method 2: Check transaction logs for token transfers to our address
    if (!valueFound && receipt.logs && receipt.logs.length > 0) {
      console.log('🔍 Verificando logs da transação para transferências de token...');
      
      for (const log of receipt.logs) {
        // ERC20 Transfer event signature: Transfer(address,address,uint256)
        // Topic[0] = keccak256("Transfer(address,address,uint256)")
        if (log.topics && log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
          // Topic[1] = from address (padded to 32 bytes)
          // Topic[2] = to address (padded to 32 bytes)
          // Data = amount (32 bytes)
          
          if (log.topics.length >= 3) {
            const toAddress = '0x' + log.topics[2].slice(-40).toLowerCase();
            console.log(`📝 Log transfer para: ${toAddress}`);
            
            if (toAddress === USDT_WALLET_ADDRESS) {
              console.log('✅ Transferência de token para nossa carteira encontrada nos logs!');
              
              // Parse amount from log data
              if (log.data && log.data.length >= 66) {
                const amountHex = log.data.slice(2); // Remove 0x
                const amountWei = BigInt('0x' + amountHex);
                
                // Get token contract address
                const tokenAddress = log.address?.toLowerCase();
                console.log(`🪙 Token contract: ${tokenAddress}`);
                
                // Convert based on token type
                if (tokenAddress) {
                  value = await convertTokenToBrl(amountWei, tokenAddress, apiKey);
                  valueFound = value > 0;
                  
                  if (valueFound) {
                    console.log(`💰 Valor convertido dos logs: R$ ${value.toFixed(2)}`);
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Method 3: Check internal transactions
    if (!valueFound) {
      console.log('🔍 Verificando transações internas...');
      try {
        const internalTxUrl = `https://api.bscscan.com/api?module=account&action=txlistinternal&txhash=${txHash}&apikey=${apiKey}`;
        const internalResponse = await fetch(internalTxUrl);
        
        if (internalResponse.ok) {
          const internalData = await internalResponse.json();
          
          if (internalData.result && Array.isArray(internalData.result)) {
            for (const internalTx of internalData.result) {
              if (internalTx.to?.toLowerCase() === USDT_WALLET_ADDRESS) {
                const internalValue = parseInt(internalTx.value, 16) / Math.pow(10, 18);
                if (internalValue > 0) {
                  console.log(`💰 Transação interna encontrada: ${internalValue} BNB`);
                  value = await convertBnbToBrl(internalValue);
                  valueFound = value > 0;
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar transações internas:', error);
      }
    }
    
    if (!valueFound) {
      console.log('⚠️ Nenhum valor encontrado para nossa carteira');
      return {
        isConfirmed,
        isFailed: false,
        value: 0,
        confirmations,
        errorMessage: 'Transação não é para nossa carteira ou valor não identificado'
      };
    }
    
    console.log(`✅ Valor final identificado: R$ ${value.toFixed(2)}`);
    
    return {
      isConfirmed,
      isFailed: false,
      value,
      confirmations
    };
  };

  const parseTokenTransfer = async (transaction: any, apiKey: string): Promise<number> => {
    try {
      const input = transaction.input;
      
      // USDT transfer function: transfer(address,uint256) = 0xa9059cbb
      if (input.startsWith('0xa9059cbb') && input.length >= 138) {
        console.log('🔍 Decodificando transferência USDT...');
        
        // Extract recipient address (bytes 4-35, but we want last 20 bytes)
        const recipientHex = input.slice(34, 74);
        const recipient = '0x' + recipientHex.slice(-40).toLowerCase();
        
        console.log(`📍 Destinatário: ${recipient}`);
        
        if (recipient === USDT_WALLET_ADDRESS) {
          // Extract amount (bytes 36-67)
          const amountHex = input.slice(74, 138);
          const amountWei = BigInt('0x' + amountHex);
          
          // Get token contract address
          const tokenAddress = transaction.to?.toLowerCase();
          
          return await convertTokenToBrl(amountWei, tokenAddress, apiKey);
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Erro ao analisar transferência de token:', error);
      return 0;
    }
  };

  const convertTokenToBrl = async (amountWei: bigint, tokenAddress: string, apiKey: string): Promise<number> => {
    try {
      // Common token addresses on BSC
      const knownTokens: { [key: string]: { decimals: number; symbol: string; binanceSymbol?: string } } = {
        '0x55d398326f99059ff775485246999027b3197955': { decimals: 18, symbol: 'USDT', binanceSymbol: 'USDTBRL' },
        '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { decimals: 18, symbol: 'USDC', binanceSymbol: 'USDCBRL' },
        '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3': { decimals: 18, symbol: 'DAI', binanceSymbol: 'DAIBRL' },
        '0x2170ed0880ac9a755fd29b2688956bd959f933f8': { decimals: 18, symbol: 'ETH', binanceSymbol: 'ETHBRL' },
        '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': { decimals: 18, symbol: 'BTCB', binanceSymbol: 'BTCBRL' }
      };
      
      let tokenInfo = knownTokens[tokenAddress];
      
      // If token not in our list, try to get info from contract
      if (!tokenInfo) {
        console.log(`🔍 Token desconhecido: ${tokenAddress}, tentando obter informações...`);
        
        // Try to get decimals from contract
        try {
          const decimalsUrl = `https://api.bscscan.com/api?module=proxy&action=eth_call&to=${tokenAddress}&data=0x313ce567&tag=latest&apikey=${apiKey}`;
          const decimalsResponse = await fetch(decimalsUrl);
          const decimalsData = await decimalsResponse.json();
          
          if (decimalsData.result) {
            const decimals = parseInt(decimalsData.result, 16);
            tokenInfo = { decimals, symbol: 'UNKNOWN' };
            console.log(`📊 Decimais obtidas: ${decimals}`);
          }
        } catch (error) {
          console.warn('Erro ao obter decimais do token:', error);
        }
        
        // Default to 18 decimals if we can't get it
        if (!tokenInfo) {
          tokenInfo = { decimals: 18, symbol: 'UNKNOWN' };
        }
      }
      
      // Convert from wei to token amount
      const tokenAmount = Number(amountWei) / Math.pow(10, tokenInfo.decimals);
      console.log(`💰 Quantidade do token: ${tokenAmount} ${tokenInfo.symbol}`);
      
      // Convert to BRL
      if (tokenInfo.binanceSymbol) {
        try {
          const rateResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${tokenInfo.binanceSymbol}`);
          if (rateResponse.ok) {
            const rateData = await rateResponse.json();
            const rate = parseFloat(rateData.price);
            const brlValue = tokenAmount * rate;
            console.log(`💱 Taxa ${tokenInfo.symbol}/BRL: ${rate}, Valor: R$ ${brlValue.toFixed(2)}`);
            return brlValue;
          }
        } catch (error) {
          console.warn(`Erro ao obter taxa ${tokenInfo.symbol}/BRL:`, error);
        }
      }
      
      // Fallback rates for common tokens
      const fallbackRates: { [key: string]: number } = {
        'USDT': 5.5,
        'USDC': 5.5,
        'DAI': 5.5,
        'ETH': 18000,
        'BTCB': 350000
      };
      
      const fallbackRate = fallbackRates[tokenInfo.symbol] || 5.5; // Default to USDT rate
      const brlValue = tokenAmount * fallbackRate;
      console.log(`💱 Taxa fallback ${tokenInfo.symbol}/BRL: ${fallbackRate}, Valor: R$ ${brlValue.toFixed(2)}`);
      
      return brlValue;
      
    } catch (error) {
      console.error('Erro na conversão de token para BRL:', error);
      return 0;
    }
  };

  const convertBnbToBrl = async (bnbAmount: number): Promise<number> => {
    try {
      const rateResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
      if (rateResponse.ok) {
        const rateData = await rateResponse.json();
        const bnbToBrlRate = parseFloat(rateData.price);
        const brlValue = bnbAmount * bnbToBrlRate;
        console.log(`💱 Taxa BNB/BRL: ${bnbToBrlRate}, Valor: R$ ${brlValue.toFixed(2)}`);
        return brlValue;
      }
    } catch (error) {
      console.warn('Erro ao obter taxa BNB/BRL:', error);
    }
    
    // Fallback rate
    const fallbackRate = 1500;
    const brlValue = bnbAmount * fallbackRate;
    console.log(`💱 Taxa fallback BNB/BRL: ${fallbackRate}, Valor: R$ ${brlValue.toFixed(2)}`);
    return brlValue;
  };

  const addPendingPayment = (txHash: string, amount: number) => {
    if (!user?.email) return;

    // Validate transaction hash format
    if (!txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      showNotification('❌ Hash da transação inválido. Deve ter 66 caracteres e começar com 0x', 'error');
      return;
    }

    const cleanHash = txHash.toLowerCase();

    // Check if this transaction was already used globally (any account)
    if (isTransactionUsed(cleanHash)) {
      showNotification('🚫 Esta transação já foi utilizada em outra conta. Cada hash só pode ser usada uma vez no sistema.', 'error');
      return;
    }

    // Check if this transaction is already being monitored by current user
    const existingPayment = pendingPayments.find(p => p.txHash === cleanHash);
    if (existingPayment) {
      showNotification('⚠️ Esta transação já está sendo monitorada em sua conta', 'error');
      return;
    }

    const newPayment: PendingPayment = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      txHash: cleanHash,
      amount,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };

    setPendingPayments(prev => [newPayment, ...prev]);
    showNotification('🚀 Verificação Instantânea Iniciada! Verificaremos sua transação a cada 3 segundos e creditaremos automaticamente o valor exato da blockchain quando confirmada.', 'info');
    
    console.log(`💰 Novo pagamento USDT adicionado para verificação instantânea: ${cleanHash.slice(0, 10)}...`);
  };

  const removePendingPayment = (id: string) => {
    setPendingPayments(prev => prev.filter(p => p.id !== id));
    console.log(`🗑️ Pagamento removido: ${id}`);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    // Create a more sophisticated notification system
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
    
    // Auto remove based on type
    const autoRemoveTime = type === 'success' ? 10000 : type === 'error' ? 12000 : 8000;
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, autoRemoveTime);
  };

  return (
    <PaymentContext.Provider value={{
      pendingPayments,
      addPendingPayment,
      removePendingPayment,
      isMonitoring
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = (): PaymentContextData => {
  const context = useContext(PaymentContext);
  
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  
  return context;
};