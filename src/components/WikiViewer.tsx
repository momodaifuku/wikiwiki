'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getArticleContent, cleanWikiHtml, getBacklinks } from '@/lib/wikipedia';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lightbulb, ArrowRight, X } from 'lucide-react';

export const WikiViewer = () => {
  const { currentTitle, goalTitle, difficulty, steps, moveTo, status } = useGameStore();
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'playing' && currentTitle) {
      loadArticle(currentTitle);
    }
    
    // Prevent accidentally leaving the page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'playing') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (status === 'playing') {
        if (confirm('ゲームを中断して戻りますか？（進行状況は失われます）')) {
          // Allow back
        } else {
          window.history.pushState(null, '', window.location.pathname);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Push an initial state to detect the first back button click
    if (status === 'playing') {
      window.history.pushState(null, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentTitle, status]);

  useEffect(() => {
    const thresholds = { easy: 8, normal: 11, hard: 15 };
    if (status === 'playing' && steps > thresholds[difficulty]) {
      loadHints();
    }
  }, [steps, difficulty, status]);

  const loadHints = async () => {
    if (hints.length > 0) {
      setShowHint(true);
      return;
    }
    try {
      const backlinks = await getBacklinks(goalTitle);
      setHints(backlinks);
      if (backlinks.length > 0) {
        setShowHint(true);
      }
    } catch (error) {
      console.error('Failed to load hints', error);
    }
  };

  const loadArticle = async (title: string) => {
    setLoading(true);
    try {
      const content = await getArticleContent(title);
      let cleaned = cleanWikiHtml(content);
      
      // Highlight goal word
      if (goalTitle) {
        // Use regex to find goal title and wrap in span
        // Be careful not to break HTML tags
        const regex = new RegExp(`(${goalTitle})`, 'gi');
        // Simple string replacement for now, but should ideally be done on text nodes
        // A better way is to replace only outside of tags
        cleaned = cleaned.replace(/(<[^>]+>)|([^<]+)/g, (match, tag, text) => {
          if (tag) return tag;
          return text.replace(regex, '<span class="text-red-500 font-bold underline decoration-red-500/50">$1</span>');
        });
      }

      setHtml(cleaned);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const wikiLink = target.closest('.wiki-link');
    
    if (wikiLink) {
      e.preventDefault();
      const title = wikiLink.getAttribute('data-wiki-title');
      if (title) {
        moveTo(title);
      }
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto min-h-screen" ref={scrollRef}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-40"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key={currentTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card p-8 lg:p-12 shadow-inner"
          >
            <h1 className="text-4xl lg:text-5xl font-black mb-8 border-b-4 border-primary pb-4 inline-block">
              {currentTitle}
            </h1>
            <div 
              className="wiki-content"
              dangerouslySetInnerHTML={{ __html: html }}
              onClick={handleLinkClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint Toast/Panel */}
      <AnimatePresence>
        {showHint && hints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-8 right-8 z-50 w-80"
          >
            <div className="glass-card p-6 shadow-2xl border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Lightbulb className="w-5 h-5 fill-current" />
                  <span className="font-bold text-sm uppercase tracking-wider">ヒント！</span>
                </div>
                <button onClick={() => setShowHint(false)} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                少し苦戦しているようですね。これらの記事はゴールである「<span className="text-white font-bold">{goalTitle}</span>」へ直接リンクしています。ここを経由すれば近づけるかもしれません：
              </p>
              <div className="space-y-2">
                {hints.slice(0, 3).map((hint, i) => (
                  <button
                    key={i}
                    onClick={() => moveTo(hint)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left text-sm group transition-all"
                  >
                    <span className="truncate pr-2">{hint}</span>
                    <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
