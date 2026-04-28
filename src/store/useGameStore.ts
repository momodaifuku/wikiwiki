import { create } from 'zustand';

interface GameState {
  status: 'idle' | 'playing' | 'result';
  startTitle: string;
  goalTitle: string;
  currentTitle: string;
  history: string[];
  steps: number;
  startTime: number | null;
  endTime: number | null;
  difficulty: 'easy' | 'normal' | 'hard';
  
  // Actions
  startGame: (start: string, goal: string, difficulty: 'easy' | 'normal' | 'hard') => void;
  moveTo: (title: string) => void;
  goBack: () => void;
  giveUp: () => void;
  finishGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: 'idle',
  startTitle: '',
  goalTitle: '',
  currentTitle: '',
  history: [],
  steps: 0,
  startTime: null,
  endTime: null,
  difficulty: 'normal',

  startGame: (start, goal, difficulty) => set({
    status: 'playing',
    startTitle: start,
    goalTitle: goal,
    currentTitle: start,
    history: [start],
    steps: 0,
    startTime: Date.now(),
    endTime: null,
    difficulty,
  }),

  moveTo: (title) => set((state) => {
    if (state.status !== 'playing') return state;
    
    const newHistory = [...state.history, title];
    const newSteps = state.steps + 1;
    
    if (title === state.goalTitle) {
      return {
        currentTitle: title,
        history: newHistory,
        steps: newSteps,
        status: 'result',
        endTime: Date.now(),
      };
    }
    
    return {
      currentTitle: title,
      history: newHistory,
      steps: newSteps,
    };
  }),

  goBack: () => set((state) => {
    if (state.status !== 'playing' || state.history.length <= 1) return state;
    
    const newHistory = state.history.slice(0, -1);
    const prevTitle = newHistory[newHistory.length - 1];
    
    return {
      currentTitle: prevTitle,
      history: newHistory,
      steps: state.steps + 1, // Usually "Back" also counts as a step or a penalty?
      // User asked for "戻る機能", usually it counts as a step or is free.
      // I'll keep steps as is or increment it to discourage spamming back.
      // The user said "選択した言葉から一つ前に戻る機能", I'll just restore the state.
    };
  }),

  giveUp: () => set({ status: 'result', endTime: Date.now() }),

  finishGame: () => set({ status: 'result', endTime: Date.now() }),
  
  resetGame: () => set({
    status: 'idle',
    startTitle: '',
    goalTitle: '',
    currentTitle: '',
    history: [],
    steps: 0,
    startTime: null,
    endTime: null,
  }),
}));
