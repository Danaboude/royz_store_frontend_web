"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorOrders, getVendorOrderById, updateVendorOrderStatus, assignDeliveryToOrder } from "@/services/vendor-api";
import { useI18n } from "@/contexts/I18nContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import NoDataMessage from "@/components/NoDataMessage";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
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
  delivery_address: string;
  payment_status: string | null;
  placed_at: string;
  payment_method: string;
  delivery_status: string;
  delivery_progress: number;
  items: OrderItem[];
  delivery_id?: number; // Added delivery_id to the interface
}

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
  delivery_personnel?: {
    delivery_id: number;
    user_id: number;
    zone_id: number;
    vehicle_type: string;
    vehicle_number: string | null;
    is_available: number;
    current_location: unknown;
    rating: string;
    total_deliveries: number;
    is_verified: number;
    verified_at: string | null;
    created_at: string;
    delivery_person_name: string;
    delivery_person_phone: string;
    delivery_zone_name: string;
  };
  delivery_tracking?: Array<{
    tracking_id: number;
    order_id: number;
    delivery_id: number;
    status: string;
    location: unknown;
    notes: string | null;
    timestamp: string;
    vehicle_type: string;
    vehicle_number: string | null;
    delivery_person_name: string;
    delivery_person_phone: string;
    timestamp_formatted: string;
  }>;
}

interface DeliveryPersonnel {
  delivery_id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  rating: number;
  total_deliveries: number;
  zone_name: string;
}

interface DeliveryAssignmentData {
  order: {
    order_id: number;
    zone_id: number | null;
    zone_name: string | null;
  };
  available_delivery: DeliveryPersonnel[];
}




