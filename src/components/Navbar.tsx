'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Trophy, Timer, MousePointer2, LogOut, Undo2, Flag, Info, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { goalTitle, goalSummary, steps, startTime, status, history, searchQuery, setSearchQuery, resetGame, goBack, giveUp } = useGameStore();
  const [elapsed, setElapsed] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'playing' && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (status !== 'playing') return null;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div className="max-w-5xl mx-auto glass-card flex items-center justify-between px-6 py-3 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Goal</span>
              <div className="flex items-center gap-2 relative">
                <span className="font-bold text-sm lg:text-base">{goalTitle}</span>
                <button 
                  onMouseEnter={() => setShowInfo(true)}
                  onMouseLeave={() => setShowInfo(false)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                  {showInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-64 p-4 glass-card bg-[#1a1a1e] backdrop-blur-xl text-xs leading-relaxed shadow-2xl z-[60] border-blue-500/30"
                    >
                      <p className="text-gray-300 font-medium">{goalSummary}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 border-l border-white/10 pl-6">
            <div className="flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Steps</span>
                <span className="font-mono font-bold">{steps}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-green-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Time</span>
                <span className="font-mono font-bold">{formatTime(elapsed)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 focus-within:border-primary/50 transition-all ml-2">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input 
                type="text"
                placeholder="ページ内を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-24 lg:w-32 placeholder:text-gray-600"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <button 
              onClick={goBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-blue-400 hover:text-blue-300"
              title="Go Back"
            >
              <Undo2 className="w-5 h-5" />
            </button>
          )}

          <button 
            onClick={() => {
              if (confirm('ギブアップしますか？解答例が表示されます。')) {
                giveUp();
              }
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400 hover:text-red-300"
            title="Give Up"
          >
            <Flag className="w-5 h-5" />
          </button>
          
          <button 
            onClick={resetGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Quit Game"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};
