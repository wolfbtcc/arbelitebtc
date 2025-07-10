import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const FounderIntroPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Trigger animations in sequence
    const timer1 = setTimeout(() => setIsVisible(true), 300);
    const timer2 = setTimeout(() => setShowContent(true), 800);
    const timer3 = setTimeout(() => setShowButton(true), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-black to-emerald-900/10"></div>
      
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col justify-center">
        <div className="max-w-7xl mx-auto">
          {/* Title with fade-in animation */}
          <h1 
            className={`text-4xl md:text-6xl font-bold mb-16 text-center bg-gradient-to-r from-green-400 via-white to-green-400 bg-clip-text text-transparent transition-all duration-1000 transform ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Conheça os fundadores da ArbElite
          </h1>

          {/* Founders Section - Three Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-16">
            
            {/* Thiago Nigro Section */}
            <div 
              className={`transition-all duration-1000 transform ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
            >
              {/* Thiago's Image */}
              <div className="mb-8 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur-xl scale-110"></div>
                  <img 
                    src="https://i.im.ge/2025/07/10/JirhDm.844f241174b84d0de4d26eff62eb1a63.md.jpeg" 
                    alt="Thiago Nigro - Fundador da ArbElite"
                    className="relative w-64 h-72 md:w-72 md:h-80 rounded-lg object-cover shadow-2xl border-4 border-green-500/30 mx-auto hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg opacity-20 blur-sm"></div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mt-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Fundador da ArbElite
                </h2>
              </div>

              {/* Thiago's Story */}
              <div className="space-y-3 text-sm md:text-base leading-relaxed">
                <p className="text-white/90 font-light">
                  <span className="text-green-400 font-semibold">Thiago Nigro</span>, mais conhecido como <span className="text-green-400 font-semibold">Primo Rico</span>, é uma das maiores referências em educação financeira do Brasil.
                </p>

                <p className="text-white/90 font-light">
                  Com milhares de alunos e seguidores, ele ajudou uma geração inteira a sair do aperto, investir com inteligência e buscar <span className="text-green-400 font-semibold">liberdade financeira</span>.
                </p>

                <p className="text-white/90 font-light">
                  Foi assim que nasceu a <span className="text-transparent bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text font-bold">ArbElite</span>. Criada por Thiago com um único objetivo — <span className="text-green-400 font-semibold">maximizar lucros através da arbitragem de Bitcoin</span>.
                </p>
              </div>
            </div>

            {/* Caio Carneiro Section */}
            <div 
              className={`transition-all duration-1000 transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ animationDelay: '0.3s' }}
            >
              {/* Caio's Image */}
              <div className="mb-8 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur-xl scale-110"></div>
                  <img 
                    src="https://i.im.ge/2025/07/10/JirmVc.514bcbd2d93eaa309cfdc34dd0570a6a.md.jpeg" 
                    alt="Caio Carneiro - Presidente da ArbElite"
                    className="relative w-64 h-72 md:w-72 md:h-80 rounded-lg object-cover shadow-2xl border-4 border-green-500/30 mx-auto hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg opacity-20 blur-sm"></div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mt-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Presidente da ArbElite
                </h2>
              </div>

              {/* Caio's Story */}
              <div className="space-y-3 text-sm md:text-base leading-relaxed">
                <p className="text-white/90 font-light">
                  <span className="text-green-400 font-semibold">Caio Carneiro</span> é sinônimo de ação, disciplina e resultado. Conquistou seu <span className="text-green-400 font-semibold">primeiro milhão antes dos 25 anos</span>.
                </p>

                <p className="text-white/90 font-light">
                  Hoje, além de fundador da escola <span className="text-green-400 font-semibold">VENDE-C</span> e sócio da <span className="text-green-400 font-semibold">Wiser Educação</span>, Caio assumiu um novo desafio: levar a ArbElite ao topo.
                </p>

                <p className="text-white/90 font-light">
                  Como presidente da plataforma, ele trouxe sua mentalidade de <span className="text-green-400 font-semibold">alta performance</span> e foco em escala. Sob sua liderança, a ArbElite é um <span className="text-green-400 font-semibold">movimento de independência financeira</span>.
                </p>
              </div>
            </div>

            {/* Bruno Perini Section */}
            <div 
              className={`transition-all duration-1000 transform ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ animationDelay: '0.6s' }}
            >
              {/* Bruno's Image */}
              <div className="mb-8 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur-xl scale-110"></div>
                  <img 
                    src="https://i.im.ge/2025/07/10/Jir6rL.f859dbe63ef023c378f6654d65b9243a.md.jpeg" 
                    alt="Bruno Perini - Diretor Financeiro da ArbElite"
                    className="relative w-64 h-72 md:w-72 md:h-80 rounded-lg object-cover shadow-2xl border-4 border-green-500/30 mx-auto hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg opacity-20 blur-sm"></div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mt-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Diretor Financeiro da ArbElite
                </h2>
              </div>

              {/* Bruno's Story */}
              <div className="space-y-3 text-sm md:text-base leading-relaxed">
                <p className="text-white/90 font-light">
                  <span className="text-green-400 font-semibold">Bruno Perini</span> é a mente por trás de uma das filosofias de investimento mais respeitadas do Brasil. <span className="text-green-400 font-semibold">Ex-militar e educador financeiro</span>, ganhou destaque ensinando como construir patrimônio com estratégia.
                </p>

                <p className="text-white/90 font-light">
                  Em 2020, se uniu a Joel Jota e Thiago Nigro como sócio do <span className="text-green-400 font-semibold">Grupo Primo</span>, reforçando o time que hoje dita o ritmo da nova educação financeira brasileira.
                </p>

                <p className="text-white/90 font-light">
                  Na ArbElite, ele ocupa uma posição estratégica: <span className="text-green-400 font-semibold">diretor financeiro</span>. É dele a missão de manter o coração da operação batendo com eficiência, <span className="text-green-400 font-semibold">analisando riscos, controlando fluxos e otimizando os ganhos</span>.
                </p>

                <p className="text-white/90 font-light">
                  Porque onde outros improvisam, ele <span className="text-green-400 font-semibold">planeja</span>. Onde outros arriscam, ele <span className="text-green-400 font-semibold">calcula</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Final Message */}
          <div 
            className={`text-center max-w-5xl mx-auto mb-12 transition-all duration-1000 transform ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="text-xl md:text-2xl text-white/90 font-light">
              Hoje, a plataforma opera silenciosamente entre as principais exchanges do mundo, gerando lucro com a diferença de preço entre elas.
            </p>
            <p className="text-xl md:text-2xl text-white/90 font-light mt-4">
              Tudo isso com <span className="text-green-400 font-semibold">tecnologia de ponta</span>, <span className="text-green-400 font-semibold">estratégia de elite</span>… e a visão de quem <span className="text-transparent bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text font-bold">nunca jogou pequeno</span>.
            </p>
          </div>

          {/* Call to action button with delayed entrance */}
          <div 
            className={`text-center transition-all duration-1000 transform ${
              showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link 
              to="/arbitragem"
              className="group relative inline-flex items-center justify-center w-full max-w-md mx-auto sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-green-500/40 overflow-hidden"
            >
              {/* Animated background overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
              
              {/* Pulse effect on hover */}
              <div className="absolute inset-0 bg-green-400/20 rounded-full scale-0 group-hover:scale-110 group-hover:opacity-0 transition-all duration-500"></div>
              
              {/* Content */}
              <div className="relative flex items-center justify-center w-full">
                <TrendingUp size={20} className="mr-2 sm:mr-3 group-hover:animate-pulse group-hover:rotate-12 transition-all duration-300" />
                <span className="text-center leading-tight">
                  <span className="block sm:inline">Começar com o Primo</span>
                  <span className="block sm:inline sm:ml-1">agora</span>
                </span>
                <ArrowRight size={20} className="ml-2 sm:ml-3 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
            </Link>
            
            {/* Mobile-specific tap indicator */}
            <div className="mt-3 sm:hidden">
              <p className="text-xs text-green-400/70 animate-pulse">
                👆 Toque para começar sua jornada
              </p>
            </div>
          </div>

          {/* Subtle footer */}
          <div 
            className={`text-center mt-12 text-white/50 text-sm transition-all duration-1000 transform ${
              showButton ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p>Uma revolução silenciosa no mundo dos investimentos</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border border-green-500/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 border border-emerald-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-5 w-12 h-12 border border-green-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/3 right-20 w-14 h-14 border border-green-600/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute bottom-1/3 left-1/4 w-10 h-10 border border-emerald-500/20 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
    </div>
  );
};

export default FounderIntroPage;