import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Play, Loader2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const MnistProject = ({ onBack }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [probabilities, setProbabilities] = useState(Array(10).fill(0));
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = 11;
    ctx.strokeStyle = 'white';
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const startDrawing = (e) => {
    if (e.type === 'touchstart') e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.type === 'touchmove') e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const handlePredict = async () => {
    setIsLoading(true);
    const canvas = canvasRef.current;
    const imageBase64 = canvas.toDataURL('image/png');

    try {
      const response = await axios.post(`${API_URL}/predict/mnist`, {
        image: imageBase64
      });
      setPrediction(response.data.digit);
      setProbabilities(response.data.prob);
    } catch (error) {
      console.error("Prediction Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
    setProbabilities(Array(10).fill(0));
  };

  return (
    <div className="min-h-screen p-8 md:p-20 flex flex-col items-center bg-[#0a0a0a] text-white">
      {/* 상단 헤더 */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-16">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm uppercase tracking-widest">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <h2 className="text-xl font-bold tracking-[0.2em] uppercase">MNIST Recognition</h2>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-center">
        {/* 1. 캔버스 영역 */}
        <div className="relative group">
          <canvas 
            ref={canvasRef}
            width={280}
            height={280}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="bg-black border border-white/10 cursor-crosshair rounded-xl shadow-2xl transition-all group-hover:border-white/30 touch-none"
          />
          <p className="absolute -bottom-8 left-0 w-full text-center text-[12px] text-gray-600 uppercase tracking-widest">Draw a digit (0-9)</p>
        </div>

        {/* 2. 컨트롤 및 예측 결과 */}
        <div className="flex flex-col gap-4 w-full max-w-[240px]">
          <button onClick={clearCanvas} className="w-full py-4 border border-white/5 hover:bg-white/5 flex items-center justify-center gap-3 transition-all text-[12px] tracking-widest uppercase">
            <RotateCcw size={14} /> Reset Canvas
          </button>
          <button 
            onClick={handlePredict} 
            disabled={isLoading}
            className="w-full py-4 bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 flex items-center justify-center gap-3 transition-all text-[12px] font-bold tracking-widest uppercase"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} fill="black" />}
            {isLoading ? "Analyzing..." : "Predict Digit"}
          </button>
          
          <div className="mt-4 p-8 border border-white/5 bg-zinc-900/30 rounded-3xl text-center relative overflow-hidden group">
            <span className="text-[12px] text-gray-500 block mb-1 uppercase tracking-widest relative z-10">Result</span>
            <span className="text-8xl font-black tracking-tighter relative z-10">
              {prediction !== null ? prediction : '?'}
            </span>
            <span className="absolute -bottom-4 -right-2 text-9xl font-black text-white/5 italic select-none">
              {prediction !== null ? prediction : ''}
            </span>
          </div>
        </div>

        {/* 3. 확률 막대 그래프 */}
        <div className="w-full max-w-md bg-zinc-900/20 p-8 rounded-3xl border border-white/5">
          <p className="text-[12px] text-gray-500 uppercase tracking-widest mb-8 text-center">Probability Distribution</p>
          <div className="grid grid-cols-10 gap-2 items-end h-40 px-2 border-b border-white/10 pb-2">
            {probabilities.map((prob, i) => (
              <div key={i} className="flex flex-col items-center gap-3 h-full justify-end group/item">
                <div className="relative w-full flex flex-col justify-end h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${prob * 100}%` }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="w-full border border-white/20 rounded-t-sm relative overflow-hidden"
                    style={{
                      backgroundColor: `rgb(${prob * 255}, ${prob * 255}, ${prob * 255})`,
                      boxShadow: prob > 0.5 ? `0 0 20px rgba(255,255,255,${prob * 0.3})` : 'none'
                    }}
                  />
                </div>
                <span className={`text-[10px] font-mono transition-colors ${prediction === i ? 'text-white font-bold' : 'text-gray-600 group-hover/item:text-gray-400'}`}>
                  {i}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MnistProject;