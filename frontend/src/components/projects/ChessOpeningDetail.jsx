import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, TrendingUp, Loader2 } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine, BarChart, Bar
} from 'recharts';
import axios from 'axios';

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

const metrics_config = {
  sharpness: { label: "Sharpness", left: "Solid", right: "Sharp", color: "text-orange-400", bgColor: "bg-orange-400" },
  elo_sensitivity: { label: "Elo Sensitivity", left: "Trap", right: "Robust", color: "text-blue-400", bgColor: "bg-blue-400" },
  time_pressure_advantage: { label: "Time Control Advantage", left: "Classical", right: "Blitz", color: "text-purple-400", bgColor: "bg-purple-400" },
  popularity: { label: "Popularity", left: "Rare", right: "Famous", color: "text-emerald-400", bgColor: "bg-emerald-400" }
};

const MetricSlider = ({ value, config, isZScore = true }) => {
  let percentage;
  let leftPos = "50%";
  let barWidth = "0%";
  if (isZScore) {
    percentage = ((value + 2.5) / 5) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    if (value >= 0) {
      leftPos = "50%";
      barWidth = `${Math.min(50, percentage - 50)}%`;
    } else {
      leftPos = `${Math.max(0, percentage)}%`;
      barWidth = `${50 - Math.max(0, percentage)}%`;
    }
  } else {
    percentage = value * 100;
    leftPos = "0%";
    barWidth = `${value*100}%`;
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-end">
        <span className="text-[12px] font-mono text-zinc-200 uppercase tracking-widest">{config.label}</span>
        <span className={`text-xs font-bold font-mono ${config.color}`}>
          {isZScore ? (value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)) : `${(value * 100).toFixed(1)}%`}
        </span>
      </div>
      
      <div className="relative h-2 w-full bg-zinc-900 rounded-full border border-white/5 overflow-hidden">
        
        {/* slider chart */}
        {isZScore && (
          <div className="absolute left-1/2 top-0 w-[2px] h-full bg-zinc-600/50 z-20 -translate-x-1/2" />
        )}
        <div 
          className={`absolute top-0 h-full transition-all duration-700 ease-out z-10 ${config.bgColor} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
          style={{ 
            left: leftPos,
            width: barWidth
          }}
        />
      </div>

      <div className="flex justify-between text-[9px] font-black text-zinc-600 uppercase tracking-tighter mt-1">
        <span className={isZScore ? (value < 0 ? "text-zinc-400" : "") : (value < 0.5 ? "text-zinc-400" : "")}>{config.left}</span>
        <span className={isZScore ? (value > 0 ? "text-zinc-400" : "") : (value >= 0.5 ? "text-zinc-400" : "")}>{config.right}</span>
      </div>
    </div>
  );
};

const ChessOpeningDetail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const opening_id = searchParams.get('id');
  const color = searchParams.get('color') || 'white';

  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!opening_id) return;
    const API_URL = import.meta.env.VITE_API_URL;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_URL}/api/chess/opening`, {
          opening_id: opening_id,
          color: color
        });
        setOpening(response.data);
        setStats((await axios.get(`${API_URL}/api/chess/stats`)).data);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [opening_id, color]);
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
    </div>
  );

  const totalGames = {white: stats.white.total, black: stats.black.total}
  const avgScore = color === 'white' ? stats.white.avg_score_rate : stats.black.avg_score_rate;
  const scoreHistData = {
    white: stats.white.score_hist,
    black: stats.black.score_hist
  };
  const drawsHistData = {
    white: stats.white.draws_hist,
    black: stats.black.draws_hist
  };
  const scoreDistData = scoreHistData[color].map((val, i) => ({ 
    count: val,
    label: 20 + i*2
  }));
  const drawsDistData = drawsHistData[color].map((val, i) => ({ 
    count: val,
    label: (i/3).toFixed(1)
  }));

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

  const getYDomain = (data, keys) => {
    const allValues = data.flatMap(d => 
      keys.map(key => parseFloat(d[key]))
    ).filter(v => !isNaN(v));
    allValues.push(avgScore);

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    return [
      Math.max(0, parseFloat((min - 1).toFixed(1))),
      Math.min(100, parseFloat((max + 1).toFixed(1)))
    ];
  };
  const ratingDomain = getYDomain(ratingData, ['wr', 'win']);
  const timeDomain = getYDomain(timeData, ['wr', 'win']);


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 p-6 md:p-16">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/chess')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-10 transition-colors text-sm uppercase tracking-widest"
        >
          <ArrowLeft size={18} /> Back to List
        </button>

        <div className="flex flex-col md:flex-row gap-12 items-start mb-20">
          {/* chessboard */}
          <div className="w-full lg:w-[450px] md:w-[400px] shrink-0">
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

          {/* general info */}
          <div className="flex-1 flex flex-col gap-6 lg:gap-8">
            <div>
              <span className="text-emerald-500 font-mono text-sm tracking-widest uppercase mb-2 block">{opening.ECO}</span>
              <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tighter mb-4">{opening.name}</h2>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-zinc-400 font-mono lg:text-lg leading-relaxed italic">
                  {opening.moves}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl border border-white/5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Avg Rating</p>
                <p className="text-2xl font-bold text-white">{Math.round(opening.average_rating)}</p>
              </div>
              <div className="bg-zinc-900/50 p-4 lg:p-6 rounded-2xl border border-white/5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Total Games</p>
                <p className="text-2xl font-bold text-white">{opening.games.toLocaleString()}</p>
              </div>
            </div>
            
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
              <div className="flex justify-between font-mono text-sm font-bold">
                {color === 'white' ? (
                  <>
                    <span className="text-white">WHITE {opening.white_rate.toFixed(1)}%</span>
                    <span className="text-zinc-400">DRAW {opening.draws_rate.toFixed(1)}%</span>
                    <span className="text-zinc-500">BLACK {opening.black_rate.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <span className="text-zinc-500">BLACK {opening.black_rate.toFixed(1)}%</span>
                    <span className="text-zinc-400">DRAW {opening.draws_rate.toFixed(1)}%</span>
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
                        <BarChart data={scoreDistData} margin={{ top: 25, bottom: -10 }}>
                            <Bar dataKey="count" shape={renderScoreBar} />
                            <XAxis 
                                dataKey="label" 
                                fontSize={8} 
                                tickLine={false} 
                                axisLine={false} 
                                stroke="#52525b" 
                                interval={14}
                                padding={{left:5, right:5}}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <ReferenceLine 
                                x={scoreDistData[opening.score_rate_hist]?.label} 
                                stroke="#f472b6" 
                                strokeDasharray="3 3"
                                label={{ 
                                    position: 'top', 
                                    value: `${opening.score_rate.toFixed(2)}% (#${opening.score_rate_rank})`, 
                                    fill: '#f472b6', 
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    dy: 0
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
                        <BarChart data={drawsDistData} margin={{ top: 25, bottom: -10 }}>
                            <Bar dataKey="count" shape={renderDrawsBar} />
                            <XAxis 
                                dataKey="label" 
                                fontSize={8} 
                                tickLine={false} 
                                axisLine={false} 
                                stroke="#52525b" 
                                interval={14}
                                padding={{left:5, right:5}}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <ReferenceLine 
                                x={drawsDistData[opening.draws_rate_hist]?.label} 
                                stroke="#f472b6" 
                                strokeDasharray="3 3"
                                label={{ 
                                    position: 'top', 
                                    value: `${opening.draws_rate.toFixed(2)}% (#${opening.draws_rate_rank})`, 
                                    fill: '#f472b6', 
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    dy: 0
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


        {/* rating & speed chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 mb-12 gap-6 lg:gap-10">
          
          <div className="bg-zinc-900/30 border border-white/5 py-8 px-4 lg:px-8 rounded-[2rem]">
            <h3 className="text-[11px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-8 pl-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-pink-400" /> Win Rate by Rating
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={ratingDomain} />
                  <ReferenceLine 
                    y={avgScore} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line name="Win+Draw/2" type="monotone" dataKey="wr" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899', r: 4 }} />
                  <Line name="Win Only" type="monotone" dataKey="win" stroke="#dddddd" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ffffff', r: 3, strokeDasharray: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 py-8 px-4 lg:px-8 rounded-[2rem]">
            <h3 className="text-[11px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-8 pl-4 flex items-center gap-2">
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
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={timeDomain} />
                  <ReferenceLine 
                    y={avgScore} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area name="Win+Draw/2" type="monotone" dataKey="wr" stroke="#ec4899" fillOpacity={1} fill="url(#colorWr)" strokeWidth={3} />
                  <Area name="Win Only" type="monotone" dataKey="win" stroke="#dddddd" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="grid gap-10">
          <div className="bg-zinc-900/30 border border-white/5 p-8 lg:p-10 rounded-[2rem] mb-12">
            <h3 className="text-[13px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-8">Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
              <MetricSlider value={opening.sharpness} config={metrics_config.sharpness} />
              <MetricSlider value={opening.elo_sensitivity} config={metrics_config.elo_sensitivity} />
              <MetricSlider value={opening.time_pressure_advantage} config={metrics_config.time_pressure_advantage} />
              <MetricSlider value={opening.popularity} config={metrics_config.popularity} isZScore={false} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChessOpeningDetail;