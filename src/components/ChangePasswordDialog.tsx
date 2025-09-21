import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/services/api';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  userId: number;
}

export default function ChangePasswordDialog({ open, onClose, userId }: ChangePasswordDialogProps) {
  const { locale, t } = useI18n();
  const isRTL = locale === 'ar';
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword.trim()) {
      setError(t('changePasswordDialog.currentPasswordRequired'));
      return;
    }

    if (!newPassword.trim()) {
      setError(t('changePasswordDialog.newPasswordRequired'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('changePasswordDialog.passwordTooShort'));
      return;
    }

    if (!confirmPassword.trim()) {
      setError(t('changePasswordDialog.confirmPasswordRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('changePasswordDialog.passwordsNotMatch'));
      return;
    }

    setLoading(true);

    try {
      await api.users.changePassword(userId, currentPassword, newPassword);
      setSuccess(t('changePasswordDialog.passwordChanged'));
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('changePasswordDialog.error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div 
        className="relative bg-[#F7F7FA] rounded-2xl shadow-2xl flex flex-col w-full max-w-md mx-4 p-8" 
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 left-4 bg-[#F8C291]/30 hover:bg-[#F8C291]/60 rounded-full p-1.5 z-10 transition-colors"
          onClick={handleClose}
          disabled={loading}
          aria-label="Close"
        >
          <X className="w-6 h-6 text-[#2C2C54]" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className={`bg-[#F8C291]/30 rounded-full p-3 ${isRTL ? 'ml-4' : 'mr-4'}`}>
            <Lock className="w-8 h-8 text-[#2C2C54]" />
          </div>
          <h2 className="text-2xl font-bold text-[#2C2C54]" style={{fontFamily: 'Tajawal, sans-serif'}}>
            {t('changePasswordDialog.title')}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2C2C54]">
              {t('changePasswordDialog.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('changePasswordDialog.currentPasswordPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C291] focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                disabled={loading}
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2C2C54]">
              {t('changePasswordDialog.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('changePasswordDialog.newPasswordPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C291] focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                disabled={loading}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2C2C54]">
              {t('changePasswordDialog.confirmPassword')}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('changePasswordDialog.confirmPasswordPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C291] focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 space-x-reverse">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-[#2C2C54] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('changePasswordDialog.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#F8C291] text-[#2C2C54] rounded-lg hover:bg-[#F8C291]/80 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2C2C54]"></div>
                </div>
              ) : (
                t('changePasswordDialog.changePassword')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 