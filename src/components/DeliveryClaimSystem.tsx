"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Phone, User, Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { 
  useAvailableOrdersForClaim, 
  useMyClaimedOrders, 
  claimOrder, 
  cancelClaim,
  AvailableOrderForClaim,
  ClaimedOrder
} from '@/services/delivery-api';
import { useQueryClient } from '@tanstack/react-query';

interface DeliveryClaimSystemProps {
  activeTab: 'available' | 'claimed';
}

export default function DeliveryClaimSystem({ activeTab }: DeliveryClaimSystemProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  
  const [currentPage] = useState(1);
  const [claimingOrderId, setClaimingOrderId] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch data
  const { data: availableData, isLoading: availableLoading, refetch: refetchAvailable } = useAvailableOrdersForClaim(currentPage, 10);
  const { data: claimedData, isLoading: claimedLoading, refetch: refetchClaimed } = useMyClaimedOrders(currentPage, 10);

  const handleClaimOrder = async (orderId: number) => {
    try {
      setClaimingOrderId(orderId);
      setError('');
      
      await claimOrder(orderId);
      setSuccess(t('delivery.orderClaimedSuccess') as string);
      
      refetchAvailable();
      refetchClaimed();
      queryClient.invalidateQueries({ queryKey: ['delivery', 'my-deliveries'] });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError((error as Error).message || t('delivery.claimError') as string);
    } finally {
      setClaimingOrderId(null);
    }
  };

  const handleCancelClaim = async (orderId: number) => {
    try {
      setCancellingOrderId(orderId);
      setError('');
      
      await cancelClaim(orderId);
      setSuccess(t('delivery.claimCancelledSuccess') as string);
      
      refetchAvailable();
      refetchClaimed();
      queryClient.invalidateQueries({ queryKey: ['delivery', 'my-deliveries'] });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError((error as Error).message || t('delivery.cancelClaimError') as string);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString( 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat( 'en-US', {
      style: 'currency',
      currency: 'SYP'
    }).format(parseFloat(amount));
  };

  if (activeTab === 'available') {
    return (
      <div className="space-y-6">
        {/* Messages */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </motion.div>
        )}

        {/* Available Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              {t('delivery.availableOrders')}
            </h3>
          </div>

          {availableLoading ? (
            <div className="p-6 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{t('delivery.loading')}</p>
            </div>
          ) : availableData?.orders.length === 0 ? (
            <div className="p-6 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('delivery.noAvailableOrders')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {availableData?.orders.map((order: AvailableOrderForClaim) => (
                <motion.div key={order.order_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {t('delivery.order')} #{order.order_id}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(order.placed_at)}
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
                          <div className="flex items-center text-sm">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{order.delivery_phone}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">{t('delivery.total')}: </span>
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{t('delivery.deliveryFee')}: </span>
                            <span>{formatCurrency(order.delivery_fee)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{t('delivery.zone')}: </span>
                            <span>{order.zone_name_ar}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleClaimOrder(order.order_id)}
                      disabled={claimingOrderId === order.order_id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {claimingOrderId === order.order_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {t('delivery.claiming')}
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4 mr-2" />
                          {t('delivery.claimOrder')}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Claimed Orders Tab
  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </motion.div>
      )}

      {/* Claimed Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            {t('delivery.myClaimedOrders')}
          </h3>
        </div>

        {claimedLoading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{t('delivery.loading')}</p>
          </div>
        ) : claimedData?.orders.length === 0 ? (
          <div className="p-6 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('delivery.noClaimedOrders')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {claimedData?.orders.map((order: ClaimedOrder) => (
              <motion.div key={order.order_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {t('delivery.order')} #{order.order_id}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.claim_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.claim_status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          <span>{t(`delivery.${order.claim_status}`)}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(order.claimed_at)}
                        </span>
                      </div>
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
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{order.delivery_phone}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">{t('delivery.total')}: </span>
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{t('delivery.deliveryFee')}: </span>
                          <span>{formatCurrency(order.delivery_fee)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{t('delivery.zone')}: </span>
                          <span>{order.zone_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  {order.claim_status === 'approved' && (
                    <button
                      onClick={() => handleCancelClaim(order.order_id)}
                      disabled={cancellingOrderId === order.order_id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {cancellingOrderId === order.order_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {t('delivery.cancelling')}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {t('delivery.cancelClaim')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 