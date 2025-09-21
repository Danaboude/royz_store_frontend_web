'use client';
import React, { useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { getVendorMonitoringStats } from '@/services/admin-api';
import * as XLSX from 'xlsx';

interface VendorMonitoring {
  user_id: number;
  vendor_name: string;
  total_sales: number;
  total_commission: number;
  net_amount: number;
  total_orders: number;
  average_rating?: number;
  total_reviews: number;
}

export default function VendorMonitoringPage() {
  const { t } = useI18n();
  const [vendors, setVendors] = useState<VendorMonitoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getVendorMonitoringStats({ page, limit: pageSize, search });
        setVendors(res.data || []);
        setTotal(res.total || 0);
      } catch (err: unknown) {
        setError((err as Error)?.message || 'Error fetching vendor performance');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page, search]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearch(searchInput);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Fetch all data for export (no pagination)
      const res = await getVendorMonitoringStats({ page: 1, limit: 0, search });
      const allVendors: VendorMonitoring[] = res.data || [];
      const data = allVendors.map((v: VendorMonitoring) => ({
        [t('table.vendorName')]: v.vendor_name,
        [t('table.totalSales')]: v.total_sales,
        [t('table.totalCommission')]: v.total_commission,
        [t('table.netAmount')]: v.net_amount,
        [t('orders')]: v.total_orders,
        [t('rating')]: typeof v.average_rating === 'number' && !isNaN(v.average_rating) ? v.average_rating.toFixed(2) : '-',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
      XLSX.writeFile(wb, 'vendor-monitoring.xlsx');
    } catch {
      setError('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t('vendors.monitoring')}</h1>
      <p className="mb-6 text-gray-700">{t('vendors.monitoringDescription')}</p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full md:w-64"
          placeholder={t('admin.searchUsersPlaceholder') || 'Search by name...'}
          value={searchInput}
          onChange={handleSearchInput}
          onKeyDown={handleSearchKeyDown}
        />
        <button
          className="bg-theme-main text-white px-4 py-2 rounded shadow hover:bg-theme-main-dark transition"
          onClick={handleExport}
        >
          {t('admin.exportExcel') || 'Export to Excel'}
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-main mr-2"></span>
          <span>{t('admin.loading')}</span>
        </div>
      ) : error ? (
        <div className="text-red-600 text-center py-4">{error}</div>
      ) : (
        <>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.vendorName')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.totalSales')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.totalCommission')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.netAmount')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.totalOrders')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.rating')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">{t('admin.noDataMessage')}</td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 text-center">{vendor.vendor_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">{vendor.total_sales?.toLocaleString()} ل.س</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">{vendor.total_commission?.toLocaleString()} ل.س</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">{vendor.net_amount?.toLocaleString()} ل.س</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">{vendor.total_orders?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">{
                      typeof vendor.average_rating === 'number' && !isNaN(vendor.average_rating) && vendor.total_reviews > 0
                        ? `${vendor.average_rating.toFixed(2)} (${vendor.total_reviews})`
                        : '-'
                    }</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('table.previous') || 'Prev'}
            </button>
            <span>{page} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              {t('table.next') || 'Next'}
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
