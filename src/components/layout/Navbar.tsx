import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, Menu, X, Home, Info, LayoutDashboard, LogOut, Wallet, Users, User, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleWithdrawal = () => {
    navigate('/wallet');
    setIsMenuOpen(false);
  };

  const handleWallet = () => {
    navigate('/investment-wallet');
    setIsMenuOpen(false);
  };

  const handleAlliance = () => {
    navigate('/alliance');
    setIsMenuOpen(false);
  };

  const handleUsdtWithdrawal = () => {
    navigate('/usdt-withdrawal');
    setIsMenuOpen(false);
  };

  const getUserDisplayName = () => {
    return userProfile?.full_name || user?.user_metadata?.full_name || 'Usuário';
  };

  return (
    <nav className="w-full py-4 px-4 md:px-8 relative">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
          <TrendingUp size={28} className="text-blue-500" />
          <span className="text-white">ArbElite</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <NavLink to="/" current={location.pathname}>Fundador</NavLink>
          <NavLink to="/arbitragem" current={location.pathname}>Arbitragem</NavLink>
          <NavLink to="/sobre" current={location.pathname}>Sobre</NavLink>
          
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" current={location.pathname}>Dashboard</NavLink>
              <button 
                onClick={handleWallet}
                className="text-white/70 hover:text-white transition-colors"
              >
                Wallet
              </button>
              <button 
                onClick={handleWithdrawal}
                className="text-white/70 hover:text-white transition-colors"
              >
                Sacar Lucro
              </button>
              <button 
                onClick={handleUsdtWithdrawal}
                className="text-white/70 hover:text-white transition-colors flex items-center"
              >
                <DollarSign size={16} className="mr-1" />
                Sacar em USDT
              </button>
              <button 
                onClick={handleAlliance}
                className="text-white/70 hover:text-white transition-colors"
              >
                🔗 Aliança ArbElite
              </button>
              
              {/* User Info */}
              <div className="flex items-center space-x-2 text-white/70">
                <User size={16} />
                <span className="text-sm">
                  {getUserDisplayName()}
                </span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="text-white/70 hover:text-white transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" current={location.pathname}>Login</NavLink>
              <Link 
                to="/register" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-all"
              >
                Criar Conta
              </Link>
            </>
          )}
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 bg-black/95 backdrop-blur-sm z-50 transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-8">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-xl font-bold"
              onClick={() => setIsMenuOpen(false)}
            >
              <TrendingUp size={28} className="text-blue-500" />
              <span className="text-white">ArbElite</span>
            </Link>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Info Mobile */}
          {isAuthenticated && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-white">{getUserDisplayName()}</p>
                  <p className="text-sm text-white/50">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <MobileNavLink 
              to="/"
              icon={<Home size={20} />}
              onClick={() => setIsMenuOpen(false)}
            >
              Fundador
            </MobileNavLink>
            
            <MobileNavLink 
              to="/arbitragem"
              icon={<TrendingUp size={20} />}
              onClick={() => setIsMenuOpen(false)}
            >
              Arbitragem
            </MobileNavLink>
            
            <MobileNavLink 
              to="/sobre"
              icon={<Info size={20} />}
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre
            </MobileNavLink>

            {isAuthenticated ? (
              <>
                <MobileNavLink 
                  to="/dashboard"
                  icon={<LayoutDashboard size={20} />}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </MobileNavLink>
                
                <button
                  onClick={handleWallet}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left w-full"
                >
                  <Wallet size={20} />
                  <span>Wallet</span>
                </button>
                
                <button
                  onClick={handleWithdrawal}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left w-full"
                >
                  <Wallet size={20} />
                  <span>Sacar Lucro</span>
                </button>
                
                <button
                  onClick={handleUsdtWithdrawal}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left w-full"
                >
                  <DollarSign size={20} />
                  <span>💰 Sacar em USDT</span>
                </button>
                
                <button
                  onClick={handleAlliance}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left w-full"
                >
                  <Users size={20} />
                  <span>🔗 Aliança ArbElite</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left w-full text-red-500"
                >
                  <LogOut size={20} />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-all text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  current: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, current, children }) => {
  const isActive = current === to;
  
  return (
    <Link
      to={to}
      className={`${
        isActive ? 'text-blue-500 font-medium' : 'text-white/70 hover:text-white'
      } transition-colors`}
    >
      {children}
    </Link>
  );
};

interface MobileNavLinkProps {
  to: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, icon, onClick, children }) => {
  return (
    <Link
      to={to}
      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

export default Navbar;