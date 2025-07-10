import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      
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

export default HomePage;