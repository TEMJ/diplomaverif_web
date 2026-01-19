import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { Button } from './Button';
import { ImageCropper } from './ImageCropper';
import axios from '../../lib/axios';

interface PhotoUploadProps {
  studentId: string;
  onUploadSuccess: (photoUrl: string) => void;
  currentPhotoUrl?: string;
}

export function PhotoUpload({ studentId, onUploadSuccess, currentPhotoUrl }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [loading, setLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, and GIF images are allowed');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    setShowCropper(false);
    await uploadPhoto(croppedFile);
  };

  const uploadPhoto = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const res = await axios.put(`/students/${studentId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const photoUrl = res.data.data?.photoUrl || res.data.photoUrl;

      // Update preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onUploadSuccess(photoUrl);
        toast.success('Photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(error.response?.data?.message || 'Failed to upload photo');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  if (showCropper) {
    return (
      <div className="space-y-4">
        <ImageCropper
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      {preview && (
        <div className="flex justify-center">
          <img
            src={preview}
            alt="Student photo"
            className="h-32 w-32 rounded-lg object-cover border-2 border-gray-200"
          />
        </div>
      )}

      {/* Drag and drop area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleChange}
          className="hidden"
          disabled={loading}
        />

        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Drag and drop your photo here or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={loading}
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Max size: 2MB • Formats: JPG, PNG, WebP, GIF • Square aspect ratio (1:1)
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Uploading...</span>
        </div>
      )}

      {/* Clear button if preview exists */}
      {preview && !loading && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setPreview(null)}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
