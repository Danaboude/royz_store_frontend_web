'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, User } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/services/api-client';
import Image from 'next/image';


interface ProfileImageUploadProps {
  open: boolean;
  onClose: () => void;
  userId?: number;
}

export default function ProfileImageUpload({ open, onClose, userId }: ProfileImageUploadProps) {
  const { t } = useI18n();
  const { user, setUser } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('profileImage.fileTypeError') as string);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('profileImage.fileSizeError') as string);
        return;
      }

      setSelectedFile(file);
      setError('');

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;

    setIsUploading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profile_image', selectedFile);

      const response = await apiClient.put(`/users/${userId}`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = response.data;

      // Update user context with new profile image using the URL from server
      if (user && data.profile_image_url) {
        setUser({
          ...user,
          profile_image: data.profile_image_url,
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (t('profileImage.uploadError') as string));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!userId) return;

    setIsUploading(true);
    setError('');

    try {
      const response = await apiClient.put(`/users/${userId}`, { profile_image: null }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(response.data);
      // Update user context
      if (user) {
        setUser({
          ...user,
          profile_image: undefined,
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (t('profileImage.removeError') as string));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-md mx-4 p-6">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-xl font-bold text-gray-900 mb-6 text-center">
          {(t('profileImage.title') as string) || 'Update Profile Image'}
        </div>

        {/* Current Profile Image */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {user?.profile_image ? (
              <Image
                width={150} // Specify the width
                height={150} // Specify the height
                src={user.profile_image}
                alt={user.name || 'Profile'}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>{(t('profileImage.selectFile') as string) || 'Select Image'}</span>
          </button>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mb-6 text-center">
            <Image
              width={150} // Specify the width
              height={150} // Specify the height
              src={previewUrl}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-gray-200"
            />
            <p className="text-sm text-gray-600 mt-2">
              {selectedFile?.name}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {user?.profile_image && (
            <button
              onClick={handleRemoveImage}
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isUploading ? (t('profileImage.removing') as string) : ((t('profileImage.remove') as string) || 'Remove')}
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? (t('profileImage.uploading') as string) : ((t('profileImage.upload') as string) || 'Upload')}
          </button>
        </div>
      </div>
    </div>
  );
} 