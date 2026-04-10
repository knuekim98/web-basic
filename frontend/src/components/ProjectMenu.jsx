import { Brain, Image, Settings, ChevronRight, ArrowLeft, ChessKing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ProjectMenu = ({ isBackendReady }) => {
  const navigate = useNavigate();
  const projects = [
    { id: 'mnist', title: 'MNIST DIGIT RECOGNITION', icon: <Brain size={20} /> },
    { id: 'chess', title: 'CHESS OPENING RECOMMENDATION', icon: <ChessKing size={20} /> },
    { id: 'p2', title: 'OBJECT DETECTION SYSTEM', icon: <Image size={20} /> },
    { id: 'p4', title: 'SYSTEM CONFIGURATION', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-8 md:p-20 gap-16">
      <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
        <motion.h2 className="text-7xl xl:text-9xl font-black tracking-tighter mb-6">PROJECTS</motion.h2>
        
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors tracking-[0.2em] text-xs uppercase mb-8"
        >
          <ArrowLeft size={14} /> Back to Home
        </button>

        {!isBackendReady && (
          <p className="text-amber-500 text-xs tracking-widest animate-pulse font-light">CONNECTING TO NEURAL ENGINE...</p>
        )}
      </div>

      <div className="w-full md:w-1/2 flex flex-col gap-4 max-w-xl">
        {projects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => navigate(`/${proj.id}`)}
            disabled={!isBackendReady | !['mnist','chess'].includes(proj.id)}
            className="w-full h-20 px-8 flex items-center justify-between border border-white/10 hover:border-white hover:bg-white/5 disabled:opacity-20 transition-all group"
          >
            <div className="flex items-center gap-6">
              <span className="text-gray-400 group-hover:text-white">{proj.icon}</span>
              <span className="tracking-[0.2em] text-sm uppercase">{proj.title}</span>
            </div>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectMenu;