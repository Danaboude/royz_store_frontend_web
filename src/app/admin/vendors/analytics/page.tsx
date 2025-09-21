'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/contexts/I18nContext';
import { 
  getVendorAnalytics, 
  getVendorAnalyticsById,
  type VendorAnalytics,
  type VendorAnalyticsResponse,
  type VendorDetailAnalytics
} from '@/services/admin-api';
import { formatPrice } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Calendar,
  Phone,
  Mail,
  Building,
  Activity
} from 'lucide-react';

export default function VendorAnalyticsPage() {
  const { t } = useI18n();
  const [selectedVendor, setSelectedVendor] = useState<VendorAnalytics | null>(null);

  const { data: analytics, isLoading, error } = useQuery<VendorAnalyticsResponse>({
    queryKey: ['vendor-analytics'],
    queryFn: getVendorAnalytics,
  });

  const { data: vendorDetail } = useQuery<VendorDetailAnalytics>({
    queryKey: ['vendor-analytics', selectedVendor?.user_id],
    queryFn: () => getVendorAnalyticsById(selectedVendor!.user_id),
    enabled: !!selectedVendor,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading vendor analytics</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No vendor analytics data available</p>
        </div>
      </div>
    );
  }

  const totalVendors = analytics.vendors.length;
  const totalRevenue = analytics.vendors.reduce((sum, v) => sum + v.total_revenue, 0);
  const totalCommission = analytics.vendors.reduce((sum, v) => sum + v.total_commission, 0);
  const totalOrders = analytics.vendors.reduce((sum, v) => sum + v.total_orders, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
          <p className="text-gray-600">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.totalVendors')}</p>
              <p className="text-2xl font-bold text-gray-900">{totalVendors}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.totalRevenue')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.totalCommission')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalCommission)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.totalOrders')}</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <Package className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Performance Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.topVendors')}</h3>
          <div className="space-y-3">
            {analytics.topVendors.slice(0, 5).map((vendor, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{vendor.vendor_name}</p>
                  <p className="text-sm text-gray-600">{vendor.total_orders} {t('admin.orders')}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatPrice(vendor.total_revenue)}</p>
                  <p className="text-sm text-gray-600">{t('admin.avgOrderValue')}: {formatPrice(vendor.avg_order_value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.commissionByType')}</h3>
          <div className="space-y-3">
            {analytics.commissionAnalytics.map((type, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{type.vendor_type}</p>
                  <p className="text-sm text-gray-600">{type.vendor_count} {t('admin.vendorCount')}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatPrice(type.total_commission)}</p>
                  <p className="text-sm text-gray-600">{type.avg_commission_rate}% {t('admin.avgCommissionRate')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Over Time */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.performanceOverTime30Days')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.date')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.orders')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.revenue')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.activeVendors')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.performanceData.slice(0, 10).map((day, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{day.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{day.orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatPrice(day.revenue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{day.active_vendors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.allVendors')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.vendor')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.type')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.revenue')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.orders')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.commission')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.status')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(analytics.vendors.filter((vendor, idx, arr) =>
                arr.findIndex(v => v.user_id === vendor.user_id && v.vendor_email === vendor.vendor_email) === idx
              )).map((vendor, idx) => (
                <tr key={`${vendor.user_id}-${vendor.vendor_email}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendor.vendor_name}</div>
                        <div className="text-sm text-gray-500">{vendor.vendor_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{vendor.vendor_type}</div>
                    <div className="text-sm text-gray-500">{vendor.commission_rate}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatPrice(vendor.total_revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {vendor.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {formatPrice(vendor.total_commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      vendor.subscription_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t(`delivery.status.${vendor.subscription_status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <button
                      onClick={() => setSelectedVendor(vendor)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {t('admin.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && vendorDetail && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedVendor.vendor_name}</h3>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Vendor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{selectedVendor.vendor_email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{selectedVendor.vendor_phone}</span>
                </div>
                <div className="flex items-center">
                  <Building className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{selectedVendor.vendor_type}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Package className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{selectedVendor.package_name}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{t('admin.joined')}: {new Date(selectedVendor.registration_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{selectedVendor.total_products} {t('admin.products')}</span>
                </div>
              </div>
            </div>

            {/* Monthly Performance */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">{t('admin.monthlyPerformance')}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.month')}</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.orders')}</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.revenue')}</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.commission')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendorDetail.monthlyPerformance.map((month, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{month.month}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{month.orders}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{formatPrice(month.revenue)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{formatPrice(month.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">{t('admin.topProducts')}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        {t('admin.product')}
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        {t('admin.price')}
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        {t('admin.timesOrdered')}
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        {t('admin.revenue')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendorDetail.topProducts.map((product) => (
                      <tr key={product.product_id}>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{product.product_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{formatPrice(product.price)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{product.times_ordered}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{formatPrice(product.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 