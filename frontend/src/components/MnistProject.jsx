import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Play } from 'lucide-react';
import axios from 'axios';

const MnistProject = ({ onBack }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = 15;
    ctx.strokeStyle = 'white';
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const handlePredict = async () => {
    const canvas = canvasRef.current;
    const imageBase64 = canvas.toDataURL('image/png'); // 이미지 추출

    try {
      const response = await axios.post(`${API_URL}/predict/mnist`, {
        image: imageBase64
      });
      setPrediction(response.data.digit);
    } catch (error) {
      console.error("Prediction Error:", error);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
  };

  return (
    <div className="min-h-screen p-8 md:p-20 flex flex-col items-center">
      {/* 상단 헤더 */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-16">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-all uppercase tracking-widest text-xs">
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <h2 className="text-2xl font-bold tracking-tighter">MNIST RECOGNITION</h2>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-col md:flex-row gap-12 items-center">
        <canvas 
          ref={canvasRef}
          width={280}
          height={280}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="bg-black border border-white/20 cursor-crosshair rounded-lg touch-none"
        />
        <div className="flex flex-col gap-4 w-64">
          <button onClick={clearCanvas} className="w-full py-4 border border-white/10 hover:bg-zinc-800 flex items-center justify-center gap-3 transition-all text-xs tracking-widest uppercase">
            <RotateCcw size={16} /> RESET
          </button>
          <button onClick={handlePredict} className="w-full py-4 bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-3 transition-all text-xs font-bold tracking-widest uppercase">
            <Play size={16} fill="black" /> PREDICT
          </button>
          <div className="mt-8 p-8 border border-white/5 bg-zinc-900/50 rounded-2xl text-center">
            <span className="text-[10px] text-gray-500 block mb-2 uppercase tracking-widest">Prediction</span>
            <span className="text-7xl font-black">{prediction !== null ? prediction : '?'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MnistProject;