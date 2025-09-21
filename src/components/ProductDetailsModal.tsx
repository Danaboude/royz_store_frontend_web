'use client';

import { useState } from 'react';
import { X, Eye, Star, ShoppingCart, Users, DollarSign, Package, TrendingUp, Image as ImageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProductDetails } from '@/services/admin-api';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ProductDetailsModalProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProductDetails {
  product_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category_id: number;
  vendor_id: number;
  is_new: boolean;
  is_best_selling: boolean;
  is_deal_offer: boolean;
  original_price?: number;
  discount_percentage?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  final_price?: number;
  has_active_discount?: boolean;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_name_ar: string;
  vendor_name: string;
  vendor_email: string;
  vendor_phone: string;
  vendor_role_id: number;
  vendor_role_name: string;
  vendor_type_name: string;
  commission_rate: number;
  subscription_status: string;
  package_name: string;
  media: Array<{
    media_id: number;
    product_id: number;
    media_url: string;
    media_type: string;
    created_at: string;
  }>;
  sales_statistics: {
    total_orders: number;
    total_quantity_sold: number;
    total_revenue: number;
    avg_order_value: number;
    unique_customers: number;
  };
  recent_orders: Array<{
    order_id: number;
    total_price: number;
    order_date: string;
    order_status: string;
    customer_name: string;
    customer_email: string;
  }>;
  reviews: Array<{
    review_id: number;
    product_id: number;
    customer_id: number;
    rating: number;
    comment: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
  }>;
  vendor_performance: {
    total_vendor_products: number;
    new_products: number;
    best_selling_products: number;
    deal_products: number;
  };
}

