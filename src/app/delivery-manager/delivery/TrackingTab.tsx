"use client";

import { useState } from "react";
import Image from 'next/image';

import { useI18n } from '@/contexts/I18nContext';
import LoadingSpinner from "@/components/LoadingSpinner";
import { getOrderTracking } from '@/services/admin-api';
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  User,
  MapPin,
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  DollarSign,
  ShoppingCart,
  Navigation
} from "lucide-react";

type TrackingData = {
  order: {
    order_id: number;
    status: string;
    total: number | string;
    subtotal: number | string;
    delivery_fee: number | string;
    discount_amount: number | string;
    payment_method: string;
    placed_at: string;
    estimated_delivery_time: string | null;
    actual_delivery_time: string | null;
    delivery_confirmation_image?: string | null;
    delivery_confirmed_at?: string | null;
    delivery_confirmation_notes?: string | null;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  delivery: {
    address: string;
    phone: string;
    zone: string;
    delivery_fee: number | string;
  };
  delivery_personnel: {
    delivery_id: number;
    name: string;
    phone: string;
    vehicle_type: string;
    vehicle_number: string;
  } | null;
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    product_description: string;
    product_image: string;
    product_price: number | string;
    category_name: string;
    qty: number;
    price: number | string;
    total_price: number | string;
  }>;
  tracking: Array<{
    tracking_id: number;
    status: string;
    notes: string | null;
    timestamp: string;
    delivery_person_name: string | null;
    delivery_person_phone: string | null;
    vehicle_type: string | null;
    vehicle_number: string | null;
  }>;
  payment: {
    payment_id: number;
    amount: number | string;
    method: string;
    status: string;
    transaction_id: string | null;
    processed_at: string | null;
    payment_received: number | string | null;
    customer_signature: string | null;
    delivery_photo: string | null;
    payment_notes: string | null;
  } | null;
  summary: {
    total_items: number;
    subtotal: number | string;
    total_with_delivery: number | string;
    tracking_count: number;
    last_update: string | null;
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'assigned': return 'bg-purple-100 text-purple-800';
    case 'picked_up': return 'bg-orange-100 text-orange-800';
    case 'in_transit': return 'bg-indigo-100 text-indigo-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'returned': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'processing': return <Package className="w-4 h-4" />;
    case 'assigned': return <User className="w-4 h-4" />;
    case 'picked_up': return <Truck className="w-4 h-4" />;
    case 'in_transit': return <Navigation className="w-4 h-4" />;
    case 'delivered': return <CheckCircle className="w-4 h-4" />;
    case 'cancelled': return <AlertCircle className="w-4 h-4" />;
    case 'returned': return <AlertCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export default function TrackingTab() {
  const { t } = useI18n();
  const [orderId, setOrderId] = useState("");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Modal state for image zoom
  const [showImageModal, setShowImageModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const fetchTracking = async () => {
    setLoading(true);
    setError(null);
    setTrackingData(null);
    try {
      const data = await getOrderTracking(Number(orderId));
      if (data.success && data.data) {
        // Validate the data structure
        if (data.data.order && data.data.customer && data.data.items) {
          setTrackingData(data.data);
        } else {
          console.error('Invalid data structure:', data.data);
          setError("Invalid data structure received from server");
        }
      } else {
        setError(data.error || "Failed to fetch tracking info");
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      // Handle specific error types
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 404) {
          setError(t("delivery.orderNotFound") || "Order not found. Please check the order ID and try again.");
        } else if (axiosError.response?.status === 400) {
          setError(t("delivery.invalidOrderId") || "Invalid order ID. Please enter a valid order number.");
        } else {
          setError(axiosError.response?.data?.message || (err as unknown as Error).message || t("delivery.failedToFetchTracking") || "Failed to fetch tracking info");
        }
      } else {
        setError((err as unknown as Error).message || t("delivery.failedToFetchTracking") || "Failed to fetch tracking info");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '0.00 ل.س';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0.00 ل.س';
    return `${numAmount.toFixed(2)} ل.س`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("delivery.tracking")}</h2>
        <p className="text-gray-600">{t("delivery.trackingDesc")}</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.orderId')}
            </label>
            <input
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder={t("delivery.enterOrderId")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchTracking}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            disabled={loading || !orderId}
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            {loading ? t("admin.loading") : t("delivery.trackOrderButton")}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      <AnimatePresence>
        {trackingData && trackingData.order && trackingData.customer && trackingData.items && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Order Summary Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-white" />
                    <div>
                      <h3 className="text-xl font-bold text-white">{t("delivery.orderNumber").replace('{orderId}', trackingData.order?.order_id?.toString() || '')}</h3>
                      <p className="text-blue-100">{t("delivery.placedOn").replace('{date}', trackingData.order?.placed_at ? formatDate(trackingData.order.placed_at) : 'N/A')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trackingData.order?.status || 'pending')}`}>
                      {getStatusIcon(trackingData.order?.status || 'pending')}
                      {(t(`delivery.status.${trackingData.order?.status}`) || 'pending').replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">{t("delivery.totalAmount")}</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(trackingData.order?.total || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">{t("delivery.items")}</p>
                      <p className="text-lg font-bold text-gray-900">{trackingData.summary?.total_items || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">{t("delivery.updates")}</p>
                      <p className="text-lg font-bold text-gray-900">{trackingData.summary?.tracking_count || 0}</p>
                    </div>
                  </div>
                </div>
                {/* Delivery Confirmation Section */}
                {(trackingData.order?.delivery_confirmation_image || trackingData.order?.delivery_confirmed_at || trackingData.order?.delivery_confirmation_notes) && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      {t("delivery.deliveryConfirmation")}
                    </h4>
                    {trackingData.order.delivery_confirmation_image && (
                      <div className="mb-2">
                        <Image
                          src={trackingData.order.delivery_confirmation_image}
                          alt={t("delivery.deliveryConfirmation")}
                          className="max-w-xs rounded shadow border cursor-zoom-in"
                          onClick={() => { setShowImageModal(true); setZoom(1); setPan({ x: 0, y: 0 }); }}
                        />
                        {/* Modal for zoomable image */}
                        {showImageModal && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowImageModal(false)}>
                            <div
                              className="relative bg-white rounded shadow-lg p-4 flex flex-col items-center"
                              style={{ minWidth: 320, minHeight: 320 }}
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                                onClick={() => setShowImageModal(false)}
                                aria-label="Close"
                              >
                                &times;
                              </button>
                              <div
                                className="overflow-hidden flex items-center justify-center border bg-gray-100"
                                style={{ width: 400, height: 400, cursor: dragging ? 'grabbing' : 'grab' }}
                                onMouseDown={e => {
                                  setDragging(true);
                                  setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                                }}
                                onMouseUp={() => setDragging(false)}
                                onMouseLeave={() => setDragging(false)}
                                onMouseMove={e => {
                                  if (dragging && dragStart) {
                                    setPan({
                                      x: e.clientX - dragStart.x,
                                      y: e.clientY - dragStart.y
                                    });
                                  }
                                }}
                              >
                                <Image
                                  src={trackingData.order.delivery_confirmation_image}
                                  alt={t("delivery.deliveryConfirmation")}
                                  style={{
                                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                    transition: dragging ? 'none' : 'transform 0.2s',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    userSelect: 'none',
                                    pointerEvents: 'none'
                                  }}
                                  draggable={false}
                                />
                              </div>
                              <div className="flex gap-2 mt-4">
                                <button
                                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                  onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                                  aria-label="Zoom Out"
                                >
                                  -
                                </button>
                                <span className="px-2">{Math.round(zoom * 100)}%</span>
                                <button
                                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                  onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                                  aria-label="Zoom In"
                                >
                                  +
                                </button>
                                <button
                                  className="ml-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                                  aria-label="Reset Zoom"
                                >
                                  {t('common.reset') || 'Reset'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {trackingData.order.delivery_confirmed_at && (
                      <div className="text-sm text-gray-700 mb-1">
                        <strong>{t("delivery.confirmedAt")}:</strong> {formatDate(trackingData.order.delivery_confirmed_at)}
                      </div>
                    )}
                    {trackingData.order.delivery_confirmation_notes && (
                      <div className="text-sm text-gray-700">
                        <strong>{t("delivery.confirmationNotes")}:</strong> {trackingData.order.delivery_confirmation_notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{t("delivery.customerInformation")}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 font-medium">{trackingData.customer?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{trackingData.customer?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{trackingData.customer?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{t("delivery.deliveryInformation")}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-gray-900 font-medium">{t("delivery.address")}</p>
                      <p className="text-gray-700 text-sm">{trackingData.delivery?.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{trackingData.delivery?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Navigation className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{trackingData.delivery?.zone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{t("delivery.deliveryFee")}: {formatCurrency(trackingData.delivery?.delivery_fee || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Personnel */}
            {trackingData.delivery_personnel && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{t("delivery.deliveryPersonnel")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900 font-medium">{trackingData.delivery_personnel?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{trackingData.delivery_personnel?.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{trackingData.delivery_personnel?.vehicle_type || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Navigation className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{trackingData.delivery_personnel?.vehicle_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{t("delivery.orderItems")}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-2/5 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.product")}</th>
                      <th className="w-1/5 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.category")}</th>
                      <th className="w-1/6 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.quantity")}</th>
                      <th className="w-1/6 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.price")}</th>
                      <th className="w-1/6 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.total")}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trackingData.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Image
                              width={150} // Specify the width
                              height={150} // Specify the height

                              src={item.product_image || '/placeholder-product.jpg'}
                              alt={item.product_name}
                              className="h-10 w-10 rounded-lg object-cover mr-4 flex-shrink-0" // was mr-3
                            />
                            <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {item.product_name}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{item.category_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{item.qty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatCurrency(item.product_price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t("delivery.deliveryTimeline")}</h3>
              </div>
              <div className="space-y-4">
                {trackingData.tracking?.map((track, index) => (
                  <div key={track.tracking_id} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(track.status)}`}>
                        {getStatusIcon(track.status)}
                      </div>
                      {index < (trackingData.tracking?.length || 0) - 1 && (
                        <div className="w-0.5 h-8 bg-gray-300 mx-auto mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                          {t(`delivery.status.${track.status}`) || track.status.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-500">{formatDate(track.timestamp)}</p>
                      </div>
                      {track.notes && (
                        <p className="text-sm text-gray-600 mt-1">{track.notes}</p>
                      )}
                      {track.delivery_person_name && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{track.delivery_person_name}</span>
                          {track.vehicle_type && (
                            <>
                              <span>•</span>
                              <span>{track.vehicle_type} ({track.vehicle_number})</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            {trackingData.payment && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{t("delivery.paymentInformation")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("delivery.method")}:</span>
                      <span className="font-medium text-gray-900 capitalize">{t(`paymentMethods.${trackingData.payment?.method}`) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("delivery.statuss")}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${trackingData.payment?.status === 'paid' ? 'bg-green-100 text-green-800' :
                          trackingData.payment?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {(t(`delivery.status.${trackingData.payment?.status}`) || 'unknown').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("delivery.amount")}:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(trackingData.payment?.amount || 0)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {trackingData.payment?.transaction_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t("delivery.transactionId")}:</span>
                        <span className="font-mono text-sm text-gray-900">{trackingData.payment.transaction_id}</span>
                      </div>
                    )}
                    {trackingData.payment?.processed_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t("delivery.processed")}:</span>
                        <span className="text-sm text-gray-900">{formatDate(trackingData.payment.processed_at)}</span>
                      </div>
                    )}
                    {trackingData.payment?.payment_notes && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t("delivery.notes")}:</span>
                        <span className="text-sm text-gray-900">{trackingData.payment.payment_notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !trackingData && !error && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t("delivery.noTrackingInformation")}</h3>
          <p className="text-gray-600">{t("delivery.enterOrderIdToView")}</p>
        </div>
      )}
    </div>
  );
} 