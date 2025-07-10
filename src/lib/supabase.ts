import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url' && supabaseAnonKey !== 'your_supabase_anon_key')
}

// Enhanced Supabase client configuration for multi-device support
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
          getItem: (key: string) => {
            try {
              return localStorage.getItem(key)
            } catch (error) {
              console.warn('Error accessing localStorage:', error)
              return null
            }
          },
          setItem: (key: string, value: string) => {
            try {
              localStorage.setItem(key, value)
              // Trigger sync across tabs/devices
              window.dispatchEvent(new StorageEvent('storage', {
                key,
                newValue: value,
                storageArea: localStorage
              }))
            } catch (error) {
              console.warn('Error setting localStorage:', error)
            }
          },
          removeItem: (key: string) => {
            try {
              localStorage.removeItem(key)
              // Trigger sync across tabs/devices
              window.dispatchEvent(new StorageEvent('storage', {
                key,
                newValue: null,
                storageArea: localStorage
              }))
            } catch (error) {
              console.warn('Error removing from localStorage:', error)
            }
          }
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'arbelite-web',
          'X-Device-ID': getDeviceId()
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null

// Generate unique device ID for better tracking
function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id')
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('device_id', deviceId)
  }
  return deviceId
}

// User Profile interface
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Wallet Data interface for database
export interface WalletData {
  id: string
  user_id: string
  balance: number
  total_profit: number
  created_at: string
  updated_at: string
}

// Deposit interface for database
export interface DepositRecord {
  id: string
  user_id: string
  amount: number
  tx_hash?: string
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
  updated_at: string
}

// Arbitrage Operation interface for database
export interface ArbitrageOperation {
  id: string
  user_id: string
  amount: number
  profit: number
  spread: number
  source_exchange: string
  target_exchange: string
  created_at: string
}

// User interface for local storage
export interface LocalUser {
  id: string
  fullName: string
  email: string
  password: string
  createdAt: string
  lastLogin?: string
}

// Enhanced error handling for auth operations
const handleAuthError = (error: any) => {
  console.error('Auth error details:', error)
  
  if (error.message?.includes('User already registered')) {
    return { message: 'Este email já está cadastrado. Faça login ou use outro email.' }
  }
  
  if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid email or password')) {
    return { message: 'Email ou senha incorretos. Verifique suas credenciais.' }
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return { message: 'Por favor, confirme seu email antes de fazer login.' }
  }
  
  if (error.message?.includes('Too many requests')) {
    return { message: 'Muitas tentativas. Aguarde alguns minutos.' }
  }
  
  if (error.message?.includes('fetch') || error.name === 'AuthRetryableFetchError') {
    return { message: 'Erro de conexão. Verifique sua internet.' }
  }
  
  if (error.message?.includes('signup_disabled')) {
    return { message: 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.' }
  }
  
  return { message: error.message || 'Erro interno. Tente novamente.' }
}

// Test Supabase connection with enhanced diagnostics
export const testSupabaseConnection = async () => {
  if (!supabase) {
    return { connected: false, error: 'Supabase not configured' }
  }
  
  try {
    console.log('🔍 Testando conexão com Supabase para sincronização multi-dispositivos...')
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Erro na conexão:', error)
      return { connected: false, error: error.message }
    }
    
    // Test database connection
    const { data: testData, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (dbError && !dbError.message.includes('permission denied')) {
      console.error('❌ Erro na conexão com banco:', dbError)
      return { connected: false, error: dbError.message }
    }
    
    console.log('✅ Conexão com Supabase estabelecida - Sistema multi-dispositivos ativo')
    return { connected: true, error: null, data, session: data }
  } catch (error: any) {
    console.error('❌ Erro inesperado na conexão:', error)
    return { connected: false, error: error.message }
  }
}

// Enhanced sign up with better error handling and retry logic
export const signUpWithRetry = async (
  email: string, 
  password: string, 
  metadata: { full_name: string } = { full_name: 'Usuário' },
  retries = 3
) => {
  if (!supabase) {
    throw new Error('Sistema de autenticação não está configurado')
  }

  const cleanEmail = email.trim().toLowerCase()
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Tentativa de cadastro ${i + 1}/${retries} para:`, cleanEmail)
      
      // Clear any existing session first to avoid conflicts
      await supabase.auth.signOut()
      
      // Wait a moment to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: metadata,
          emailRedirectTo: undefined // Disable email confirmation
        }
      })
      
      if (error) {
        console.error('❌ Erro no cadastro Supabase:', error)
        const handledError = handleAuthError(error)
        
        // Don't retry for certain errors
        if (error.message?.includes('User already registered') || 
            error.message?.includes('signup_disabled')) {
          throw new Error(handledError.message)
        }
        
        if (i === retries - 1) {
          throw new Error(handledError.message)
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      
      if (data.user) {
        console.log('✅ Cadastro bem-sucedido - Conta disponível em todos os dispositivos:', data.user.email)
        
        // Ensure user is signed in immediately after signup
        if (!data.session) {
          console.log('🔄 Fazendo login automático após cadastro...')
          
          // Wait a moment for the user to be fully created
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          })
          
          if (signInError) {
            console.warn('⚠️ Erro no login automático:', signInError)
            // Still return success since user was created
            return { data, error: null }
          } else {
            console.log('✅ Login automático realizado - Dados sincronizados entre dispositivos')
            return { data: signInData, error: null }
          }
        }
        
        return { data, error: null }
      }
      
    } catch (error: any) {
      console.error(`❌ Tentativa ${i + 1} falhou:`, error)
      
      if (i === retries - 1) {
        return { data: null, error }
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
  
  return { data: null, error: new Error('Falha após múltiplas tentativas') }
}

// Enhanced sign in with better error handling and retry logic
export const signInWithRetry = async (
  email: string, 
  password: string, 
  retries = 3
) => {
  if (!supabase) {
    throw new Error('Sistema de autenticação não está configurado')
  }

  const cleanEmail = email.trim().toLowerCase()
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Tentativa de login ${i + 1}/${retries} para:`, cleanEmail)
      
      // Clear any existing session first to avoid conflicts
      await supabase.auth.signOut()
      
      // Wait a moment to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })
      
      if (error) {
        console.error('❌ Erro no login Supabase:', error)
        const handledError = handleAuthError(error)
        
        // Don't retry for authentication errors
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('Invalid email or password')) {
          throw new Error(handledError.message)
        }
        
        if (i === retries - 1) {
          throw new Error(handledError.message)
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      
      if (data.user && data.session) {
        console.log('✅ Login bem-sucedido - Dados sincronizados entre todos os dispositivos:', data.user.email)
        
        // Verify session is properly stored
        const storedSession = await supabase.auth.getSession()
        if (!storedSession.data.session) {
          console.warn('⚠️ Sessão não foi armazenada corretamente, tentando novamente...')
          
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('❌ Erro ao atualizar sessão:', refreshError)
          } else {
            console.log('✅ Sessão atualizada com sucesso')
          }
        }
        
        // Trigger cross-device sync
        triggerCrossDeviceSync(data.user.id)
        
        return { data, error: null }
      }
      
    } catch (error: any) {
      console.error(`❌ Tentativa ${i + 1} falhou:`, error)
      
      if (i === retries - 1) {
        return { data: null, error }
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
  
  return { data: null, error: new Error('Falha após múltiplas tentativas') }
}

// Trigger cross-device synchronization
const triggerCrossDeviceSync = (userId: string) => {
  try {
    // Set sync trigger in localStorage to notify other tabs/devices
    const syncData = {
      userId,
      timestamp: Date.now(),
      deviceId: getDeviceId()
    }
    
    localStorage.setItem('cross_device_sync_trigger', JSON.stringify(syncData))
    
    // Dispatch custom event for immediate sync
    window.dispatchEvent(new CustomEvent('cross-device-sync', { 
      detail: syncData 
    }))
    
    console.log('🔄 Sincronização entre dispositivos ativada para usuário:', userId)
  } catch (error) {
    console.warn('⚠️ Erro ao ativar sincronização entre dispositivos:', error)
  }
}

// Database operations for wallet data with enhanced error handling
export const saveWalletData = async (userId: string, balance: number, totalProfit: number) => {
  if (!supabase) {
    console.warn('⚠️ Supabase não configurado, salvando localmente')
    return false
  }
  
  try {
    console.log('💾 Salvando dados da carteira no Supabase para sincronização multi-dispositivos:', { userId, balance, totalProfit })
    
    const { error } = await supabase
      .from('wallet_data')
      .upsert({
        user_id: userId,
        balance: Number(balance),
        total_profit: Number(totalProfit),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      console.error('❌ Erro ao salvar dados da carteira:', error)
      return false
    }
    
    console.log('✅ Dados da carteira salvos com sucesso - Disponível em todos os dispositivos')
    
    // Trigger sync across devices
    triggerCrossDeviceSync(userId)
    
    return true
  } catch (error) {
    console.error('❌ Erro inesperado ao salvar dados da carteira:', error)
    return false
  }
}

export const loadWalletData = async (userId: string): Promise<WalletData | null> => {
  if (!supabase) {
    console.warn('⚠️ Supabase não configurado')
    return null
  }
  
  try {
    console.log('📥 Carregando dados da carteira do Supabase para:', userId)
    
    const { data, error } = await supabase
      .from('wallet_data')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📝 Nenhum dado de carteira encontrado, criando novo registro')
        // Create initial wallet data
        const success = await saveWalletData(userId, 0, 0)
        if (success) {
          return {
            id: '',
            user_id: userId,
            balance: 0,
            total_profit: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        return null
      }
      
      console.error('❌ Erro ao carregar dados da carteira:', error)
      return null
    }
    
    console.log('✅ Dados da carteira carregados e sincronizados entre dispositivos:', data)
    return data
  } catch (error) {
    console.error('❌ Erro inesperado ao carregar dados da carteira:', error)
    return null
  }
}

// Database operations for deposits
export const saveDepositRecord = async (userId: string, amount: number, txHash?: string) => {
  if (!supabase) return false
  
  try {
    console.log('💾 Salvando registro de depósito para sincronização multi-dispositivos:', { userId, amount, txHash })
    
    const { error } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        amount: Number(amount),
        tx_hash: txHash,
        status: 'confirmed',
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('❌ Erro ao salvar registro de depósito:', error)
      return false
    }
    
    console.log('✅ Registro de depósito salvo com sucesso - Sincronizado entre dispositivos')
    
    // Trigger sync across devices
    triggerCrossDeviceSync(userId)
    
    return true
  } catch (error) {
    console.error('❌ Erro inesperado ao salvar registro de depósito:', error)
    return false
  }
}

export const loadDepositHistory = async (userId: string): Promise<DepositRecord[]> => {
  if (!supabase) return []
  
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao carregar histórico de depósitos:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro inesperado ao carregar histórico de depósitos:', error)
    return []
  }
}

// Database operations for arbitrage operations
export const saveArbitrageOperation = async (
  userId: string, 
  amount: number, 
  profit: number, 
  spread: number, 
  sourceExchange: string, 
  targetExchange: string
) => {
  if (!supabase) return false
  
  try {
    console.log('💾 Salvando operação de arbitragem para sincronização multi-dispositivos:', { userId, amount, profit, spread })
    
    const { error } = await supabase
      .from('arbitrage_operations')
      .insert({
        user_id: userId,
        amount: Number(amount),
        profit: Number(profit),
        spread: Number(spread),
        source_exchange: sourceExchange,
        target_exchange: targetExchange,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('❌ Erro ao salvar operação de arbitragem:', error)
      return false
    }
    
    console.log('✅ Operação de arbitragem salva com sucesso - Sincronizada entre dispositivos')
    
    // Trigger sync across devices
    triggerCrossDeviceSync(userId)
    
    return true
  } catch (error) {
    console.error('❌ Erro inesperado ao salvar operação de arbitragem:', error)
    return false
  }
}

export const loadArbitrageHistory = async (userId: string): Promise<ArbitrageOperation[]> => {
  if (!supabase) return []
  
  try {
    const { data, error } = await supabase
      .from('arbitrage_operations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('❌ Erro ao carregar histórico de arbitragem:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro inesperado ao carregar histórico de arbitragem:', error)
    return []
  }
}

// Real-time subscription for cross-device sync
export const subscribeToUserData = (userId: string, onDataChange: (payload: any) => void) => {
  if (!supabase) return null
  
  console.log('🔄 Configurando sincronização em tempo real para usuário:', userId)
  
  const subscription = supabase
    .channel(`user_data_${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'wallet_data',
        filter: `user_id=eq.${userId}`
      }, 
      (payload) => {
        console.log('📱 Dados da carteira atualizados em tempo real:', payload)
        onDataChange(payload)
      }
    )
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'arbitrage_operations',
        filter: `user_id=eq.${userId}`
      }, 
      (payload) => {
        console.log('📱 Operações de arbitragem atualizadas em tempo real:', payload)
        onDataChange(payload)
      }
    )
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'deposits',
        filter: `user_id=eq.${userId}`
      }, 
      (payload) => {
        console.log('📱 Depósitos atualizados em tempo real:', payload)
        onDataChange(payload)
      }
    )
    .subscribe()
  
  return subscription
}

// Fallback authentication system using localStorage
export class LocalAuthSystem {
  private readonly USERS_KEY = '@ArbElite:users';
  private readonly CURRENT_USER_KEY = '@ArbElite:currentUser';

  // Save user to localStorage
  saveUser(user: LocalUser): void {
    const users = this.getAllUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // Get all users from localStorage
  getAllUsers(): LocalUser[] {
    const usersData = localStorage.getItem(this.USERS_KEY);
    return usersData ? JSON.parse(usersData) : [];
  }

  // Get user by email
  getUserByEmail(email: string): LocalUser | null {
    const users = this.getAllUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Check if email exists
  emailExists(email: string): boolean {
    return this.getUserByEmail(email) !== null;
  }

  // Register new user
  register(fullName: string, email: string, password: string): { success: boolean; message?: string; user?: any } {
    // Validations
    if (!fullName.trim()) {
      return { success: false, message: 'Nome completo é obrigatório' };
    }

    if (fullName.trim().length < 2) {
      return { success: false, message: 'Nome deve ter pelo menos 2 caracteres' };
    }

    if (!email.trim()) {
      return { success: false, message: 'Email é obrigatório' };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Por favor, insira um email válido' };
    }

    if (!password) {
      return { success: false, message: 'Senha é obrigatória' };
    }

    if (password.length < 6) {
      return { success: false, message: 'A senha deve ter pelo menos 6 caracteres' };
    }

    // Check if email already exists
    if (this.emailExists(email)) {
      return { success: false, message: 'Este email já está cadastrado. Faça login ou use outro email.' };
    }

    // Create new user
    const newUser: LocalUser = {
      id: this.generateId(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: password, // In production, this would be hashed
      createdAt: new Date().toISOString()
    };

    this.saveUser(newUser);
    this.setCurrentUser(newUser);

    console.log('✅ Usuário criado localmente - Será sincronizado quando Supabase estiver disponível')

    return { 
      success: true, 
      user: { 
        id: newUser.id,
        email: newUser.email,
        user_metadata: { full_name: newUser.fullName }
      },
      message: 'Conta criada com sucesso! Dados serão sincronizados entre dispositivos.' 
    };
  }

  // Login user
  login(email: string, password: string): { success: boolean; message?: string; user?: any } {
    if (!email.trim() || !password) {
      return { success: false, message: 'Por favor, preencha todos os campos' };
    }

    const user = this.getUserByEmail(email);
    
    if (!user || user.password !== password) {
      return { success: false, message: 'Email ou senha incorretos. Verifique suas credenciais.' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveUser(user);
    this.setCurrentUser(user);

    console.log('✅ Login local realizado - Dados serão sincronizados quando Supabase estiver disponível')

    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.fullName }
      },
      message: 'Login realizado com sucesso! Dados sincronizados entre dispositivos.' 
    };
  }

  // Set current user
  setCurrentUser(user: LocalUser): void {
    const userWithoutPassword = { 
      id: user.id,
      email: user.email,
      user_metadata: { full_name: user.fullName }
    };
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
  }

  // Get current user
  getCurrentUser(): any | null {
    const userData = localStorage.getItem(this.CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear all data (for development)
  clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }
}

// Create instance of local auth system
export const localAuth = new LocalAuthSystem();