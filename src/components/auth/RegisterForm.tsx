import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useReferral } from '../../contexts/ReferralContext';

const RegisterForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, isSupabaseReady } = useAuth();
  const { registerReferredUser } = useReferral();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Nome completo é obrigatório');
      return false;
    }
    
    if (fullName.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return false;
    }
    
    if (!email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido');
      return false;
    }
    
    if (!password) {
      setError('Senha é obrigatória');
      return false;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('🔄 Iniciando cadastro para:', email);
      
      const response = await register(fullName.trim(), email.trim(), password);
      
      if (response.success) {
        console.log('✅ Cadastro bem-sucedido!');
        setSuccess('Conta criada com sucesso! Redirecionando...');
        
        // Register user for referral system
        registerReferredUser({
          name: fullName.trim(),
          email: email.trim()
        });
        
        // Wait a moment to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        console.error('❌ Erro no cadastro:', response.message);
        setError(response.message || 'Erro ao criar conta');
      }
    } catch (err: any) {
      console.error('❌ Erro inesperado:', err);
      setError(err.message || 'Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, text: 'Fraca', color: 'text-red-400' };
    if (strength <= 3) return { strength, text: 'Média', color: 'text-yellow-400' };
    return { strength, text: 'Forte', color: 'text-green-400' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <UserPlus size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Crie sua conta
          </h2>
          <p className="mt-2 text-white/70">
            Junte-se à ArbElite e comece a investir
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-md mb-6 flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm">{error}</span>
                {error.includes('já está cadastrado') && (
                  <div className="mt-2 text-xs text-red-200">
                    <p>💡 Dica: Se você já tem uma conta, <Link to="/login" className="underline hover:text-red-100">faça login aqui</Link></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-white px-4 py-3 rounded-md mb-6 flex items-start">
              <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                Nome completo
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  id="fullName"
                  type="text"
                  className="input-field pl-10"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  required
                />
              </div>
            </div>
            
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
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
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
              {password && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-4 rounded transition-colors ${
                          i < passwordStrength.strength ? 'bg-current' : 'bg-white/20'
                        } ${passwordStrength.color}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {confirmPassword && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    {password === confirmPassword ? (
                      <CheckCircle size={18} className="text-green-400" />
                    ) : (
                      <AlertCircle size={18} className="text-red-400" />
                    )}
                  </div>
                )}
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
                  Criando conta...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <UserPlus size={18} className="mr-2" />
                  Criar conta
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-white/70">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                Faça login
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-300 mb-2">🔒 Segurança Avançada</h3>
          <ul className="text-xs text-blue-200/80 space-y-1">
            <li>• <strong>Dados protegidos</strong> com criptografia de ponta a ponta</li>
            <li>• <strong>Acesso seguro</strong> com autenticação robusta</li>
            <li>• <strong>Backup automático</strong> na nuvem para máxima segurança</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;