'use client';
import { useEffect, useState } from 'react';
import { getVendorSubscriptions, subscribeToPackage, getSubscriptionPackagesByVendorType } from '@/services/vendor-api';
import { useI18n } from '@/contexts/I18nContext';
import { Package, DollarSign, CheckCircle, X } from 'lucide-react';

// Define a minimal Subscription type for this file
interface Subscription {
  subscription_id: number;
  package_id: number;
  vendor_type_id: number;
  package_name_en?: string;
  package_name_ar?: string;

  package_name?: string;
  status: string;
  max_products: number;
  current_products?: number;
  days_left?: number;
  end_date?: string;
}

// Define SubscriptionPackage type
interface SubscriptionPackage {
  package_id: number;
  vendor_type_id: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  price_2weeks?: number;
  duration_months: number;
  features_en: string;
  features_ar: string;
  max_products: number;
  commission_rate: number;
  is_active: number;
  is_popular: number;
  created_at: string;
}

export default function VendorSubscriptionsPage() {
  const { t, locale } = useI18n();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [upgradeFields, setUpgradeFields] = useState({
    num_products: '',
  });
  const [preview, setPreview] = useState<{ price?: number; end_date?: string; error?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showUpgradePlan, setShowUpgradePlan] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [upgradePlanError, setUpgradePlanError] = useState<string | null>(null);
  const [upgradePlanLoading, setUpgradePlanLoading] = useState(false);
  const [vendorTypeId, setVendorTypeId] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<'2w' | '1m' | '3m' | '6m' | null>(null);

  // Get vendor type ID based on role
  const getVendorTypeId = (roleId: number) => {
    switch (roleId) {
      case 3: return 1; // Seller
      case 4: return 2; // Real Estate
      case 5: return 3; // Factory
      default: return 1;
    }
  };

  // Get user profile to determine vendor type
  const getUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        // Support both { role_id } and { user: { role_id } }
        const roleId = userData.role_id || (userData.user && userData.user.role_id) || (userData.user && userData.user.roleId);
        const userVendorTypeId = getVendorTypeId(roleId);
        setVendorTypeId(userVendorTypeId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Preview upgrade price and end date
  useEffect(() => {
    if (!showUpgrade || !selectedSub) return;
    const { num_products } = upgradeFields;
    if (!num_products) {
      setPreview(null);
      return;
    }
    // Call backend to preview (simulate upgrade)
    (async () => {
      try {
        const payload: Record<string, unknown> = {
          package_id: selectedSub.package_id,
          vendor_type_id: selectedSub.vendor_type_id,
          num_products: Number(num_products) || 0,
          payment_method: 'preview',
        };
        const resp = await subscribeToPackage(payload);
        setPreview({ price: resp.total_amount, end_date: resp.subscription?.end_date });
      } catch (e: unknown) {
        setPreview({ error: e instanceof Error ? e.message : String(e) });
      }
    })();
  }, [upgradeFields, showUpgrade, selectedSub]);

  // Fetch packages by vendor type when opening upgrade plan dialog or when vendorTypeId changes and dialog is open
  useEffect(() => {
    if (showUpgradePlan && vendorTypeId) {
      setAvailablePackages([]); // Clear before fetching
      setSelectedPackageId(null); // Reset selection
      setSelectedDuration(null); // Reset duration
      getSubscriptionPackagesByVendorType(vendorTypeId)
        .then(packages => {
          setAvailablePackages(packages);
        })
        .catch(error => {
          console.error('DEBUG: Error fetching packages for vendorTypeId', vendorTypeId, error);
          setAvailablePackages([]);
        });
    }
  }, [showUpgradePlan, vendorTypeId]);

  // Handle form input change
  const handleUpgradeFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpgradeFields(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Handle confirm upgrade
  const handleUpgradeConfirm = async () => {
    if (!selectedSub) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        package_id: selectedSub.package_id,
        vendor_type_id: selectedSub.vendor_type_id,
        num_products: Number(upgradeFields.num_products) || 0,
        payment_method: 'upgrade',
      };
      await subscribeToPackage(payload);
      setShowUpgrade(false);
      setUpgradeFields({ num_products: '' });
      setPreview(null);
      setSelectedSub(null);
      setLoading(true);
      // Refresh subscriptions
      const data = await getVendorSubscriptions();
      const subscriptions = Array.isArray(data) ? data : (data.data || []);
      interface Subscription {
        package_id: number;
        user_id: number;
        vendor_type_id: number;
        created_at: string;
        end_date?: string; // Optional, as it may not always be present
        max_products?: number | null; // Optional, as it may not always be present
        products_used?: number; // This will be populated in the backend
        days_left?: number | string; // This will be populated in the backend
        package_name_en?: string;
        package_name_ar?: string;
        vendor_type_name_en?: string;
        vendor_type_name_ar?: string;
        user_name?: string;
        user_email?: string;
      }

      const mappedSubs = subscriptions.map((sub: Subscription) => ({
        ...sub,
        current_products: sub.products_used ?? sub.products_used ?? 0,
      }));
      setSubs(mappedSubs);
      setLoading(false);
    } catch (e: unknown) {
      setPreview({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle confirm upgrade plan
  const handleUpgradePlanConfirm = async () => {
    if (!selectedPackageId || !selectedDuration) return;
    setUpgradePlanLoading(true);
    setUpgradePlanError(null);
    let duration_months = 1;
    let duration_weeks = undefined;
    switch (selectedDuration) {
      case '2w': duration_months = 0; duration_weeks = 2; break;
      case '1m': duration_months = 1; break;
      case '3m': duration_months = 3; break;
      case '6m': duration_months = 6; break;
    }
    try {
      await subscribeToPackage({
        package_id: selectedPackageId,
        vendor_type_id: subs[0]?.vendor_type_id,
        duration_months,
        duration_weeks,
        num_products: 1, // Default to 1 slot, can be improved
        payment_method: 'upgrade_plan',
        force_upgrade: true,
      });
      setShowUpgradePlan(false);
      setSelectedPackageId(null);
      setSelectedDuration(null);
      setLoading(true);
      const data = await getVendorSubscriptions();
      setSubs(Array.isArray(data) ? data : (data.data || []));
      setLoading(false);
    } catch (e: unknown) {
      setUpgradePlanError(e instanceof Error ? e.message : String(e));
    } finally {
      setUpgradePlanLoading(false);
    }
  };
  interface Subscriptiontype {
    package_id: number;
    vendor_type_id: number;
    user_id: number;
    created_at: string;
    products_used: number;
    max_products: number | null;
    end_date: string | null;
    days_left: number | string;
    package_name_en: string;
    package_name_ar: string;
    vendor_type_name_en: string;
    vendor_type_name_ar: string;
    user_name: string;
    user_email: string;
  }
  useEffect(() => {
    getVendorSubscriptions()
      .then(data => {
        const subscriptions = Array.isArray(data) ? data : (data.data || []);
        // Map products_used to current_products for UI
        const mappedSubs = subscriptions.map((sub: Subscriptiontype) => ({
          ...sub,
          current_products: sub.products_used ?? 0,
        }));
        setSubs(mappedSubs);
        setLoading(false);
      })
      .catch(() => {
        setError(t('subscriptions.errorLoading'));
        setLoading(false);
      });

    // Get user profile to determine vendor type

  }, [t, getUserProfile]);

  if (loading) return <div className="p-8 text-center text-gray-500">{t('subscriptions.loading')}</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  if (!subs.length) return <div className="p-8 text-center text-gray-500">{t('subscriptions.noSubscriptions')}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('subscriptions.mySubscriptions')}</h1>
      <button
        className="mb-4 px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition"
        onClick={() => setShowUpgradePlan(true)}
      >
        {t('subscriptions.upgradePlan')}
      </button>
      {subs.map(sub => {
        const isCancelled = !!(sub.status && sub.status.toLowerCase() === 'cancelled');
        return (
          <div
            key={sub.subscription_id}
            className={`bg-white rounded-xl shadow p-6 mb-6 border border-gray-200 relative transition-opacity${isCancelled ? ' opacity-60' : ''}`}
            style={isCancelled ? { filter: 'grayscale(1)', opacity: 0.6, pointerEvents: 'none' } : {}}
          >
            {isCancelled && (
              <span className="absolute top-4 right-4 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold shadow">{t('vendors.cancelled') || 'Cancelled'}</span>
            )}
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-lg font-bold text-blue-700">{sub.package_name_ar || sub.package_name}</div>
                <div className="text-sm text-gray-500">{t('subscriptions.status')}: {t(`vendorStatus.${sub.status}`)}</div>
              </div>
              {(sub.package_id >= 9 && sub.package_id <= 12) && (
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  onClick={() => { if (!isCancelled) { setSelectedSub(sub); setShowUpgrade(true); } }}
                  disabled={isCancelled}
                  style={isCancelled ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                >
                  {t('subscriptions.upgradeOrAdd')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-gray-500">{t('subscriptions.maxProducts')}</div>
                <div className="text-lg font-bold">{sub.max_products}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('subscriptions.productsUsed')}</div>
                <div className="text-lg font-bold">{sub.current_products || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('subscriptions.daysLeft')}</div>
                <div className="text-lg font-bold">{sub.days_left ?? '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t('subscriptions.endDate')}</div>
                <div className="text-lg font-bold">{sub.end_date ? new Date(sub.end_date).toLocaleDateString(locale) : '-'}</div>
              </div>
            </div>
          </div>
        );
      })}
      {/* Upgrade/Change Plan Dialog */}
      {showUpgrade && selectedSub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{t('subscriptions.upgradeOrAdd')}</h2>
            <p className="mb-4">{t('subscriptions.upgradeDialogText')}</p>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleUpgradeConfirm(); }}>
              <div>
                <label className="block text-sm font-medium mb-1">{t('subscriptions.addProducts')}</label>
                <input
                  type="number"
                  name="num_products"
                  min="1"
                  className="w-full border rounded px-3 py-2"
                  value={upgradeFields.num_products}
                  onChange={handleUpgradeFieldChange}
                  placeholder={t('subscriptions.addProductsPlaceholder')}
                  required
                />
              </div>
              {preview && (
                <div className="bg-gray-50 rounded p-3 mt-2">
                  {preview.error ? (
                    <div className="text-red-500">{preview.error}</div>
                  ) : (
                    <>
                      <div>{t('subscriptions.priceToPay')}: <span className="font-bold">{preview.price ?? '-'}</span></div>
                      <div>{t('subscriptions.newEndDate')}: <span className="font-bold">{preview.end_date ? new Date(preview.end_date).toLocaleDateString(locale) : '-'}</span></div>
                    </>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? t('common.loading') : t('subscriptions.confirmUpgrade')}
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                  onClick={() => { setShowUpgrade(false); setUpgradeFields({ num_products: '' }); setPreview(null); setSelectedSub(null); }}
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showUpgradePlan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{t('subscriptions.upgradePlan')}</h2>
              <button
                onClick={() => { setShowUpgradePlan(false); setSelectedPackageId(null); setUpgradePlanError(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    {t('subscriptions.upgradePlanWarning')}
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    {t('subscriptions.upgradePlanWarningText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Package Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('subscriptions.selectNewPackage')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePackages.map((pkg) => (
                  <div
                    key={pkg.package_id}
                    onClick={() => setSelectedPackageId(pkg.package_id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPackageId === pkg.package_id
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
                        {t('subscriptionPackages.maxProducts')}: {pkg.max_products}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {t('subscriptionPackages.commissionRate')}: {pkg.commission_rate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {upgradePlanError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{upgradePlanError}</p>
              </div>
            )}

            {/* Duration Selection */}
            <div className="mt-6 mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('subscriptions.selectDuration') || 'Select Duration'}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {/* Hide 2 weeks button if vendorTypeId is 1 or 3 */}
                {vendorTypeId !== 1 && vendorTypeId !== 3 && (
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-bold border transition ${selectedDuration === '2w' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'}`}
                    onClick={() => setSelectedDuration('2w')}
                  >
                    {t('subscriptions.duration2weeks') || '2 Weeks'}
                  </button>
                )}
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg font-bold border transition ${selectedDuration === '1m' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'}`}
                  onClick={() => setSelectedDuration('1m')}
                >
                  {t('subscriptions.duration1month') || '1 Month'}
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg font-bold border transition ${selectedDuration === '3m' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'}`}
                  onClick={() => setSelectedDuration('3m')}
                >
                  {t('subscriptions.duration3months') || '3 Months'}
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg font-bold border transition ${selectedDuration === '6m' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'}`}
                  onClick={() => setSelectedDuration('6m')}
                >
                  {t('subscriptions.duration6months') || '6 Months'}
                </button>
              </div>
            </div>
            {/* Show total amount after selecting package and duration */}
            {selectedPackageId && selectedDuration && (() => {
              const pkg = availablePackages.find(p => p.package_id === selectedPackageId);
              if (!pkg) return null;
              let total = 0;
              switch (selectedDuration) {
                case '2w':
                  total = pkg.price_2weeks ?? (pkg.price / 2);
                  break;
                case '1m':
                  total = pkg.price;
                  break;
                case '3m':
                  total = pkg.price * 3;
                  break;
                case '6m':
                  total = pkg.price * 6;
                  break;
              }
              return (
                <div className="mt-2 mb-4 text-lg font-bold text-blue-700">
                  {t('subscriptions.priceToPay')}: <span>{total} $</span>
                </div>
              );
            })()}

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpgradePlanConfirm}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
                disabled={!selectedPackageId || !selectedDuration || upgradePlanLoading}
              >
                {upgradePlanLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('subscriptions.confirmUpgradePlan')}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold"
                onClick={() => { setShowUpgradePlan(false); setSelectedPackageId(null); setUpgradePlanError(null); }}
                disabled={upgradePlanLoading}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 