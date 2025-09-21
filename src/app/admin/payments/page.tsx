"use client";
import React, { useState, useEffect } from "react";
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from "framer-motion";
import { 
  getOrderPayments, 
  getSubscriptionPayments, 
  getVendorPayments,
  updateVendorPaymentStatus,
  type VendorPayment 
} from '@/services/admin-api';
import { activateSubscriptionPayment } from '@/services/vendor-api';
import * as XLSX from "xlsx";
import "jspdf-autotable";
import '/public/fonts/Tajawal-Regular-normal.js';
import '/public/fonts/Tajawal-Bold-normal.js';
// import { CurrencyDollarIcon, ListBulletIcon, UsersIcon } from '@heroicons/react/24/outline';

type OrderPayment = {
  payment_id: number;
  order_id: number;
  customer_id: number;
  amount: number;
  method: string;
  status: string;
  processed_at: string;
  commission_amount?: number;
};

type SubscriptionPayment = {
  payment_id: number;
  vendor_name: string;
  package_name: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  commission_amount?: number;
};

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

interface PaymentsTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  error: unknown;
  emptyText: string;
}

function PaymentsTable<T>({ columns, data, loading, error, emptyText, motionRows }: PaymentsTableProps<T> & { motionRows?: boolean }) {
  const { t } = useI18n();
  const safeData = Array.isArray(data) ? data : [];
  if (loading) return <div className="py-8 text-center">{t("payments.loading")}</div>;
  if (error) return <div className="text-red-500 text-center py-8">{typeof error === 'string' ? error : t("payments.errorLoading")}</div>;
  if (!safeData || safeData.length === 0) return <div className="py-8 text-center text-gray-500">{emptyText}</div>;
  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key as string} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <AnimatePresence initial={false}>
            {safeData.map((row, idx) =>
              motionRows ? (
                <motion.tr
                  key={(row as { payment_id?: number }).payment_id ?? idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className="hover:bg-gray-50 transition-all"
                >
                  {columns.map((col) => (
                    <td key={col.key as string} className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {col.render ? col.render(row) : row[col.key as keyof T] as React.ReactNode}
                    </td>
                  ))}
                </motion.tr>
              ) : (
                <tr key={(row as { payment_id?: number }).payment_id ?? idx} className="hover:bg-gray-50 transition-all">
                  {columns.map((col) => (
                    <td key={col.key as string} className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {col.render ? col.render(row) : row[col.key as keyof T] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              )
            )}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

function exportToExcel<T>(data: T[], columns: Column<T>[], filename: string) {
  const wsData = [columns.map(col => col.label), ...data.map(row => columns.map(col => col.render ? col.render(row) : (row as Record<string, unknown>)[col.key as string]))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}

const PAGE_SIZE = 8;

export default function AdminPaymentsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"order" | "subscription" | "vendor">("order");

  // Order Payments state
  const [orderPage, setOrderPage] = useState<number>(1);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);
  const [orderLoading, setOrderLoading] = useState<boolean>(false);
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderInput, setOrderInput] = useState<string>('');

  // Subscription Payments state
  const [subscriptionPage, setSubscriptionPage] = useState<number>(1);
  const [subscriptionTotal, setSubscriptionTotal] = useState<number>(0);
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPayment[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(false);
  const [subscriptionSearch, setSubscriptionSearch] = useState<string>('');
  const [subscriptionInput, setSubscriptionInput] = useState<string>('');
  const [subscriptionRefresh, setSubscriptionRefresh] = useState(0);

  // Vendor Payments state
  const [vendorPage, setVendorPage] = useState<number>(1);
  const [vendorTotal, setVendorTotal] = useState<number>(0);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [vendorLoading, setVendorLoading] = useState<boolean>(false);
  const [vendorSearch, setVendorSearch] = useState<string>('');
  const [vendorInput, setVendorInput] = useState<string>('');
  const [vendorRefresh, setVendorRefresh] = useState(0); // NEW

  // Fetch order payments when page or search changes
  useEffect(() => {
    setOrderLoading(true);
    getOrderPayments({ page: orderPage, limit: PAGE_SIZE, search: orderSearch })
      .then(({ payments, total }) => {
        setOrderPayments(payments);
        setOrderTotal(total);
      })
      .finally(() => setOrderLoading(false));
  }, [orderPage, orderSearch]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch]);

  // Fetch subscription payments
  useEffect(() => {
    setSubscriptionLoading(true);
    getSubscriptionPayments({ page: subscriptionPage, limit: PAGE_SIZE, search: subscriptionSearch })
      .then(({ payments, total }) => {
        setSubscriptionPayments(payments);
        setSubscriptionTotal(total);
      })
      .finally(() => setSubscriptionLoading(false));
  }, [subscriptionPage, subscriptionSearch, subscriptionRefresh]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setSubscriptionPage(1);
  }, [subscriptionSearch, subscriptionRefresh]);

  // Fetch vendor payments
  useEffect(() => {
    setVendorLoading(true);
    getVendorPayments({ page: vendorPage, limit: PAGE_SIZE, search: vendorSearch })
      .then(({ payments, total }) => {
        setVendorPayments(payments);
        setVendorTotal(total);
      })
      .finally(() => setVendorLoading(false));
  }, [vendorPage, vendorSearch, vendorRefresh]); // ADD vendorRefresh

  // Reset to page 1 when search changes
  useEffect(() => {
    setVendorPage(1);
  }, [vendorSearch]);

  // Pagination controls for Order Payments
  function renderOrderPagination() {
    const totalPages = Math.max(1, Math.ceil(orderTotal / PAGE_SIZE));
    return (
      <div className="flex items-center gap-2 mt-2">
        <button disabled={orderPage === 1} onClick={() => setOrderPage(orderPage - 1)} className="px-2 py-1 border rounded disabled:opacity-50">&lt;</button>
        <span>{orderPage} / {totalPages}</span>
        <button disabled={orderPage === totalPages} onClick={() => setOrderPage(orderPage + 1)} className="px-2 py-1 border rounded disabled:opacity-50">&gt;</button>
      </div>
    );
  }

  // Pagination controls for Subscription Payments
  function renderSubscriptionPagination() {
    const totalPages = Math.max(1, Math.ceil(subscriptionTotal / PAGE_SIZE));
    return (
      <div className="flex items-center gap-2 mt-2">
        <button disabled={subscriptionPage === 1} onClick={() => setSubscriptionPage(subscriptionPage - 1)} className="px-2 py-1 border rounded disabled:opacity-50">&lt;</button>
        <span>{subscriptionPage} / {totalPages}</span>
        <button disabled={subscriptionPage === totalPages} onClick={() => setSubscriptionPage(subscriptionPage + 1)} className="px-2 py-1 border rounded disabled:opacity-50">&gt;</button>
      </div>
    );
  }

  // Pagination controls for Vendor Payments
  function renderVendorPagination() {
    const totalPages = Math.max(1, Math.ceil(vendorTotal / PAGE_SIZE));
    return (
      <div className="flex items-center gap-2 mt-2">
        <button disabled={vendorPage === 1} onClick={() => setVendorPage(vendorPage - 1)} className="px-2 py-1 border rounded disabled:opacity-50">&lt;</button>
        <span>{vendorPage} / {totalPages}</span>
        <button disabled={vendorPage === totalPages} onClick={() => setVendorPage(vendorPage + 1)} className="px-2 py-1 border rounded disabled:opacity-50">&gt;</button>
      </div>
    );
  }

  // Function to update vendor payment status
  const updatePaymentStatus = async (paymentId: number, status: string) => {
    try {
      await updateVendorPaymentStatus(
        paymentId, 
        status, 
        new Date().toISOString(), 
        'bank_transfer'
      );
      setVendorRefresh(r => r + 1); // TRIGGER REFRESH
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  // Table columns for each payment type
  const orderColumns: Column<OrderPayment>[] = [
    { key: "payment_id", label: "#" },
    { key: "order_id", label: t("payments.order") },
    { key: "customer_id", label: t("payments.customer") },
    { key: "amount", label: t("payments.amount") },
    { key: "method", label: t("payments.method") },
    { key: "status", label: t("payments.status") },
    { key: "processed_at", label: t("payments.date") },
  ];
  const [activateLoading, setActivateLoading] = useState<number | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);

  const handleActivateSubscription = async (paymentId: number) => {
    setActivateLoading(paymentId);
    setActivateError(null);
    try {
      await activateSubscriptionPayment(paymentId);
      // Force immediate refresh without delay
      setSubscriptionRefresh(r => r + 1);
    } catch (err) {
      setActivateError('Activation failed. Please try again.'+err);
    } finally {
      setActivateLoading(null);
    }
  };

  const subscriptionColumns: Column<SubscriptionPayment>[] = [
    { key: "payment_id", label: "#" },
    { key: "vendor_name", label: t("payments.vendor") },
    { key: "package_name", label: t("payments.package") },
    { key: "amount", label: t("payments.amount") },
    { key: "payment_method", label: t("payments.method") },
    { key: "payment_status", label: t("payments.status") },
    { key: "payment_date", label: t("payments.date") },
    {
      key: "actions",
      label: t("payments.actions"),
      render: (row) => {
        if (row.payment_status !== 'completed') {
          return (
            <>
              <button
                onClick={() => handleActivateSubscription(row.payment_id)}
                className={`bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 ${activateLoading === row.payment_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={activateLoading === row.payment_id}
              >
                {activateLoading === row.payment_id ? t("payments.loading") : t("payments.markPaid")}
              </button>
              {activateError && activateLoading === row.payment_id && (
                <div className="text-red-500 text-xs mt-1">{activateError}</div>
              )}
            </>
          );
        }
        return <span className="text-gray-400 text-sm">{t("payments.noActions")}</span>;
      }
    }
  ];
  const vendorColumns: Column<VendorPayment>[] = [
    { key: "vendor_name", label: t("payments.vendor") },
    { key: "order_id", label: t("payments.order") },
    { key: "amount", label: t("payments.amount") },
    {
      key: "commission_amount", 
      label: t("payments.commission"),
      render: (row) => `${row.commission_amount} ل.س (${row.commission_rate}%)`
    },
    { key: "commission_rate", label: t("payments.commission") + " (" + t("payments.amount") + ")" },
    { key: "net_amount", label: t("payments.net") },
    { key: "payment_status", label: t("payments.status") },
    { key: "payment_date", label: t("payments.date") },
    {
      key: "actions",
      label: t("payments.actions"),
      render: (row) => {
        if (row.payment_status === 'pending') {
          return (
            <div className="flex gap-1 justify-center">
              <button
                onClick={() => updatePaymentStatus(row.payment_id, 'paid')}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
              >
                {t("payments.markPaid")}
              </button>
              <button
                onClick={() => updatePaymentStatus(row.payment_id, 'cancelled')}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
              >
                {t("payments.cancel")}
              </button>
            </div>
          );
        }
        return <span className="text-gray-400 text-sm">{t("payments.noActions")}</span>;
      }
    },
  ];

  // --- Helper: Calculate summary statistics for each tab ---



  return (
    <motion.div
      className="w-full min-h-screen py-8 px-2 sm:px-6 md:px-12"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h1 className="text-2xl font-bold mb-6">{t('admin.payments')}</h1>
      {/* Export All Buttons */}
      <div className="flex gap-2 mb-4">
        {tab === 'order' && (
          <>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 transition"
              onClick={async () => {
                const { payments } = await getOrderPayments({ page: 1, limit: 1000000, search: orderSearch });
                exportToExcel(
                  Array.isArray(payments) ? payments as OrderPayment[] : (payments as OrderPayment[]),
                  orderColumns,
                  'payments-order.xlsx'
                );
              }}
            >
              {t('payments.exportExcel')}
            </button>
        
          </>
        )}
        {tab === 'subscription' && (
          <>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 transition"
              onClick={async () => {
                const { payments } = await getSubscriptionPayments({ page: 1, limit: 100000, search: subscriptionSearch });
                exportToExcel(
                  Array.isArray(payments) ? payments as SubscriptionPayment[] : (payments as SubscriptionPayment[]),
                  subscriptionColumns,
                  'payments-subscription.xlsx'
                );
              }}
            >
              {t('payments.exportExcel')}
            </button>
           
          </>
        )}
        {tab === 'vendor' && (
          <>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 transition"
              onClick={async () => {
                const { payments } = await getVendorPayments({ page: 1, limit: 100000, search: vendorSearch });
                exportToExcel(
                  Array.isArray(payments) ? payments as VendorPayment[] : (payments as VendorPayment[]),
                  vendorColumns,
                  'payments-vendor.xlsx'
                );
              }}
            >
              {t('payments.exportExcel')}
            </button>
        
          </>
        )}
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          className={`px-4 py-2 rounded-t-lg font-medium transition-all ${tab === "order" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          onClick={() => setTab("order")}
        >
          {t('admin.orderPayments')}
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-medium transition-all ${tab === "subscription" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          onClick={() => setTab("subscription")}
        >
          {t('admin.subscriptionPayments')}
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-medium transition-all ${tab === "vendor" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          onClick={() => setTab("vendor")}
        >
          {t('admin.vendorPayments')}
        </button>
      </div>
      <div className="bg-white rounded-b-lg shadow-lg p-4 w-full overflow-x-auto">
        <AnimatePresence mode="wait">
          {tab === "order" && (
            <motion.div
              key="order"
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
           
              {/* Search and Pagination Controls */}
              <div className="flex items-end gap-4 mb-4">
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-40"
                    placeholder={t('payments.search')}
                    value={orderInput}
                    onChange={e => setOrderInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') setOrderSearch(orderInput);
                    }}
                  />
              
              </div>
              {/* Table */}
              <PaymentsTable<OrderPayment>
                columns={orderColumns}
                data={orderPayments}
                loading={orderLoading}
                error={null}
                emptyText={t("payments.noPaymentsFound")}
                motionRows
              />
              {/* Pagination Controls */}
              {renderOrderPagination()}
            </motion.div>
          )}
          {tab === "subscription" && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
           
              {/* Search and Pagination Controls */}
              <div className="flex items-end gap-4 mb-4">
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-40"
                    placeholder={t('payments.search')}
                    value={subscriptionInput}
                    onChange={e => setSubscriptionInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') setSubscriptionSearch(subscriptionInput); }}
                  />
              </div>
              {/* Table */}
              <PaymentsTable<SubscriptionPayment>
                columns={subscriptionColumns}
                data={Array.isArray(subscriptionPayments) ? subscriptionPayments : (subscriptionPayments as SubscriptionPayment[])}
                loading={subscriptionLoading}
                error={null}
                emptyText={t("payments.noPaymentsFound")}
                motionRows
              />
              {/* Pagination Controls */}
              {renderSubscriptionPagination()}
            </motion.div>
          )}
          {tab === "vendor" && (
            <motion.div
              key="vendor"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -32 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
           
              {/* Search and Pagination Controls */}
              <div className="flex items-end gap-4 mb-4">
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-40"
                    placeholder={t('payments.search')}
                    value={vendorInput}
                    onChange={e => setVendorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') setVendorSearch(vendorInput); }}
                  />
              </div>
              {/* Table */}
              <PaymentsTable<VendorPayment>
                columns={vendorColumns}
                data={Array.isArray(vendorPayments) ? vendorPayments : (vendorPayments as VendorPayment[])}
                loading={vendorLoading}
                error={null}
                emptyText={t("payments.noPaymentsFound")}
                motionRows
              />
              {/* Pagination Controls */}
              {renderVendorPagination()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 