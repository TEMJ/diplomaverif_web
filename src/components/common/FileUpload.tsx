import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { Button } from './Button';
import axios from '../../lib/axios';

interface FileUploadProps {
  universityId: string;
  uploadType: 'logo' | 'seal' | 'signature';
  label: string;
  onUploadSuccess: (url: string) => void;
  currentUrl?: string;
}

export function FileUpload({
  universityId,
  uploadType,
  label,
  onUploadSuccess,
  currentUrl,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [loading, setLoading] = useState(false);
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

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const endpoint =
        uploadType === 'logo'
          ? `/universities/${universityId}/logo`
          : uploadType === 'seal'
            ? `/universities/${universityId}/seal`
            : `/universities/${universityId}/signature`;

      const res = await axios.put(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileUrl =
        res.data.data?.[`${uploadType}Url`] || res.data[`${uploadType}Url`];
      onUploadSuccess(fileUrl);
      toast.success(`${label} uploaded successfully`);
    } catch (error: any) {
      console.error(`Error uploading ${uploadType}:`, error);
      toast.error(
        error.response?.data?.message || `Failed to upload ${uploadType}`
      );
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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt={label}
            className="max-w-xs h-auto border border-gray-300 rounded-lg"
          />
        </div>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            Drag and drop or click to upload {label.toLowerCase()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max 2MB. Supported: JPG, PNG, WebP, GIF
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="hidden"
        />
      </div>

      <Button
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Uploading...' : `Upload ${label}`}
      </Button>
    </div>
  );
}
