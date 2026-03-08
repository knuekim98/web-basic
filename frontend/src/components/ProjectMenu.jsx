import React from 'react';
import { Brain, Image, BarChart3, Settings, ChevronRight } from 'lucide-react';

const ProjectMenu = ({ isBackendReady }) => {
  const projects = [
    { id: 'mnist', title: 'MNIST DIGIT RECOGNITION', icon: <Brain size={20} /> },
    { id: 'p2', title: 'OBJECT DETECTION SYSTEM', icon: <Image size={20} /> },
    { id: 'p3', title: 'PREDICTIVE DATA ANALYSIS', icon: <BarChart3 size={20} /> },
    { id: 'p4', title: 'SYSTEM CONFIGURATION', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row items-center justify-center p-8 md:p-20 gap-16">
      <div className="w-full md:w-1/2 text-center md:text-left">
        <h2 className="text-7xl md:text-7xl font-black tracking-tighter text-white mb-6">PROJECTS</h2>
        <p className="text-sm tracking-widest text-white">
          This is a sample text. It will give an explanation of each projects.  
        </p>
        {!isBackendReady && (
          <p className="text-amber-500 text-xs tracking-widest animate-pulse">CONNECTING TO SERVER...</p>
        )}
      </div>
      <div className="w-full md:w-1/2 flex flex-col gap-4 max-w-xl">
        {projects.map((proj) => (
          <button
            key={proj.id}
            disabled={!isBackendReady}
            className="w-full h-20 px-8 flex items-center justify-between border border-white/10 text-white hover:bg-white/5 disabled:opacity-20 transition-all"
          >
            <div className="flex items-center gap-6">
              {proj.icon} <span className="tracking-[0.2em] text-sm uppercase">{proj.title}</span>
            </div>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectMenu;