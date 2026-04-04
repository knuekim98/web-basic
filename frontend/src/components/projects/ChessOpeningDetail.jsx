import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Chessboard } from 'react-chessboard';

const ChessOpeningDetail = ({ opening, onBack }) => {

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 p-6 md:p-16">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-10 transition-colors text-sm uppercase tracking-widest"
        >
          <ArrowLeft size={18} /> Back to List
        </button>

        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* 1. 체스 보드 영역 (React-Chessboard) */}
          <div className="w-full lg:w-[500px] shrink-0">
            <div className="aspect-square rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
              <Chessboard 
                options={{
                    position: opening.fen,
                    boardOrientation: "white",
                    allowDragging: false
                }}
              />
            </div>
          </div>

          {/* 오프닝 정보 */}
          <div className="flex-1 flex flex-col gap-8">
            <div>
              <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase mb-2 block">{opening.ECO}</span>
              <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-4">{opening.name}</h2>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-zinc-400 font-mono text-lg leading-relaxed italic">
                  {opening.moves}
                </p>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Avg Rating</p>
                <p className="text-2xl font-bold text-white">{Math.round(opening.average_rating)}</p>
              </div>
              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Total Games</p>
                <p className="text-2xl font-bold text-white">{opening.games.toLocaleString()}</p>
              </div>
            </div>
            
            {/* 승률 바 */}
            <div className="flex flex-col gap-4">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Performance</p>
              <div className="flex h-6 w-full rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/10">
                <div style={{ width: `${opening.white_rate}%` }} className="bg-white" />
                <div style={{ width: `${opening.draws_rate}%` }} className="bg-zinc-500" />
                <div style={{ width: `${opening.black_rate}%` }} className="bg-zinc-700" />
              </div>
              <div className="flex justify-between font-mono text-xs font-bold">
                <span className="text-white">WHITE {opening.white_rate}%</span>
                <span className="text-zinc-500">DRAW {opening.draws_rate}%</span>
                <span className="text-zinc-400">BLACK {opening.black_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessOpeningDetail;