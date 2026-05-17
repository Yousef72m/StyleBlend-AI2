import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CropDialog } from './CropDialog';

interface ImageUploaderProps {
  label: string;
  description: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  className?: string;
}

export function ImageUploader({ label, description, value, onChange, className }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
    // reset input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setTempImage(event.target.result);
        setCropDialogOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64: string) => {
    onChange(croppedBase64);
    setTempImage(null);
  };

  return (
    <div className={cn("flex flex-col gap-3 group/uploader w-full", className)}>
      
      {!value ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/50 hover:border-primary rounded-[2rem] cursor-pointer transition-all duration-300 min-h-[300px] lg:min-h-[400px] overflow-hidden bg-background shadow-sm hover:shadow-md",
            isDragging && "border-primary bg-primary/5 scale-[1.02]"
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-primary/5 backdrop-blur-[2px] z-0" />
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="flex flex-col items-center gap-4 text-center z-10">
            <div className={cn(
              "p-5 rounded-2xl shadow-sm transition-transform duration-300",
              isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-primary/10 text-primary group-hover/uploader:scale-110"
            )}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 flex flex-col items-center">
              <span className="inline-flex px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">
                {label}
              </span>
              <p className="text-sm font-medium text-foreground">Click or drop to upload</p>
              <p className="text-xs text-muted-foreground/80 max-w-[200px] mx-auto">{description}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-[2rem] overflow-hidden border-2 border-dashed border-primary/80 group bg-card shadow-md aspect-square lg:aspect-auto lg:h-[400px] w-full cursor-pointer hover:border-primary transition-all p-1"
          onClick={() => setCropDialogOpen(true)}
        >
          <div className="w-full h-full rounded-[1.8rem] overflow-hidden relative">
            <img src={value} alt={label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
              <span className="text-white font-medium drop-shadow-md">Click to Crop</span>
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-full w-12 h-12 shadow-xl hover:scale-110 transition-transform bg-destructive/90 hover:bg-destructive absolute bottom-4 right-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Dialog */}
      <CropDialog 
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={tempImage}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
