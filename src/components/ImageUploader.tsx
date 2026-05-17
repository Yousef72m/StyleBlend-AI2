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
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-end">
        <label className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">{label}</label>
      </div>
      
      {!value ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 min-h-[220px]",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-3 bg-background rounded-full shadow-sm border">
              <UploadCloud className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Click or drag image to upload</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border group bg-muted/30 aspect-square md:aspect-auto min-h-[220px]">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <Button 
              variant="destructive" 
              size="icon" 
              className="rounded-full w-10 h-10"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
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
