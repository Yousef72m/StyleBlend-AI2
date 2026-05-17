import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from './store';
import { ImageUploader } from './components/ImageUploader';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
      const newImage = await generateBlendedImage(productImage, currentStyle, intensity[0]);
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
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden font-sans selection:bg-primary/30 transition-colors duration-300">
      
      {/* LEFT COLUMN: Controls */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full md:w-[420px] lg:w-[480px] shrink-0 border-r bg-card/30 backdrop-blur-3xl flex flex-col h-screen overflow-y-auto"
      >
        <div className="p-6 pb-2 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 text-primary mb-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">StyleBlend AI</h1>
            </div>
            <p className="text-sm text-muted-foreground">Smart Product Visual Adaptor</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        <Separator className="my-4 opacity-50" />

        <div className="p-6 flex-1 flex flex-col gap-8">
          <div className="space-y-6">
            <ImageUploader 
              label="1. Product Source" 
              description="Upload the main product image (e.g., shoe, furniture, bottle on white background). Click to crop."
              value={productImage}
              onChange={(val) => {
                setProductImage(val);
                setGeneratedImage(null);
              }}
            />

            <ImageUploader 
              label="2. Style Reference" 
              description="Upload an image representing the mood, lighting, and environment you want"
              value={referenceImage}
              onChange={(val) => {
                setReferenceImage(val);
                setStyleDescription(null);
                setGeneratedImage(null);
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <Label className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">3. Blend Intensity</Label>
              <span className="text-xs font-mono text-muted-foreground">{intensity[0]}%</span>
            </div>
            <Slider 
              value={intensity} 
              onValueChange={setIntensity} 
              max={100} 
              step={1}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">Higher intensity means further deviation from the original product shape.</p>
          </div>
        </div>

        <div className="p-6 border-t bg-background/50 backdrop-blur-md sticky bottom-0 z-10 w-full flex flex-col gap-4">
          {(!generatedImage && !isWorking) || historyIndex === 0 ? null : (
            <div className="flex w-full gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo} className="flex-1">
                <Undo2 className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo} className="flex-1">
                <Redo2 className="w-4 h-4 mr-2" />
                Redo
              </Button>
            </div>
          )}

          <Button 
            className="w-full h-12 shadow-xl shadow-primary/20 relative overflow-hidden group" 
            onClick={handleGenerate}
            disabled={!productImage || !referenceImage || isWorking}
          >
            {isWorking && (
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />
            )}
            {isWorking ? (
              <span className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                {isAnalyzing ? "Analyzing Texture & Mood..." : "Synthesizing Image..."}
              </span>
            ) : (
              <span className="flex items-center gap-2 font-medium tracking-wide">
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Generate Visualization
              </span>
            )}
          </Button>
          
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-muted-foreground h-8">
              Reset Strategy
            </Button>
          </div>
        </div>
      </motion.div>

      {/* RIGHT COLUMN: Output canvas */}
      <div className="flex-1 bg-black/5 dark:bg-[#121212] flex flex-col relative transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0" />
        
        <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center relative z-10">
          
          {!generatedImage && !isWorking ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center max-w-md mx-auto space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-6 ring-1 ring-border shadow-inner">
                <Wand2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-light tracking-tight">Ready to synthesize</h2>
              <p className="text-muted-foreground">Upload both your product and a reference image to adapt the style organically.</p>
            </motion.div>
          ) : isWorking ? (
            <motion.div 
              key="working"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-3xl aspect-square md:aspect-[4/3] rounded-3xl border border-border/50 bg-black/5 dark:bg-black/40 shadow-2xl overflow-hidden flex flex-col items-center justify-center relative"
            >
               {/* Animated grid background */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
               
               <div className="z-10 text-center space-y-6">
                 <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <motion.div 
                      className="absolute inset-0 border-2 border-primary/30 rounded-full border-t-primary"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    />
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                 </div>
                 
                 <div className="space-y-2">
                   <h3 className="text-xl font-medium">
                      {isAnalyzing ? "Phase 1: Deep Analysis" : "Phase 2: Image Generation"}
                   </h3>
                   <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                      {isAnalyzing 
                        ? "Extracting atmospheric data, lighting conditions, and material properties..."
                        : "Applying neural style transfer while preserving underlying product geometry..."}
                   </p>
                 </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6"
            >
              <div className="w-full flex-1 min-h-0 min-w-0 aspect-square md:aspect-[4/3] lg:aspect-video rounded-2xl md:rounded-3xl border-2 border-border/50 bg-black/5 dark:bg-black shadow-2xl shadow-primary/10 overflow-hidden relative group">
                <img src={generatedImage!} alt="Generated visualization" className="w-full h-full object-contain" />
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" onClick={handleDownload} className="rounded-full shadow-lg">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {styleDescription && (
                <div className="w-full max-w-3xl bg-card border rounded-2xl p-6 shadow-sm">
                  <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Extracted Style Profile
                  </h4>
                  <p className="text-sm leading-relaxed text-card-foreground/90 font-serif">
                    {styleDescription}
                  </p>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>

    </div>
  );
}
