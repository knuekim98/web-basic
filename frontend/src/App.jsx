import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Image, BarChart3, Settings, ChevronRight } from 'lucide-react';
import axios from 'axios';

import LandingPage from './components/LandingPage';
import ProjectMenu from './components/ProjectMenu';


export default function App() {
  const [page, setPage] = useState('landing');
  const [isBackendReady, setIsBackendReady] = useState(false);

  useEffect(() => {
    axios.get('https://web-basic-backend.onrender.com/')
      .then(() => setIsBackendReady(true))
      .catch(() => console.log("Backend waking up..."));
  }, []);

  return (
    <main className="bg-[#0a0a0a] min-h-screen">
      {page === 'landing' ? (
        <LandingPage onStart={() => setPage('menu')} />
      ) : (
        <ProjectMenu isBackendReady={isBackendReady} />
      )}
    </main>
  );
}