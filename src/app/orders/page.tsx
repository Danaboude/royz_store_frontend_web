"use client";
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/services/api-client';
import ImageWithFallback from '@/components/ImageWithFallback';

interface Order {
  order_id: number;
  status: string;
  total: number;
  created_at: string;
  delivery_address: string;
  payment_status: string;
  placed_at: string;
  payment_method?: string;
  confirmation_status?: string;
  vendor_id?: number;
  delivery_id?: number;
  split_group_id?: string;
}

export default function OrdersPage() {
  const { isLoggedIn } = useUser();
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<number|null>(null);
  const [cancelOrderHasDelivery, setCancelOrderHasDelivery] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
      return;
    }
    apiClient.get('/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        const data = res.data && res.data.data;
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
          setError(String(t('common.errorOccurred')));
        }
        setLoading(false);
      })
      .catch(() => {
        setError(String(t('common.errorOccurred')));
        setLoading(false);
      });
  }, [isLoggedIn, router, t]);

  const handleCancel = async (orderId: number) => {
    await apiClient.patch(`/orders/${orderId}/cancel`, {}, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setOrders(orders => orders.map(o => o.order_id === orderId ? { ...o, status: 'cancelled' } : o));
    setShowCancelModal(false);
    setCancelOrderId(null);
    setCancelOrderHasDelivery(false);
  };

  const handleCancelClick = (order: Order) => {
    if (order.delivery_id) {
      setShowCancelModal(true);
      setCancelOrderId(order.order_id);
      setCancelOrderHasDelivery(true);
    } else {
      setShowCancelModal(true);
      setCancelOrderId(order.order_id);
      setCancelOrderHasDelivery(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancel': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#F7F7FA] font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <h1 className="text-3xl font-bold mb-8 text-center" style={{fontFamily: 'Tajawal, sans-serif'}}>{String(t('common.orders'))}</h1>
        {loading ? (
          <div className="text-center text-lg text-gray-500 py-12">{String(t('common.loading'))}</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ImageWithFallback src="/empty-orders.svg" alt="No orders" className="w-40 h-40 mb-4 opacity-70" />
            <div className="text-lg text-gray-500">{String(t('common.noOrders')) || 'No orders found.'}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              // Normalize status: treat 'cancel' as 'cancelled' for display/logic
              const normalizedStatus = order.status === 'cancel' ? 'cancelled' : order.status;
              return (
                <div key={order.order_id} className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="font-bold text-lg" style={{fontFamily: 'Tajawal, sans-serif'}}>{String(t('common.orderNumber'))}: #{order.order_id}</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(normalizedStatus)}`}>{String(t('common.orderStatus'))}: {String(t('orderss.status.' + normalizedStatus)) || normalizedStatus}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{String(t('common.paymentMethod'))}: {String(t('orders.paymentMethod.' + (order.payment_method || ''))) !== 'orders.paymentMethod.' + (order.payment_method || '') ? String(t('orders.paymentMethod.' + (order.payment_method || ''))) : (order.payment_method || '-')}</span>
                      {order.confirmation_status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.confirmation_status === 'confirmed' ? 'bg-green-100 text-green-800' : order.confirmation_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{String(t('orders.confirmationStatus'))}: {String(t('orders.confirmation.' + order.confirmation_status)) || order.confirmation_status}</span>
                      )}
                      {order.delivery_id && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{String(t('deliveryAssigned'))}</span>
                      )}
                    </div>
                    <div>{String(t('common.total'))}: <span className="font-semibold">{order.total} ل.س</span></div>
                    <div>{String(t('common.orderDate'))}: {order.placed_at ? new Date(order.placed_at).toLocaleString(locale) : '-'}</div>
                    <div>{String(t('common.shippingAddress'))}: {order.delivery_address}</div>
                  </div>
                  {normalizedStatus !== 'delivered' && normalizedStatus !== 'cancelled' ? (
                    <button
                      className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition mt-4 md:mt-0"
                      onClick={() => handleCancelClick(order)}
                    >
                      {String(t('sidebar.cancelOrder'))}
                    </button>
                  ) : (normalizedStatus === 'cancelled') && (
                    <span className="px-4 py-2 rounded-xl bg-gray-200 text-gray-600 font-semibold mt-4 md:mt-0">{String(t('common.readOnly') || 'Read Only')}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
            <div className="mb-4 text-lg font-bold">{String(t('cancelConfirmTitle'))}</div>
            <div className="mb-6">
              {cancelOrderHasDelivery
                ? String(t('cancelWithDeliveryFee'))
                : String(t('cancelConfirmText'))}
            </div>
            <div className="flex justify-center gap-4">
              <button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-300"
                onClick={() => { setShowCancelModal(false); setCancelOrderId(null); setCancelOrderHasDelivery(false); }}
              >
                {String(t('common.no'))}
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
                onClick={() => cancelOrderId && handleCancel(cancelOrderId)}
              >
                {String(t('common.yes'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 