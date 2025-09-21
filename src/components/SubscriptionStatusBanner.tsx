'use client';

import { useQuery } from '@tanstack/react-query';
import { getVendorSubscriptionStatus } from '@/services/vendor-api';
import { useI18n } from '@/contexts/I18nContext';
// Icons as SVG components
const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ExclamationCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InformationCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

interface SubscriptionStatus {
  hasSubscription: boolean;
  status: 'no_subscription' | 'expired' | 'active';
  message: string;
  productLimit: number;
  currentProducts: number;
  remainingProducts: number;
  warningLevel: 'none' | 'warning' | 'critical' | 'limit_reached';
  subscriptionDetails?: {
    package_name: string;
    end_date: string;
    max_products: number;
    status: string;
    payment_status: string;
  };
}

export default function SubscriptionStatusBanner() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const { data: subscriptionStatus, isLoading, error } = useQuery<SubscriptionStatus>({
    queryKey: ['vendor-subscription-status'],
    queryFn: getVendorSubscriptionStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !subscriptionStatus) {
    return null;
  }

  // Don't show banner if everything is fine
  if (subscriptionStatus.status === 'active' && subscriptionStatus.warningLevel === 'none') {
    return null;
  }

  const getBannerStyle = () => {
    if (subscriptionStatus.status === 'no_subscription') {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: XCircleIcon,
        iconColor: 'text-red-500'
      };
    }
    
    if (subscriptionStatus.status === 'expired') {
      return {
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        icon: ExclamationCircleIcon,
        iconColor: 'text-orange-500'
      };
    }

    if (subscriptionStatus.warningLevel === 'limit_reached') {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: XCircleIcon,
        iconColor: 'text-red-500'
      };
    }

    if (subscriptionStatus.warningLevel === 'critical') {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-red-500'
      };
    }

    if (subscriptionStatus.warningLevel === 'warning') {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-yellow-500'
      };
    }

    return {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-500'
    };
  };

  const getMessage = () => {
    if (subscriptionStatus.status === 'no_subscription') {
      return t('vendor.subscription.subscribeMessage');
    }
    
    if (subscriptionStatus.status === 'expired') {
      return t('vendor.subscription.renewMessage');
    }

    if (subscriptionStatus.warningLevel === 'limit_reached') {
      return t('vendor.subscription.limitReachedMessage');
    }

    if (subscriptionStatus.warningLevel === 'critical') {
      return t('vendor.subscription.criticalMessage');
    }

    if (subscriptionStatus.warningLevel === 'warning') {
      return t('vendor.subscription.warningMessage');
    }

    return subscriptionStatus.message;
  };

  const getTitle = () => {
    if (subscriptionStatus.status === 'no_subscription') {
      return t('vendor.subscription.noSubscription');
    }
    
    if (subscriptionStatus.status === 'expired') {
      return t('vendor.subscription.subscriptionExpired');
    }

    if (subscriptionStatus.warningLevel === 'limit_reached') {
      return t('vendor.subscription.productLimitReached');
    }

    if (subscriptionStatus.warningLevel === 'critical') {
      return t('vendor.subscription.critical');
    }

    if (subscriptionStatus.warningLevel === 'warning') {
      return t('vendor.subscription.warning');
    }

    return t('vendor.subscription.subscriptionActive');
  };

  const style = getBannerStyle();
  const Icon = style.icon;

  return (
    <div className={`${style.bgColor} border ${style.borderColor} rounded-lg p-4 mb-6`}>
      <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isRTL ? 'mr-3' : 'ml-3'}`}>
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
        </div>
        <div className={`flex-1 ${isRTL ? 'mr-3' : 'ml-3'}`}>
          <h3 className={`text-sm font-medium ${style.textColor}`}>
            {getTitle()}
          </h3>
          <div className={`mt-2 text-sm ${style.textColor}`}>
            <p>{getMessage()}</p>
            
            {subscriptionStatus.hasSubscription && subscriptionStatus.status === 'active' && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{subscriptionStatus.currentProducts}</div>
                  <div className="text-xs opacity-75">{t('vendor.subscription.currentProducts')}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{subscriptionStatus.productLimit}</div>
                  <div className="text-xs opacity-75">{t('vendor.subscription.productLimit')}</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${
                    subscriptionStatus.remainingProducts <= 0 ? 'text-red-600' : 
                    subscriptionStatus.remainingProducts <= Math.ceil(subscriptionStatus.productLimit * 0.2) ? 'text-red-600' :
                    subscriptionStatus.remainingProducts <= Math.ceil(subscriptionStatus.productLimit * 0.5) ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {subscriptionStatus.remainingProducts}
                  </div>
                  <div className="text-xs opacity-75">{t('vendor.subscription.productsRemaining')}</div>
                </div>
              </div>
            )}

            {subscriptionStatus.subscriptionDetails && (
              <div className="mt-3 text-xs opacity-75">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">{t('vendor.subscription.packageName')}:</span> {subscriptionStatus.subscriptionDetails.package_name}
                  </div>
                  <div>
                    <span className="font-medium">{t('vendor.subscription.endDate')}:</span> {new Date(subscriptionStatus.subscriptionDetails.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 