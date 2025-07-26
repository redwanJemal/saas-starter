// components/admin/PictureUpload.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import { SupabaseUploadService, UploadResult } from '@/lib/services/s3UploadService';

interface PictureUploadProps {
  packageId: string;
  existingPictures?: PackagePicture[];
  onUploadComplete?: (pictures: PackagePicture[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface PackagePicture {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  result?: UploadResult;
}

export default function PictureUpload({
  packageId,
  existingPictures = [],
  onUploadComplete,
  maxFiles = 10,
  disabled = false
}: PictureUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pictures, setPictures] = useState<PackagePicture[]>(existingPictures);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadService = new SupabaseUploadService();

  const handleFileSelect = async (files: File[]) => {
    if (disabled || isUploading) return;

    // Check total file limit
    const totalFiles = pictures.length + files.length;
    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} pictures allowed. You can upload ${maxFiles - pictures.length} more.`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      const validation = uploadService.validatePackagePicture(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Invalid files:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length === 0) return;

    // Initialize upload progress
    const progressArray: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadProgress(progressArray);
    setIsUploading(true);

    try {
      // Upload files
      const uploadResults = await uploadService.uploadPackagePictures(validFiles, packageId);
      
      // Update progress for each file
      const updatedProgress = progressArray.map((progress, index) => {
        const result = uploadResults[index];
        return {
          ...progress,
          progress: 100,
          status: result.success ? 'success' as const : 'error' as const,
          error: result.error,
          result
        };
      });

      setUploadProgress(updatedProgress);

      // Save successful uploads to database
      const successfulUploads = uploadResults.filter(result => result.success);
      if (successfulUploads.length > 0) {
        await savePicturesToDatabase(successfulUploads);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error',
        error: 'Upload failed'
      })));
    } finally {
      setIsUploading(false);
      // Clear progress after 3 seconds
      setTimeout(() => setUploadProgress([]), 3000);
    }
  };

  const savePicturesToDatabase = async (uploadResults: UploadResult[]) => {
    try {
      // Filter out any results with missing required fields
      const validResults = uploadResults.filter(result => 
        result.fileName && result.fileUrl
      );
      
      if (validResults.length === 0) {
        throw new Error('No valid upload results to save');
      }
      
      // Log what we're sending to the API
      const documentsToSave = validResults.map(result => ({
        documentType: 'picture',
        fileName: result.fileName || `image-${Date.now()}.jpg`, // Fallback filename if missing
        fileUrl: result.fileUrl,
        fileSize: result.fileSize,
        mimeType: result.mimeType || 'image/jpeg',
        isPublic: true
      }));
      
      console.log('Sending documents to API:', JSON.stringify(documentsToSave, null, 2));
      console.log('Package ID:', packageId);
      
      const response = await fetch(`/api/admin/packages/${packageId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents: documentsToSave
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`Failed to save pictures to database: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const newPictures = data.documents || [];
      
      setPictures(prev => [...prev, ...newPictures]);
      onUploadComplete?.(pictures.concat(newPictures));

    } catch (error) {
      console.error('Error saving to database:', error);
      alert('Pictures uploaded but failed to save to database. Please refresh the page.');
    }
  };

  const handleDeletePicture = async (pictureId: string) => {
    if (!confirm('Are you sure you want to delete this picture?')) return;

    try {
      const response = await fetch(`/api/admin/packages/${packageId}/documents/${pictureId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete picture');
      }

      setPictures(prev => prev.filter(p => p.id !== pictureId));
      onUploadComplete?.(pictures.filter(p => p.id !== pictureId));

    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete picture');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Package Pictures
          <Badge variant="outline">
            {pictures.length}/{maxFiles}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop pictures here, or click to select files
          </p>
          <p className="text-xs text-gray-500">
            JPEG, PNG, WebP up to 10MB each. Max {maxFiles} pictures.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploading...</h4>
            {uploadProgress.map((progress, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{progress.file.name}</span>
                  <div className="flex items-center gap-1">
                    {progress.status === 'uploading' && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {progress.status === 'success' && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                    {progress.status === 'error' && (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span>{progress.progress}%</span>
                  </div>
                </div>
                <Progress value={progress.progress} className="h-1" />
                {progress.error && (
                  <p className="text-xs text-red-500">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Existing Pictures */}
        {pictures.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Pictures</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pictures.map((picture) => (
                <div key={picture.id} className="relative group">
                  <div className="aspect-square relative overflow-hidden rounded-lg border">
                    <Image
                      src={picture.fileUrl}
                      alt={picture.fileName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  </div>
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(picture.fileUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePicture(picture.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* File info */}
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 truncate">
                      {picture.fileName}
                    </p>
                    {picture.fileSize && (
                      <p className="text-xs text-gray-400">
                        {(picture.fileSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {pictures.length === 0 && uploadProgress.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No pictures uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}