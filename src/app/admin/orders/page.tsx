'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminOrders, updateOrderStatus, getAdminOrderById, updateOrderDetails, getDeliveryZones } from '@/services/admin-api';
import { useI18n } from '@/contexts/I18nContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import NoDataMessage from '@/components/NoDataMessage';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '/public/fonts/Tajawal-Regular-normal.js';
import '/public/fonts/Tajawal-Bold-normal.js';

interface Order {
  order_id: number;
  customer_id: number;
  total: string;
  status: string;
  address_id: number;
  payment_id: number | null;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  delivery_zone_id?: number;
  payment_status: string | null;
  placed_at: string;
  payment_method: string;
  delivery_status: string;
  delivery_progress: number;
  delivery_notes?: string;
}

// Add a type for order with items
interface OrderItem {
  product_id: number;
  product_name: string;
  product_price: number;
  vendor_id: number;
  vendor_name: string;
  qty?: number;
  quantity?: number;
  delivery_status?: string;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const ORDERS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderWithItems | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch orders with server-side pagination and search
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', currentPage, searchTerm],
    queryFn: () => getAdminOrders({ page: currentPage, limit: ORDERS_PER_PAGE, search: searchTerm }),
  });
  const orders = data?.data || [];
  // Ensure default total is 0 only when data is missing
  const total = data?.total ?? 0; // difference: `??` not `||`
  const totalorders = data?.totalorders ?? 0; // difference: `??` not `||`

  const totalPages = total;
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      setSelectedOrder(null);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Error updating order status';
      toast.error(errorMessage);
    },
  });
type OrderData = {
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  address_id?: number | null;
  delivery_zone_id?: number | null;
  notes?: string;
};


  // Update order details mutation
  const updateOrderDetailsMutation = useMutation({
    mutationFn: ({ id, orderData }: { id: number; orderData: OrderData }) => {
      return updateOrderDetails(id, orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(t('admin.orderUpdatedSuccess'));
      setShowEditModal(false);
      setEditingOrder(null);
    },
    onError: (error: unknown) => {
      console.error('❌ [DEBUG] Frontend updateOrderDetails error:', error);
      toast.error(t('admin.orderUpdateError'));
    },
  });

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    // Fetch full order details (with items)
    try {
      const response = await getAdminOrderById(order.order_id);
      setOrderDetails(response.data);
    } catch {
      setOrderDetails(null);
    }
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = (newStatus: string) => {
    if (selectedOrder) {
      updateStatusMutation.mutate({ id: selectedOrder.order_id, status: newStatus });
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Export all orders to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await getAdminOrders({ page: 1, limit: 0, search: searchTerm });
      const allOrders: Order[] = res.data || [];
      const data = allOrders.map((order: Order) => ({
        [t('admin.orderId')]: order.order_id,
        [t('admin.customer')]: order.customer_name,
        [t('admin.totalAmount')]: order.total,
        [t('admin.status')]: order.status,
        [t('admin.date')]: order.placed_at,
        [t('admin.paymentMethod')]: order.payment_method,
        [t('admin.deliveryStatus')]: order.delivery_status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      XLSX.writeFile(wb, 'orders.xlsx');
    } catch {
      toast.error('Failed to export orders');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading orders</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.ordersManagement')}</h1>
        <p className="text-gray-600">{t('admin.ordersManagementDesc')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.searchOrders')}
            </label>
            <input
              type="text"
              placeholder={t('admin.searchOrdersPlaceholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearchTerm(inputValue);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            className="bg-theme-main text-white px-4 py-2 rounded shadow hover:bg-theme-main-dark transition min-w-[140px] flex items-center justify-center"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <span className="flex items-center"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>{t('admin.exporting') || 'Exporting...'}</span>
            ) : (
              t('admin.exportExcel') || 'Export to Excel'
            )}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!Array.isArray(orders) ? (
          <div className="p-6 text-center">
            <div className="text-gray-500 mb-2">Unexpected data format received</div>
            <div className="text-sm text-gray-400">Orders data: {JSON.stringify(orders, null, 2)}</div>
          </div>
        ) : orders.length === 0 ? (
          <NoDataMessage type="default" customMessage={t('admin.noOrdersFound')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.orderId')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.customer')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.totalAmount')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.status')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.date')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-center' : 'text-left'}`}>
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order: Order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50">
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      #{order.order_id}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">ID: {order.customer_id}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      <div className="font-medium text-green-600">
                        ل.س {parseFloat(order.total).toFixed(2)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {t(`admin.${order.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      <div>{formatDate(order.placed_at)}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${locale === 'ar' ? 'text-center' : 'text-left'}`}>
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('admin.viewDetails')}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t('admin.updateStatus')}
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-green-600 hover:text-green-900"
                        >
                          {t('admin.editOrder')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && ORDERS_PER_PAGE > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            {t('table.previous')}
          </button>
          <span className="px-4 py-2 mx-1 text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            {t('table.next')}
          </button>
        </div>
      )}
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.totalOrders')}</div>
          <div className="text-2xl font-bold text-gray-900">{totalorders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.pendingOrders')}</div>
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter((o: Order) => o.status.toLowerCase() === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.deliveredOrders')}</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter((o: Order) => o.status.toLowerCase() === 'delivered').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.totalRevenue')}</div>
          <div className="text-2xl font-bold text-blue-600">
            ل.س {orders.reduce((sum: number, o: Order) => sum + parseFloat(o.total), 0).toFixed(2)}
          </div>
        </div>
      </div>



      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && orderDetails && (
        <OrderDetailsModal
          order={orderDetails}
          onClose={() => { setShowOrderModal(false); setOrderDetails(null); }}
          formatDate={formatDate}
        />
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <UpdateStatusModal
          order={selectedOrder}
          onClose={() => setShowStatusModal(false)}
          onUpdate={confirmStatusUpdate}
          isLoading={updateStatusMutation.isPending}
        />
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => { setShowEditModal(false); setEditingOrder(null); }}
          onUpdate={(orderData) => {
            console.log('🔍 [DEBUG] EditOrderModal onUpdate called with:', {
              order_id: editingOrder.order_id,
              orderData
            });
            updateOrderDetailsMutation.mutate({ id: editingOrder.order_id, orderData });
          }}
          isLoading={updateOrderDetailsMutation.isPending}
        />
      )}
    </div>
  );
}

// Order Details Modal Component
function OrderDetailsModal({ order, onClose, formatDate }: {
  order: OrderWithItems;
  onClose: () => void;
  formatDate: (dateString: string) => string;
}) {
  const { t, locale } = useI18n();

  // PDF Invoice Download Handler
  const handleDownloadInvoice = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const isRTL = locale === 'ar';
    const margin = 40;
    let y = margin;
    doc.setFont('Tajawal-Regular', 'normal');
    if (isRTL) doc.setFont('Tajawal-Bold', 'normal');
    doc.setFontSize(18);
    doc.text(t('admin.orderDetails') + ` #${order.order_id}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 30;
    doc.setFontSize(12);
    doc.text(`${t('admin.orderDate')}: ${formatDate(order.placed_at)}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 20;
    doc.text(`${t('admin.customer')}: ${order.customer_name}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 20;
    doc.text(`${t('admin.customerId')}: ${order.customer_id}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 20;
    doc.text(`${t('admin.deliveryAddress')}: ${order.delivery_address}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 20;
    doc.text(`${t('admin.paymentMethod')}: ${order.payment_method}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 20;
    doc.text(`${t('admin.status')}: ${order.status}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 20;
    doc.text(`${t('admin.totalAmount')}:  ${parseFloat(order.total).toFixed(2)} SYR`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 30;
    // Items Table
    autoTable(doc, {
      startY: y,
      head: [[
        t('admin.productName'),
        t('admin.vendor'),
        t('admin.quantity'),
        t('admin.price'),
        t('admin.status')
      ]],
      body: order.items.map(item => [
        item.product_name || '',
        `${item.vendor_name || ''} (ID: ${item.vendor_id || ''})`,
        item.qty ?? item.quantity ?? 0,
        ` ${item.product_price ?? 0} SYR`,
        item.delivery_status || t('admin.status') || ''
      ]),
      styles: { font: 'Tajawal-Regular', fontStyle: 'normal', fontSize: 10, halign: isRTL ? 'right' : 'left' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: isRTL ? 'right' : 'left', font: 'Tajawal-Bold', fontStyle: 'normal' },
      margin: { left: margin, right: margin },
      tableWidth: 515,
      theme: 'grid',
      didDrawPage: () => {
        // No-op for RTL, just keep for future extension
      }
    });
    doc.save(`invoice_order_${order.order_id}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t('admin.orderDetails')} #{order.order_id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Customer Info */}
          <div>
            <h4 className="font-medium mb-2">{t('admin.customer')}</h4>
            <div className="bg-gray-50 p-3 rounded">
              <div><strong>{t('auth.name')}:</strong> {order.customer_name}</div>
              <div><strong>{t('admin.customerId')}:</strong> {order.customer_id}</div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('admin.totalAmount')}:</span>
              <span className="text-xl font-bold text-green-600">ل.س {parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">{t('admin.deliveryAddress')}</h4>
              <p className="text-gray-600">{order.delivery_address}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t('admin.paymentMethod')}</h4>
              <p className="text-gray-600">{t(`paymentMethods.${order.payment_method}`)}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t('admin.orderDate')}</h4>
              <p className="text-gray-600">{formatDate(order.placed_at)}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t('admin.deliveryStatus')}</h4>
              <p className="text-gray-600">{t(`delivery.status.${order.delivery_status.toLowerCase()}`)}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t('admin.deliveryProgress')}</h4>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${order.delivery_progress}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-500">{order.delivery_progress}%</span>
            </div>
          </div>

          {/* Download Invoice Button */}
          {(() => { console.log('Order items:', order.items, 'Length:', Array.isArray(order.items) ? order.items.length : 'not array'); return null; })()}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleDownloadInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium mb-4"
              >
                {t('admin.printInvoice') || 'Download Invoice (PDF)'}
              </button>
            </div>
          )}
          {(!Array.isArray(order.items) || order.items.length === 0) && (
            <div className="text-red-500 text-sm mt-2">No order items found for this order.</div>
          )}

          {/* Order Items Table */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">{t('admin.orderItems')}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 mx-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase text-center">{t('admin.productName')}</th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase text-center">{t('admin.vendor')}</th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase text-center">{t('admin.quantity')}</th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase text-center">{t('admin.price')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, idx) => (
                      <tr key={`${item.product_id}-${item.vendor_id}-${idx}`}>
                        <td className="px-4 py-2 whitespace-nowrap text-center">{item.product_name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">{item.vendor_name} (ID: {item.vendor_id})</td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">{item.qty || item.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">ل.س {item.product_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            {t('admin.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Update Status Modal Component
function UpdateStatusModal({ order, onClose, onUpdate, isLoading }: {
  order: Order;
  onClose: () => void;
  onUpdate: (status: string) => void;
  isLoading: boolean;
}) {
  const { t } = useI18n();
  const [selectedStatus, setSelectedStatus] = useState(order.status);

  const statusOptions = [
    { value: 'pending', label: t('admin.pending') },
    { value: 'processing', label: t('admin.processing') },
    { value: 'shipped', label: t('admin.shipped') },
    { value: 'delivered', label: t('admin.delivered') },
    { value: 'cancelled', label: t('admin.cancelled') },
    { value: 'refunded', label: t('admin.refunded') },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('admin.updateStatus')} - #{order.order_id}
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.status')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              {t('admin.cancel')}
            </button>
            <button
              onClick={() => onUpdate(selectedStatus)}
              disabled={isLoading || selectedStatus === order.status}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
type OrderData = {
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  address_id?: number | null;
  delivery_zone_id?: number | null;
  notes?: string;
};


// Edit Order Modal Component
function EditOrderModal({ order, onClose, onUpdate, isLoading }: {
  order: Order;
  onClose: () => void;
  onUpdate: (orderData: OrderData) => void;
  isLoading: boolean;
}) {
  const { t, locale } = useI18n();
type DeliveryZoneType = {
  zone_id: number;
  name_en: string;
  name_ar: string;
  description?: string; // optional in case it can be null/empty
  delivery_fee: number;
  estimated_delivery_time: string;
};



  // Initialize form with available data from order
  const [formData, setFormData] = useState({
    customer_name: order.customer_name || '',
    customer_phone: order.customer_phone || '',
    delivery_address: order.delivery_address || '',
    address_id: order.address_id || null,
    delivery_zone_id: order.delivery_zone_id || null,
    notes: ''
  });

  // Fetch delivery zones
  const { data: zones, isLoading: zonesLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: getDeliveryZones
  });



  // Fetch order details to get additional data like delivery_notes
  const { data: orderDetails, isLoading: orderDetailsLoading } = useQuery({
    queryKey: ['order-details', order.order_id],
    queryFn: () => getAdminOrderById(order.order_id),
  });

  // Update form data when order details are fetched
  useEffect(() => {
    if (orderDetails && orderDetails.data) {
      setFormData(prev => ({
        ...prev,
        notes: orderDetails.data.delivery_notes || prev.notes || ''
      }));
    }
  }, [orderDetails]);

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update form data when order data is available
  useEffect(() => {
    if (order) {
      setFormData({
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        delivery_address: order.delivery_address || '',
        address_id: order.address_id || null,
        delivery_zone_id: order.delivery_zone_id || null,
        notes: ''
      });
    }
  }, [order]);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  // Show loading state while fetching order details
  if (orderDetailsLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-700">{t('admin.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {t('admin.editOrderDetails')} - #{order.order_id}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.customerName')}
              </label>
              <input
                type="text"
                value={formData.customer_name || ''}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.customerPhone')}
              </label>
              <input
                type="tel"
                value={formData.customer_phone || ''}
                onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder={orderDetailsLoading ? t('admin.loading') : t('admin.enterPhoneNumber')}
              />
            </div>

            {/* Delivery Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.deliveryAddress')}
                {formData.address_id && (
                  <span className="ml-2 text-xs text-gray-500">
                    (ID: {formData.address_id})
                  </span>
                )}
              </label>
              <textarea
                value={formData.delivery_address || ''}
                onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Delivery Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.deliveryZone')}
              </label>
              <select
                value={formData.delivery_zone_id || ''}
                onChange={(e) => {
                  const newZoneId = e.target.value ? parseInt(e.target.value) : null;
                  handleInputChange('delivery_zone_id', newZoneId);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={zonesLoading}
              >
                <option value="">{t('admin.selectZone')}</option>
                {zonesLoading ? (
                  <option value="" disabled>{t('admin.loadingZones')}</option>
                ) : zones && zones.data ? (
                  zones.data.map((zone: DeliveryZoneType) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {locale === 'ar' ? zone.name_ar : zone.name_en}
                    </option>
                  ))
                ) : zones && Array.isArray(zones) ? (
                  zones.map((zone: DeliveryZoneType) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {locale === 'ar' ? zone.name_ar : zone.name_en}
                    </option>
                  ))
                ) : null}
              </select>
            </div>

            {/* Order Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.orderNotes')}
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('admin.orderNotesPlaceholder')}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              {t('admin.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? t('admin.saving') : t('admin.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 