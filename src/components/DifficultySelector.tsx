'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CATEGORIES, getRandomArticles, getRandomArticleFromCategory } from '@/lib/wikipedia';
import { motion } from 'framer-motion';
import { Play, Zap, Brain, ShieldAlert, Loader2, Target } from 'lucide-react';

export const DifficultySelector = () => {
  const { startGame, status } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('random');

  const handleStart = async () => {
    setLoading(true);
    try {
      const [start] = await getRandomArticles(1);
      let goal;
      
      const categoryObj = CATEGORIES.find(c => c.id === selectedCategoryId);
      if (categoryObj && categoryObj.category) {
        goal = await getRandomArticleFromCategory(categoryObj.category);
      } else {
        const [randomGoal] = await getRandomArticles(1);
        goal = randomGoal;
      }
      
      startGame(start, goal, difficulty);
    } catch (error) {
      console.error(error);
      alert('Failed to start game. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'idle') return null;

  const levels = [
    { id: 'easy', label: 'Easy', icon: Zap, color: 'text-green-400', desc: 'Short articles, many links' },
    { id: 'normal', label: 'Normal', icon: Brain, color: 'text-blue-400', desc: 'Standard Wikipedia racing' },
    { id: 'hard', label: 'Hard', icon: ShieldAlert, color: 'text-red-400', desc: 'Niche topics, obscure paths' },
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
          Unleash your knowledge. Find the shortest path between two random worlds.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-10 text-left">
          {/* Difficulty Section */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Difficulty
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

          {/* Category Section */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" /> Goal Genre
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`relative p-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedCategoryId === cat.id 
                    ? 'border-secondary bg-secondary/10 text-secondary' 
                    : 'border-white/5 hover:border-white/10 bg-white/5 text-gray-400'
                  }`}
                >
                  {cat.label}
                  {selectedCategoryId === cat.id && (
                    <motion.div 
                      layoutId="active-category"
                      className="absolute inset-0 border border-secondary rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Play className="w-6 h-6 fill-current" />
              START RACE
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};
