import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import LandingPage from './components/LandingPage';
import ProjectMenu from './components/ProjectMenu';
import MnistProject from './components/projects/MnistProject';
import ChessProject from './components/projects/ChessProject';
import ChessOpeningDetail from './components/projects/ChessOpeningDetail';
import ChessUserSearch from './components/projects/ChessUserSearch';
import ChessUserAnalysis from './components/projects/ChessUserAnalysis';

export default function App() {
  const [isBackendReady, setIsBackendReady] = useState(false);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    const checkBackend = async () => {
      try {
        const response = await axios.get(`${API_URL}/`);
        if (response.status == 200) {
          setIsBackendReady(true);
        }
      } catch (e) {
        setTimeout(checkBackend, 5000);
      }
    };
    checkBackend();
  }, []);

  return (
    <main className="bg-[#0a0a0a] min-h-screen text-white">
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/menu" 
            element={<ProjectMenu isBackendReady={isBackendReady} />} 
          />
          
          <Route path="/mnist" element={<MnistProject />} />
          <Route path="/chess" element={<ChessProject />} />
          <Route path="/chess/opening" element={<ChessOpeningDetail />} />
          <Route path="/chess/search" element={<ChessUserSearch />} />
          <Route path="/chess/user/:username" element={<ChessUserAnalysis />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </main>
  );
}