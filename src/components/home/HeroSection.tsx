import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ArbitrageSimulation from './ArbitrageSimulation';

const HeroSection: React.FC = () => {
  const [animateTitle, setAnimateTitle] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setAnimateTitle(true);
  }, []);

  return (
    <section className="min-h-[85vh] flex flex-col md:flex-row items-center justify-between pt-10 pb-16 px-4 md:px-8 container mx-auto">
      <div className="w-full md:w-1/2 space-y-6 mb-10 md:mb-0">
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight transition-all duration-700 ${animateTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          Maximize seus lucros com{' '}
          <span className="text-blue-500">arbitragem de</span>{' '}
          <span className="text-blue-500">Bitcoin</span>
        </h1>
        
        <p className={`text-lg text-white/80 mt-4 max-w-xl transition-all duration-700 delay-200 ${animateTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          ArbElite oferece oportunidades de arbitragem com spreads de até 0,80%, monitorando automaticamente as principais exchanges globais.
        </p>
        
        <div className={`flex flex-col sm:flex-row gap-4 mt-8 transition-all duration-700 delay-400 ${animateTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link 
            to="/register" 
            className="btn-primary group"
          >
            Comece agora
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </Link>
          
          <Link
            to="/login"
            className="btn-secondary"
          >
            Já tenho conta
          </Link>
          
          <Link
            to="/"
            className="btn-secondary flex items-center justify-center"
          >
            👑 Conheça o Fundador
          </Link>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 flex justify-end">
        <ArbitrageSimulation />
      </div>
    </section>
  );
};

export default HeroSection;