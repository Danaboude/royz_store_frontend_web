'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/controllers/admin/productsController';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorProducts, addVendorProduct, editVendorProduct, deleteVendorProduct, exportVendorProducts, getVendorSubscriptionStatus } from '@/services/vendor-api';
import ProductTable from '@/views/admin/ProductTable';
import ProductEditModal from '@/components/ProductEditModal';
import ProductAddModal from '@/components/ProductAddModal';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import ImportModal from '@/components/ImportModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import SubscriptionStatusBanner from '@/components/SubscriptionStatusBanner';
import RequireVendor from '@/middleware/requireVendor';
import { useI18n } from '@/contexts/I18nContext';
// Type for subscription status
interface SubscriptionStatus {
  hasSubscription: boolean;
  status: 'no_subscription' | 'expired' | 'active' |'pending';
  message: string;
  productLimit?: number;
  max_products?: number;
  currentProducts?: number;
  remainingProducts?: number;
  warningLevel?: 'none' | 'warning' | 'critical' | 'limit_reached';
  subscriptionDetails?: {
    package_name?: string;
    end_date?: string;
    max_products?: number;
    status?: string;
    payment_status?: string;
  };
}

export default function VendorProductsPage() {
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const PRODUCTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; productId: number | null; productName: string }>({ isOpen: false, productId: null, productName: '' });

  // Fetch vendor products with pagination and search
  const { data, isLoading, isError } = useQuery<{ products: Product[]; total: number }, Error>({
    queryKey: ['vendor-products', currentPage, searchTerm],
    queryFn: () => getVendorProducts({ page: currentPage, limit: PRODUCTS_PER_PAGE, search: searchTerm }),
  });
  const products = useMemo(() => data?.products  || [], [data]);
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  // Subscription/product limit state
  const { data: subscriptionStatus, isLoading: isSubStatusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['vendor-subscription-status'],
    queryFn: getVendorSubscriptionStatus,
    refetchInterval: 30000,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache
  });

 

  // Memoize product limit and reached state for performance
  const productLimit = useMemo(() => {
    if (!subscriptionStatus) return 0;
    const limit = subscriptionStatus.productLimit ?? subscriptionStatus.max_products ?? 0;
    console.log('📊 Product Limit Calculation:', {
      productLimit: subscriptionStatus.productLimit,
      max_products: subscriptionStatus.max_products,
      finalLimit: limit
    });
    return limit;
  }, [subscriptionStatus]);

  const productLimitReached = useMemo(() => {
    if (!subscriptionStatus) return false;
    const current = subscriptionStatus.currentProducts ?? 0;
    const limit = productLimit;
    const reached = (limit > 0 && current >= limit);
    const warning = subscriptionStatus.warningLevel === 'limit_reached';
    const result = reached || warning;
    console.log('🚫 Product Limit Reached Check (defensive):', {
      warningLevel: subscriptionStatus.warningLevel,
      productLimit: limit,
      currentProducts: current,
      reached,
      warning,
      result
    });
    return result;
  }, [subscriptionStatus, productLimit]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const addProductMutation = useMutation({
    mutationFn: (product: Product) => addVendorProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setIsAddModalOpen(false);
    },
  });

  const editProductMutation = useMutation({
    mutationFn: ({ id, product }: { id: number; product: Product }) => editVendorProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => deleteVendorProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-subscription-status'] });
      setDeleteDialog({ isOpen: false, productId: null, productName: '' });
    },
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = (productId: number) => {
    const product = products?.find(p => p.product_id === productId);
    if (product && product.product_id) {
      setDeleteDialog({ isOpen: true, productId: product.product_id, productName: product.name });
    }
  };

  const confirmDelete = async () => {
    if (deleteDialog.productId != null) {
      try {
        await deleteProductMutation.mutateAsync(deleteDialog.productId);
      } catch {
        // Optionally handle error
      }
    }
  };

  const handleView = (product: Product) => {
    setSelectedProductId(product.product_id || null);
    setIsDetailsModalOpen(true);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    editProductMutation.mutate({ id: updatedProduct.product_id, product: updatedProduct });
  };

  const handleExportProducts = async () => {
    try {
      setIsExporting(true);
      const blob = await exportVendorProducts();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vendor-products-export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Optionally handle error
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    setIsImportModalOpen(false);
  };

  // Normalize products to ensure all required fields are present
  const normalizedProducts = useMemo(() =>
    (products || []).map((p) => ({
      ...p,
      image_url: typeof p.image_url === 'string' ? p.image_url : '',
      is_new: p.is_new ?? false,
      is_best_selling: p.is_best_selling ?? false,
      is_deal_offer: p.is_deal_offer ?? false,
      created_at: p.created_at ?? '',
      updated_at: p.updated_at ?? '',
    })),
    [products]
  );

  return (
    <RequireVendor>
      <div className="min-h-screen bg-white relative">
        {subscriptionStatus?.status === 'no_subscription' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
              <h2 className="text-xl font-bold mb-4">{t('subscriptionPendingTitle') || 'Subscription Under Review'}</h2>
              <p className="mb-4 text-gray-700">{t('subscriptionPending') || 'Your subscription is under review. Please wait for approval.'}</p>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Subscription Status Banner */}
          {!isSubStatusLoading && <SubscriptionStatusBanner />}

         
          {/* Page Header */}
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('vendor.myProducts')}</h1>
              <p className="text-gray-600">{t('vendor.dashboard')}</p>
            </div>
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <button
                onClick={() => !productLimitReached && setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={productLimitReached}
                aria-disabled={productLimitReached}
                tabIndex={productLimitReached ? -1 : 0}
                style={productLimitReached ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                {t('admin.addProduct')}
              </button>
              <button
                onClick={handleExportProducts}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isExporting ? t('admin.export.processing') : t('admin.export.button')}
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors shadow-sm"
              >
                {t('admin.import.title')}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className={`relative max-w-md ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSearchTerm(inputValue); }}
              className={`block w-full ${isRTL ? 'pr-10' : 'pl-10'} py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
              placeholder={t('admin.searchProducts')}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-left">
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <span>{t('admin.errorLoadingProducts')}</span>
              </div>
            </div>
          )}

          {/* Products Table */}
          {normalizedProducts && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <ProductTable
                products={normalizedProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                {t('table.previous')}
              </button>
              <span className="px-4 py-2 mx-1 text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                {t('table.next')}
              </button>
            </div>
          )}

          {/* Add Modal */}
          {isAddModalOpen && !productLimitReached && (
            <ProductAddModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSave={() => {
                setIsAddModalOpen(false);
                queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
              }}
              isLoading={addProductMutation.isPending}
            />
          )}

          {/* Edit Modal */}
          {isEditModalOpen && selectedProduct && (
            <ProductEditModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedProduct(null);
              }}
              onSave={handleSaveProduct}
              product={selectedProduct}
              isLoading={editProductMutation.isPending}
            />
          )}

          {/* Details Modal */}
          <ProductDetailsModal
            productId={selectedProductId ?? null}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedProductId(null);
            }}
          />

          {/* Import Modal */}
          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSuccess}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={deleteDialog.isOpen}
            onClose={() => setDeleteDialog({ isOpen: false, productId: null, productName: '' })}
            onConfirm={confirmDelete}
            title={t('admin.confirmDelete')}
            message={`${t('admin.confirmDelete')} "${deleteDialog.productName}"?`}
            type="danger"
            isLoading={deleteProductMutation.isPending}
          />
        </div>
      </div>
    </RequireVendor>
  );
} 