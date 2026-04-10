import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-12 text-white">
          PORTFOLIO
        </h1>
        <button 
          onClick={() => navigate('/menu')}
          className="px-12 py-4 border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-500 text-sm tracking-[0.3em] uppercase"
        >
          Enter Experience
        </button>
      </motion.div>
    </div>
  );
};

export default LandingPage;