export default function ProductDetailsModal({ productId, isOpen, onClose }: ProductDetailsModalProps) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'reviews' | 'orders' | 'media'>('overview');

  const { data: productDetails, isLoading, error } = useQuery<ProductDetails>({
    queryKey: ['product-details', productId],
    queryFn: () => getProductDetails(productId!),
    enabled: isOpen && productId !== null,
  });

  const isRTL = locale === 'ar';

  const tabs = [
    { id: 'overview', label: t('admin.overview'), icon: Eye },
    { id: 'sales', label: t('admin.sales'), icon: TrendingUp },
    { id: 'reviews', label: t('admin.reviews'), icon: Star },
    { id: 'orders', label: t('admin.orders'), icon: ShoppingCart },
    { id: 'media', label: t('admin.media'), icon: ImageIcon },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVendorRoleColor = (roleId: number) => {
    switch (roleId) {
      case 1: return 'bg-purple-100 text-purple-800';
      case 3: return 'bg-blue-100 text-blue-800';
      case 4: return 'bg-green-100 text-green-800';
      case 5: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50"
      >
        <div
          className="flex items-center justify-center min-h-screen p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`relative bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full max-w-6xl max-h-[90vh] flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gray-50 px-6 py-4 border-b border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isLoading ? t('admin.loading') : productDetails?.name || 'Product Details'}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading State */}
              {isLoading && (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{t('admin.loadingProductDetails')}</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-8 text-center">
                  <div className="text-red-600 mb-4">
                    <X className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600">{t('admin.errorLoadingProduct')}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Product Details Content */}
              {productDetails && !isLoading && !error && (
                <>
                  {/* Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} -mb-px`}>
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'overview' | 'sales' | 'reviews' | 'orders' | 'media')}
                            className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              } ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <Icon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Product Information */}
                        <div className={`rounded-xl border bg-white/90 shadow mb-8 p-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Package className="w-7 h-7 text-blue-500" />
                            <h4 className="text-xl font-bold text-blue-900">{t('admin.productInformation')}</h4>
                          </div>
                          <div className="px-6 pb-6 pt-2 grid grid-cols-1 gap-y-4">
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.name')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{productDetails.name}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.category')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{productDetails.category_name}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.description')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{productDetails.description}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.price')}</div>
                              <div className="text-green-700 font-bold text-lg whitespace-pre-line break-words">{formatPrice(productDetails.final_price || productDetails.price, locale)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.stock')}</div>
                              <div className={`font-bold text-lg whitespace-pre-line break-words ${productDetails.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{productDetails.stock}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.created')}</div>
                              <div className="text-gray-900 whitespace-pre-line break-words">{new Date(productDetails.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>

                        {/* Vendor Information */}
                        <div className={`rounded-xl border bg-white/90 shadow mb-8 p-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Users className="w-7 h-7 text-green-500" />
                            <h4 className="text-xl font-bold text-green-900">{t('admin.vendorInformation')}</h4>
                          </div>
                          <div className="px-6 pb-6 pt-2 grid grid-cols-1 gap-y-4">
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.name')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{productDetails.vendor_name}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.email')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{productDetails.vendor_email}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.phone')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{productDetails.vendor_phone}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.role')}</div>
                              <div className={`font-semibold whitespace-pre-line break-words ${getVendorRoleColor(productDetails.vendor_role_id)}`}>{productDetails.vendor_role_name}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.type')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{t(`vendorType.${productDetails.vendor_type_name}`)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.commission')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{productDetails.commission_rate}%</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-sm font-medium mb-1">{t('admin.subscription')}</div>
                              <div className="text-gray-900 font-semibold whitespace-pre-line break-words">{t(`vendorStatus.${productDetails.subscription_status}`)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sales Tab */}
                    {activeTab === 'sales' && (
                      <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-gray-900">{t('admin.salesStatistics')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                              <ShoppingCart className="w-8 h-8 text-blue-600" />
                              <div className={isRTL ? 'mr-3' : 'ml-3'}>
                                <div className="text-2xl font-bold text-blue-600">{productDetails.sales_statistics.total_orders}</div>
                                <div className="text-sm text-blue-600">{t('admin.totalOrders')}</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                              <Package className="w-8 h-8 text-green-600" />
                              <div className={isRTL ? 'mr-3' : 'ml-3'}>
                                <div className="text-2xl font-bold text-green-600">{productDetails.sales_statistics.total_quantity_sold}</div>
                                <div className="text-sm text-green-600">{t('admin.quantitySold')}</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                              <DollarSign className="w-8 h-8 text-yellow-600" />
                              <div className={isRTL ? 'mr-3' : 'ml-3'}>
                                <div className="text-2xl font-bold text-yellow-600">{formatPrice(productDetails.sales_statistics.total_revenue, locale)}</div>
                                <div className="text-sm text-yellow-600">{t('admin.totalRevenue')}</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                              <Users className="w-8 h-8 text-purple-600" />
                              <div className={isRTL ? 'mr-3' : 'ml-3'}>
                                <div className="text-2xl font-bold text-purple-600">{productDetails.sales_statistics.unique_customers}</div>
                                <div className="text-sm text-purple-600">{t('admin.uniqueCustomers')}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                      <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-gray-900">{t('admin.reviews')} ({productDetails.reviews.length})</h4>
                        {productDetails.reviews.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            {t('admin.noReviews')}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {productDetails.reviews.map((review) => (
                              <div key={review.review_id} className="bg-gray-50 rounded-lg p-4">
                                <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                    <span className={`text-sm font-medium text-gray-900 ${isRTL ? 'mr-2' : 'ml-2'}`}>{review.customer_name}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="mt-2 text-gray-700">{review.comment}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                      <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-gray-900">{t('admin.recentOrders')} ({productDetails.recent_orders.length})</h4>
                        {productDetails.recent_orders.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            {t('admin.noOrders')}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('admin.orderId')}
                                  </th>
                                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('admin.customer')}
                                  </th>
                                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('admin.total')}
                                  </th>
                                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('admin.status')}
                                  </th>
                                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('admin.date')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {productDetails.recent_orders.map((order) => (
                                  <tr key={order.order_id}>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                                      #{order.order_id}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                                      {order.customer_name}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                                      {formatPrice(order.total_price, locale)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                                        {order.order_status}
                                      </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                                      {new Date(order.order_date).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                      <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-gray-900">{t('admin.productMedia')} ({productDetails.media.length})</h4>
                        {productDetails.media.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            {t('admin.noMedia')}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {productDetails.media.map((media) => {
                              // Helper to check if URL is YouTube
                              const isYouTube = (url: string) =>
                                /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
                              // Helper to check if URL is a video file
                              const isVideoFile = (url: string) =>
                                /\.(mp4|webm|ogg)$/i.test(url);
                              return (
                                <div key={media.media_id} className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                                  {media.media_type === 'image' ? (
                                    <Image
                                      width={150} // Specify the width
                                      height={150} // Specify the height
                                      src={media.media_url}
                                      alt={`Product media ${media.media_id}`}
                                      className="w-full h-32 object-cover rounded-lg mb-2"
                                    />
                                  ) : media.media_type === 'video' ? (
                                    isYouTube(media.media_url) ? (
                                      <iframe
                                        width="100%"
                                        height="180"
                                        src={
                                          media.media_url.includes('embed')
                                            ? media.media_url
                                            : media.media_url.replace('watch?v=', 'embed/')
                                        }
                                        title={`YouTube video ${media.media_id}`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full rounded-lg mb-2"
                                      ></iframe>
                                    ) : isVideoFile(media.media_url) ? (
                                      <video
                                        src={media.media_url}
                                        controls
                                        className="w-full h-32 object-cover rounded-lg mb-2"
                                      >
                                        {t('admin.videoNotSupported')}
                                      </video>
                                    ) : (
                                      <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-lg mb-2 text-gray-500">
                                        {t('admin.unsupportedVideoFormat')}
                                      </div>
                                    )
                                  ) : (
                                    <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-lg mb-2 text-gray-500">
                                      {t('admin.unknownMediaType')}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-600">
                                    {media.media_type} - {new Date(media.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('admin.close')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 