export default function VendorOrdersPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const ORDERS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderWithItems | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryAssignmentData | null>(null);

  const [estimatedPickupTime, setEstimatedPickupTime] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [exporting, setExporting] = useState(false);

  // Fetch vendor orders
  const { data, isLoading, error } = useQuery({
    queryKey: ["vendor-orders", currentPage, searchTerm],
    queryFn: async () => {

      try {
        const result = await getVendorOrders({ page: currentPage, limit: ORDERS_PER_PAGE, search: searchTerm });
    
        return result;
      } catch (err) {
        console.error('API Error:', err);
        throw err;
      }
    },
  });
  
 
  
  const orders: Order[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / ORDERS_PER_PAGE);

  // Bulk selection state and logic (must be after orders is defined)


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ order_id, status }: { order_id: number; status: string }) => updateVendorOrderStatus({ order_id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      setSelectedOrder(null);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Error updating order status';
      toast.error(errorMessage);
    },
  });

  // Delivery assignment mutation
  const assignDeliveryMutation = useMutation({
    mutationFn: ({ orderId, deliveryId, estimatedPickupTime, notes }: { 
      orderId: number; 
      deliveryId: number; 
      estimatedPickupTime?: string; 
      notes?: string; 
    }) => assignDeliveryToOrder(orderId, deliveryId, estimatedPickupTime, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Delivery assigned successfully');
      setShowDeliveryModal(false);
      setSelectedOrder(null);
      setDeliveryData(null);
      setEstimatedPickupTime("");
      setDeliveryNotes("");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Error assigning delivery';
      toast.error(errorMessage);
    },
  });

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    // Fetch full order details (with items)
    try {
      const response = await getVendorOrderById(order.order_id);
      setOrderDetails(response.data);
    } catch {
      setOrderDetails(null);
    }
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

 

  const confirmDeliveryAssignment = (deliveryId: number) => {
    if (selectedOrder) {
      assignDeliveryMutation.mutate({
        orderId: selectedOrder.order_id,
        deliveryId: deliveryId,
        estimatedPickupTime: estimatedPickupTime || undefined,
        notes: deliveryNotes || undefined
      });
    }
  };

  const confirmStatusUpdate = (newStatus: string) => {
    if (selectedOrder) {
      updateStatusMutation.mutate({ order_id: selectedOrder.order_id, status: newStatus });
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Export all orders to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await getVendorOrders({ page: 1, limit: 0, search: searchTerm });
      const allOrders: Order[] = res.data || [];
      const data = allOrders.map((order: Order) => ({
        [t("admin.orderId")]: order.order_id,
        [t("admin.customer")]: order.customer_name,
        [t("admin.totalAmount")]: order.total,
        [t("admin.status")]: order.status,
        [t("admin.date")]: order.placed_at,
        [t("admin.paymentMethod")]: order.payment_method,
        [t("admin.deliveryStatus")]: order.delivery_status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, "vendor-orders.xlsx");
    } catch {
      toast.error("Failed to export orders");
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
        <h1 className="text-2xl font-bold text-gray-900">{t("vendor.myOrders")}</h1>
        <p className="text-gray-600">{t("vendor.ordersManagementDesc")}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("admin.searchOrders")}
            </label>
            <input
              type="text"
              placeholder={t("admin.searchOrdersPlaceholder")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearchTerm(inputValue);
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
              <span className="flex items-center"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>{t("admin.exporting") || "Exporting..."}</span>
            ) : (
              t("admin.exportExcel") || "Export to Excel"
            )}
          </button>
        </div>
      </div>

    

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!Array.isArray(orders) ? (
                      <div className="p-6 text-left">
            <div className="text-gray-500 mb-2">Unexpected data format received</div>
            <div className="text-sm text-gray-400">Orders data: {JSON.stringify(orders, null, 2)}</div>
          </div>
        ) : orders.length === 0 ? (
          <NoDataMessage type="default" customMessage={t("admin.noOrdersFound")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
             
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === "ar" ? "text-right" : "text-left"}`}>
                    {t("admin.orderId")}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === "ar" ? "text-right" : "text-left"}`}>
                    {t("admin.customer")}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === "ar" ? "text-right" : "text-left"}`}>
                    {t("admin.totalAmount")}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === "ar" ? "text-right" : "text-left"}`}>
                    {t("admin.status")}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === "ar" ? "text-right" : "text-left"}`}>
                    {t("admin.date")}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === "ar" ? "text-center" : "text-left"}`}>
                    {t("admin.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order: Order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50">
                
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${locale === "ar" ? "text-right" : "text-left"}`}>
                      #{order.order_id}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${locale === "ar" ? "text-right" : "text-left"}`}>
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">ID: {order.customer_id}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${locale === "ar" ? "text-right" : "text-left"}`}>
                      <div className="font-medium text-green-600">
                        ل.س {parseFloat(order.total).toFixed(2)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${locale === "ar" ? "text-right" : "text-left"}`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {t(`admin.${order.status.toLowerCase()||'none'}`)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${locale === "ar" ? "text-right" : "text-left"}`}>
                      <div>{formatDate(order.placed_at)}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${locale === "ar" ? "text-center" : "text-left"}`}>
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('admin.viewDetails')}
                        </button>
                        {order.status.toLowerCase() === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {t('admin.updateStatus')}
                          </button>
                        )}
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
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            {t("table.previous")}
          </button>
          <span className="px-4 py-2 mx-1 text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            {t("table.next")}
          </button>
        </div>
      )}
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t("admin.totalOrders")}</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t("admin.pendingOrders")}</div>
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter((o: Order) => o.status.toLowerCase() === "pending").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t("admin.deliveredOrders")}</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter((o: Order) => o.status.toLowerCase() === "delivered").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t("admin.totalRevenue")}</div>
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

      {/* Delivery Assignment Modal */}
      {showDeliveryModal && selectedOrder && deliveryData && (
        <DeliveryAssignmentModal
          order={selectedOrder}
          deliveryData={deliveryData}
          onClose={() => { setShowDeliveryModal(false); setDeliveryData(null); }}
          onAssign={confirmDeliveryAssignment}
          isLoading={assignDeliveryMutation.isPending}
          estimatedPickupTime={estimatedPickupTime}
          setEstimatedPickupTime={setEstimatedPickupTime}
          deliveryNotes={deliveryNotes}
          setDeliveryNotes={setDeliveryNotes}
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
    if (order.placed_at) {
      doc.text(`${t('admin.orderDate')}: ${formatDate(order.placed_at)}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
      y += 20;
    }
    doc.text(`${t('admin.customer')}: ${order.customer_name}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 20;
    if (order.customer_id) {
      doc.text(`${t('admin.customerId')}: ${order.customer_id}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
      y += 20;
    }
    if (order.delivery_address) {
      doc.text(`${t('admin.deliveryAddress')}: ${order.delivery_address}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
      y += 20;
    }
    if (order.payment_method) {
      doc.text(`${t('admin.paymentMethod')}: ${order.payment_method}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
      y += 20;
    }
    doc.text(`${t('admin.status')}: ${order.status}`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 20;
    doc.text(`${t('admin.totalAmount')}:  ${parseFloat(order.total).toLocaleString()} SYP`, isRTL ? 555 : margin, y, { align: isRTL ? 'right' : 'left' });
    y += 30;
    // Items Table
    autoTable(doc, {
      startY: y,
      head: [[
        t('admin.productName'),
        t('admin.quantity'),
        t('admin.price'),
        t('admin.subtotal')
      ]],
      body: order.items.map(item => [
        item.product_name || '',
        item.qty ?? item.quantity ?? 0,
        `${item.product_price?.toLocaleString() ?? 0} SYP`,
        `${((item.qty ?? item.quantity ?? 1) * (item.product_price ?? 0)).toLocaleString()}}`
      ]),
      styles: { font: 'Tajawal-Regular', fontStyle: 'normal', fontSize: 10, halign: isRTL ? 'right' : 'left' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: isRTL ? 'right' : 'left', font: 'Tajawal-Bold', fontStyle: 'normal' },
      margin: { left: margin, right: margin },
      tableWidth: 515,
      theme: 'grid',
    });
    doc.save(`invoice_order_${order.order_id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          &times;
        </button>
        {/* Print/Download Invoice Button */}
        <button
          onClick={handleDownloadInvoice}
          className="absolute top-4 right-16 text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-1 rounded"
        >
          <span role="img" aria-label="print">🖨️</span> {t('admin.printInvoice')}
        </button>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          {t('admin.orderDetails')} #{order.order_id}
        </h2>
        {/* Modern summary card with duplicated data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">{t('admin.customer')}:</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">{t('admin.status')}:</span>
              <span className="capitalize px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">{t(`delivery.status.${order.status}`)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">{t('admin.totalAmount')}:</span>
              <span className="text-lg font-bold">{order.total} {t('common.currency')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">{t('payments.status')}:</span>
              <span className="capitalize px-2 py-1 rounded bg-green-100 text-green-800 text-xs">{t(`delivery.status.${order.payment_status}`)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">{t('admin.paymentMethod')}:</span>
              <span className="flex items-center gap-1">
                {/* Payment method icon */}
                {order.payment_method === 'cash' && <span className="inline-block w-4 h-4 bg-yellow-400 rounded-full mr-1" title="Cash"></span>}
                {order.payment_method === 'card' && <span className="inline-block w-4 h-4 bg-blue-400 rounded-full mr-1" title="Card"></span>}
                {order.payment_method === 'transfer' && <span className="inline-block w-4 h-4 bg-purple-400 rounded-full mr-1" title="Bank Transfer"></span>}
                <span>{t(`paymentMethods.${order.payment_method}`) || order.payment_method}</span>
              </span>
            </div>
          
          </div>
          {/* Delivery personnel details */}
          <div className="bg-green-50 rounded p-4 flex flex-col gap-2">
            <div className="font-semibold text-gray-700 mb-1">{t('delivery.deliveryPersonnel')}</div>
            {order?.delivery_personnel ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('delivery.name')}:</span>
                  <span>{order.delivery_personnel.delivery_person_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('delivery.phone')}:</span>
                  <span>{order.delivery_personnel.delivery_person_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('delivery.zoneName')}:</span>
                  <span>{order.delivery_personnel.delivery_zone_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('delivery.vehicleType')}:</span>
                  <span>{t(`delivery.${order.delivery_personnel.vehicle_type}`) || order.delivery_personnel.vehicle_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('delivery.vehicleNumber')}:</span>
                  <span>{order.delivery_personnel.vehicle_number || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('delivery.rating')}:</span>
                  <span>{order.delivery_personnel.rating}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('delivery.totalDeliveries')}:</span>
                  <span>{order.delivery_personnel.total_deliveries}</span>
                </div>
              </>
            ) : (
              <span className="text-gray-500">{t('delivery.noPersonnel')}</span>
            )}
          </div>
        </div>
        {/* Delivery tracking timeline */}
        <div className="mb-4">
          <div className="font-semibold text-gray-700 mb-2">{t('delivery.tracking')}</div>
          {order?.delivery_tracking && order.delivery_tracking.length > 0 ? (
            <ol className="relative border-l border-gray-200">
              {order.delivery_tracking.map((track, idx) => (
                <li key={`${track.tracking_id}-${idx}`} className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-900">{t(`delivery.status.${track.status}`) || track.status}</span>
                    <span className="text-xs text-gray-500">{track.timestamp_formatted}</span>
                    {track.notes && <span className="text-xs text-gray-400">{track.notes}</span>}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <span className="text-gray-500">{t('delivery.noTrackingInfo')}</span>
          )}
        </div>
        {/* Duplicated summary for clarity */}
        <div className="bg-gray-50 rounded p-4 flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">{t('admin.orderId')}:</span>
            <span>{order.order_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">{t('admin.customer')}:</span>
            <span>{order.customer_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">{t('admin.totalAmount')}:</span>
            <span>{order.total} {t('common.currency')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">{t('admin.status')}:</span>
            <span className="capitalize px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">{}{t(`delivery.status.${order.status}`)}</span>
          </div>
        </div>
        {/* Order items table (existing) */}
     <div>
  <div className="font-semibold text-gray-700 mb-2 ">{t('admin.orderItems')}</div>
  <table className="min-w-full bg-white border border-gray-200 rounded mx-auto">
    <thead>
      <tr>
        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.product')}</th>
        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.quantity')}</th>
        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.price')}</th>
        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.subtotal')}</th>
      </tr>
    </thead>
    <tbody>
      {order.items && order.items.length > 0 ? (
        order.items.map((item, idx) => (
          <tr key={`${item.product_id}-${idx}`} className="border-t">
            <td className="px-4 py-2 text-center">{item.product_name}</td>
            <td className="px-4 py-2 text-center">{item.qty ?? item.quantity ?? '-'}</td>
            <td className="px-4 py-2 text-center">{item.product_price}</td>
            <td className="px-4 py-2 text-center">{((item.qty ?? item.quantity ?? 1) * item.product_price).toLocaleString()}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={4} className="text-center text-gray-400 py-4">{t('admin.noOrderItems') || 'No items'}</td>
        </tr>
      )}
    </tbody>
  </table>
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

// Delivery Assignment Modal Component
function DeliveryAssignmentModal({ order, deliveryData, onClose, onAssign, isLoading, estimatedPickupTime, setEstimatedPickupTime, deliveryNotes, setDeliveryNotes }: {
  order: Order;
  deliveryData: DeliveryAssignmentData;
  onClose: () => void;
  onAssign: (deliveryId: number) => void;
  isLoading: boolean;
  estimatedPickupTime: string;
  setEstimatedPickupTime: (time: string) => void;
  deliveryNotes: string;
  setDeliveryNotes: (notes: string) => void;
}) {
  const { t } = useI18n();
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('admin.assignDelivery')} - #{order.order_id}
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.selectDeliveryPersonnel')}
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
              {deliveryData.available_delivery.length === 0 ? (
                <div className="p-4 text-left text-gray-500">
                  {t('admin.noDeliveryPersonnelAvailable')}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {deliveryData.available_delivery.map((personnel) => (
                    <div
                      key={personnel.delivery_id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedDeliveryId === personnel.delivery_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedDeliveryId(personnel.delivery_id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{personnel.name}</div>
                          <div className="text-sm text-gray-500">{personnel.phone}</div>
                          <div className="text-sm text-gray-500">
                            {personnel.vehicle_type} - {personnel.vehicle_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            Zone: {personnel.zone_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            Rating: {personnel.rating}/5
                          </div>
                          <div className="text-sm text-gray-500">
                            {personnel.total_deliveries} deliveries
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.estimatedPickupTime')}
            </label>
            <input
              type="datetime-local"
              value={estimatedPickupTime}
              onChange={(e) => setEstimatedPickupTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.deliveryNotes')}
            </label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('admin.deliveryNotesPlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              {t('admin.cancel')}
            </button>
            <button
              onClick={() => selectedDeliveryId && onAssign(selectedDeliveryId)}
              disabled={isLoading || !selectedDeliveryId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? t('admin.assigning') : t('admin.assign')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 