import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import axios from 'axios';

const ChessUserAnalysis = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!username) return;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const lichessUrl = `https://lichess.org/api/games/user/${username}?max=200&rated=true&perfType=bullet,blitz,rapid,classical`;
        const res = await fetch(lichessUrl, { headers: { 'Accept': 'application/x-ndjson' } });
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
        console.error("Analysis error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [username, API_URL]);

  // sort
  const processResult = (resultObj) => {
    if (!resultObj) return [];
    return Object.entries(resultObj)
      .map(([id, data]) => ({ id, ...data, total: data.white + data.draws + data.black }))
      .sort((a, b) => b.total - a.total)
      //.slice(0, 8);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
      <p className="text-zinc-500 font-mono text-sm tracking-[0.3em] animate-pulse uppercase">Analyzing Games...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <button onClick={() => navigate('/chess')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-12 transition-colors text-xs uppercase tracking-widest font-bold">
        <ArrowLeft size={16} /> Back to List
      </button>

      <div className="mb-20">
        <span className="text-emerald-500 font-mono text-xs tracking-[0.4em] uppercase font-bold block mb-2">Analysis Result</span>
        <h2 className="text-7xl font-black text-white tracking-tighter italic lowercase">{username}<span className="text-zinc-800">.</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <RepertoireSection title="White Repertoire" groups={processResult(data?.white)} myColor="white" />
        <RepertoireSection title="Black Repertoire" groups={processResult(data?.black)} myColor="black" />
      </div>
    </div>
  );
};

const RepertoireSection = ({ title, groups, myColor }) => (
  <div className="space-y-6">
    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
      <span className={`w-2 h-2 rounded-full ${myColor === 'white' ? 'bg-white' : 'bg-zinc-700'}`} />
      {title}
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-widest">
            <th className="pb-4 font-bold">Main Opening</th>
            <th className="pb-4 font-bold">Games</th>
            <th className="pb-4 font-bold">Result</th>
            <th className="pb-4 font-bold text-right">WR%</th>
            <th className="pb-4 w-8"></th>
          </tr>
        </thead>
        {groups.map((group) => (
          <OpeningGroupCard key={group.name} group={group} myColor={myColor} />
        ))}
      </table>
    </div>
  </div>
);

const OpeningGroupCard = ({ group, myColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const winCount = myColor === 'white' ? group.white : group.black;
  const drawCount = group.draws;
  const lossCount = myColor === 'white' ? group.black : group.white;
  const total = group.total;
  
  const winP = (winCount / total) * 100;
  const drawP = (drawCount / total) * 100;
  const lossP = (lossCount / total) * 100;

  return (
    <tbody className="border-b border-white/5 last:border-0">
      {/* main opening list */}
      <tr 
        className="group cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <td className="py-4 pr-4">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-zinc-600" />}
            <span className="text-zinc-200 font-bold text-sm group-hover:text-emerald-400 transition-colors">
              {group.name}
            </span>
          </div>
        </td>
        <td className="py-4 pr-4 text-zinc-500 font-mono text-xs">{total}</td>
        <td className="py-4 pr-4 min-w-[120px]">
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-zinc-800">
              <div style={{ width: `${winP}%` }} className="bg-emerald-500" />
              <div style={{ width: `${drawP}%` }} className="bg-zinc-500" />
              <div style={{ width: `${lossP}%` }} className="bg-rose-500" />
            </div>
            <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-400">
              <span>W:{winCount}</span>
              <span>D:{drawCount}</span>
              <span>L:{lossCount}</span>
            </div>
          </div>
        </td>
        <td className="py-4 text-right font-black font-mono text-xs italic text-white">
          {( (winCount + drawCount/2) / total * 100 ).toFixed(1)}%
        </td>
        <td className="py-4 text-right pl-4"></td>
      </tr>

      {/* detailed opening list */}
      {isOpen && (
        <tr>
          <td colSpan="5" className="bg-black/20 px-4 py-4 rounded-xl">
            <div className="space-y-3">
              {Object.entries(group.variations)
                .map(([id, data]) => ({ id, ...data, total: data.white + data.draws + data.black }))
                .sort((a,b) => (b.total) - (a.total))
                .map((varOp) => (
                  <div key={varOp.id} className="flex items-center justify-between text-[11px] hover:bg-white/5 p-1 rounded transition-colors">
                    <span className="text-zinc-300 truncate max-w-[60%]">
                       └ {varOp.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-zinc-500">
                        <span className="text-emerald-500">{myColor==='white'?varOp.white:varOp.black}W</span> · {varOp.draws}D · <span className="text-rose-500">{myColor==='white'?varOp.black:varOp.white}L</span>
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`${window.location.origin}${window.location.pathname}#/chess/opening?id=${varOp.id}&color=${myColor}`, '_blank');
                        }}
                        className="text-zinc-700 hover:text-emerald-400"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
};

export default ChessUserAnalysis;