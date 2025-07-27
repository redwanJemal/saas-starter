// app/(admin)/admin/packages/receiving/components/package-image-upload.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadProgress {
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  documentId?: string;
  fileUrl?: string;
}

interface Document {
  id: string;
  documentId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

interface PackagePictureUploadProps {
  packageId?: string;
  pictures: Document[];
  setPictures: (pictures: Document[]) => void;
  onUploadComplete?: (pictures: Document[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  sessionId?: string;
}

export default function PackagePictureUpload({
  packageId,
  pictures,
  setPictures,
  onUploadComplete,
  maxFiles = 10,
  disabled = false,
  sessionId: propSessionId
}: PackagePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    propSessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propSessionId && propSessionId !== currentSessionId) {
      setCurrentSessionId(propSessionId);
    }
  }, [propSessionId, currentSessionId]);

  const handleFileSelect = async (files: File[]) => {
    if (disabled || files.length === 0) return;

    const remainingSlots = maxFiles - pictures.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxFiles} pictures allowed`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const validFiles: File[] = [];

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;
    await uploadFiles(validFiles);
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    
    const initialProgress: UploadProgress[] = files.map(file => ({
      fileName: file.name,
      status: 'uploading',
      progress: 0
    }));
    setUploadProgress(initialProgress);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('sessionId', currentSessionId);
      formData.append('purpose', packageId ? 'package_update' : 'package_creation');
      formData.append('documentType', 'picture');
      formData.append('path', `packages/pictures`);
      formData.append('isPublic', 'true');

      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const updatedProgress: UploadProgress[] = files.map((file, index) => {
        const doc = data.documents[index];
        return {
          fileName: file.name,
          status: doc ? 'success' : 'error',
          documentId: doc?.documentId,
          fileUrl: doc?.fileUrl,
          error: doc ? undefined : data.errors?.[index] || 'Upload failed'
        };
      });
      setUploadProgress(updatedProgress);

      if (packageId && data.documents.length > 0) {
        await attachDocumentsToPackage(data.sessionId);
      } else {
        // Store successful uploads for later attachment
        const successfulDocs: Document[] = data.documents.map((doc: any) => ({
          id: doc.documentId,
          documentId: doc.documentId,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          uploadedAt: new Date().toISOString()
        }));
        
        // Fix: Use functional update with proper typing
        setPictures([...pictures, ...successfulDocs]);
        onUploadComplete?.([...pictures, ...successfulDocs]);
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
      setTimeout(() => setUploadProgress([]), 3000);
    }
  };

  const attachDocumentsToPackage = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/packages/${packageId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, documentType: 'picture' })
      });

      if (!response.ok) {
        throw new Error(`Failed to attach documents: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const newPictures: Document[] = data.documents || [];
      
      // Fix: Use direct assignment instead of functional update
      setPictures([...pictures, ...newPictures]);
      onUploadComplete?.([...pictures, ...newPictures]);
    } catch (error) {
      console.error('Error attaching documents to package:', error);
      alert('Pictures uploaded but failed to attach to package. Please refresh the page.');
    }
  };

  const handleDeletePicture = async (picture: Document) => {
    if (!confirm('Are you sure you want to delete this picture?')) return;

    try {
      let response;
      if (packageId) {
        response = await fetch(`/api/admin/packages/${packageId}/documents/${picture.id}`, {
          method: 'DELETE'
        });
      } else {
        response = await fetch(`/api/admin/documents/${picture.documentId}`, {
          method: 'DELETE'
        });
      }

      if (!response.ok) {
        throw new Error('Failed to delete picture');
      }

      // Fix: Use direct assignment for deletion
      const updatedPictures = pictures.filter(p => p.id !== picture.id);
      setPictures(updatedPictures);
      onUploadComplete?.(updatedPictures);
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
          {!packageId && (
            <Badge variant="secondary" className="text-xs">
              Temporary Upload
            </Badge>
          )}
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
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Upload Progress</h4>
            {uploadProgress.map((progress, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {progress.status === 'uploading' && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                )}
                {progress.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {progress.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="flex-1 truncate">{progress.fileName}</span>
                {progress.status === 'error' && progress.error && (
                  <span className="text-red-500 text-xs">{progress.error}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pictures Grid */}
        {pictures.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pictures.map((picture) => (
              <div key={picture.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={picture.fileUrl}
                    alt={picture.fileName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  onClick={() => handleDeletePicture(picture)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
                <p className="mt-1 text-xs text-gray-500 truncate">
                  {picture.fileName}
                </p>
              </div>
            ))}
          </div>
        )}

        {pictures.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No pictures uploaded yet</p>
          </div>
        )}

        {/* Status Information */}
        {!packageId && pictures.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Pictures are temporarily stored and will be attached to the package when it's created.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}