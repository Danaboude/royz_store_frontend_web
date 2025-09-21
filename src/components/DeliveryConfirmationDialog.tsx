"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import DeliveryImageUpload from './DeliveryImageUpload';

interface DeliveryConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (imageFile?: File, notes?: string) => void;
  action: 'pick_up' | 'start_delivery' | 'mark_delivered' | 'mark_failed';
  orderId: number;
  customerName: string;
}

export default function DeliveryConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  action,
  orderId,
  customerName
}: DeliveryConfirmationDialogProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [notes, setNotes] = useState('');

  const getActionConfig = () => {
    switch (action) {
      case 'pick_up':
        return {
          title: t('delivery.confirmPickUp.title'),
          message: t('delivery.confirmPickUp.message'),
          icon: Package,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          confirmText: t('delivery.confirmPickUp.confirm'),
          requiresImage: false
        };
      case 'start_delivery':
        return {
          title: t('delivery.confirmStartDelivery.title'),
          message: t('delivery.confirmStartDelivery.message'),
          icon: Truck,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
          confirmText: t('delivery.confirmStartDelivery.confirm'),
          requiresImage: false
        };
      case 'mark_delivered':
        return {
          title: t('delivery.confirmDelivered.title'),
          message: t('delivery.confirmDelivered.message'),
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          confirmText: t('delivery.confirmDelivered.confirm'),
          requiresImage: true
        };
      case 'mark_failed':
        return {
          title: t('delivery.confirmFailed.title'),
          message: t('delivery.confirmFailed.message'),
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          confirmText: t('delivery.confirmFailed.confirm'),
          requiresImage: false
        };
      default:
        return {
          title: t('delivery.confirmAction.title'),
          message: t('delivery.confirmAction.message'),
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          confirmText: t('delivery.confirmAction.confirm'),
          requiresImage: false
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  const handleConfirm = async () => {
    // Validate image requirement for delivery confirmation
    if (config.requiresImage && !selectedImage) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(selectedImage || undefined, notes || undefined);
      onClose();
      // Reset form
      setSelectedImage(null);
      setNotes('');
    } catch (error) {
      console.error('Error confirming action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setSelectedImage(null);
    setNotes('');
  };

  const isConfirmDisabled = config.requiresImage && !selectedImage;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${config.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {config.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {config.message.replace('{orderId}', orderId.toString()).replace('{customerName}', customerName)}
                </p>
                
                {/* Order Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t('delivery.orderNumber')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      #{orderId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t('delivery.customerName')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {customerName}
                    </span>
                  </div>
                </div>

                {/* Image Upload for Delivery Confirmation */}
                {config.requiresImage && (
                  <div className="mb-4">
                    <DeliveryImageUpload
                      onImageSelected={setSelectedImage}
                      onImageRemoved={() => setSelectedImage(null)}
                      selectedImage={selectedImage}
                      isRequired={true}
                    />
                  </div>
                )}

                {/* Notes Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('delivery.notes')} ({t('delivery.optional')})
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('delivery.notesPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('delivery.cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading || isConfirmDisabled}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonColor}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('delivery.processing')}
                    </div>
                  ) : (
                    config.confirmText
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
} 