import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LandingPage from './components/LandingPage';
import ProjectMenu from './components/ProjectMenu';
import MnistProject from './components/MnistProject';

export default function App() {
  const [page, setPage] = useState('landing');
  const [isBackendReady, setIsBackendReady] = useState(false);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    axios.get(`${API_URL}/`)
      .then(() => setIsBackendReady(true))
      .catch(() => console.log("Backend waking up..."));
  }, []);

  return (
    <main className="bg-[#0a0a0a] min-h-screen text-white">
      {page === 'landing' && (
        <LandingPage onStart={() => setPage('menu')} />
      )}
      
      {page === 'menu' && (
        <ProjectMenu 
          isBackendReady={isBackendReady} 
          onBack={() => setPage('landing')} 
          onSelectProject={(id) => setPage(id)} 
        />
      )}

      {page === 'mnist' && (
        <MnistProject onBack={() => setPage('menu')} />
      )}
    </main>
  );
}