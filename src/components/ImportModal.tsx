'use client';

import React, { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { downloadExcelTemplate, importProductsFromExcel } from '@/services/admin-api';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ImportResults {
  results: {
    total: number;
    success: number;
    failed: number;
    errors: string[];
  };
}

export default function ImportModal({ isOpen, onClose, onImportSuccess }: ImportModalProps) {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(t('admin.import.invalidFileType'));
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('admin.import.fileSizeLimit'));
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      const blob = await downloadExcelTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError(t('admin.import.error'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t('admin.import.selectFile'));
      return;
    }
    try {
      setIsUploading(true);
      setError(null);
      setImportResults(null);
      const results = await importProductsFromExcel(selectedFile);
      setImportResults(results as ImportResults);

      onImportSuccess();

    } catch (error: unknown) {
      console.error('Error importing products:', error);
      if (typeof error === 'object' && error && 'response' in error && typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string') {
        setError((error as { response: { data: { error: string } } }).response.data.error);
      } else {
        setError(t('import.error'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    setImportResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('admin.import.title')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1"
            aria-label={t('admin.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Download Template Section */}
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('admin.import.downloadTemplate')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('admin.import.templateHint')}
            </p>
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {isDownloading ? t('admin.import.downloading') : t('admin.import.downloadTemplate')}
            </button>
          </div>

          {/* Upload File Section */}
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('admin.import.uploadFile')}
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedFile ? selectedFile.name : t('admin.import.selectFileLabel')}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                {t('admin.import.supportedFormats')}
              </p>
            </div>
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                {isUploading ? t('admin.import.processing') : t('admin.import.uploadFile')}
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('admin.import.results.title')}</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">{t('admin.import.results.total')}:</span> {importResults.results.total}</p>
                <p><span className="font-medium">{t('admin.import.results.success')}:</span> {importResults.results.success}</p>
                <p><span className="font-medium">{t('admin.import.results.failed')}:</span> {importResults.results.failed}</p>
                {importResults.results.errors.length > 0 && (
                  <div>
                    <p className="font-medium text-red-600">{t('admin.import.results.errors')}:</p>
                    <ul className="list-disc list-inside text-xs text-red-600 max-h-20 overflow-y-auto">
                      {importResults.results.errors.slice(0, 5).map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                      {importResults.results.errors.length > 5 && (
                        <li>{t('admin.import.results.moreErrors').replace('{count}', String(importResults.results.errors.length - 5))}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg font-medium"
          >
            {t('admin.close')}
          </button>
        </div>
      </div>
    </div>
  );
} 