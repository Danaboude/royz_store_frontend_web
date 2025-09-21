"use client";

import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';

interface DeliveryImageUploadProps {
  onImageSelected: (file: File) => void;
  onImageRemoved: () => void;
  selectedImage: File | null;
  isRequired?: boolean;
}

export default function DeliveryImageUpload({
  onImageSelected,
  onImageRemoved,
  selectedImage,
  isRequired = true
}: DeliveryImageUploadProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      onImageSelected(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    onImageRemoved();
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {t('delivery.confirmationImage')}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-xs text-gray-500">
          {t('delivery.imageRequirement')}
        </span>
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              width={150} // Specify the width
              height={150} // Specify the height

              src={previewUrl}
              alt="Delivery confirmation"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedImage?.name}
          </p>
        </div>
      )}

      {/* Upload Options */}
      {!previewUrl && (
        <div className="space-y-3">
          {/* Camera Capture */}
          <button
            type="button"
            onClick={handleCameraClick}
            className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Camera className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-gray-600">{t('delivery.takePhoto')}</span>
          </button>

          {/* File Upload */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Upload className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-gray-600">{t('delivery.uploadImage')}</span>
          </button>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <ImageIcon className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">{t('delivery.imageInstructions.title')}</p>
            <ul className="text-xs space-y-1">
              <li>• {t('delivery.imageInstructions.requirement1')}</li>
              <li>• {t('delivery.imageInstructions.requirement2')}</li>
              <li>• {t('delivery.imageInstructions.requirement3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 