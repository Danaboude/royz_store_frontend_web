'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { BarChart2, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { getVendorAnalyticsById } from '@/services/vendor-api';

interface VendorAnalytics {
  vendor: {
    vendor_name: string;
    vendor_email: string;
    vendor_phone: string;
    vendor_type: string;
    commission_rate: number;
    total_products: number;
    total_orders: number;
    total_revenue: number;
    total_commission: number;
    total_net: number;
    paid_payments: number;
    pending_payments: number;
    cancelled_payments: number;
    subscription_status: string;
    subscription_end: string;
    package_name: string;
    package_price: number;
    registration_date: string;
  };
  monthlyPerformance: Array<{
    month: string;
    orders: number;
    revenue: number;
    commission: number;
  }>;
  topProducts: Array<{
    product_id: number;
    product_name: string;
    price: number;
    times_ordered: number;
    total_revenue: number;
  }>;
}

export default function VendorDashboardHome() {
  const { t, locale } = useI18n();
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [vendorIds, setVendorIds] = useState<number | null>(null);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    let vendorId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      vendorId = payload.id;
      setVendorIds(payload.id);
      if (![3, 4, 5].includes(payload.roleId)) {
        router.push('/unauthorized');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }
    getVendorAnalyticsById(vendorId)
      .then((data) => {
        setAnalytics(data);
        // Debug: print the full analytics object to the console
      })
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-lg text-gray-600">{t('admin.loading')}</div>;
  }
  if (error || !analytics) {
    return <div className="flex items-center justify-center h-64 text-lg text-red-500">{error || 'Error loading analytics'}</div>;
  }
  const { vendor, monthlyPerformance, topProducts } = analytics;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{vendor.vendor_name}</h1>
        <p className="mt-2 text-gray-600">{vendor.vendor_email} | {vendor.vendor_phone}</p>
        <p className="mt-2 text-gray-600">{t('vendor.id')}{ vendorIds}</p>

        <p className="mt-1 text-gray-500">{t('vendor.myProducts')}: {vendor.total_products} | {t('vendor.myOrders')}: {vendor.total_orders}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <DollarSign className="w-8 h-8 text-green-500 mb-2" />
          <div className="text-sm text-gray-600">{t('admin.totalRevenue')}</div>
          <div className="text-2xl font-bold text-gray-900">{vendor.total_revenue?.toLocaleString(locale)} ل.س</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <ShoppingCart className="w-8 h-8 text-cyan-500 mb-2" />
          <div className="text-sm text-gray-600">{t('admin.totalOrders')}</div>
          <div className="text-2xl font-bold text-gray-900">{vendor.total_orders?.toLocaleString(locale)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <Package className="w-8 h-8 text-orange-500 mb-2" />
          <div className="text-sm text-gray-600">{t('admin.totalProducts')}</div>
          <div className="text-2xl font-bold text-gray-900">{vendor.total_products?.toLocaleString(locale)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <BarChart2 className="w-8 h-8 text-blue-500 mb-2" />
          <div className="text-sm text-gray-600">{t('admin.totalCommission')}</div>
          <div className="text-2xl font-bold text-gray-900">{vendor.total_commission?.toLocaleString(locale)} ل.س</div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('admin.monthRevenue')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{t('admin.monthRevenue')}</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{t('admin.totalOrders')}</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{t('admin.totalCommission')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyPerformance.map((mp) => (
                <tr key={mp.month}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{mp.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{mp.orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{mp.commission?.toLocaleString(locale)} ل.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('vendor.myProducts')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{t('admin.product')}</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{t('admin.totalOrders')}</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{t('admin.revenue')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((prod) => (
                <tr key={prod.product_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{prod.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{prod.times_ordered}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{prod.total_revenue?.toLocaleString(locale)} ل.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 