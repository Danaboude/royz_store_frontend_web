'use client';
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { X, Package, DollarSign, CheckCircle } from 'lucide-react';
import { getSubscriptionPackagesByVendorType, assignSubscriptionToVendor, getVendorCurrentSubscription, SubscriptionPackage, AssignSubscriptionPayload } from '@/services/admin-api';

interface SubscriptionAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: {
    user_id: number;
    name: string;
    role_id: number;
    vendor_type_id?: number;
  };
  onSuccess: () => void;
}

export default function SubscriptionAssignmentModal({
  isOpen,
  onClose,
  vendor,
  onSuccess
}: SubscriptionAssignmentModalProps) {
  const { t, locale } = useI18n();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [existingSubscription, setExistingSubscription] = useState<{
    subscription_id: number;
    package_name: string;
    end_date: string;
    status: string;
  } | null>(null);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  // Add state for duration and num_products
  const [selectedDuration, setSelectedDuration] = useState<'none' | '2weeks' | 'month'>('month');
  const [numProducts, setNumProducts] = useState<number>(1);
  const [paymentNotification, setPaymentNotification] = useState<{ amount: number, visible: boolean }>({ amount: 0, visible: false });
  // Add state for admin confirmation if overwriting subscription
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  // Get vendor type ID based on role
  const getVendorTypeId = (roleId: number) => {
    switch (roleId) {
      case 3: return 1; // Seller
      case 4: return 2; // Real Estate
      case 5: return 3; // Factory
      default: return 1;
    }
  };

  const vendorTypeId = vendor.vendor_type_id || getVendorTypeId(vendor.role_id);

  // Helper to check if selected package is real estate special (9-12)
  const isSpecialRealEstatePackage = selectedPackage && [9, 10, 11, 12].includes(selectedPackage.package_id);

  // Helper to get remaining days for prorated calculation
  const getRemainingDays = () => {
    if (!existingSubscription) return 0;
    const now = new Date();
    const end = new Date(existingSubscription.end_date);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // Update calculateTotalAmount for 'none' duration
  const calculateTotalAmount = () => {
    if (!selectedPackage) return 0;
    if (isRealEstate && selectedDuration === 'none') {
      // Prorated for remaining days in month, only if there is an existing subscription
      const remainingDays = getRemainingDays();
      if (!existingSubscription || remainingDays === 0) return 0;
      return Math.round(((selectedPackage.price / 30) * remainingDays * numProducts) * 100) / 100;
    }
    if (isRealEstate && selectedDuration === '2weeks') {
      return (selectedPackage.price_2weeks || 0) * numProducts;
    }
    if (isRealEstate) {
      return selectedPackage.price * numProducts * durationMonths;
    }
    return selectedPackage.price * durationMonths;
  };

  useEffect(() => {
    if (isOpen && vendorTypeId) {
      loadPackages();
      checkExistingSubscription();
    }
  }, [isOpen, vendorTypeId]);

  const checkExistingSubscription = async () => {
    try {
      const currentSubscription = await getVendorCurrentSubscription(vendor.user_id);
      if (currentSubscription && currentSubscription.is_active) {
        setExistingSubscription({
          subscription_id: currentSubscription.subscription_id,
          package_name: currentSubscription.package_name,
          end_date: currentSubscription.end_date,
          status: currentSubscription.status
        });
        setShowWarning(true);
      }
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const loadPackages = async () => {
    try {
      setLoading(true);
      const packagesData = await getSubscriptionPackagesByVendorType(vendorTypeId);
      setPackages(packagesData);
      setError('');
    } catch (err) {
      setError('Failed to load packages');
      console.error('Error loading packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
  };

  // Update handleSubmit to handle 'none' duration
const handleSubmit = async () => {
  if (!selectedPackage) {
    setError(t('vendors.packageRequired'));
    return;
  }
  if (isSpecialRealEstatePackage && selectedDuration === 'month' && durationMonths < 1) {
    setError(t('vendors.durationRequired'));
    return;
  }
  if (!isSpecialRealEstatePackage && durationMonths < 1) {
    setError(t('vendors.durationRequired'));
    return;
  }
  
  try {
    setLoading(true);
    setError('');
    
    let apiPayload: AssignSubscriptionPayload = {
      user_id: vendor.user_id,
      package_id: selectedPackage.package_id,
      auto_renew: autoRenew,
    };
    
    if (isSpecialRealEstatePackage) {
      if (selectedDuration === '2weeks') {
        apiPayload = {
          ...apiPayload,
          duration_days: 14,
          num_products: numProducts,
        };
      } else if (selectedDuration === 'month') {
        apiPayload = {
          ...apiPayload,
          duration_months: durationMonths,
          num_products: numProducts,
        };
      } else if (selectedDuration === 'none') {
        apiPayload = {
          ...apiPayload,
          num_products: numProducts,
        };
      }
    } else {
      apiPayload = {
        ...apiPayload,
        duration_months: durationMonths,
      };
    }
    
    const response = await assignSubscriptionToVendor(apiPayload);
    let paymentAmount = 0;

    // Type the response properly
    interface SubscriptionResponse {
      total_amount?: number;
      subscription?: {
        total_amount?: number;
      };
    }

    const typedResponse = response as SubscriptionResponse;
    if (typeof typedResponse?.total_amount === 'number') {
      paymentAmount = typedResponse.total_amount;
    } else if (typeof typedResponse?.subscription?.total_amount === 'number') {
      paymentAmount = typedResponse.subscription.total_amount;
    }

    if (paymentAmount > 0) {
      setPaymentNotification({ amount: paymentAmount, visible: true });
      setTimeout(() => setPaymentNotification({ amount: 0, visible: false }), 6000);
    }
    
    onSuccess();
    onClose();
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : t('vendors.errorAssigningSubscription');
    
    // Special handling for package change error
    if (typeof errorMessage === 'string' && errorMessage.includes('You cannot change your package')) {
      setError(t('vendors.cannotChangePackage'));
    } else {
      setError(errorMessage);
    }
    
    console.error('Error assigning subscription:', err);
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    setSelectedPackage(null);
    setDurationMonths(1);
    setAutoRenew(true);
    setError('');
    setExistingSubscription(null);
    setShowWarning(false);
    setPaymentNotification({ amount: 0, visible: false });
    onClose();
  };

  if (!isOpen) return null;

  const isRealEstate = vendorTypeId === 2;

  return (
    <>
      {paymentNotification.visible && (
        <div style={{ position: 'fixed', top: 24, left: 24, zIndex: 9999 }} className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {t('vendors.totalAmount')}: <span className="font-bold">${paymentNotification.amount}</span>
        </div>
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('vendors.assignSubscriptionTo').replace('{name}', vendor.name)}
                </h2>
                <p className="text-sm text-green-600 font-medium">
                  {t('vendors.adminAssignmentNote')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Existing Subscription Warning */}
            {showWarning && existingSubscription && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {t('vendors.existingSubscriptionWarning')}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        {t('vendors.existingSubscriptionMessage')
                          .replace('{name}', vendor.name)
                          .replace('{endDate}', new Date(existingSubscription.end_date).toLocaleDateString())}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p><strong>{t('vendors.packageName')}:</strong> {existingSubscription.package_name}</p>
                        <p><strong>{t('vendors.endDate')}:</strong> {new Date(existingSubscription.end_date).toLocaleDateString()}</p>
                        <p><strong>{t('vendors.status')}:</strong> {existingSubscription.status}</p>
                      </div>
                      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                        <span className="font-bold text-yellow-900">{t('vendors.subscriptionAlreadyExists') || 'Subscription already exists'}</span><br/>
                        <span>{t('vendors.proceedWithNewSubscription') || 'Proceeding will cancel the previous subscription and assign the new one.'}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-bold hover:bg-yellow-700 transition"
                          onClick={() => setConfirmOverwrite(true)}
                          disabled={confirmOverwrite}
                        >
                          {t('vendors.proceedWithNewSubscription') || 'Proceed with new subscription'}
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                          onClick={handleClose}
                        >
                          {t('vendors.cancelAssignment') || 'Cancel assignment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Package Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('vendors.selectPackage')}
              </h3>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.package_id}
                      onClick={() => handlePackageSelect(pkg)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPackage?.package_id === pkg.package_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{locale === 'ar' ? pkg.name_ar : pkg.name_en}</h4>
                        <div className="text-lg font-bold text-blue-600">
                         ${pkg.price}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{locale === 'ar' ? pkg.description_ar : pkg.description_en}</p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          {t('subscriptionPackages.maxProducts')}  {pkg.max_products}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                         {t('subscriptionPackages.commissionRate')}   {pkg.commission_rate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duration/Properties Selection */}
            {isRealEstate && (
              <>
                <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                  <label className="font-bold text-[#2C2C54]">{t('vendors.duration')}</label>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-bold border-2 ${selectedDuration === 'none' ? 'bg-gray-200 border-gray-400 text-[#2C2C54]' : 'bg-white border-gray-300 text-[#2C2C54]'}`}
                    onClick={() => setSelectedDuration('none')}
                  >
                    {t('vendors.none') || 'None'}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-bold border-2 ${selectedDuration === '2weeks' ? 'bg-[#F8C291] border-[#F8C291] text-[#2C2C54]' : 'bg-white border-gray-300 text-[#2C2C54]'}`}
                    onClick={() => setSelectedDuration('2weeks')}
                  >
                    {t('vendors.twoWeeks')}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-bold border-2 ${selectedDuration === 'month' ? 'bg-[#F8C291] border-[#F8C291] text-[#2C2C54]' : 'bg-white border-gray-300 text-[#2C2C54]'}`}
                    onClick={() => setSelectedDuration('month')}
                  >
                    {t('vendors.oneMonth')}
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                  <label className="font-bold text-[#2C2C54]">{t('vendors.numProperties')}</label>
                  <input
                    type="number"
                    min={1}
                    value={numProducts}
                    onChange={e => setNumProducts(Number(e.target.value))}
                    className="w-24 border rounded px-3 py-2 border-gray-300 text-center font-bold"
                  />
                </div>
              </>
            )}
            {!isRealEstate && (
              <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                <label className="font-bold text-[#2C2C54]">{t('vendors.durationMonths')}</label>
                <input
                  type="number"
                  min={1}
                  value={durationMonths}
                  onChange={e => setDurationMonths(Number(e.target.value))}
                  className="w-24 border rounded px-3 py-2 border-gray-300 text-center font-bold"
                />
              </div>
            )}

            {/* Auto Renew */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="autoRenew"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoRenew" className="text-sm text-gray-700">
                {t('vendors.autoRenew')}
              </label>
            </div>

            {/* Summary */}
            {selectedPackage ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {t('vendors.subscriptionDetails')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('vendors.packageName')}:</span>
                    <span className="font-medium">{locale === 'ar' ? selectedPackage.name_ar : selectedPackage.name_en}</span>
                  </div>
                  {isRealEstate && selectedDuration === 'none' ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('vendors.numProperties')}:</span>
                      <span className="font-medium">{numProducts}</span>
                    </div>
                  ) : isRealEstate && selectedDuration === '2weeks' ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('vendors.duration')}:</span>
                      <span className="font-medium">14 {t('vendors.days')}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('vendors.durationMonths')}:</span>
                      <span className="font-medium">{durationMonths} {t('vendors.month')}</span>
                    </div>
                  )}
                  {isRealEstate && selectedDuration !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('vendors.numProperties')}:</span>
                      <span className="font-medium">{numProducts}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('vendors.totalAmount')}:</span>
                    <span className="font-bold text-lg text-blue-600">
                      ${calculateTotalAmount()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('vendors.paymentMethod')}:</span>
                    <span className="font-medium text-green-600">{t('vendors.adminPayment')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                {t('vendors.selectPackage')}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
              disabled={loading || (showWarning && !confirmOverwrite)}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('vendors.confirmAssignment')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 