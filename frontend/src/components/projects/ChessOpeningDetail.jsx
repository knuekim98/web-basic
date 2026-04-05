import React from 'react';
import { ArrowLeft, BarChart2, TrendingUp } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine, BarChart, Bar
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-white/10 p-3 rounded-lg shadow-xl font-mono text-[11px]">
        <p className="text-zinc-500 mb-1 uppercase tracking-widest">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="font-bold">
            {entry.name}: {entry.value.toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChessOpeningDetail = ({ opening, color, onBack }) => {

  const totalGames = {white: 494, black: 411}
  const scoreHistData = {
    white: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 6, 24, 70, 122, 145, 76, 29, 10, 3, 2, 1, 0, 1, 0, 0, 0, 0, 0],
    black: [0, 0, 0, 0, 0, 1, 0, 0, 1, 3, 10, 29, 50, 101, 106, 65, 33, 9, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] 
  };
  const drawsHistData = {
    white: [0, 0, 0, 0, 0, 1, 0, 1, 4, 10, 21, 40, 46, 74, 86, 70, 53, 34, 19, 14, 14, 3, 3, 1, 0, 0, 0, 0, 0, 0],
    black: [0, 0, 0, 0, 0, 1, 0, 0, 6, 10, 14, 25, 44, 63, 59, 56, 44, 34, 20, 14, 12, 2, 5, 2, 0, 0, 0, 0, 0, 0]
  };
  const scoreDistData = scoreHistData[color].map(val => ({ count: val }));
  const drawsDistData = drawsHistData[color].map(val => ({ count: val }));

  const ratingData = [
      { name: '0', wr: opening['0_score_rate'], win: opening[`0_${color}_rate`] },
      { name: '1000', wr: opening['1000_score_rate'], win: opening[`1000_${color}_rate`] },
      { name: '1200', wr: opening['1200_score_rate'], win: opening[`1200_${color}_rate`] },
      { name: '1400', wr: opening['1400_score_rate'], win: opening[`1400_${color}_rate`] },
      { name: '1600', wr: opening['1600_score_rate'], win: opening[`1600_${color}_rate`] },
      { name: '1800', wr: opening['1800_score_rate'], win: opening[`1800_${color}_rate`] },
      { name: '2000', wr: opening['2000_score_rate'], win: opening[`2000_${color}_rate`] },
      { name: '2200', wr: opening['2200_score_rate'], win: opening[`2200_${color}_rate`] },
      { name: '2500', wr: opening['2500_score_rate'], win: opening[`2500_${color}_rate`] },
  ];

  const timeData = [
      { name: 'Bullet', wr: opening['bullet_score_rate'], win: opening[`bullet_${color}_rate`] },
      { name: 'Blitz', wr: opening['blitz_score_rate'], win: opening[`blitz_${color}_rate`] },
      { name: 'Rapid', wr: opening['rapid_score_rate'], win: opening[`rapid_${color}_rate`] },
      { name: 'Classical', wr: opening['classical_score_rate'], win: opening[`classical_${color}_rate`] },
  ];

  const renderScoreBar = (props) => {
      const { x, y, width, height, index } = props;
      const isHighlighted = index === opening.score_rate_hist;
      return (
          <rect 
              x={x} y={y} width={width} height={height} 
              fill={isHighlighted ? '#ec4899' : '#27272a'} 
              rx={2}
          />
      );
  };
  const renderDrawsBar = (props) => {
      const { x, y, width, height, index } = props;
      const isHighlighted = index === opening.draws_rate_hist;
      return (
          <rect 
              x={x} y={y} width={width} height={height} 
              fill={isHighlighted ? '#ec4899' : '#27272a'} 
              rx={2}
          />
      );
  };


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 p-6 md:p-16">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-10 transition-colors text-sm uppercase tracking-widest"
        >
          <ArrowLeft size={18} /> Back to List
        </button>

        <div className="flex flex-col lg:flex-row gap-16 items-start mb-20">
          {/* 1. 체스 보드 영역 (React-Chessboard) */}
          <div className="w-full lg:w-[450px] shrink-0">
            <div className="aspect-square rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
              <Chessboard 
                options={{
                    position: opening.fen,
                    boardOrientation: color,
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
              <div className="flex justify-between font-mono text-xs font-bold">
                {color === 'white' ? (
                  <>
                    <span className="text-white">WHITE {opening.white_rate.toFixed(1)}%</span>
                    <span className="text-zinc-500">DRAW {opening.draws_rate.toFixed(1)}%</span>
                    <span className="text-zinc-400">BLACK {opening.black_rate.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-zinc-400">BLACK {opening.black_rate.toFixed(1)}%</span>
                    <span className="text-zinc-500">DRAW {opening.draws_rate.toFixed(1)}%</span>
                    <span className="text-white">WHITE {opening.white_rate.toFixed(1)}%</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        
        {/* score_rate rank, draws_rate rank, pick rate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl flex flex-col h-56 relative">
                <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-4">Win+Draw/2 Rate Rank</h3>
                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistData} margin={{ top: 10, bottom: 30 }}>
                            <Bar dataKey="count" shape={renderScoreBar} />
                            <ReferenceLine 
                                x={opening.score_rate_hist} 
                                stroke="none" 
                                label={{ 
                                    position: 'bottom', 
                                    value: `${opening.score_rate.toFixed(2)}% (#${opening.score_rate_rank})`, 
                                    fill: '#f472b6', 
                                    fontSize: 13,
                                    fontWeight: 'bold',
                                    dy: 8
                                }} 
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl flex flex-col h-56 relative">
                <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-4">Draw Rate Rank</h3>
                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={drawsDistData} margin={{ top: 10, bottom: 30 }}>
                            <Bar dataKey="count" shape={renderDrawsBar} />
                            <ReferenceLine 
                                x={opening.draws_rate_hist} 
                                stroke="none" 
                                label={{ 
                                    position: 'bottom', 
                                    value: `${opening.draws_rate.toFixed(2)}% (#${opening.draws_rate_rank})`, 
                                    fill: '#f472b6', 
                                    fontSize: 13,
                                    fontWeight: 'bold',
                                    dy: 8
                                }} 
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl flex flex-col justify-center items-center h-56 relative">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold absolute top-6 left-6"> Popularity </h3>
              <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white italic tracking-tighter"> 
                      #{opening.selection_rate_rank} <span className="text-zinc-600 text-2xl">/ {totalGames[color]}</span>
                  </span>
                  <p className="text-right text-m font-mono text-zinc-400 mt-2"> Pick Rate: {opening.selection_rate.toFixed(2)}% </p>
              </div>
            </div>
        </div>


        {/* --- 분석 차트 대시보드 --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* 1. 레이팅별 승률 */}
          <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem]">
            <h3 className="text-[11px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-8 flex items-center gap-2">
              <TrendingUp size={14} className="text-pink-400" /> Win Rate by Rating
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line name="Win+Draw/2" type="monotone" dataKey="wr" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899', r: 4 }} />
                  <Line name="Win Only" type="monotone" dataKey="win" stroke="#dddddd" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ffffff', r: 3, strokeDasharray: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. 시간대별 승률 */}
          <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem]">
            <h3 className="text-[11px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-8 flex items-center gap-2">
              <BarChart2 size={14} className="text-pink-400" /> Win Rate by Speed
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area name="Win+Draw/2" type="monotone" dataKey="wr" stroke="#ec4899" fillOpacity={1} fill="url(#colorWr)" strokeWidth={3} />
                  <Area name="Win Only" type="monotone" dataKey="win" stroke="#dddddd" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessOpeningDetail;