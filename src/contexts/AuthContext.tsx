import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, UserProfile, isSupabaseConfigured, signUpWithRetry, signInWithRetry, testSupabaseConnection, localAuth, subscribeToUserData } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextData {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSupabaseReady: boolean;
  syncUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando sistema de autenticação multi-dispositivos avançado...');
        
        // Test Supabase connection first
        if (isSupabaseConfigured()) {
          console.log('✅ Supabase configurado, testando conexão...');
          const connectionTest = await testSupabaseConnection();
          
          if (connectionTest.connected) {
            console.log('✅ Conexão com Supabase estabelecida - Sistema multi-dispositivos 100% ativo');
            setIsSupabaseReady(true);
            
            // Get initial session
            try {
              const { data: { session: initialSession }, error } = await supabase!.auth.getSession();
              
              if (error) {
                console.warn('⚠️ Erro ao verificar sessão:', error.message);
                // Try to recover from local storage
                await tryRecoverFromLocalStorage();
              } else if (mounted && initialSession) {
                console.log('📱 Sessão ativa encontrada - Sincronizando dados entre todos os dispositivos...');
                setSession(initialSession);
                setUser(initialSession.user);
                
                // Fetch profile and sync data
                await fetchUserProfile(initialSession.user.id);
                await syncUserDataFromSupabase(initialSession.user.id);
                
                // Setup real-time sync
                setupRealtimeSync(initialSession.user.id);
              } else {
                // No active session, try local storage
                await tryRecoverFromLocalStorage();
              }
            } catch (sessionError) {
              console.warn('⚠️ Erro na inicialização da sessão:', sessionError);
              await tryRecoverFromLocalStorage();
            }
            
            // Set up auth listener for real-time sync
            try {
              const { data } = supabase!.auth.onAuthStateChange(
                async (event, session) => {
                  console.log('🔄 Estado de autenticação alterado:', event);
                  
                  if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    
                    if (session?.user) {
                      console.log('👤 Usuário logado - Sincronizando dados entre todos os dispositivos...');
                      await fetchUserProfile(session.user.id);
                      await syncUserDataFromSupabase(session.user.id);
                      
                      // Setup real-time sync
                      setupRealtimeSync(session.user.id);
                      
                      // Save to local storage for offline access
                      saveUserToLocalStorage(session.user);
                      
                      // Show sync notification
                      showSyncNotification('✅ Conta sincronizada! Seus dados estão disponíveis em todos os dispositivos.');
                    } else {
                      setUserProfile(null);
                      clearLocalUserData();
                      cleanupRealtimeSync();
                    }
                  }
                }
              );
              authSubscription = data.subscription;
            } catch (error) {
              console.error('❌ Erro ao configurar listener de auth:', error);
            }
          } else {
            console.warn('⚠️ Falha na conexão com Supabase, usando sistema local:', connectionTest.error);
            setIsSupabaseReady(false);
            await tryRecoverFromLocalStorage();
          }
        } else {
          console.log('⚠️ Supabase não configurado, usando sistema local');
          setIsSupabaseReady(false);
          await tryRecoverFromLocalStorage();
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        setIsSupabaseReady(false);
        await tryRecoverFromLocalStorage();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const tryRecoverFromLocalStorage = async () => {
      const localUser = localAuth.getCurrentUser();
      if (localUser && mounted) {
        console.log('📱 Usuário local encontrado:', localUser.email);
        setUser(localUser);
        setUserProfile({
          id: localUser.id,
          email: localUser.email,
          full_name: localUser.user_metadata?.full_name || 'Usuário',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // If Supabase is available, try to sync local data to cloud
        if (isSupabaseConfigured()) {
          try {
            await syncLocalDataToSupabase(localUser);
          } catch (error) {
            console.warn('⚠️ Não foi possível sincronizar dados locais:', error);
          }
        }
      }
    };

    const syncLocalDataToSupabase = async (localUser: any) => {
      if (!supabase) return;
      
      try {
        console.log('🔄 Tentando sincronizar dados locais para Supabase...');
        
        // Try to sign in with local credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email: localUser.email,
          password: localUser.password || 'temp-password'
        });

        if (!error && data.user) {
          console.log('✅ Sincronização bem-sucedida com Supabase');
          setSession(data.session);
          setUser(data.user);
          await fetchUserProfile(data.user.id);
          setupRealtimeSync(data.user.id);
        }
      } catch (error) {
        console.warn('⚠️ Não foi possível sincronizar com Supabase:', error);
      }
    };

    const saveUserToLocalStorage = (user: User) => {
      const userData = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        created_at: user.created_at
      };
      localStorage.setItem('@ArbElite:supabase_user', JSON.stringify(userData));
    };

    const clearLocalUserData = () => {
      localStorage.removeItem('@ArbElite:supabase_user');
      localAuth.logout();
    };

    initializeAuth();

    // Listen for cross-device sync events
    const handleCrossDeviceSync = (event: CustomEvent) => {
      if (event.detail.userId === user?.id) {
        console.log('🔄 Sincronização entre dispositivos detectada...');
        syncUserData();
      }
    };

    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === 'cross_device_sync_trigger' && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          if (syncData.userId === user?.id) {
            console.log('🔄 Sincronização entre abas/dispositivos detectada...');
            syncUserData();
          }
        } catch (error) {
          console.warn('Erro ao processar sincronização entre dispositivos:', error);
        }
      }
    };

    window.addEventListener('cross-device-sync', handleCrossDeviceSync as EventListener);
    window.addEventListener('storage', handleStorageSync);

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      cleanupRealtimeSync();
      window.removeEventListener('cross-device-sync', handleCrossDeviceSync as EventListener);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  const setupRealtimeSync = (userId: string) => {
    if (!supabase || !isSupabaseReady) return;
    
    // Cleanup existing subscription
    cleanupRealtimeSync();
    
    console.log('🔄 Configurando sincronização em tempo real para todos os dispositivos...');
    
    const subscription = subscribeToUserData(userId, (payload) => {
      console.log('📱 Dados atualizados em tempo real em outro dispositivo:', payload);
      
      // Trigger sync in all contexts
      window.dispatchEvent(new CustomEvent('supabase-realtime-update', { 
        detail: { userId, payload } 
      }));
      
      // Show notification about sync
      showSyncNotification('🔄 Dados atualizados em outro dispositivo. Sincronizando...');
    });
    
    setRealtimeSubscription(subscription);
  };

  const cleanupRealtimeSync = () => {
    if (realtimeSubscription) {
      console.log('🔄 Limpando sincronização em tempo real...');
      realtimeSubscription.unsubscribe();
      setRealtimeSubscription(null);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    if (!supabase || !isSupabaseReady) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Erro ao buscar perfil:', error.message);
      } else if (data) {
        setUserProfile(data);
        console.log('✅ Perfil do usuário carregado e sincronizado:', data.full_name);
      }
    } catch (error) {
      console.warn('Falha ao buscar perfil:', error);
    }
  };

  const syncUserDataFromSupabase = async (userId: string) => {
    if (!supabase || !isSupabaseReady) return;
    
    try {
      console.log('🔄 Sincronizando dados do usuário entre todos os dispositivos...');
      
      // This will trigger wallet and other contexts to sync their data
      // The actual sync happens in their respective contexts
      window.dispatchEvent(new CustomEvent('supabase-user-sync', { 
        detail: { userId } 
      }));
      
      console.log('✅ Sincronização de dados iniciada para todos os dispositivos');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  };

  const syncUserData = async (): Promise<void> => {
    if (user?.id) {
      await syncUserDataFromSupabase(user.id);
    }
  };

  const showSyncNotification = (message: string) => {
    // Create a subtle notification for sync status
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm transition-all duration-300 transform translate-x-full';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Input validation
    if (!name.trim()) return { success: false, message: 'Nome completo é obrigatório' };
    if (name.trim().length < 2) return { success: false, message: 'Nome deve ter pelo menos 2 caracteres' };
    if (!email.trim()) return { success: false, message: 'Email é obrigatório' };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { success: false, message: 'Por favor, insira um email válido' };
    
    if (!password) return { success: false, message: 'Senha é obrigatória' };
    if (password.length < 6) return { success: false, message: 'A senha deve ter pelo menos 6 caracteres' };

    try {
      console.log('🔄 Iniciando processo de cadastro multi-dispositivos...');
      
      if (isSupabaseReady && supabase) {
        // Try Supabase first for cloud sync
        console.log('🔄 Tentando cadastro via Supabase (multi-dispositivos)...');
        const { data, error } = await signUpWithRetry(
          email.trim().toLowerCase(),
          password,
          { full_name: name.trim() }
        );

        if (error) {
          console.error('❌ Erro no cadastro Supabase:', error);
          
          // Fallback to local auth but save for later sync
          console.log('🔄 Fallback para sistema local com sync posterior...');
          const localResult = localAuth.register(name, email, password);
          
          if (localResult.success) {
            setUser(localResult.user);
            setUserProfile({
              id: localResult.user.id,
              email: localResult.user.email,
              full_name: localResult.user.user_metadata?.full_name || name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

            // Mark for later sync when connection is available
            localStorage.setItem('@ArbElite:pending_sync', JSON.stringify({
              action: 'register',
              data: { name, email, password },
              timestamp: new Date().toISOString()
            }));
            
            showSyncNotification('✅ Conta criada! Será sincronizada quando a conexão for restabelecida.');
          }
          
          return localResult;
        }

        if (data.user) {
          console.log('✅ Cadastro Supabase realizado com sucesso! Multi-dispositivos 100% ativo.');
          
          // Save to local storage for offline access
          saveUserToLocalStorage(data.user);
          
          // Setup real-time sync
          setupRealtimeSync(data.user.id);
          
          showSyncNotification('✅ Conta criada e sincronizada! Disponível em todos os dispositivos.');
          
          return { success: true, message: 'Conta criada com sucesso! Agora você pode acessar de qualquer dispositivo.' };
        }
      } else {
        // Use local auth but prepare for sync
        console.log('🔄 Usando sistema local com preparação para sync...');
        const localResult = localAuth.register(name, email, password);
        
        if (localResult.success) {
          setUser(localResult.user);
          setUserProfile({
            id: localResult.user.id,
            email: localResult.user.email,
            full_name: localResult.user.user_metadata?.full_name || name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          // Save for later sync
          localStorage.setItem('@ArbElite:pending_sync', JSON.stringify({
            action: 'register',
            data: { name, email, password },
            timestamp: new Date().toISOString()
          }));
          
          showSyncNotification('✅ Conta criada! Será sincronizada quando possível.');
        }
        
        return localResult;
      }

      return { success: false, message: 'Erro inesperado ao criar conta' };
    } catch (error: any) {
      console.error('❌ Erro interno no cadastro:', error);
      
      // Final fallback to local auth
      console.log('🔄 Fallback final para sistema local...');
      const localResult = localAuth.register(name, email, password);
      
      if (localResult.success) {
        setUser(localResult.user);
        setUserProfile({
          id: localResult.user.id,
          email: localResult.user.email,
          full_name: localResult.user.user_metadata?.full_name || name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        showSyncNotification('✅ Conta criada localmente! Será sincronizada quando possível.');
      }
      
      return localResult;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (!email.trim() || !password) {
      return { success: false, message: 'Por favor, preencha todos os campos' };
    }

    try {
      console.log('🔄 Iniciando processo de login multi-dispositivos...');
      
      if (isSupabaseReady && supabase) {
        // Try Supabase first for cloud sync
        console.log('🔄 Tentando login via Supabase (multi-dispositivos)...');
        const { data, error } = await signInWithRetry(
          email.trim().toLowerCase(),
          password
        );

        if (error) {
          console.error('❌ Erro no login Supabase:', error);
          
          // Fallback to local auth
          console.log('🔄 Fallback para sistema local...');
          const localResult = localAuth.login(email, password);
          
          if (localResult.success) {
            setUser(localResult.user);
            setUserProfile({
              id: localResult.user.id,
              email: localResult.user.email,
              full_name: localResult.user.user_metadata?.full_name || 'Usuário',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

            // Try to sync to cloud in background
            setTimeout(async () => {
              try {
                await syncLocalDataToSupabase(localResult.user);
              } catch (error) {
                console.warn('Sync em background falhou:', error);
              }
            }, 1000);
            
            showSyncNotification('✅ Login realizado! Tentando sincronizar com a nuvem...');
          }
          
          return localResult;
        }

        if (data.user) {
          console.log('✅ Login Supabase realizado com sucesso! Dados 100% sincronizados entre dispositivos.');
          
          // Save to local storage for offline access
          saveUserToLocalStorage(data.user);
          
          // Setup real-time sync
          setupRealtimeSync(data.user.id);
          
          showSyncNotification('✅ Login realizado! Dados sincronizados em todos os dispositivos.');
          
          return { success: true, message: 'Login realizado com sucesso! Seus dados estão sincronizados.' };
        }
      } else {
        // Use local auth
        console.log('🔄 Usando sistema local para login...');
        const localResult = localAuth.login(email, password);
        
        if (localResult.success) {
          setUser(localResult.user);
          setUserProfile({
            id: localResult.user.id,
            email: localResult.user.email,
            full_name: localResult.user.user_metadata?.full_name || 'Usuário',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          showSyncNotification('✅ Login realizado! Dados serão sincronizados quando possível.');
        }
        
        return localResult;
      }

      return { success: false, message: 'Erro inesperado ao fazer login' };
    } catch (error: any) {
      console.error('❌ Erro interno no login:', error);
      
      // Final fallback to local auth
      console.log('🔄 Fallback final para sistema local...');
      const localResult = localAuth.login(email, password);
      
      if (localResult.success) {
        setUser(localResult.user);
        setUserProfile({
          id: localResult.user.id,
          email: localResult.user.email,
          full_name: localResult.user.user_metadata?.full_name || 'Usuário',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        showSyncNotification('✅ Login realizado localmente!');
      }
      
      return localResult;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔄 Fazendo logout de todos os dispositivos...');
      
      if (supabase && isSupabaseReady) {
        await supabase.auth.signOut();
      }
      
      // Always clear local auth as well
      localAuth.logout();
      
      // Cleanup real-time sync
      cleanupRealtimeSync();
      
      // Clear all local data
      localStorage.removeItem('@ArbElite:supabase_user');
      localStorage.removeItem('@ArbElite:pending_sync');
      
      showSyncNotification('✅ Logout realizado em todos os dispositivos');
      
      console.log('✅ Logout realizado com sucesso em todos os dispositivos');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      // Force logout locally
      setUser(null);
      setSession(null);
      setUserProfile(null);
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isSupabaseReady,
    syncUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};