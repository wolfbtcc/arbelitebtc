import React from 'react';
import { TrendingUp, BarChart2, Shield, DollarSign } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <TrendingUp size={24} className="text-blue-500" />,
      title: "Arbitragem automática",
      description: "Identifica oportunidades de arbitragem em tempo real entre as principais exchanges globais."
    },
    {
      icon: <BarChart2 size={24} className="text-blue-500" />,
      title: "Análises avançadas",
      description: "Dados históricos e estatísticos para otimizar suas estratégias de arbitragem."
    },
    {
      icon: <Shield size={24} className="text-blue-500" />,
      title: "Segurança garantida",
      description: "Proteção de dados e criptografia avançada para manter suas operações seguras."
    },
    {
      icon: <DollarSign size={24} className="text-blue-500" />,
      title: "Lucros consistentes",
      description: "Aproveite oportunidades com spreads de até 0,80% em diversas criptomoedas."
    }
  ];

  return (
    <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-black to-slate-900">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher ArbElite?</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Nossa plataforma oferece uma experiência completa de arbitragem automatizada com 
            todas as ferramentas que você precisa para maximizar seus lucros.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;