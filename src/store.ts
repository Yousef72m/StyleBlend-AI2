import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  productImage: string | null;
  referenceImage: string | null;
  generatedImage: string | null;
  
  // History for undo/redo (stores generated images)
  history: (string | null)[];
  historyIndex: number;
  
  // Theme state
  theme: 'dark' | 'light';

  intensity: number[];
  ensureUnique: boolean;
  isAnalyzing: boolean;
  isGenerating: boolean;
  styleDescription: string | null;
  
  setProductImage: (url: string | null) => void;
  setReferenceImage: (url: string | null) => void;
  setGeneratedImage: (url: string | null) => void;
  
  undo: () => void;
  redo: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  setIntensity: (val: number[]) => void;
  setEnsureUnique: (val: boolean) => void;
  setIsAnalyzing: (val: boolean) => void;
  setIsGenerating: (val: boolean) => void;
  setStyleDescription: (desc: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      productImage: null,
      referenceImage: null,
      generatedImage: null,
      
      history: [null],
      historyIndex: 0,
      
      theme: 'dark', // default dark

      intensity: [60],
      ensureUnique: true,
      isAnalyzing: false,
      isGenerating: false,
      styleDescription: null,
      
      setProductImage: (url) => set({ productImage: url }),
      setReferenceImage: (url) => set({ referenceImage: url }),
      
      setGeneratedImage: (url) => {
        const { history, historyIndex } = get();
        // Discard any future history if we generated a new one while not at the end
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(url);
        
        set({ 
          generatedImage: url,
          history: newHistory,
          historyIndex: newHistory.length - 1
        });
      },
      
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          set({
            historyIndex: historyIndex - 1,
            generatedImage: history[historyIndex - 1]
          });
        }
      },
      
      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          set({
            historyIndex: historyIndex + 1,
            generatedImage: history[historyIndex + 1]
          });
        }
      },
      
      setTheme: (theme) => set({ theme }),

      setIntensity: (val) => set({ intensity: val }),
      setEnsureUnique: (val) => set({ ensureUnique: val }),
      setIsAnalyzing: (val) => set({ isAnalyzing: val }),
      setIsGenerating: (val) => set({ isGenerating: val }),
      setStyleDescription: (desc) => set({ styleDescription: desc }),
      
      reset: () => set({ 
        productImage: null, 
        referenceImage: null, 
        generatedImage: null, 
        styleDescription: null,
        isAnalyzing: false,
        isGenerating: false,
        intensity: [60],
        ensureUnique: true,
        history: [null],
        historyIndex: 0
      }),
    }),
    {
      name: 'styleblend-storage',
      partialize: (state) => ({ 
        intensity: state.intensity,
        ensureUnique: state.ensureUnique,
        theme: state.theme
      }),
    }
  )
);
