'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getRandomArticles, getArticleSummary } from '@/lib/wikipedia';
import { motion } from 'framer-motion';
import { Play, Zap, Brain, ShieldAlert, Loader2 } from 'lucide-react';

export const DifficultySelector = () => {
  const { startGame, status } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  const handleStart = async () => {
    setLoading(true);
    try {
      const [start, goal] = await getRandomArticles(2);
      
      const summary = await getArticleSummary(goal);
      startGame(start, goal, summary, difficulty);
    } catch (error) {
      console.error(error);
      alert('Failed to start game. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'idle') return null;

  const levels = [
    { id: 'easy', label: '初級', icon: Zap, color: 'text-green-400', desc: '短い記事が多く、リンクが見つかりやすい' },
    { id: 'normal', label: '中級', icon: Brain, color: 'text-blue-400', desc: '標準的なウィキレースの難易度' },
    { id: 'hard', label: '上級', icon: ShieldAlert, color: 'text-red-400', desc: 'マニアックな記事が多く、難易度が高い' },
  ] as const;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full glass-card p-10 text-center"
      >
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          WIKI RACE
        </motion.h1>
        <p className="text-gray-400 mb-10 text-lg">
          知の繋がりを駆け抜けろ。<br />2つのランダムな記事を繋ぐ最短経路を見つけ出そう。
        </p>

        <div className="mb-10 text-left max-w-sm mx-auto">
          <h3 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" /> 難易度を選択
          </h3>
          <div className="space-y-3">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => setDifficulty(level.id)}
                className={`relative w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  difficulty === level.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-white/5 hover:border-white/10 bg-white/5'
                }`}
              >
                <level.icon className={`w-5 h-5 ${level.color}`} />
                <div className="text-left">
                  <div className="font-bold text-sm">{level.label}</div>
                  <div className="text-[10px] text-gray-500 leading-tight">{level.desc}</div>
                </div>
                {difficulty === level.id && (
                  <motion.div 
                    layoutId="active-difficulty"
                    className="absolute inset-0 border border-primary rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>お題を生成中...</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-current" />
              <span>レース開始</span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};
