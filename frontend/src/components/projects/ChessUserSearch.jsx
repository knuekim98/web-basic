import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ChessUserAnalysis from './ChessUserAnalysis';

const ChessUserSearch = ({ onBack, onSelectOpening }) => {
  const [inputValue, setInputValue] = useState("");
  const [onSearch, setOnSearch] = useState(false);

  if (onSearch) {
    return (
      <ChessUserAnalysis
        username={inputValue}
        onBack={() => setOnSearch(false)} 
        onSelectOpening={onSelectOpening}
      />
    );
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-12">
        <div className="text-center space-y-4">
          <button 
            onClick={onBack}
            className="text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-[0.3em] mb-4"
          >
            ← Back to List
          </button>
          <h2 className="text-6xl font-black text-white tracking-tighter italic">
            SEARCH <span className="text-emerald-500">PLAYER</span>
          </h2>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
            Enter Lichess Username to analyze opening personality
          </p>
        </div>

        <div className="relative group">
          <input 
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && inputValue && setOnSearch(true)}
            placeholder="Username..."
            className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-8 px-10 text-3xl font-bold text-white focus:outline-none focus:border-emerald-500/40 transition-all placeholder:text-zinc-800"
          />
          <button 
            onClick={() => inputValue && setOnSearch(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-5 bg-emerald-500 text-black rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            <Search size={28} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChessUserSearch;