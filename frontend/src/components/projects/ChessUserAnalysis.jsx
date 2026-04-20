import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronUp, ChevronDown, ExternalLink, 
         Zap, Flame, Timer, Clock, Search } from 'lucide-react';
import axios from 'axios';

const ChessUserAnalysis = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState(null);
  const [speedCount, setSpeedCount] = useState(null);
  const [analyzedCount, setAnalyzedCount] = useState(200);
  const [userData, setUserData] = useState(null);
  const [insight, setInsight] = useState(null);
  const [insightStats, setInsightStats] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!username) return;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const profileRes = await fetch(`https://lichess.org/api/user/${username}`);
        const profileData = await profileRes.json();
        setUserData(profileData);

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
          games: games,
        });
        setData(response.data.opening_result);
        setAnalyzedCount(response.data.total_count);
        setSpeedCount(response.data.speed_count);
        setInsight(response.data.insight);
        setInsightStats(response.data.insight_stats);
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
      .slice(0, 10);
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-[1px] w-8 bg-emerald-500/50" />
          <span className="text-emerald-500 font-mono text-[11px] tracking-[0.4em] uppercase font-bold">
            Analysis Report
          </span>
        </div>
        <h2 className="text-7xl font-black text-gray-50 tracking-tighter italic flex items-baseline gap-2">
          {userData.username}<span className="text-emerald-500">.</span>
        </h2>
        <p className="text-zinc-500 text-sm mb-16 flex items-center gap-2">
          <Search size={14} className="text-zinc-500" />
          Analyzed the last <span className="text-zinc-300 font-bold">{analyzedCount}</span> rated games from your history.
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-y-8 mb-16 px-2">
        <RatingItem 
          icon={Zap} 
          label="Bullet" 
          rating={userData?.perfs?.bullet?.rating} 
          prov={userData?.perfs?.bullet?.prov} 
          total={userData?.perfs?.bullet?.games} 
          samples={speedCount?.bullet}
          color="text-yellow-400"
        />
        <RatingItem 
          icon={Flame} 
          label="Blitz" 
          rating={userData?.perfs?.blitz?.rating} 
          prov={userData?.perfs?.blitz?.prov} 
          total={userData?.perfs?.blitz?.games} 
          samples={speedCount?.blitz}
          color="text-orange-500"
        />
        <RatingItem 
          icon={Timer} 
          label="Rapid" 
          rating={userData?.perfs?.rapid?.rating} 
          prov={userData?.perfs?.rapid?.prov} 
          total={userData?.perfs?.rapid?.games} 
          samples={speedCount?.rapid}
          color="text-emerald-400"
        />
        <RatingItem 
          icon={Clock} 
          label="Classical" 
          rating={userData?.perfs?.classical?.rating} 
          prov={userData?.perfs?.classical?.prov} 
          total={userData?.perfs?.classical?.games} 
          samples={speedCount?.classical}
          color="text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <RepertoireSection title="White Repertoire" groups={processResult(data?.white)} myColor="white" />
        <RepertoireSection title="Black Repertoire" groups={processResult(data?.black)} myColor="black" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-24">
        <MetricAnalysisCard 
          title="Opening Sharpness"
          value={insight?.sharpness}
          stats={insightStats?.sharpness}
          labels={["Solid", "Sharp"]}
          theme="orange"
          description="얼마나 공격적이고 복잡한 전술적 오프닝을 선택하는지 나타냅니다."
        />
        <MetricAnalysisCard 
          title="Opening Popularity"
          value={insight?.popularity}
          stats={insightStats?.popularity}
          labels={["Rare", "Famous"]}
          theme="emerald"
          description="남들이 자주 두는 정석(Mainline)을 얼마나 따르는지 나타냅니다."
        />
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
            <th className="pb-4 font-bold text-center">Games</th>
            <th className="pb-4 font-bold text-center">Result</th>
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
        <td className="py-4 px-4 text-gray-50 font-bold text-xs text-center">{total}</td>
        <td className="py-4 px-2 min-w-[120px]">
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
        <td className="py-4 pl-2 text-right font-black font-mono text-xs italic text-gray-50">
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

const RatingItem = ({ icon: Icon, label, color, rating, prov, total, samples }) => (
  <div className="flex flex-col min-w-[160px] group">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className={`${color} opacity-80`} />
      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">{label}</span>
    </div>

    <div className="flex items-baseline gap-1 mb-3">
      <span className="text-4xl font-mono font-black text-gray-50 italic tracking-tighter">
        {rating ? `${rating}${prov ? '?' : ''}` : '—'}
      </span>
    </div>

    <div className="flex items-center gap-4 border-t border-white/5 pt-2">
      <div className="flex flex-col">
        <span className="text-[11px] font-mono font-bold text-zinc-500">{(total || 0).toLocaleString()}</span>
        <span className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Total</span>
      </div>
      <div className="w-px h-5 bg-white/5" />
      <div className="flex flex-col">
        <span className={`text-[11px] font-mono font-bold ${samples > 0 ? 'text-emerald-500/80' : 'text-zinc-800'}`}>
          {samples || 0}
        </span>
        <span className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Recent</span>
      </div>
    </div>
  </div>
);

const MetricAnalysisCard = ({ title, value, stats, labels, theme, description }) => {
  if (!stats) return null;

  const isOrange = theme === 'orange';
  const themeColor = isOrange ? 'text-orange-500' : 'text-emerald-500';
  const themeBg = isOrange ? 'bg-orange-500' : 'bg-emerald-500';
  const themeBorder = isOrange ? 'border-orange-500/20' : 'border-emerald-500/20';
  const themeShadow = isOrange ? 'shadow-orange-500/20' : 'shadow-emerald-500/20';

  const getPosition = (val) => {
    const clamped = Math.min(Math.max(val, -2.5), 2.5);
    return ((clamped + 2.5) / 5) * 100;
  };

  const betterOnHigh = stats.win_rate_high > stats.win_rate_low;

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 flex flex-col gap-10 relative overflow-hidden">
      <div className={`absolute -top-24 -right-24 w-64 h-64 ${themeBg} opacity-[0.03] blur-[100px] pointer-events-none`} />

      {/* header */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-1 h-4 ${themeBg} rounded-full`} />
          <h4 className="text-2xl font-black text-gray-50 tracking-tighter italic uppercase">{title}</h4>
        </div>
        <p className="text-zinc-500 text-sm leading-relaxed max-w-md">{description}</p>
      </div>

      {/* slider */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full h-5 flex items-center mt-4">
          <div className="h-1.5 w-full bg-zinc-800/50 rounded-full relative overflow-hidden">
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-r from-zinc-700 via-zinc-500 to-${isOrange ? 'orange-500' : 'emerald-500'}`} />
            <div className="absolute left-1/2 top-0 w-[1.5px] h-full bg-white/20 z-10" />
          </div>
          
          <div 
            className={`absolute w-5 h-5 ${themeBg} rounded-full border-[4px] border-zinc-950 ${themeShadow} shadow-[0_0_15px] transition-all duration-700 z-20`}
            style={{ 
              left: `${getPosition(value)}%`, 
              top: '50%',
              transform: 'translate(-50%, -50%)' 
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
          <span>{labels[0]}</span>
          <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1 rounded-full border border-white/5">
            <span className={`text-xs font-mono font-black ${themeColor} italic`}>
              {value?.toFixed(2)}
            </span>
          </div>
          <span>{labels[1]}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
        {/* left */}
        <div className={`p-8 bg-zinc-900/60 flex flex-col gap-6 relative ${!betterOnHigh ? `ring-1 ring-inset ${isOrange ? 'ring-orange-500/20' : 'ring-emerald-500/20'}` : ''}`}>
          {!betterOnHigh && (
            <div className={`absolute top-4 right-4 ${isOrange ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'} text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border`}>
              Better Performance
            </div>
          )}
          <div className="mt-2">
            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">More {labels[0]}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-mono font-black ${!betterOnHigh ? themeColor : ''} italic`}>{stats.win_rate_low}%</span>
              <span className="text-[9px] text-zinc-600 font-bold uppercase">Win Rate</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              {stats.openings_low.slice(0, 4).map((op) => (
                <OpeningMiniLink key={op.id} op={op} theme={theme} />
              ))}
            </div>
          </div>
        </div>

        {/* right */}
        <div className={`p-8 bg-zinc-900/60 flex flex-col gap-6 relative ${betterOnHigh ? `ring-1 ring-inset ${isOrange ? 'ring-orange-500/20' : 'ring-emerald-500/20'}` : ''}`}>
          {betterOnHigh && (
            <div className={`absolute top-4 right-4 ${isOrange ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'} text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border`}>
              Better Performance
            </div>
          )}
          <div className="mt-2">
            <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">More {labels[1]}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-mono font-black ${betterOnHigh ? themeColor : ''} italic`}>{stats.win_rate_high}%</span>
              <span className="text-[9px] text-zinc-600 font-bold uppercase">Win Rate</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              {stats.openings_high.slice(0, 4).map((op) => (
                <OpeningMiniLink key={op.id} op={op} theme={theme} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OpeningMiniLink = ({ op, theme }) => (
  <button 
    onClick={() => window.open(`${window.location.origin}${window.location.pathname}#/chess/opening?id=${op.id}&color=${op.color}`, '_blank')}
    className="group flex items-center justify-between text-left hover:bg-white/[0.03] p-1.5 rounded-xl transition-all border border-transparent hover:border-white/5"
  >
    <span className={`text-[11px] text-zinc-400 group-hover:${theme === 'orange' ? 'text-orange-400' : 'text-emerald-400'} truncate pr-2 transition-colors`}>
      {op.name}
    </span>
    <ExternalLink size={10} className="text-zinc-800 group-hover:text-zinc-400 shrink-0 transition-colors" />
  </button>
);

export default ChessUserAnalysis;