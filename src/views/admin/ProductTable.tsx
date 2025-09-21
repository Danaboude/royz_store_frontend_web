'use client';

import { useState } from 'react';
import { Edit, Trash2, Eye, Tag, Star, Zap, ToggleRight } from 'lucide-react';
import { Product } from '@/controllers/admin/productsController';
import { useI18n } from '@/contexts/I18nContext';
import { MotionContainer } from '@/components/Motion';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';


interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  onView: (product: Product) => void;
  showDeleted?: boolean; // NEW
}

export default function ProductTable({ products, onEdit, onDelete, onView, showDeleted = false }: ProductTableProps) {
  const { t, locale } = useI18n();
  const [sortField, setSortField] = useState<keyof Product>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[sortField] as string | number;
    const bValue = b[sortField] as string | number;

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const isRTL = locale === 'ar';

  return (
    <MotionContainer className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}>
          <thead className="bg-gray-50">
            <tr>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => handleSort('product_id')}
              >
                {t('admin.productId') || 'ID'}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => handleSort('name')}
              >
                {t('admin.productName')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => handleSort('price')}
              >
                {t('admin.price')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => handleSort('stock')}
              >
                {t('admin.stock')}
              </th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('admin.specialCategories')}
              </th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('admin.status')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => handleSort('created_at')}
              >
                {t('admin.created')}
              </th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-left' : 'text-right'}`}>
                {t('admin.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product) => (
              <motion.tr
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <span className="font-mono text-gray-600">#{product.product_id}</span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center ${'flex-row'}`}>
                    <div className="h-10 w-10 flex-shrink-0">
                      <Image
                        width={150} // Specify the width
                        height={150} // Specify the height
                        className="h-10 w-10 rounded-lg object-cover"
                        src={product.image_url || '/placeholder-product.jpg'}
                        alt={product.name}
                      />
                    </div>
                    <div className={isRTL ? 'mr-4' : 'ml-4'}>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div>
                    <div className="font-medium">{formatPrice(product.final_price || product.price, locale)}</div>
                    {product.has_active_discount && product.original_price && (
                      <div className="text-xs text-gray-500 line-through">{formatPrice(product.original_price, locale)}</div>
                    )}
                    {product.discount_percentage && (
                      <div className="text-xs text-green-600 font-medium">
                        -{product.discount_percentage}% OFF
                      </div>
                    )}
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {product.stock ?? 0}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                  {(() => {
                    const categories = [];
                    if (product.is_new) {
                      categories.push(
                        <span key="new" className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          <Zap className="w-3 h-3 mr-1" />
                          New
                        </span>
                      );
                    }
                    if (product.is_best_selling) {
                      categories.push(
                        <span key="best" className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          <Star className="w-3 h-3 mr-1" />
                          Best
                        </span>
                      );
                    }
                    if (product.is_deal_offer) {
                      categories.push(
                        <span key="deal" className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          <Tag className="w-3 h-3 mr-1" />
                          Deal
                        </span>
                      );
                    }

                    return categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {categories}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    );
                  })()}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.stock > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {product.stock > 0 ? t('admin.inStock') : t('admin.outOfStock')}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {product.created_at ? new Date(product.created_at).toLocaleDateString() : ''}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isRTL ? 'text-left' : 'text-right'}`}>
                  <div className={`flex items-center ${isRTL ? 'justify-start space-x-reverse space-x-2' : 'justify-end space-x-2'}`}>
                    <button
                      onClick={() => onView(product)}
                      className="text-blue-600 hover:text-blue-900 p-1 transition-colors duration-200"
                      title={t('admin.view')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!showDeleted && (
                      <>
                        <button
                          onClick={() => onEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 transition-colors duration-200"
                          title={t('admin.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product.product_id ?? 0)}
                          className="text-red-600 hover:text-red-900 p-1 transition-colors duration-200"
                          title={t('admin.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {showDeleted && (
                      <button
                        onClick={() => onDelete(product.product_id ?? 0)}
                        className="text-green-600 hover:text-green-900 p-1 transition-colors duration-200"
                        title={t('admin.restore')}
                      >
                        <ToggleRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t('admin.noProductsFound')}
        </div>
      )}
    </MotionContainer>
  );
} 