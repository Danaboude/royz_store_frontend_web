import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import type { Category } from '@/views/admin/CategoryTable';

interface CategoryFormModalProps {
  category?: Category | null;
  onClose: () => void;
  onSave: (data: Omit<Category, 'category_id' | 'order' | 'created_at'>) => void;
  isLoading?: boolean;
}

export default function CategoryFormModal({ category, onClose, onSave, isLoading }: CategoryFormModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (category) {
      setForm({
        name_en: category.name_en || '',
        name_ar: category.name_ar || '',
        description_en: category.description_en || '',
        description_ar: category.description_ar || '',
      });
    } else {
      setForm({ name_en: '', name_ar: '', description_en: '', description_ar: '' });
    }
  }, [category]);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.name_en.trim()) errs.name_en = t('categories.name_en_required');
    if (!form.name_ar.trim()) errs.name_ar = t('categories.name_ar_required');
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-bold mb-4">
          {category ? t('categories.edit') : t('categories.add')}
        </h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t('categories.name_en')}
            <span className="text-red-500">*</span>
          </label>
          <input
            name="name_en"
            value={form.name_en}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.name_en ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {errors.name_en && <div className="text-red-500 text-xs mt-1">{errors.name_en}</div>}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t('categories.name_ar')}
            <span className="text-red-500">*</span>
          </label>
          <input
            name="name_ar"
            value={form.name_ar}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.name_ar ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
            dir="rtl"
          />
          {errors.name_ar && <div className="text-red-500 text-xs mt-1">{errors.name_ar}</div>}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t('categories.description_en')}
          </label>
          <textarea
            name="description_en"
            value={form.description_en}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={2}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t('categories.description_ar')}
          </label>
          <textarea
            name="description_ar"
            value={form.description_ar}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={2}
            disabled={isLoading}
            dir="rtl"
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={isLoading}
          >
            {t('categories.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            disabled={isLoading}
          >
            {category ? t('categories.save') : t('categories.add')}
          </button>
        </div>
      </form>
    </div>
  );
} 