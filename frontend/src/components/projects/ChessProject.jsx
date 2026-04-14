import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, ChessKing, TrendingUp, Search, X, Lightbulb } from 'lucide-react';
import axios from 'axios';

const ChessProject = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [color, setColor] = useState("white");
  const [sortBy, setSortBy] = useState('games');
  const [ascending, setAscending] = useState(false);
  const pageSize = 15;

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_URL}/api/chess/query`, {
          columns: ["id", "name", "ECO", "moves", "games", "white_rate", "draws_rate", "black_rate"],
          limit: pageSize,
          offset: currentPage * pageSize,
          sortby: sortBy,
          ascending: ascending,
          color: color,
          search: searchTerm
        });
        setData(response.data.data);
        setTotalCount(response.data.total_count);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, searchTerm, color, sortBy, ascending]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };
  const toggleColor = () => {
    setColor(prev => prev === "white" ? "black" : "white");
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const getPaginationRange = () => {
    const current = currentPage + 1;
    const range = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 p-6 md:p-16 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex justify-between items-start mb-10">
          <button onClick={() => navigate('/menu')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm uppercase tracking-widest">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          <button 
            onClick={() => navigate('/chess/search')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold text-sm"
          >
            <Search size={16} /> Analyze Player
          </button>
        </div>

        <h1 className="text-5xl font-black text-white tracking-tighter italic">
          CHESS OPENINGS <span className="text-zinc-700">EXPLORER</span>
        </h1>

        <h3 className="text-sm text-zinc-500 italic mt-3">
          This database features openings with a minimum of 500k recorded games on lichess.org,<br></br>
          restricted to the initial 3-6 moves for games played at a 1400+ rating (Blitz or slower). 
        </h3>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8 w-full md:w-auto">
            {/* color toggle button */}
            <button
              onClick={toggleColor}
              className={`group w-14 h-14 flex items-center justify-center rounded-2xl border transition-all duration-300 relative ${
                color === 'white'
                ? 'bg-white text-black border-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-100'
                : 'bg-zinc-900 text-white border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:bg-zinc-700'
              }`}
            >
              <ChessKing 
                size={27} 
                className="transition-transform duration-300 group-active:scale-90"
              />
            </button>

            {/* sort */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-200 uppercase tracking-widest opacity-60">Sorted by</span>
              <div className="flex items-center gap-3">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-zinc-200 text-sm font-bold outline-none cursor-pointer hover:text-white transition-colors appearance-none pr-4"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="games" className="bg-zinc-900">Games Count</option>
                  <option value="score_rate" className="bg-zinc-900">Win Rate</option>
                  <option value="draws_rate" className="bg-zinc-900">Draw Rate</option>
                  <option value="average_rating" className="bg-zinc-900">Avg Rating</option>
                </select>
                
                <button 
                  onClick={() => setAscending(!ascending)}
                  className="text-zinc-500 hover:text-pink-400 transition-colors p-1"
                  title={ascending ? "Ascending" : "Descending"}
                >
                  <TrendingUp 
                    size={16} 
                    className={`transition-transform duration-300 ${ascending ? 'rotate-0' : 'rotate-180 flip-y'}`} 
                  />
                </button>
              </div>
            </div>
          </div>
          
          {/* search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="Search by Name or Moves"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="max-w-7xl mx-auto bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="py-8 pl-8 text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Opening</th>
                <th className="py-8 px-2 text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Win Rate Distribution</th>
                <th className="p-8 text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Move Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr><td colSpan="3" className="p-32 text-center text-zinc-500 tracking-widest text-lg animate-pulse">ACCESSING DATABASE...</td></tr>
              ) : data.map((opening, idx) => {
                return (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-all group">
                    {/* Name & Total Games */}
                    <td className="py-8 pl-8 pr-4 overflow-hidden w-80 lg:w-110">
                      <div className="flex flex-col gap-2 max-w-full">
                        <span 
                          onClick={() => navigate(`/chess/opening?id=${opening.id}&color=${color}`)}
                          className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight truncate block w-80 lg:w-110"
                          title={opening.name}
                        >
                          {opening.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded text-zinc-400">{opening.ECO}</span>
                          <span className="text-sm font-medium text-zinc-500">
                            <b className="text-zinc-300">{opening.games.toLocaleString()}</b> games played
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Win Rate Bar */}
                    <td className="py-8 px-2 w-50 lg:w-80">
                      <div className="flex flex-col gap-3">
                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/10">
                          {color === 'white' ? (
                            <>
                              <div style={{ width: `${opening.white_rate}%` }} className="bg-white" />
                              <div style={{ width: `${opening.draws_rate}%` }} className="bg-zinc-500" />
                              <div style={{ width: `${opening.black_rate}%` }} className="bg-zinc-700" />
                            </>
                          ) : (
                            <>
                              <div style={{ width: `${opening.black_rate}%` }} className="bg-zinc-700" />
                              <div style={{ width: `${opening.draws_rate}%` }} className="bg-zinc-500" />
                              <div style={{ width: `${opening.white_rate}%` }} className="bg-white" />
                            </>
                          )}
                        </div>
                        <div className="flex justify-between text-xs font-bold font-mono">
                          {color === 'white' ? (
                            <>
                              <span className="text-white">W {opening.white_rate.toFixed(1)}%</span>
                              <span className="text-zinc-400">D {opening.draws_rate.toFixed(1)}%</span>
                              <span className="text-zinc-500">B {opening.black_rate.toFixed(1)}%</span>
                            </>
                          ) : (
                            <>
                              <span className="text-zinc-500">B {opening.black_rate.toFixed(1)}%</span>
                              <span className="text-zinc-400">D {opening.draws_rate.toFixed(1)}%</span>
                              <span className="text-white">W {opening.white_rate.toFixed(1)}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Move Sequence */}
                    <td className="p-8 overflow-hidden">
                      <div className="bg-black/30 px-4 py-3 rounded-lg border border-white/5 max-w-full">
                        <p className="text-xs font-mono text-zinc-200" title={opening.moves}>
                          {opening.moves}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 border-t border-white/10 flex items-center justify-center gap-2">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-2 text-zinc-500 hover:text-white disabled:opacity-20"
          >
            <ChevronLeft size={20} />
          </button>

          {getPaginationRange().map((page, idx) => (
            <button
              key={idx}
              onClick={() => typeof page === 'number' && setCurrentPage(page - 1)}
              disabled={page === '...'}
              className={`min-w-[40px] h-10 rounded-lg text-sm font-mono transition-all ${
                currentPage + 1 === page 
                ? 'bg-white text-black font-bold' 
                : 'text-zinc-500 hover:bg-white/5 hover:text-white'
              } ${page === '...' ? 'cursor-default' : ''}`}
            >
              {page}
            </button>
          ))}

          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={(currentPage + 1) >= totalPages}
            className="p-2 text-zinc-500 hover:text-white disabled:opacity-20"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChessProject;