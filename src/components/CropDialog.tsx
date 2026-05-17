import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCroppedImg } from '../lib/cropImage';
import { Check, X } from 'lucide-react';

interface CropDialogProps {
  imageSrc: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (croppedBase64: string) => void;
}

export function CropDialog({ imageSrc, open, onOpenChange, onCropComplete }: CropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset crop when image changes
  useEffect(() => {
    if (imageSrc) {
      setCrop(undefined);
    }
  }, [imageSrc]);

  if (!imageSrc) return null;

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const cropSize = Math.min(width, height) * 0.8;
    setCrop({
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x: (width - cropSize) / 2,
      y: (height - cropSize) / 2,
    });
  }

  const handleApplyCrop = async () => {
    if (!crop || !crop.width || !crop.height) {
      // If no crop selection, just return original
      onCropComplete(imageSrc);
      return;
    }

    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, crop);
      onCropComplete(croppedImage);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto w-full flex items-center justify-center p-4 bg-muted/30 rounded-lg">
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={onImageLoad}
              className="max-h-[60vh] object-contain"
              alt="Crop preview"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="w-full sm:justify-between items-center gap-2 mt-4">
          <p className="text-xs text-muted-foreground hidden sm:block">
            Drag to select area. Leave untouched to use original.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleApplyCrop} disabled={isProcessing}>
              <Check className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
