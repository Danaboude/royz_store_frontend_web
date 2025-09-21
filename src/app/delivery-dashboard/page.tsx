"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Package, Clock, CheckCircle, AlertCircle, MapPin, Phone, User, Users, List } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useMyDeliveries, useDeliveryStats, updateDeliveryStatus, updateAvailability } from '@/services/delivery-api';
import DeliveryConfirmationDialog from '@/components/DeliveryConfirmationDialog';
import DeliveryClaimSystem from '@/components/DeliveryClaimSystem';
interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  vendor_address: string; // New field
  vendor_phone: string;   // New field
}

interface VendorAddressInfo {
  address: string;
  phone: string;
}

interface Order {
  order_id: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;

  // Can be a single vendor address object or an array of them
  vendor_addresses?: VendorAddressInfo | VendorAddressInfo[];

  total: number;
  status: string;
  placed_at: string;
  estimated_delivery_time?: string;
  items: OrderItem[];
  payment_method?: string; // 'cash' | 'card' | etc.
}


export default function DeliveryDashboard() {
  const { t } = useI18n();
  const { user, isLoggedIn } = useUser();
  const router = useRouter();

  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'deliveries' | 'available' | 'claimed'>('deliveries');

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: 'pick_up' | 'start_delivery' | 'mark_delivered' | 'mark_failed';
    orderId: number;
    customerName: string;
  }>({
    isOpen: false,
    action: 'pick_up',
    orderId: 0,
    customerName: ''
  });

  // Use React Query hooks for data fetching
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders, error: ordersError } = useMyDeliveries(activeFilter);
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDeliveryStats();

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn) {
      router.push('/delivery-signin');
      return;
    }

    // Check if user is delivery personnel
    if (user?.roleId !== 6) {
      router.push('/delivery-signin');
      return;
    }
  }, [user, isLoggedIn, router]);

  // Show loading while checking authentication
  if (!isLoggedIn || user?.roleId !== 6) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleActionClick = (action: 'pick_up' | 'start_delivery' | 'mark_delivered' | 'mark_failed', orderId: number, customerName: string) => {
    setConfirmationDialog({
      isOpen: true,
      action,
      orderId,
      customerName
    });
  };

  const handleConfirmAction = async (imageFile?: File, notes?: string) => {
    try {
      const { action, orderId } = confirmationDialog;
      console.log(error);
      let newStatus: 'picked_up' | 'in_transit' | 'delivered' | 'failed';

      switch (action) {
        case 'pick_up':
          newStatus = 'picked_up';
          break;
        case 'start_delivery':
          newStatus = 'in_transit';
          break;
        case 'mark_delivered':
          newStatus = 'delivered';
          break;
        case 'mark_failed':
          newStatus = 'failed';
          break;
        default:
          return;
      }

      await updateDeliveryStatus(orderId, newStatus, notes, imageFile);
      refetchOrders();
      refetchStats(); // Refresh stats after status change
    } catch {
      setError(t('delivery.statusUpdateError') as string);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      await updateAvailability(!isAvailable);
      setIsAvailable(!isAvailable);
    } catch {
      setError(t('delivery.availabilityError') as string);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'picked_up': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Clock className="w-4 h-4" />;
      case 'picked_up': return <Package className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const loading = ordersLoading || statsLoading;

  // Show error if there are API errors
  if (ordersError || statsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-left">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">
            {ordersError?.message || statsError?.message || 'Failed to load delivery data'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/delivery-signin')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-left">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">{t('delivery.loading')}</p>
          <p className="text-sm text-gray-500 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const orderCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('delivery.dashboard')}</h1>
                <p className="text-sm text-gray-600">{t('delivery.welcomeMessage')}</p>
              </div>
            </div>

            {/* Navigation and Availability */}
            <div className="flex items-center space-x-4">
              {/* Personnel Management Button */}
              <button
                onClick={() => router.push('/delivery-dashboard/personnel')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Users className="w-4 h-4 mr-2" />
                {t('delivery.personnelManagement')}
              </button>

              {/* Logout Button */}
              <button
                onClick={() => {
                  // Clear user session and redirect to signin
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/delivery-signin');
                }}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {t('delivery.logout')}
              </button>

              {/* Availability Toggle */}
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">{t('delivery.availability')}:</span>
                <button
                  onClick={handleAvailabilityToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isAvailable ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className="ml-2 text-sm text-gray-600">
                  {isAvailable ? t('delivery.available') : t('delivery.unavailable')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('delivery.totalDeliveries')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('delivery.completedDeliveries')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed_orders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('delivery.activeDeliveries')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_orders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('delivery.totalEarnings')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'SYP'
                    }).format(stats.earnings?.total_earnings || 0)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'deliveries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  {t('delivery.myDeliveries')}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center">
                  <List className="w-4 h-4 mr-2" />
                  {t('delivery.availableOrders')}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('claimed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'claimed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  {t('delivery.myClaimedOrders')}
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'deliveries' && (
                <motion.div
                  key="deliveries"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Existing delivery content */}
                  <div className="space-y-6">
                    {/* Filter buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveFilter(undefined)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!activeFilter
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {t('delivery.allOrders')}
                      </button>
                      <button
                        onClick={() => setActiveFilter('assigned')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'assigned'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {t('delivery.assigned')}
                      </button>
                      <button
                        onClick={() => setActiveFilter('picked_up')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'picked_up'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {t('delivery.pickedUp')}
                      </button>
                      <button
                        onClick={() => setActiveFilter('in_transit')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'in_transit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {t('delivery.inTransit')}
                      </button>
                    </div>

                    {/* Orders list */}
                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">{t('delivery.noOrders')}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order: Order) => (
                          <motion.div
                            key={order.order_id}
                            variants={orderCardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {t('delivery.order')} #{order.order_id}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                    <div className="flex items-center">
                                      {getStatusIcon(order.status)}
                                      <span className="ml-1">{t(`delivery.${order.status}`)}</span>
                                    </div>
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center text-sm">
                                      <User className="w-4 h-4 mr-2 text-gray-500" />
                                      <span className="font-medium">{order.customer_name}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                                      <span>{order.customer_phone}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                                      <span>{order.delivery_address}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="text-sm">
                                      <span className="font-medium">{t('delivery.total')}: </span>
                                      <span className="text-green-600 font-semibold">
                                        {new Intl.NumberFormat('en-US', {
                                          style: 'currency',
                                          currency: 'SYP'
                                        }).format(order.total)}
                                      </span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium">{t('delivery.placedAt')}: </span>
                                      <span>{new Date(order.placed_at).toLocaleDateString('en-US')}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Order items with vendor pickup addresses */}
                                {order.items && order.items.length > 0 && (
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      {t('delivery.orderItems')}:
                                    </h4>
                                    <div className="space-y-3">
                                      {order.items.map((item, index) => (
                                        <div key={index} className="border border-gray-200 rounded p-3">
                                          <div className="flex justify-between text-sm font-semibold mb-1">
                                            <span>{item.product_name} x {item.quantity}</span>
                                            <span>
                                              {new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: 'SYP'
                                              }).format(item.price * item.quantity)}
                                            </span>
                                          </div>

                                          {/* Vendor pickup details */}
                                          <div className="text-xs text-gray-600">
                                            <span className="font-medium">{t('delivery.pickupFrom')}:</span> {item.vendor_address}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            <span className="font-medium">{t('delivery.phone')}:</span> {item.vendor_phone}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div></div>

                            {/* Action buttons */}
                            <div className="flex justify-end space-x-3">
                              {order.status === 'assigned' && (
                                <button
                                  onClick={() => handleActionClick('pick_up', order.order_id, order.customer_name)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                >
                                  <Package className="w-4 h-4 mr-2" />
                                  {t('delivery.pickUp')}
                                </button>
                              )}

                              {order.status === 'picked_up' && (
                                <button
                                  onClick={() => handleActionClick('start_delivery', order.order_id, order.customer_name)}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                                >
                                  <Truck className="w-4 h-4 mr-2" />
                                  {t('delivery.startDelivery')}
                                </button>
                              )}

                              {order.status === 'in_transit' && (
                                <div className="flex space-x-3">
                                  <button
                                    onClick={() => handleActionClick('mark_delivered', order.order_id, order.customer_name)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {t('delivery.markDelivered')}
                                  </button>
                                  <button
                                    onClick={() => handleActionClick('mark_failed', order.order_id, order.customer_name)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                                  >
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    {t('delivery.markFailed')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {(activeTab === 'available' || activeTab === 'claimed') && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <DeliveryClaimSystem activeTab={activeTab} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <DeliveryConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
        onConfirm={handleConfirmAction}
        action={confirmationDialog.action}
        orderId={confirmationDialog.orderId}
        customerName={confirmationDialog.customerName}
      />
    </div>
  );
} 