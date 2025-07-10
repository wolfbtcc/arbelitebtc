import React from 'react';
import Navbar from '../components/layout/Navbar';
import { Shield, TrendingUp, DollarSign, Clock } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Sobre a ArbElite</h1>
          
          <div className="mb-10">
            <p className="text-lg text-white/80 mb-4">
              A ArbElite é uma plataforma líder em arbitragem de criptomoedas, permitindo que traders de todos os níveis aproveitem as diferenças de preços entre as principais exchanges globais.
            </p>
            <p className="text-lg text-white/80">
              Nossa tecnologia avançada monitora constantemente os mercados para identificar oportunidades de arbitragem em tempo real, oferecendo aos nossos usuários a chance de obter lucros consistentes com risco reduzido.
            </p>
          </div>
          
          <h2 className="text-2xl font-bold mb-6">Como funciona a arbitragem de criptomoedas?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="card p-6">
              <div className="flex mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <TrendingUp size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Encontre oportunidades</h3>
                  <p className="text-white/70 mt-1">Identificamos diferenças de preços entre exchanges</p>
                </div>
              </div>
              <p className="text-white/80">
                Nossa plataforma monitora continuamente dezenas de exchanges de criptomoedas globais, identificando diferenças de preços que podem ser exploradas para obter lucro.
              </p>
            </div>
            
            <div className="card p-6">
              <div className="flex mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <Clock size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Execute rapidamente</h3>
                  <p className="text-white/70 mt-1">Aproveite oportunidades antes que desapareçam</p>
                </div>
              </div>
              <p className="text-white/80">
                As oportunidades de arbitragem podem durar apenas alguns segundos. Nossa plataforma permite que você execute operações rapidamente para maximizar seus lucros.
              </p>
            </div>
            
            <div className="card p-6">
              <div className="flex mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <Shield size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Risco reduzido</h3>
                  <p className="text-white/70 mt-1">Estratégia com menor exposição ao mercado</p>
                </div>
              </div>
              <p className="text-white/80">
                A arbitragem de criptomoedas oferece um perfil de risco mais baixo do que trading tradicional, pois você não está especulando sobre a direção do mercado.
              </p>
            </div>
            
            <div className="card p-6">
              <div className="flex mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <DollarSign size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Lucros consistentes</h3>
                  <p className="text-white/70 mt-1">Obtenha retornos regulares em sua carteira</p>
                </div>
              </div>
              <p className="text-white/80">
                Com spreads de até 0,80%, você pode obter lucros consistentes independentemente da volatilidade geral do mercado de criptomoedas.
              </p>
            </div>
          </div>
          
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 mb-10">
            <h3 className="text-xl font-semibold mb-4">Por que escolher a ArbElite?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2 mt-1">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span>Monitoramento em tempo real de mais de 30 exchanges globais</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2 mt-1">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span>Interface intuitiva que facilita a execução de operações de arbitragem</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2 mt-1">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span>Suporte a múltiplos pares de criptomoedas para diversificar oportunidades</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2 mt-1">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span>Segurança avançada para proteger seus fundos e dados pessoais</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2 mt-1">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span>Acesso a ferramentas analíticas para otimizar suas estratégias</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Comece a operar hoje mesmo</h3>
            <p className="text-white/80 mb-6">
              Junte-se a milhares de traders que já estão aproveitando as oportunidades de arbitragem em criptomoedas com a ArbElite.
            </p>
            <a href="/register" className="btn-primary inline-block">
              Criar uma conta gratuita
            </a>
          </div>
        </div>
      </div>
      
      <footer className="py-8 px-4 md:px-8 border-t border-white/10">
        <div className="container mx-auto text-center">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} ArbElite. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;