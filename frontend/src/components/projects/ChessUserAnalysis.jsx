import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import axios from 'axios';

const ChessUserAnalysis = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!username) return;
    const API_URL = import.meta.env.VITE_API_URL;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const lichessUrl = `https://lichess.org/api/games/user/${username}?max=200&rated=true&perfType=bullet,blitz,rapid,classical`;
        const res = await fetch(lichessUrl, {
          headers: { 'Accept': 'application/x-ndjson' }
        });
        if (!res.ok) throw new Error("Lichess API access failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let { value, done } = await reader.read();
        let leftover = "";
        const games = [];

        while (!done) {
          const chunk = leftover + decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          leftover = lines.pop();
          for (const line of lines) {
            if (line.trim()) games.push(JSON.parse(line));
          }
          ({ value, done } = await reader.read());
        }

        const response = await axios.post(`${API_URL}/api/chess/analyze`, {
          username: username,
          games: games
        });
        setData(response.data.opening_result);
      } catch (error) {
        console.error("Analysis Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [username]);

  // sort
  const processResult = (resultObj) => {
    if (!resultObj) return [];
    return Object.entries(resultObj)
      .map(([id, stats]) => ({
        id,
        ...stats,
        total: stats.white + stats.draws + stats.black
      }))
      .sort((a, b) => b.total - a.total) 
      .slice(0, 8);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-zinc-500 font-mono text-sm animate-pulse uppercase tracking-[0.3em]">Analyzing Games...</p>
      </div>
    );
  }

  const whiteRepertoire = processResult(data?.white);
  const blackRepertoire = processResult(data?.black);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <button 
        onClick={() => navigate('/chess')}
        className="flex items-center gap-2 text-zinc-500 hover:text-white mb-10 transition-colors text-sm uppercase tracking-widest"
      >
        <ArrowLeft size={18} /> Back to List
      </button>

      <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 font-mono text-xs tracking-[0.4em] uppercase font-bold">Player Report</span>
          </div>
          <h2 className="text-7xl font-black text-white tracking-tighter lowercase">{username}<span className="text-zinc-800">.</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <RepertoireSection 
          title="White Repertoire" 
          openings={whiteRepertoire}
          color="white" 
        />
        <RepertoireSection 
          title="Black Repertoire" 
          openings={blackRepertoire}
          color="black" 
        />
      </div>
    </div>
  );
};

// 리퍼토리 섹션 컴포넌트
const RepertoireSection = ({ title, openings, color }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${color === 'white' ? 'bg-white' : 'bg-zinc-700'}`} />
        {title}
      </h3>
      <div className="grid gap-4">
        {openings.length > 0 ? (
          openings.map((op) => (
            <Link to={`/chess/opening?id=${op.id}&color=${color}`} target="_blank" rel="noopener noreferrer">
              <div key={op.id} className="cursor-pointer">
                <OpeningStatCard op={op} myColor={color} />
              </div>
            </Link>
          ))
        ) : (
          <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center text-zinc-700 italic">
            No matching openings found
          </div>
        )}
      </div>
    </div>
  );
};

// 개별 오프닝 카드 컴포넌트
const OpeningStatCard = ({ op, myColor }) => {
  const winCount = myColor === 'white' ? op.white : op.black;
  const lossCount = myColor === 'white' ? op.black : op.white;
  const drawCount = op.draws;
  
  const winP = (winCount / op.total) * 100;
  const drawP = (drawCount / op.total) * 100;
  const lossP = (lossCount / op.total) * 100;

  return (
    <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="max-w-[70%]">
          <h4 className="text-white font-bold text-sm truncate group-hover:text-emerald-400 transition-colors">{op.name}</h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">{op.total} Games Played</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-white font-mono">WR {(winP + drawP / 2).toFixed(1)}%</span>
        </div>
      </div>

      {/* Stacked Win/Draw/Loss Bar */}
      <div className="h-2 w-full flex rounded-full overflow-hidden bg-zinc-800">
        <div style={{ width: `${winP}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
        <div style={{ width: `${drawP}%` }} className="h-full bg-zinc-500" />
        <div style={{ width: `${lossP}%` }} className="h-full bg-rose-500" />
      </div>
      
      <div className="flex justify-between mt-2 text-[9px] font-bold font-mono text-zinc-600 uppercase">
        <span className="text-emerald-500/80">Win {winCount}</span>
        <span>Draw {drawCount}</span>
        <span className="text-rose-500/80">Loss {lossCount}</span>
      </div>
    </div>
  );
};

export default ChessUserAnalysis;