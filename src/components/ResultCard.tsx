'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion } from 'framer-motion';
import { Trophy, Share2, RotateCcw, ArrowRight, MousePointer2, Timer, HelpCircle, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { findSimplePath } from '@/lib/wikipedia';

export const ResultCard = () => {
  const { startTitle, goalTitle, currentTitle, history, steps, startTime, endTime, status, resetGame } = useGameStore();
  const [solutionPath, setSolutionPath] = useState<string[]>([]);
  const [loadingPath, setLoadingPath] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isSuccess = currentTitle === goalTitle;

  useEffect(() => {
    if (status === 'result' && startTitle && goalTitle) {
      loadSolution();
    }
  }, [status, startTitle, goalTitle]);

  const loadSolution = async () => {
    setLoadingPath(true);
    try {
      const path = await findSimplePath(startTitle, goalTitle);
      setSolutionPath(path);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPath(false);
    }
  };

  if (status !== 'result' || !startTime || !endTime) return null;

  const duration = Math.floor((endTime - startTime) / 1000);
  const m = Math.floor(duration / 60);
  const s = duration % 60;

  const handleShare = async () => {
    if (cardRef.current === null) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `wiki-race-result-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div 
          ref={cardRef}
          className="glass-card p-10 mb-8 border-2 border-primary/30 relative overflow-hidden"
        >
          {/* Background Decoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full" />

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className={`p-5 rounded-full border-2 ${
                isSuccess 
                ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' 
                : 'bg-red-400/10 border-red-400/20 text-red-400'
              }`}>
                {isSuccess ? <Trophy className="w-12 h-12" /> : <HelpCircle className="w-12 h-12" />}
              </div>
            </div>

            <h2 className="text-4xl font-black text-center mb-2 uppercase">
              {isSuccess ? 'Mission Complete' : 'Give Up'}
            </h2>
            <p className="text-center text-gray-400 mb-10">
              {isSuccess ? "You've reached the destination!" : "Don't worry, knowledge is a journey."}
            </p>

            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="glass-card p-6 text-center border-white/5">
                <MousePointer2 className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <div className="text-3xl font-black">{steps}</div>
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Steps</div>
              </div>
              <div className="glass-card p-6 text-center border-white/5">
                <Timer className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <div className="text-3xl font-black">{m}:{s.toString().padStart(2, '0')}</div>
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Time</div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Your Route</div>
                <div className="flex flex-wrap items-center gap-2">
                  {history.map((title, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        i === 0 ? 'bg-primary/20 text-primary' : 
                        title === goalTitle ? 'bg-secondary/20 text-secondary' :
                        'bg-white/5 text-gray-300'
                      }`}>
                        {title}
                      </span>
                      {i < history.length - 1 && <ArrowRight className="w-4 h-4 text-gray-600" />}
                    </div>
                  ))}
                </div>
              </div>

              {(!isSuccess || solutionPath.length > 0) && (
                <div className="pt-6 border-t border-white/5">
                  <div className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> 解答例（最短ルートの一例）
                  </div>
                  {loadingPath ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm italic">
                      <Loader2 className="w-4 h-4 animate-spin" /> 最短ルートを計算中...
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {solutionPath.map((title, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                              i === 0 ? 'bg-primary/20 border-primary text-primary' :
                              i === solutionPath.length - 1 ? 'bg-secondary/20 border-secondary text-secondary' :
                              'bg-white/5 border-white/10 text-gray-400'
                            }`}>
                              {i + 1}
                            </div>
                            {i < solutionPath.length - 1 && (
                              <div className="w-0.5 h-4 bg-white/5 my-1" />
                            )}
                          </div>
                          <div className={`flex-1 p-3 rounded-xl border transition-all ${
                            i === 0 ? 'bg-primary/5 border-primary/20' :
                            i === solutionPath.length - 1 ? 'bg-secondary/5 border-secondary/20' :
                            'bg-white/5 border-white/5'
                          }`}>
                            <span className="text-sm font-bold">{title}</span>
                            {i === 0 && <span className="ml-2 text-[10px] text-primary/60 uppercase">Start</span>}
                            {i === solutionPath.length - 1 && <span className="ml-2 text-[10px] text-secondary/60 uppercase">Goal</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={handleShare}
            className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 font-bold transition-all"
          >
            <Share2 className="w-5 h-5" />
            Save Result Card
          </button>
          <button
            onClick={resetGame}
            className="flex-1 py-4 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 font-bold transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </div>
      </motion.div>
    </div>
  );
};
