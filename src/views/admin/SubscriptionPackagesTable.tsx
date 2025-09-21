"use client";

import { Edit, Trash2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export interface SubscriptionPackage {
  package_id: number;
  vendor_type_id: number;
  vendor_type_name_en?: string;
  vendor_type_name_ar?: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  duration_months: number;
  features_en?: string;
  features_ar?: string;
  max_products?: number;
  commission_rate?: number;
  is_active: boolean;
  is_popular: boolean;
  created_at?: string;
}

interface SubscriptionPackagesTableProps {
  packages: SubscriptionPackage[];
  onEdit: (pkg: SubscriptionPackage, details?: boolean) => void;
  onDelete: (packageId: number) => void;
}

export default function SubscriptionPackagesTable({ packages, onEdit, onDelete }: SubscriptionPackagesTableProps) {
  const { locale, t } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('subscriptionPackages.name')}</th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('subscriptionPackages.description')}</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subscriptionPackages.price')}</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subscriptionPackages.duration')}</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('subscriptionPackages.status')}</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {packages.map((pkg, idx) => (
              <tr key={pkg.package_id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-center">{idx + 1}</td>
                <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? pkg.name_ar : pkg.name_en}</td>
                <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? (pkg.description_ar || t('subscriptionPackages.noDescription')) : (pkg.description_en || t('subscriptionPackages.noDescription'))}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{pkg.price}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{pkg.duration_months}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {pkg.is_active ? t('subscriptionPackages.active') : t('subscriptionPackages.inactive')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button
                    onClick={() => onEdit(pkg, false)}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                    title={t('admin.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
              
                  <button
                    onClick={() => onDelete(pkg.package_id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title={t('admin.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {packages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t('subscriptionPackages.noPackagesFound')}
        </div>
      )}
    </div>
  );
} 