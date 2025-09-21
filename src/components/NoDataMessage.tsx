'use client';

import { useI18n } from '@/contexts/I18nContext';

interface NoDataMessageProps {
  type?: 'default' | 'category' | 'product' | 'customer' | 'revenue' | 'sales' | 'vendor' | 'realtime' | 'dashboard' | 'topProducts' | 'retention';
  customMessage?: string;
  className?: string;
}

export default function NoDataMessage({ 
  type = 'default', 
  customMessage, 
  className = '' 
}: NoDataMessageProps) {
  const { t } = useI18n();

  const getMessage = () => {
    if (customMessage) return customMessage;
    
    switch (type) {
      case 'category':
        return t('admin.noDataForCategory');
      case 'product':
        return t('admin.noProductPerformanceData');
      case 'customer':
        return t('admin.noDataForCustomer');
      case 'revenue':
        return t('admin.noDataForRevenue');
      case 'sales':
        return t('admin.noDataForSales');
      case 'vendor':
        return t('admin.noDataForVendor');
      case 'realtime':
        return t('admin.noDataForRealTime');
      case 'dashboard':
        return t('admin.noDataForDashboard');
      case 'topProducts':
        return t('admin.noDataForTopProducts');
      case 'retention':
        return t('admin.noDataForRetention');
      default:
        return t('admin.noDataMessage');
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 mb-4 text-gray-400">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {t('admin.noDataAvailable')}
      </h3>
      <p className="text-gray-500 max-w-md">
        {getMessage()}
      </p>
    </div>
  );
} 