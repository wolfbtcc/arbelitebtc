import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

// Pages with lazy loading for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const FounderIntroPage = React.lazy(() => import('./pages/FounderIntroPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const WalletPage = React.lazy(() => import('./pages/WalletPage'));
const InvestmentWalletPage = React.lazy(() => import('./pages/InvestmentWalletPage'));
const AlliancePage = React.lazy(() => import('./pages/AlliancePage'));
const UsdtWithdrawalPage = React.lazy(() => import('./pages/UsdtWithdrawalPage'));

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { ArbitrageProvider } from './contexts/ArbitrageContext';
import { WithdrawalProvider } from './contexts/WithdrawalContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { ReferralProvider } from './contexts/ReferralContext';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white/70">Carregando página...</p>
    </div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Erro no carregamento</h2>
            <p className="text-white/70 mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ReferralProvider>
            <WalletProvider>
              <PaymentProvider>
                <ArbitrageProvider>
                  <WithdrawalProvider>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<FounderIntroPage />} />
                        <Route path="/arbitragem" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/sobre" element={<AboutPage />} />
                        <Route path="/wallet" element={<WalletPage />} />
                        <Route path="/investment-wallet" element={<InvestmentWalletPage />} />
                        <Route path="/alliance" element={<AlliancePage />} />
                        <Route path="/usdt-withdrawal" element={<UsdtWithdrawalPage />} />
                      </Routes>
                    </Suspense>
                  </WithdrawalProvider>
                </ArbitrageProvider>
              </PaymentProvider>
            </WalletProvider>
          </ReferralProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;