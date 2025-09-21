'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Image as ImageIcon, Tag, Percent } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { createProduct, createProductWithMedia, uploadMediaWithoutProduct, getAdminCategories, getAdminUsers } from '@/services/admin-api';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';
import ImageWithFallback from './ImageWithFallback';

// Define Product interface locally to avoid import issues
interface NewProduct {
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
  [key: string]: unknown;
}

interface ProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isLoading: boolean;
}

interface Category {
  category_id: number;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
}

// UserType for vendor extraction
type UserType = { user_id: number; name: string; email?: string; role_id?: number|string; roleId?: number|string; role?: number|string; roleID?: number|string };

export default function ProductAddModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading 
}: ProductAddModalProps) {
  const [formData, setFormData] = useState<NewProduct>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category_id: 0,
    vendor_id: 0, // 0 means not selected
    is_new: false,
    is_best_selling: false,
    is_deal_offer: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newImages, setNewImages] = useState<{ type: 'file' | 'url'; value: File | string }[]>([]);
  const [newVideos, setNewVideos] = useState<{ type: 'file' | 'url'; value: File | string }[]>([]);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { user } = useUser();
  const [vendors, setVendors] = useState<{ user_id: number; name: string; email?: string }[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (user?.roleId === 1) {
        fetchVendors();
      }
      // For vendor role 4, set default category and stock
      if (user?.roleId === 4) {
        setFormData((prev) => ({
          ...prev,
          category_id: 14,
          stock: 1,
        }));
      }
    }
  }, [isOpen, user]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const categoriesData = await getAdminCategories();
      // Ensure categoriesData is an array
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set empty array on error
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const users = await getAdminUsers();
            // Robustly extract the user array from the response
      let usersArr: UserType[] = [];
      if (Array.isArray(users)) {
        usersArr = users;
      } else if (users && typeof users === 'object') {
        // Find the first array property in the object
        const arrProp = Object.values(users).find(Array.isArray);
        if (Array.isArray(arrProp)) {
          usersArr = arrProp as UserType[];
        }
      }
            if (usersArr.length > 0) {
              }
      const vendorList: { user_id: number; name: string; email?: string }[] = usersArr
        .filter((u) => {
          const role = Number(u.role_id ?? u.roleId ?? u.role ?? u['roleID'] ?? 0);
          return [3, 4, 5].includes(role);
        })
        .map((u) => ({
          user_id: u.user_id,
          name: u.name,
          email: u.email
        }));
            setVendors(vendorList);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleInputChange = (field: keyof NewProduct, value: unknown) => {
    setFormData((prev: NewProduct) => {
      if (field === 'vendor_id') {
        let numValue = 0;
        if (typeof value === 'number' && !isNaN(value)) {
          numValue = value;
        } else if (typeof value === 'string' && value !== '') {
          const parsed = Number(value);
          numValue = !isNaN(parsed) ? parsed : 0;
        }
        return { ...prev, [field]: numValue };
      }
      
      // For role ID 4, enforce defaults but allow other fields to change
      if (user?.roleId === 4) {
        return { 
          ...prev, 
          [field]: value,
          category_id: 14, 
          stock: 1 
        };
      }
      
      return { ...prev, [field]: value };
    });
    
    // Clear error for this field
    if (errors[field as string]) {
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [field as string]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    // Skip stock and category validation for role ID 4
    if (user?.roleId !== 4) {
      if (formData.stock !== undefined && formData.stock < 0) {
        newErrors.stock = 'Stock cannot be negative';
      }

      if (!formData.category_id) {
        newErrors.category_id = 'Category is required';
      }
    }

    if (formData.discount_percentage !== undefined) {
      if (formData.discount_percentage < 0 || formData.discount_percentage > 100) {
        newErrors.discount_percentage = 'Discount must be between 0 and 100';
      }
      if (formData.discount_percentage > 0 && !formData.discount_start_date) {
        newErrors.discount_start_date = 'Start date is required when discount is set';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // If admin, ensure vendor_id is set from dropdown
        if (user?.roleId === 1) {
          if (!formData.vendor_id || formData.vendor_id === 0) {
            alert('Please select a vendor.');
            return;
          }
        } else {
          formData.vendor_id = user?.id ?? 0;
        }

        // Debug: log the payload being sent
                if (!formData.name?.trim() || !formData.price || formData.price <= 0) {
          alert('Product name and a valid price are required.');
          return;
        }

        // Check if we have files to upload
        const filesToUpload = [
          ...newImages.filter(img => img.type === 'file').map(img => img.value as File),
          ...newVideos.filter(video => video.type === 'file').map(video => video.value as File)
        ];

        let mediaData: Array<{ url: string; type: 'image' | 'video' }> = [];
        const updatedFormData = { ...formData };

        if (filesToUpload.length > 0) {
          // Upload files first to get permanent URLs
          const uploadedMedia = await uploadMediaWithoutProduct(filesToUpload);
          mediaData = uploadedMedia.map(media => ({ url: media.url, type: media.type }));

          // Set main image if we have uploaded images
          const firstUploadedImage = uploadedMedia.find(media => media.type === 'image');
          if (firstUploadedImage) {
            const productWithImage = { ...updatedFormData, image_url: firstUploadedImage.url };
            await createProductWithMedia(productWithImage, mediaData);
            toast.success(t('admin.productEdit.productSavedSuccessfully'), { position: 'top-left', duration: 3000 });
          } else {
            await createProductWithMedia(updatedFormData, mediaData);
            toast.success(t('admin.productEdit.productSavedSuccessfully'), { position: 'top-left', duration: 3000 });
          }
        } else {
          // No files to upload, just create product with URL media
          const urlMedia = [
            ...newImages.filter(img => img.type === 'url').map(img => ({ 
              url: img.value as string, 
              type: 'image' as const 
            })),
            ...newVideos.filter(video => video.type === 'url').map(video => ({ 
              url: video.value as string, 
              type: 'video' as const 
            }))
          ];

          if (urlMedia.length > 0) {
            // Set main image if we have URL images
            const firstUrlImage = urlMedia.find(media => media.type === 'image');
            if (firstUrlImage) {
              const productWithImage = { ...updatedFormData, image_url: firstUrlImage.url };
              await createProductWithMedia(productWithImage, urlMedia);
              toast.success(t('admin.productEdit.productSavedSuccessfully'), { position: 'top-left', duration: 3000 });
            } else {
              await createProductWithMedia(updatedFormData, urlMedia);
              toast.success(t('admin.productEdit.productSavedSuccessfully'), { position: 'top-left', duration: 3000 });
            }
          } else {
            // No media at all, just create product
            await createProduct(updatedFormData);
            toast.success(t('admin.productEdit.productSavedSuccessfully'), { position: 'top-left', duration: 3000 });
          }
        }

        onSave();
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: 0,
          stock: 0,
          category_id: 0,
          vendor_id: (user?.roleId === 1 ? 0 : (typeof user?.id === 'number' ? user.id : 0)),
          is_new: false,
          is_best_selling: false,
          is_deal_offer: false
        });
        setNewImages([]);
        setNewVideos([]);
        setErrors({});
      } catch (error: unknown) {
        console.error('Error creating product:', error);
        let errorMessage = 'Failed to create product';
        if (typeof error === 'object' && error && 'response' in error && typeof (error as { response?: { status?: number; data?: { error?: string } } }).response?.status === 'number') {
          const err = error as { response?: { status?: number; data?: { error?: string } } };
          if (err.response?.status === 403) {
            toast.error(t('subscription.limitReachedMessage'), { position: 'top-center', duration: 4000 });
            return;
          } else if (err.response?.status === 401) {
            errorMessage = t('admin.authFailed') || 'Authentication failed. Please log in again.';
          } else if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
          }
        } else if (error instanceof Error && error.message) {
          errorMessage = error.message;
        }
        toast.error(errorMessage, { position: 'top-center', duration: 4000 });
      }
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setNewImages(prev => [...prev, { type: 'url', value: newImageUrl.trim() }]);
      setNewImageUrl('');
      setShowImageUrlInput(false);
    }
  };

  const handleAddVideoUrl = () => {
    if (newVideoUrl.trim()) {
      setNewVideos(prev => [...prev, { type: 'url', value: newVideoUrl.trim() }]);
      setNewVideoUrl('');
      setShowVideoUrlInput(false);
    }
  };

  const handleUploadImages = (files: FileList | null) => {
    if (files) {
      const newImages = Array.from(files).map(file => ({ type: 'file' as const, value: file }));
      setNewImages(prev => [...prev, ...newImages]);
    }
  };

  const handleUploadVideos = (files: FileList | null) => {
    if (files) {
      const newVideos = Array.from(files).map(file => ({ type: 'file' as const, value: file }));
      setNewVideos(prev => [...prev, ...newVideos]);
    }
  };

  const handleRemoveNewImage = (idx: number) => setNewImages(prev => prev.filter((_, i) => i !== idx));
  const handleRemoveNewVideo = (idx: number) => setNewVideos(prev => prev.filter((_, i) => i !== idx));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50"
      >
        <div className="flex items-center justify-center min-h-screen p-4" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`relative bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full max-w-5xl max-h-[90vh] flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gray-50 px-6 py-4 border-b border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('addProduct') || 'Add New Product'}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Product Info Card */}
              <div className={`rounded-xl border bg-white/90 shadow p-0 ${isRTL ? 'text-right' : 'text-left'}`}> 
                <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}> 
                  <Package className="w-7 h-7 text-blue-500" />
                  <h4 className="text-xl font-bold text-blue-900">{t('admin.productInformation')}</h4>
                </div>
                <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.productName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      disabled={isLoading}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{t(errors.name)}</p>}
                  </div>
                  {user?.roleId !== 4 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.category')} *
                      </label>
                      <select
                        value={formData.category_id || ''}
                        onChange={e => handleInputChange('category_id', Number(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.category_id ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isLoading || isLoadingCategories}
                      >
                        <option value="">{isLoadingCategories ? t('admin.loadingCategories') : t('admin.productEdit.selectCategory')}</option>
                        {Array.isArray(categories) && categories.map((category) => (
                          <option key={category.category_id} value={category.category_id}>
                            {isRTL && category.name_ar ? category.name_ar : category.name_en}
                          </option>
                        ))}
                      </select>
                      {errors.category_id && <p className="text-red-500 text-sm mt-1">{t(errors.category_id)}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.price')} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={e => handleInputChange('price', Number(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                      disabled={isLoading}
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{t(errors.price)}</p>}
                  </div>
                  {user?.roleId !== 4 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.stock')}
                      </label>
                      <input
                        type="number"
                        value={formData.stock || ''}
                        onChange={e => handleInputChange('stock', Number(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isLoading}
                      />
                      {errors.stock && <p className="text-red-500 text-sm mt-1">{t(errors.stock)}</p>}
                    </div>
                  )}
                  {user?.roleId === 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.vendor')} *
                      </label>
                      <select
                        value={typeof formData.vendor_id === 'number' && !isNaN(formData.vendor_id) ? formData.vendor_id : 0}
                        onChange={e => handleInputChange('vendor_id', Number(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md`}
                        disabled={isLoading || isLoadingVendors}
                      >
                        <option value={0}>{isLoadingVendors ? t('admin.loadingVendors') : t('admin.selectVendor')}</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.user_id} value={vendor.user_id}>
                            {vendor.name} {vendor.email ? `(${vendor.email})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.description')}
                    </label>
                    <RichTextEditor
                      value={formData.description || ''}
                      onChange={(value) => handleInputChange('description', value)}
                      placeholder={t('admin.enterProductDescription')}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Special Categories Card */}
              <div className="rounded-xl border bg-white/90 shadow p-0">
                <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}> 
                  <Tag className="w-7 h-7 text-yellow-500" />
                  <h4 className="text-xl font-bold text-yellow-900">{t('admin.specialCategories')}</h4>
                </div>
                <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_new || false}
                      onChange={e => handleInputChange('is_new', e.target.checked)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-gray-700">{t('admin.newProduct')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_best_selling || false}
                      onChange={e => handleInputChange('is_best_selling', e.target.checked)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-gray-700">{t('admin.bestSelling')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_deal_offer || false}
                      onChange={e => handleInputChange('is_deal_offer', e.target.checked)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-gray-700">{t('admin.dealOffer')}</span>
                  </label>
                </div>
              </div>

              {/* Deal Offer Settings Card */}
              {formData.is_deal_offer && (
                <div className="rounded-xl border bg-white/90 shadow p-0">
                  <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}> 
                    <Percent className="w-7 h-7 text-pink-500" />
                    <h4 className="text-xl font-bold text-pink-900">{t('admin.dealOfferSettings')}</h4>
                  </div>
                  <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.originalPrice')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.original_price || ''}
                        onChange={e => handleInputChange('original_price', Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.discountPercentage')} (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discount_percentage || ''}
                        onChange={e => handleInputChange('discount_percentage', Number(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.discount_percentage ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isLoading}
                      />
                      {errors.discount_percentage && (
                        <p className="text-red-500 text-sm mt-1">{t(errors.discount_percentage)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.discountStartDate')}
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.discount_start_date ? new Date(formData.discount_start_date).toISOString().slice(0, 16) : ''}
                        onChange={e => handleInputChange('discount_start_date', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.discount_start_date ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isLoading}
                      />
                      {errors.discount_start_date && (
                        <p className="text-red-500 text-sm mt-1">{t(errors.discount_start_date)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.discountEndDate')}
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.discount_end_date ? new Date(formData.discount_end_date).toISOString().slice(0, 16) : ''}
                        onChange={e => handleInputChange('discount_end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Media Card */}
              <div className="rounded-xl border bg-white/90 shadow p-0">
                <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}> 
                  <ImageIcon className="w-7 h-7 text-indigo-500" />
                  <h4 className="text-xl font-bold text-indigo-900">{t('admin.media')}</h4>
                </div>
                <div className="px-6 pb-6 pt-2">
                  {/* New Images */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">{t('admin.newImages')}</h5>
                    <div className="flex flex-wrap gap-4">
                      {newImages.map((item, idx) => (
                        <div key={`new-image-${idx}`} className="relative w-24 h-24 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          <button type="button" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow" onClick={() => handleRemoveNewImage(idx)}>
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                          {item.type === 'file' ? (
                            <ImageWithFallback 
                              src={URL.createObjectURL(item.value as File)} 
                              alt="img" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageWithFallback 
                              src={item.value as string} 
                              alt="img" 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button type="button" className="px-3 py-1 bg-blue-100 text-blue-700 rounded" onClick={() => setShowImageUrlInput(v => !v)}>{t('admin.addImageUrl')}</button>
                      <button type="button" className="px-3 py-1 bg-blue-100 text-blue-700 rounded" onClick={() => document.getElementById('upload-image-input')?.click()}>{t('admin.uploadImage')}</button>
                      <input id="upload-image-input" type="file" accept="image/*" multiple className="hidden" onChange={e => handleUploadImages(e.target.files)} />
                    </div>
                    {showImageUrlInput && (
                      <div className="flex gap-2 mt-2">
                        <input type="url" className="border rounded px-2 py-1 flex-1" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder={t('admin.imageURL')} />
                        <button type="button" className="px-3 py-1 bg-green-500 text-white rounded" onClick={handleAddImageUrl}>{t('admin.add')}</button>
                      </div>
                    )}
                  </div>

                  {/* New Videos */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">{t('admin.newVideos')}</h5>
                    <div className="flex flex-wrap gap-4">
                      {newVideos.map((item, idx) => (
                        <div key={`new-video-${idx}`} className="relative w-32 h-24 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          <button type="button" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow" onClick={() => handleRemoveNewVideo(idx)}>
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                          {item.type === 'file' ? (
                            <video 
                              src={URL.createObjectURL(item.value as File)} 
                              controls 
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                          ) : (
                            <video 
                              src={item.value as string} 
                              controls 
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button type="button" className="px-3 py-1 bg-blue-100 text-blue-700 rounded" onClick={() => setShowVideoUrlInput(v => !v)}>{t('admin.addVideoUrl')}</button>
                      <button type="button" className="px-3 py-1 bg-blue-100 text-blue-700 rounded" onClick={() => document.getElementById('upload-video-input')?.click()}>{t('admin.uploadVideo')}</button>
                      <input id="upload-video-input" type="file" accept="video/*" multiple className="hidden" onChange={e => handleUploadVideos(e.target.files)} />
                    </div>
                    {showVideoUrlInput && (
                      <div className="mb-4">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder={t('admin.productEdit.videoURL') || 'Enter video URL'}
                          value={newVideoUrl}
                          onChange={e => setNewVideoUrl(e.target.value)}
                          disabled={isLoading}
                        />
                        <button type="button" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded" onClick={handleAddVideoUrl} disabled={isLoading}>
                          {t('admin.productEdit.addVideo') || 'Add Video'}
                        </button>
                        <div className="text-xs text-gray-500 mt-2">{t('admin.videoMaxSizeHint')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('admin.saving')}...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addProduct') || 'Add Product'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 