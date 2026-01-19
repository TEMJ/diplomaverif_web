import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, X, Check } from 'lucide-react';
import { Button } from './Button';

interface ImageCropperProps {
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
}

export function ImageCropper({ onCropComplete }: ImageCropperProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0, size: 200 });
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, and GIF images are allowed');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 2MB');
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEvent = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!imageRef.current) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - rect.left;
      const newY = moveEvent.clientY - rect.top;

      setCropPos((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(newX - prev.size / 2, imageRef.current!.width - prev.size)),
        y: Math.max(0, Math.min(newY - prev.size / 2, imageRef.current!.height - prev.size)),
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCrop = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    try {
      setIsLoading(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        toast.error('Failed to get canvas context');
        return;
      }

      // Set canvas to square size
      canvas.width = cropPos.size;
      canvas.height = cropPos.size;

      // Draw cropped image
      ctx.drawImage(
        imageRef.current,
        cropPos.x,
        cropPos.y,
        cropPos.size,
        cropPos.size,
        0,
        0,
        cropPos.size,
        cropPos.size
      );

      // Convert to blob and create file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-photo.png', { type: 'image/png' });
          onCropComplete(file);
          toast.success('Photo cropped successfully');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
    } finally {
      setIsLoading(false);
    }
  };

  if (!image) {
    return (
      <div className="space-y-4">
        <div
          onDragEnter={handleDragEvent}
          onDragLeave={handleDragEvent}
          onDragOver={handleDragEvent}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Drag and drop your photo here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to select (Max 2MB)
              </p>
            </div>
          </label>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Supported formats: JPG, PNG, WebP, GIF
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Drag the crop box to frame your photo (1:1 aspect ratio)
        </p>
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={image}
            alt="Crop preview"
            className="max-w-full max-h-96 block"
            onLoad={() => {
              if (imageRef.current) {
                const size = Math.min(
                  imageRef.current.width,
                  imageRef.current.height,
                  200
                );
                setCropPos({
                  x: (imageRef.current.width - size) / 2,
                  y: (imageRef.current.height - size) / 2,
                  size,
                });
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          <svg
            className="absolute inset-0 cursor-move"
            style={{
              width: `${(cropPos.size / imageRef.current!.width) * 100}%`,
              height: `${(cropPos.size / imageRef.current!.height) * 100}%`,
              left: `${(cropPos.x / imageRef.current!.width) * 100}%`,
              top: `${(cropPos.y / imageRef.current!.height) * 100}%`,
              border: '2px solid #3b82f6',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            }}
            onMouseDown={handleMouseDown}
          >
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setImage(null);
            setCropPos({ x: 0, y: 0, size: 200 });
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Choose Different Photo
        </Button>
        <Button
          onClick={handleCrop}
          disabled={isLoading}
        >
          <Check className="w-4 h-4 mr-2" />
          {isLoading ? 'Processing...' : 'Confirm Crop'}
        </Button>
      </div>
    </div>
  );
}
