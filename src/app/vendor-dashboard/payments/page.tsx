"use client";
import React, { useState, useEffect } from "react";
import { useI18n } from '@/contexts/I18nContext';
import { getVendorPayments } from '@/services/vendor-api';
import * as XLSX from "xlsx";

interface VendorPayment {
  payment_id: number;
  order_id: number;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  payment_status: string;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

const PAGE_SIZE = 8;

export default function VendorPaymentsPage() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [summary, setSummary] = useState<{ totalAmount: number; totalCommission: number; totalNet: number }>({ totalAmount: 0, totalCommission: 0, totalNet: 0 });

  useEffect(() => {
    setLoading(true);
    setError(null);
    getVendorPayments({ page, limit: PAGE_SIZE, search, status: statusFilter !== "all" ? statusFilter : undefined })
      .then((res) => {
        setPayments(res.data);
        setTotal(res.pagination?.total || 0);
        // Calculate summary stats
        let totalAmount = 0, totalCommission = 0, totalNet = 0;
        res.data.forEach((p: VendorPayment) => {
          totalAmount += Number(p.amount);
          totalCommission += Number(p.commission_amount);
          totalNet += Number(p.net_amount);
        });
        setSummary({ totalAmount, totalCommission, totalNet });
      })
      .catch((err) => {
        setError(err.message || t("payments.errorLoading"));
      })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, t]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const columns = [
    { key: "payment_id", label: "#" },
    { key: "order_id", label: t("payments.order") },
    { key: "amount", label: t("payments.amount") },
    { key: "commission_rate", label: t("subscriptionPackages.commissionRate") },
    { key: "commission_amount", label: t("payments.commission") },
    { key: "net_amount", label: t("payments.net") },
    { key: "payment_status", label: t("payments.status") },
    { key: "payment_date", label: t("payments.date") },
    { key: "payment_method", label: t("common.paymentMethod") },
  ];

  function exportToExcel() {
    const wsData = [columns.map(col => col.label), ...payments.map(row => columns.map(col => row[col.key as keyof VendorPayment]?.toString() || ''))];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "vendor_payments.xlsx");
  }

  function renderPagination() {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center gap-2 mt-4">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          {t("table.previous")}
        </button>
        <span className="px-2">{` ${page} / ${totalPages}`}</span>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          {t("table.next")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('vendor.payments') || 'Payments'}</h1>
      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="bg-blue-50 rounded p-3 min-w-[160px]">
          <div className="text-xs text-gray-500">{t('payments.totalAmount')}</div>
          <div className="font-bold text-lg">{summary.totalAmount.toLocaleString()} ل.س</div>
        </div>
        <div className="bg-green-50 rounded p-3 min-w-[160px]">
          <div className="text-xs text-gray-500">{t('payments.totalCommission')}</div>
          <div className="font-bold text-lg">{summary.totalCommission.toLocaleString()} ل.س</div>
        </div>
        <div className="bg-yellow-50 rounded p-3 min-w-[160px]">
          <div className="text-xs text-gray-500">{t('payments.totalNet')}</div>
          <div className="font-bold text-lg">{summary.totalNet.toLocaleString()} ل.س</div>
        </div>
      </div>
      {/* Controls: Search, Filter, Export */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          className="border px-2 py-1 rounded w-64"
          placeholder={t('payments.searchPlaceholder')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') setSearch(input); }}
        />
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => setSearch(input)}
        >
          {t('homepage.search')}
        </button>
        <select
          className="border px-2 py-1 rounded"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">{t('payments.allPayments')}</option>
          <option value="paid">{t('admin.paidPayments') || 'Paid'}</option>
          <option value="pending">{t('admin.pendingPayments') || 'Pending'}</option>
          <option value="cancelled">{ t('admin.cancel') || 'Cancelled'}</option>
        </select>
        <button
          className="px-3 py-1 bg-green-600 text-white rounded"
          onClick={exportToExcel}
        >
          {t('payments.exportExcel')}
        </button>
      </div>
      {loading ? (
                    <div className="py-8 text-left">{t('banners.loading')}</div>
      ) : error ? (
                  <div className="text-red-500 text-left py-8">{error}</div>
      ) : payments.length === 0 ? (
                  <div className="py-8 text-left text-gray-500">{t('payments.noPaymentsFound')}</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((row) => (
                <tr key={row.payment_id} className="hover:bg-gray-50 transition-all">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {row[col.key as keyof VendorPayment]?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {renderPagination()}
    </div>
  );
} 