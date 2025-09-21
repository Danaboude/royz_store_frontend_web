"use client";

import { useState, useEffect } from 'react';
import ProductTable from '@/views/admin/ProductTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProducts, updateProduct, deleteProduct, createProduct, exportProductsToExcel, restoreProduct } from '@/services/admin-api';
import ProductEditModal from '@/components/ProductEditModal';
import ProductAddModal from '@/components/ProductAddModal';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { MotionContainer, MotionItem } from '@/components/Motion';
import { Plus, Search, Download, Upload, ToggleLeft, ToggleRight } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useUser } from '@/contexts/UserContext';
import { Product as ProductTableData } from '@/controllers/admin/productsController';
import ImportModal from '@/components/ImportModal';
import LoadingSpinner from '@/components/LoadingSpinner';

// Type definitions for modal components
interface ModalProduct {
  product_id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  vendor_id: number;
  image_url?: string;
  is_new?: boolean;
  is_best_selling?: boolean;
  is_deal_offer?: boolean;
  original_price?: number;
  discount_percentage?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export default function ProductManagerProductsPage() {
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const { user, isLoggedIn } = useUser();
  const isRTL = locale === 'ar';
  
  const PRODUCTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductTableData | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false); // NEW
  
  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    productId: number | null;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    productName: ''
  });

  // Fetch products with server-side pagination, search, and deleted filter
  const { data, isLoading, isError, error: queryError } = useQuery<{ products: ProductTableData[]; total: number }, Error>({
    queryKey: ['admin-products', currentPage, searchTerm, showDeleted],
    queryFn: () => getAdminProducts({ page: currentPage, limit: PRODUCTS_PER_PAGE, search: searchTerm, deleted: showDeleted ? 1 : 0 }),
  });
  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Debug log to help troubleshoot authentication issues
  console.log('Auth Debug:', { 
    isLoggedIn, 
    userRole: user?.roleId, 
    user: user,
    token: typeof window !== 'undefined' ? localStorage.getItem('token')?.substring(0, 20) + '...' : 'no token' 
  });
  
  const updateProductMutation = useMutation({
    mutationFn: ({ id, product }: { id: number; product: ProductTableData }) => updateProduct(id, product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });
  
  const createProductMutation = useMutation({
    mutationFn: (product: ProductTableData) => createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsAddModalOpen(false);
    },
  });
  
  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const restoreProductMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const handleEdit = (product: ProductTableData) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = (productId: number) => {
    const product = products?.find(p => p.product_id === productId);
    if (product) {
      if (showDeleted) {
        // Restore product
        restoreProductMutation.mutate(productId);
      } else {
        setDeleteDialog({
          isOpen: true,
          productId: product.product_id,
          productName: product.name
        });
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteDialog.productId) {
      try {
        await deleteProductMutation.mutateAsync(deleteDialog.productId);
        setDeleteDialog({ isOpen: false, productId: null, productName: '' });
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleView = (product: ProductTableData) => {
    setSelectedProductId(product.product_id);
    setIsDetailsModalOpen(true);
  };

  const handleSaveProduct = async (updatedProduct: ModalProduct) => {
    try {
      if (!updatedProduct.product_id) {
        throw new Error('Product ID is required');
      }
      await updateProductMutation.mutateAsync({ 
        id: updatedProduct.product_id, 
        product: updatedProduct as ProductTableData 
      });
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleExportProducts = async () => {
    try {
      setIsExporting(true);
      const blob = await exportProductsToExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products-export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting products:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    setIsImportModalOpen(false);
  };

  // Check if user has admin role (roleId 1), vendor roles (roleId 3, 4, 5), or product manager role (roleId 11)
  if (user?.roleId !== 1 && user?.roleId !== 3 && user?.roleId !== 4 && user?.roleId !== 5 && user?.roleId !== 11) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('admin.accessDenied')}</h2>
            <p className="text-gray-600 mb-6">{t('admin.accessDeniedMessage')}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('admin.goHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !products) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <MotionContainer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <MotionItem>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('products')}</h1>
              <p className="text-gray-600">{t('admin.productsManagementDesc')}</p>
            </div>
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Toggle for Active/Deleted */}
              <button
                onClick={() => setShowDeleted((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm ${showDeleted ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                title={showDeleted ? t('admin.showActiveProducts') : t('admin.showDeletedProducts')}
              >
                {showDeleted ? <ToggleLeft className="w-5 h-5 text-red-500" /> : <ToggleRight className="w-5 h-5 text-green-500" />}
                {showDeleted ? t('admin.showActiveProducts') : t('admin.showDeletedProducts')}
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('admin.addProduct')}
              </button>
              <button
                onClick={handleExportProducts}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                {isExporting ? t('admin.export.processing') : t('admin.exportExcel')}
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                {t('admin.importExcel')}
              </button>
            </div>
          </div>
        </MotionItem>

        {/* Search Bar */}
        <MotionItem>
          <div className={`relative max-w-md ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearchTerm(inputValue);
              }}
              className={`block w-full ${isRTL ? 'pr-10' : 'pl-10'} py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
              placeholder={t('admin.searchProducts')}
            />
          </div>
        </MotionItem>

        {/* Loading State */}
        {isLoading && (
          <MotionItem>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </MotionItem>
        )}

        {/* Error State */}
        {isError && (
          <MotionItem>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center justify-center space-x-2 text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{t('admin.errorLoadingProducts')}: {queryError?.message || t('admin.unknownError')}</span>
            </div>
            </div>
          </MotionItem>
        )}

        {/* Products Table */}
        {products && (
          <MotionItem>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <ProductTable
                products={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                showDeleted={showDeleted}
              />
            </div>
          </MotionItem>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <MotionItem>
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
          </MotionItem>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <ProductAddModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={() => {
              setIsAddModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            }}
            isLoading={createProductMutation.isPending}
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
            isLoading={updateProductMutation.isPending}
          />
        )}

        {/* Details Modal */}
        <ProductDetailsModal
          productId={selectedProductId}
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
      </MotionContainer>
    </div>
  );
} 