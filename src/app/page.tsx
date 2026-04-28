'use client';

import { useGameStore } from '@/store/useGameStore';
import { Navbar } from '@/components/Navbar';
import { WikiViewer } from '@/components/WikiViewer';
import { DifficultySelector } from '@/components/DifficultySelector';
import { ResultCard } from '@/components/ResultCard';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const { status } = useGameStore();

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary">
      <Navbar />
      
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DifficultySelector />
          </motion.div>
        )}

        {status === 'playing' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WikiViewer />
          </motion.div>
        )}

        {status === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultCard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>
    </main>
  );
}
