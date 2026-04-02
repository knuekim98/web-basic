import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import axios from 'axios';

const ChessProject = ({ onBack }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/chess/query`, {
        columns: ["name", "white", "draws", "black", "average_rating", "moves", "ECO", "games", "white_rate", "draws_rate", "black_rate"],
        limit: pageSize,
        offset: currentPage * pageSize,
        sortby: "games",
        ascending: false,
        color: "white"
      });
      setData(response.data.data);
      setTotalCount(response.data.total_count);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 p-6 md:p-16 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm uppercase tracking-widest">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <h1 className="text-5xl font-black text-white tracking-tighter italic">
          CHESS OPENINGS <span className="text-zinc-700">EXPLORER</span>
        </h1>
      </div>

      {/* Table Container */}
      <div className="max-w-7xl mx-auto bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="p-8 text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Opening / Stats</th>
                <th className="p-8 text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Win Rate Distribution</th>
                <th className="p-8 text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Move Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr><td colSpan="3" className="p-32 text-center text-zinc-500 tracking-widest text-lg animate-pulse">ACCESSING DATABASE...</td></tr>
              ) : data.map((item, idx) => {
                return (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-all group">
                    {/* Name & Total Games */}
                    <td className="p-8 overflow-hidden">
                      <div className="flex flex-col gap-2 max-w-full">
                        <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight truncate">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded text-zinc-400">{item.ECO}</span>
                          <span className="text-sm font-medium text-zinc-500">
                            <b className="text-zinc-300">{item.games}</b> games played
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Win Rate (Thicker Bar) */}
                    <td className="p-8 w-80">
                      <div className="flex flex-col gap-3">
                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/10">
                          <div style={{ width: `${item.white_rate}%` }} className="bg-white" />
                          <div style={{ width: `${item.draws_rate}%` }} className="bg-zinc-500" />
                          <div style={{ width: `${item.black_rate}%` }} className="bg-zinc-700" />
                        </div>
                        <div className="flex justify-between text-xs font-bold font-mono">
                          <span className="text-white">W {item.white_rate}%</span>
                          <span className="text-zinc-400">D {item.draws_rate}%</span>
                          <span className="text-zinc-500">B {item.black_rate}%</span>
                        </div>
                      </div>
                    </td>

                    {/* Move Sequence (Highlighted) */}
                    <td className="p-8 overflow-hidden">
                      <div className="bg-black/30 px-4 py-3 rounded-lg border border-white/5 max-w-full">
                        <p className="text-xs font-mono text-zinc-500 truncate italic" title={item.moves}>
                          {item.moves}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-8 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
          <p className="text-sm text-zinc-500 font-mono">
            SHOWING <span className="text-white">{(currentPage * pageSize) + 1}-{Math.min((currentPage + 1) * pageSize, totalCount)}</span> OF {totalCount.toLocaleString()}
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent transition-all flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={(currentPage + 1) * pageSize >= totalCount}
              className="px-6 py-3 bg-white text-black hover:bg-zinc-200 disabled:opacity-20 transition-all flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessProject;