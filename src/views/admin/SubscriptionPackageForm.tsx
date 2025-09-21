import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import {  SubscriptionPackage } from '@/services/admin-api';
import { subscriptionPackagesApi } from '@/services/api-client';

interface VendorType {
  vendor_type_id: number;
  name_en: string;
  name_ar: string;
}

interface SubscriptionPackageFormProps {
  initialData?: Partial<SubscriptionPackage>;
  onSubmit: (data: Omit<SubscriptionPackage, 'package_id' | 'created_at'>) => Promise<void>;
  loading?: boolean;
  readOnly?: boolean;
}

const defaultValues: Omit<SubscriptionPackage, 'package_id' | 'created_at'> = {
  vendor_type_id: 1,
  name_en: '',
  name_ar: '',
  description_en: '',
  description_ar: '',
  price: 0,
  duration_months: 1,
  features_en: '',
  features_ar: '',
  max_products: 1,
  commission_rate: 0.0,
   is_active: true,   // <-- boolean
  is_popular: false // <-- boolean
};

export default function SubscriptionPackageForm({ initialData, onSubmit, loading, readOnly }: SubscriptionPackageFormProps) {
  const { t, locale } = useI18n();
  const [form, setForm] = useState<Omit<SubscriptionPackage, 'package_id' | 'created_at'>>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setForm({ ...defaultValues, ...initialData });
    setErrors({});
    setSubmitting(false);
    subscriptionPackagesApi.getVendorTypes().then(res => {
      setVendorTypes(res.data || []);
    });
    setMounted(true);
  }, [initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name_en) errs.name_en = t('subscriptionPackages.validation.nameEn');
    if (!form.name_ar) errs.name_ar = t('subscriptionPackages.validation.nameAr');
    if (!form.price || form.price < 0) errs.price = t('subscriptionPackages.validation.price');
    if (!form.duration_months || form.duration_months < 1) errs.duration_months = t('subscriptionPackages.validation.duration');
    if (!form.vendor_type_id) errs.vendor_type_id = t('subscriptionPackages.validation.vendorType');
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | number | boolean = value;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      fieldValue = e.target.checked;
    } else if (type === 'number') {
      fieldValue = Number(value);
    }
    setForm((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        features_en: JSON.stringify(form.features_en?.split('\n').map(f => f.trim()).filter(Boolean) || []),
        features_ar: JSON.stringify(form.features_ar?.split('\n').map(f => f.trim()).filter(Boolean) || []),
      };
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`transition-all duration-500 ease-out
        ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        max-w-4xl mx-auto p-8 bg-white border border-gray-200 rounded-2xl shadow-2xl
        space-y-6 animate-fade-in`}
      style={{ boxShadow: '0 8px 32px 0 rgba(60,60,120,0.10)' }}
    >
      <div>
        <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.vendorType')}</label>
        <select
          name="vendor_type_id"
          value={form.vendor_type_id}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 border-gray-300"
          disabled={submitting || loading || readOnly}
        >
          {vendorTypes.map((vt) => (
            <option key={vt.vendor_type_id} value={vt.vendor_type_id}>
              {locale === 'ar' ? vt.name_ar : vt.name_en}
            </option>
          ))}
        </select>
        {errors.vendor_type_id && <div className="text-red-500 text-xs mt-1">{errors.vendor_type_id}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.nameEn')}</label>
          <input
            type="text"
            name="name_en"
            value={form.name_en}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.name_en ? 'border-red-500' : 'border-gray-300'}`}
            disabled={submitting || loading || readOnly}
          />
          {errors.name_en && <div className="text-red-500 text-xs mt-1">{errors.name_en}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.nameAr')}</label>
          <input
            type="text"
            name="name_ar"
            value={form.name_ar}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.name_ar ? 'border-red-500' : 'border-gray-300'}`}
            disabled={submitting || loading || readOnly}
            dir="rtl"
          />
          {errors.name_ar && <div className="text-red-500 text-xs mt-1">{errors.name_ar}</div>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.descriptionEn')}</label>
          <textarea
            name="description_en"
            value={form.description_en}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            disabled={submitting || loading || readOnly}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.descriptionAr')}</label>
          <textarea
            name="description_ar"
            value={form.description_ar}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            disabled={submitting || loading || readOnly}
            dir="rtl"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.price')}</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
            min={0}
            step={0.01}
            disabled={submitting || loading || readOnly}
          />
          {errors.price && <div className="text-red-500 text-xs mt-1">{errors.price}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.duration')}</label>
          <input
            type="number"
            name="duration_months"
            value={form.duration_months}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.duration_months ? 'border-red-500' : 'border-gray-300'}`}
            min={1}
            max={36}
            disabled={submitting || loading || readOnly}
          />
          {errors.duration_months && <div className="text-red-500 text-xs mt-1">{errors.duration_months}</div>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.maxProducts')}</label>
          <input
            type="number"
            name="max_products"
            value={form.max_products ?? ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            min={0}
            disabled={submitting || loading || readOnly}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.commissionRate')}</label>
          <input
            type="number"
            name="commission_rate"
            value={form.commission_rate ?? ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            min={0}
            max={100}
            step={0.01}
            disabled={submitting || loading || readOnly}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.featuresEn')}</label>
          <textarea
            name="features_en"
            value={form.features_en ? (Array.isArray(form.features_en) ? form.features_en.join('\n') : form.features_en.replace(/^\[|\]$/g, '').replace(/","/g, '\n').replace(/"/g, '')) : ''}
            onChange={handleFeaturesChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            disabled={submitting || loading || readOnly}
            placeholder={t('subscriptionPackages.featuresPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('subscriptionPackages.featuresAr')}</label>
          <textarea
            name="features_ar"
            value={form.features_ar ? (Array.isArray(form.features_ar) ? form.features_ar.join('\n') : form.features_ar.replace(/^\[|\]$/g, '').replace(/","/g, '\n').replace(/"/g, '')) : ''}
            onChange={handleFeaturesChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
            disabled={submitting || loading || readOnly}
            placeholder={t('subscriptionPackages.featuresPlaceholder')}
            dir="rtl"
          />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            disabled={submitting || loading || readOnly}
          />
          {t('subscriptionPackages.active')}
        </label>
       
      </div>
      {!readOnly && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            disabled={submitting || loading}
          >
            {submitting || loading ? t('admin.saving') : t('admin.saveChanges')}
          </button>
        </div>
      )}
    </form>
  );
} 