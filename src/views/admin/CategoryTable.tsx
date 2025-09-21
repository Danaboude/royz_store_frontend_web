'use client';

import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface Category {
  category_id: number;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  created_at?: string;
  order: number;
}

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: number) => void;
  onReorder: (newOrder: number[]) => void;
}

export type { Category };
export default function CategoryTable({ categories, onEdit, onDelete, onReorder }: CategoryTableProps) {
  const { locale, t } = useI18n();
  const isRTL = locale === 'ar';
  const [sortField, setSortField] = useState<'name_en' | 'name_ar' | 'created_at'>(isRTL ? 'name_ar' : 'name_en');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name_en' | 'name_ar' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const moveCategory = (index: number, direction: -1 | 1) => {
    const newCategories = [...sortedCategories];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    // Swap
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    onReorder(newCategories.map(cat => cat.category_id));
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('categories.id')}</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('categories.order') || 'Order'}</th>
              <th 
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => handleSort(isRTL ? 'name_ar' : 'name_en')}
              >
                {t('categories.name_en')}
              </th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('categories.description_en')}</th>
              <th 
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => handleSort('created_at')}
              >
                {t('admin.created') || 'Created'}
              </th>
              <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCategories.map((category, idx) => (
              <tr key={category.category_id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-500">{category.category_id}</td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{category.order + 1}</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        className="text-gray-400 hover:text-gray-700 p-0.5 disabled:opacity-30"
                        onClick={() => moveCategory(idx, -1)}
                        disabled={idx === 0}
                        title="Move up"
                        aria-label="Move up"
                      >▲</button>
                      <button
                        className="text-gray-400 hover:text-gray-700 p-0.5 disabled:opacity-30"
                        onClick={() => moveCategory(idx, 1)}
                        disabled={idx === sortedCategories.length - 1}
                        title="Move down"
                        aria-label="Move down"
                      >▼</button>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}> 
                  <div className="text-sm font-medium text-gray-900">{isRTL ? category.name_ar : category.name_en}</div>
                </td>
                <td className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}> 
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {isRTL ? (category.description_ar || 'لا يوجد وصف') : (category.description_en || 'No description')}
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}> 
                  {category.created_at ? new Date(category.created_at).toLocaleDateString() : ''}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}> 
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(category)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(category.category_id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedCategories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t('categories.noCategoriesFound')}
        </div>
      )}
    </div>
  );
} 