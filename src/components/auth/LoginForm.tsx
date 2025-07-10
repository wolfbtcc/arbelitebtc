import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Loader2, UserPlus, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isSupabaseReady } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('🔄 Tentando fazer login...');
      const response = await login(email, password);
      
      if (response.success) {
        console.log('✅ Login bem-sucedido, redirecionando...');
        navigate('/dashboard');
      } else {
        console.error('❌ Erro no login:', response.message);
        setError(response.message || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <LogIn size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Entrar na sua conta
          </h2>
          <p className="mt-2 text-white/70">
            Acesse sua conta ArbElite de qualquer dispositivo
          </p>
          
          {/* Multi-device indicator */}
          {isSupabaseReady && (
            <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Smartphone size={16} className="text-blue-400" />
                <Tablet size={16} className="text-blue-400" />
                <Monitor size={16} className="text-blue-400" />
              </div>
              <p className="text-xs text-blue-200">
                <span className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Sistema Multi-Dispositivos Ativo - Dados sincronizados em tempo real
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-md mb-6 flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm">{error}</span>
                {error.includes('Email ou senha incorretos') && (
                  <div className="mt-2 text-xs text-red-200">
                    <p>💡 Dicas:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Verifique se o email está correto</li>
                      <li>Certifique-se de que a senha está correta</li>
                      <li>Se não tem conta, <Link to="/register" className="underline hover:text-red-100">registre-se aqui</Link></li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  id="email"
                  type="email"
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn-primary w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LogIn size={18} className="mr-2" />
                  Entrar
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-white/70">
              Não tem conta?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium transition-colors inline-flex items-center">
                <UserPlus size={16} className="mr-1" />
                Registre-se agora
              </Link>
            </p>
          </div>
        </div>

        {/* Multi-device benefits */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-300 mb-2">🌐 Acesso Universal</h3>
          <ul className="text-xs text-green-200/80 space-y-1">
            <li>• <strong>Celular:</strong> Acesse de qualquer lugar</li>
            <li>• <strong>Tablet:</strong> Interface otimizada para touch</li>
            <li>• <strong>Computador:</strong> Experiência completa</li>
            <li>• <strong>Sincronização:</strong> Dados sempre atualizados</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;