import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from './store';
import { ImageUploader } from './components/ImageUploader';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { analyzeReferenceImage, generateBlendedImage } from './services/geminiService';
import { Sparkles, Wand2, Download, RefreshCcw, Layers, Sun, Moon, Undo2, Redo2 } from 'lucide-react';

export default function App() {
  const {
    productImage,
    referenceImage,
    generatedImage,
    intensity,
    ensureUnique,
    isAnalyzing,
    isGenerating,
    styleDescription,
    history,
    historyIndex,
    theme,
    setProductImage,
    setReferenceImage,
    setGeneratedImage,
    setIntensity,
    setEnsureUnique,
    setIsAnalyzing,
    setIsGenerating,
    setStyleDescription,
    setTheme,
    undo,
    redo,
    reset,
  } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleGenerate = async () => {
    if (!productImage || !referenceImage) return;

    try {
      let currentStyle = styleDescription;
      if (!currentStyle) {
        setIsAnalyzing(true);
        currentStyle = await analyzeReferenceImage(referenceImage);
        setStyleDescription(currentStyle);
        setIsAnalyzing(false);
      }

      setIsGenerating(true);
      
      const modifiedDescription = ensureUnique 
        ? `${currentStyle}. Alter key details and geometric proportions subtly to ensure the result is uniquely generated and differs from the original reference structure.`
        : currentStyle;

      const newImage = await generateBlendedImage(productImage, modifiedDescription, intensity[0]);
      if (newImage) {
        setGeneratedImage(newImage);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during generation. Check the console for details.');
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `StyleBlend-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isWorking = isAnalyzing || isGenerating;
  const canUndo = historyIndex > 1 || (historyIndex === 1 && history[0] !== null);
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 transition-colors duration-300">
      
      {/* TOP NAV */}
      <header className="h-16 shrink-0 border-b bg-background flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3 text-primary">
          <div className="p-1.5 bg-primary rounded-xl shadow-sm border border-primary/20 text-primary-foreground">
            <Layers className="w-5 h-5 fill-current" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">StyleBlend AI</h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Mock Tabs from image */}
           <div className="hidden sm:flex p-1 bg-muted rounded-full">
             <button className="px-5 py-1.5 bg-background shadow-sm rounded-full text-sm font-medium">Create New</button>
             <button className="px-5 py-1.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">My Creations</button>
           </div>
           
           <div className="flex items-center gap-2 border-l pl-4 border-border/50">
             <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9">
               {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </Button>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative w-full flex flex-col items-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
        
        <div className="w-full max-w-6xl mx-auto px-4 py-8 lg:py-12 flex flex-col gap-8 relative z-10 lg:pl-10 lg:pr-10">
          
          {/* Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
             <ImageUploader 
                label="Product Image" 
                description="Upload the main product image. Click to crop."
                value={productImage}
                onChange={(val) => {
                  setProductImage(val);
                  setGeneratedImage(null);
                }}
              />

              <ImageUploader 
                label="Style Reference" 
                description="Upload an image representing the mood and environment."
                value={referenceImage}
                onChange={(val) => {
                  setReferenceImage(val);
                  setStyleDescription(null);
                  setGeneratedImage(null);
                }}
              />
          </div>

          {/* Control Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto bg-card rounded-[2rem] shadow-xl border border-border p-6 md:p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-8">
              {/* Slider Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <Label className="text-base font-bold text-foreground">Style Similarity</Label>
                   <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-widest">
                     {intensity[0] < 30 ? "LOW" : intensity[0] > 70 ? "HIGH" : "MED"}
                   </span>
                </div>
                
                <div className="space-y-4">
                  <Slider 
                    value={intensity} 
                    onValueChange={setIntensity} 
                    max={100} 
                    step={1}
                    className="py-1"
                  />
                  <div className="flex justify-between px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Subtle</span>
                    <span>Balanced</span>
                    <span>Intense</span>
                  </div>
                </div>
              </div>

              {/* Ensure Unique Switch Section */}
              <div className="flex items-start md:items-center justify-between md:justify-end gap-6 h-full pt-2">
                 <div className="flex flex-col text-left md:text-right">
                   <Label className="text-base font-bold text-foreground mb-1">Ensure Unique Details</Label>
                   <p className="text-sm text-muted-foreground">Modify elements to avoid direct copying</p>
                 </div>
                 <Switch 
                   checked={ensureUnique}
                   onCheckedChange={setEnsureUnique}
                   className="data-[state=checked]:bg-primary"
                 />
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              className="w-full h-16 rounded-2xl shadow-lg shadow-black/10 relative overflow-hidden group text-lg font-bold tracking-wide bg-[#111] hover:bg-[#222] text-white dark:bg-primary dark:hover:bg-primary/90" 
              onClick={handleGenerate}
              disabled={!productImage || !referenceImage || isWorking}
            >
              {isWorking && (
                <motion.div 
                  className="absolute inset-0 bg-white/10"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              )}
              {isWorking ? (
                <span className="flex items-center gap-3">
                  <RefreshCcw className="w-5 h-5 animate-spin opacity-70" />
                  {isAnalyzing ? "Analyzing Textures..." : "Synthesizing Image..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
                  Adapt My Product
                </span>
              )}
            </Button>
            
            {/* Tool bar for undo/redo */}
            {history.length > 1 && (
               <div className="flex justify-center mt-6 gap-2">
                  <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} className="h-8 rounded-full px-4">
                    <Undo2 className="w-3.5 h-3.5 mr-1" /> Undo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset} className="h-8 rounded-full px-4 text-muted-foreground">
                     Reset Workspace
                  </Button>
                  <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} className="h-8 rounded-full px-4">
                    Redo <Redo2 className="w-3.5 h-3.5 ml-1" />
                  </Button>
               </div>
            )}
          </motion.div>

          {/* Generated Result Section */}
          <AnimatePresence mode="wait">
            {(generatedImage || isWorking) && (
               <motion.div 
                 key="working-or-result"
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="w-full max-w-4xl mx-auto mb-12"
               >
                  {isWorking ? (
                     <div className="w-full aspect-[4/3] lg:aspect-video rounded-[2rem] border border-border/40 bg-card/50 shadow-2xl overflow-hidden flex flex-col items-center justify-center relative backdrop-blur-sm">
                       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                       
                       <div className="z-10 text-center space-y-8">
                         <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                            <motion.div 
                              className="absolute inset-0 border-2 border-primary/20 rounded-full border-t-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                            />
                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                         </div>
                         <h3 className="text-2xl font-medium tracking-tight text-foreground bg-background/80 backdrop-blur-md py-4 px-8 rounded-2xl border border-border/50">
                            {isAnalyzing ? "Deep Analysis..." : "Generating Result..."}
                         </h3>
                       </div>
                     </div>
                  ) : generatedImage ? (
                     <div className="w-full flex-1 flex flex-col items-center gap-6">
                        <div className="w-full min-h-[400px] rounded-[2.5rem] border border-border/30 bg-black/5 dark:bg-black/40 shadow-2xl p-2 relative group flex items-center justify-center backdrop-blur-sm">
                          <img src={generatedImage} alt="Generated visualization" className="w-full h-full object-contain rounded-[2rem] bg-white dark:bg-black/80" />
                          
                          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button size="icon" variant="secondary" onClick={handleDownload} className="rounded-full shadow-xl h-12 w-12 bg-background/90 hover:bg-background border border-border/50 text-foreground transition-all hover:scale-105">
                              <Download className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>

                        {styleDescription && (
                          <div className="w-full max-w-3xl bg-card border border-border/50 rounded-2xl p-6 shadow-sm mx-auto text-center">
                            <h4 className="text-[10px] font-bold tracking-widest uppercase text-primary/80 mb-3 flex items-center justify-center gap-2">
                              <Sparkles className="w-3 h-3" /> Processed Concept
                            </h4>
                            <p className="text-sm leading-relaxed text-foreground/80 font-serif">
                              {styleDescription}
                            </p>
                          </div>
                        )}
                     </div>
                  ) : null}
               </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
