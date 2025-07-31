// features/packages/components/package-photo-upload.tsx
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Camera, Eye } from 'lucide-react';
import Image from 'next/image';

interface PackagePhoto {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

interface PackagePhotoUploadProps {
  photos: PackagePhoto[];
  onPhotosChange: (photos: PackagePhoto[]) => void;
  maxPhotos?: number;
  maxFileSize?: number; // in MB
}

export function PackagePhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  maxFileSize = 5
}: PackagePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Handle file selection (both drag & drop and file input)
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (photos.length + fileArray.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);
    try {
      const newPhotos: PackagePhoto[] = [];
      
      for (const file of fileArray) {
        if (file.size > maxFileSize * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB`);
          continue;
        }

        // Create a local URL for preview
        const url = URL.createObjectURL(file);
        const photo: PackagePhoto = {
          id: `temp_${Date.now()}_${Math.random()}`,
          url,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date(),
        };
        
        newPhotos.push(photo);
      }

      onPhotosChange([...photos, ...newPhotos]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  }, [photos, onPhotosChange, maxPhotos, maxFileSize]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // File input handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [handleFiles]);

  // Remove photo
  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosChange(updatedPhotos);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <Card>
          <CardContent className="p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="photo-upload"
                disabled={uploading || photos.length >= maxPhotos}
              />
              
              <label 
                htmlFor="photo-upload" 
                className="cursor-pointer block"
              >
                {uploading ? (
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                )}
                
                <p className="text-sm text-gray-600 mb-2">
                  {uploading 
                    ? 'Uploading photos...'
                    : isDragActive
                    ? 'Drop photos here'
                    : 'Drag and drop photos here, or click to select'
                  }
                </p>
                
                <p className="text-xs text-gray-500">
                  JPEG, PNG, WebP up to {maxFileSize}MB each. Max {maxPhotos} photos.
                </p>
                
                <Badge variant="outline" className="mt-2">
                  {photos.length}/{maxPhotos} photos
                </Badge>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={photo.url}
                  alt={photo.fileName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                
                {/* Remove button */}
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
                
                {/* View button */}
                <button
                  onClick={() => window.open(photo.url, '_blank')}
                  className="absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <Eye className="h-3 w-3" />
                </button>
              </div>
              
              {/* Photo info */}
              <div className="mt-2 text-xs text-gray-500">
                <p className="truncate">{photo.fileName}</p>
                <p>{formatFileSize(photo.fileSize)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {photos.length === 0 && (
        <div className="text-center py-4">
          <Camera className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No photos uploaded yet</p>
          <p className="text-xs text-gray-400">Photos help with package identification and customs</p>
        </div>
      )}
    </div>
  );
}