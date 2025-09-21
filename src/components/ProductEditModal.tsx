'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product } from '@/controllers/admin/productsController';
import { X, Save, Loader2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useUser } from '@/contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Image as ImageIcon, Tag, Percent } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { getProductMedia, ProductMedia, updateProductWithMedia, getAdminCategories, deleteProductMedia, uploadProductMedia } from '@/services/admin-api';
import { uploadVendorProductMedia } from '@/services/vendor-api';
import { toast } from 'react-hot-toast';
import ImageWithFallback from './ImageWithFallback';

interface ProductEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  isLoading: boolean;
}

interface Category {
  category_id: number;
  name_en: string;
  name_ar: string;
  description?: string;
}

export default function ProductEditModal({ 
  product, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading 
}: ProductEditModalProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState<Product>(product);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingMedia, setExistingMedia] = useState<ProductMedia[]>([]);
  const [newImages, setNewImages] = useState<{ type: 'file' | 'url'; value: File | string }[]>([]);
  const [newVideos, setNewVideos] = useState<{ type: 'file' | 'url'; value: File | string }[]>([]);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<ProductMedia | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);
  const deletedMediaIdsRef = useRef<number[]>([]);
  const [zoomedVideo, setZoomedVideo] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const { t, locale } = useI18n();
  // Detect vendor context (simple check: if path includes 'vendor-dashboard')
  const isVendor = typeof window !== 'undefined' && window.location.pathname.includes('vendor-dashboard');
  const isRTL = locale === 'ar';

  useEffect(() => {
    if (product && isOpen) {
      // Ensure all required fields are present
      setFormData({
        ...product,
        image_url: product.image_url ?? '',
        is_new: product.is_new ?? false,
        is_best_selling: product.is_best_selling ?? false,
        is_deal_offer: product.is_deal_offer ?? false,
        created_at: product.created_at ?? '',
        updated_at: product.updated_at ?? '',
        category_id: user?.roleId === 4 ? 14 : (product.category_id ?? 0),
        stock: user?.roleId === 4 ? 1 : (product.stock ?? 0),
      });
      setErrors({});
      fetchProductMedia();
      fetchCategories();
    }
  }, [product, isOpen, user]);

  const fetchProductMedia = async () => {
    if (!product.product_id) return;
    
    setIsLoadingMedia(true);
    try {
      const media = await getProductMedia(product.product_id);
      console.log('Fetched product media:', media); // Debug log
      setExistingMedia(Array.isArray(media) ? media : []);
    } catch (error) {
      console.error('Error fetching product media:', error);
      setExistingMedia([]); // Set empty array on error
    } finally {
      setIsLoadingMedia(false);
    }
  };

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

  const handleInputChange = (field: keyof Product, value: unknown) => {
    setFormData((prev: Product) => {
      const updatedData: Partial<Product> = {
        ...prev,
        [field]: value,
        image_url: typeof prev.image_url === 'string' ? prev.image_url : '',
        is_new: prev.is_new ?? false,
        is_best_selling: prev.is_best_selling ?? false,
        is_deal_offer: prev.is_deal_offer ?? false,
        created_at: prev.created_at ?? '',
        updated_at: prev.updated_at ?? '',
      };

      // Handle specific field types
      if (field === 'category_id') {
        updatedData.category_id = user?.roleId === 4 ? 14 : (typeof value === 'number' ? value : prev.category_id);
      } else if (field === 'stock') {
        updatedData.stock = user?.roleId === 4 ? 1 : (typeof value === 'number' ? value : prev.stock);
      } else {
        // For other fields, use the value as is
        updatedData[field] = value;
      }

      return updatedData as Product;
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

    // Skip stock validation for role ID 4
    if (user?.roleId !== 4 && formData.stock !== undefined && formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
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
    if (!validateForm()) {
        return;
  }

    try {
    // 1. Upload files (images/videos)
    const uploadedMedia: ProductMedia[] = [];
    const filesToUpload = [
      ...newImages.filter(img => img.type === 'file').map(img => img.value as File),
      ...newVideos.filter(video => video.type === 'file').map(video => video.value as File),
    ];

        if (filesToUpload.length > 0) {
      if (isVendor) {
                const uploaded = await uploadVendorProductMedia(product.product_id!, filesToUpload);
                uploadedMedia.push(...uploaded);
      } else {
                const uploaded = await uploadProductMedia(product.product_id!, filesToUpload);
                uploadedMedia.push(...uploaded);
      }
    } else {
          }

    // 2. Determine main image logic
    const hasMainImage = Boolean(formData.image_url?.trim());
    const hasNewImages = newImages.length > 0;
    const hasExistingImages = existingMedia.some(media => media.type === 'image');

        const updatedFormData = { ...formData };

    if (!hasMainImage && hasNewImages) {
      const firstNewImage = newImages.find(img => img.type === 'file' || img.type === 'url');
      if (firstNewImage) {
        if (firstNewImage.type === 'file') {
          const firstUploadedImage = uploadedMedia.find(media => media.type === 'image' && media.url);
                    if (firstUploadedImage) {
            updatedFormData.image_url = firstUploadedImage.url;
          }
        } else {
          updatedFormData.image_url = firstNewImage.value as string;
                  }
      }
    } else if (!hasMainImage && hasExistingImages) {
      const firstExistingImage = existingMedia.find(media => media.type === 'image');
            if (firstExistingImage) {
        updatedFormData.image_url = firstExistingImage.url;
      }
    } else {
          }

    // 3. Prepare media to add & delete (filter out invalid)
    const deletedMediaIds = deletedMediaIdsRef.current;
        let toAdd = [
      ...uploadedMedia
        .filter(media => media.url && media.type)
        .map(media => ({ url: media.url, type: media.type as 'image' | 'video' })),
      ...newImages
        .filter(img => img.type === 'url' && img.value)
        .map(img => ({ url: img.value as string, type: 'image' as const })),
      ...newVideos
        .filter(video => video.type === 'url' && video.value)
        .map(video => ({ url: video.value as string, type: 'video' as const })),
    ];

    // Remove duplicates
    toAdd = toAdd.filter(
      (item, idx, arr) =>
        arr.findIndex(i => i.url === item.url && i.type === item.type) === idx
    );

        const mediaData = {
      toAdd,
      toDelete: deletedMediaIds,
    };

    // 4. Call API
    if (isVendor) {
            if (uploadedMedia.length > 0 && uploadedMedia[0].url) {
        updatedFormData.image_url = uploadedMedia[0].url;
              }

      const { editVendorProduct } = await import('@/services/vendor-api');
      await editVendorProduct(product.product_id!, updatedFormData);

      if (mediaData.toAdd.length > 0 || mediaData.toDelete.length > 0) {
                await updateProductWithMedia(product.product_id!, updatedFormData, mediaData);
      }

      toast.success(t('admin.productEdit.productSavedSuccessfully'), { position: 'top-left', duration: 3000 });
      onSave(updatedFormData as Product);
    } else {
            const result = await updateProductWithMedia(product.product_id!, updatedFormData, mediaData);
            toast.success(t('admin.productEdit.productSavedSuccessfully'), { position: 'top-left', duration: 3000 });
      onSave(result.product as Product);
    }

    // 5. Reset state
    deletedMediaIdsRef.current = [];
    setNewImages([]);
    setNewVideos([]);
    fetchProductMedia();
      } catch (error) {
    console.error('Error updating product:', error);
    onSave(formData);
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

  const handleRemoveExistingMedia = (media: ProductMedia) => {
    setMediaToDelete(media);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    
    setIsDeletingMedia(true);
    try {
      await deleteProductMedia(mediaToDelete.id);
      setExistingMedia(prev => prev.filter(media => media.id !== mediaToDelete.id));
      
      // Track the deleted media ID for the backend update
      deletedMediaIdsRef.current.push(mediaToDelete.id);
      
      // If the deleted media was the main image, remove it from product data
      if (formData.image_url === mediaToDelete.url) {
        setFormData(prev => ({
          ...prev,
          image_url: ''
        }));
              }
      
      // Show success message
          } catch (error) {
      console.error('Error deleting media:', error);
      // Show error message
    } finally {
      setIsDeletingMedia(false);
      setShowDeleteConfirm(false);
      setMediaToDelete(null);
    }
  };

  const cancelDeleteMedia = () => {
    setShowDeleteConfirm(false);
    setMediaToDelete(null);
  };

  const handleZoomMedia = (media: { url: string; type: 'image' | 'video' }) => {
    setZoomedVideo(media);
  };

  const handleCloseZoom = () => {
    setZoomedVideo(null);
  };

  // Helper functions for video URLs
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const isVimeoUrl = (url: string): boolean => {
    return url.includes('vimeo.com');
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const getVimeoEmbedUrl = (url: string): string => {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
    return `https://player.vimeo.com/video/${videoId}`;
  };

  const getVideoEmbedUrl = (url: string): string => {
    if (isYouTubeUrl(url)) {
      return getYouTubeEmbedUrl(url);
    } else if (isVimeoUrl(url)) {
      return getVimeoEmbedUrl(url);
    }
    return url;
  };



  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="product-edit-modal"
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
                  {t('admin.editProduct') || t('editProduct')}
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
                        {t('category')} *
                      </label>
                      <select
                        value={formData.category_id || ''}
                        onChange={e => handleInputChange('category_id', parseInt(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-md ${errors.category_id ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isLoading || isLoadingCategories}
                      >
                        <option value="">{isLoadingCategories ? t('admin.loadingCategories') : t('admin.selectCategory')}</option>
                        {Array.isArray(categories) && categories.map((category, idx) => (
                          <option key={category.category_id || `category-${idx}`} value={category.category_id}>
                            {isRTL ? category.name_ar : category.name_en}
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
                      onChange={e => handleInputChange('price', parseFloat(e.target.value))}
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
                        onChange={e => handleInputChange('stock', parseInt(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-md ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isLoading}
                      />
                      {errors.stock && <p className="text-red-500 text-sm mt-1">{t(errors.stock)}</p>}
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('description')}
                    </label>
                    <RichTextEditor
                      value={formData.description || ''}
                      onChange={(value) => handleInputChange('description', value)}
                      placeholder={t('enterProductDescription')}
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
                  <h4 className="text-xl font-bold text-yellow-900">{t('specialCategories')}</h4>
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
                    <span className="text-sm font-medium text-gray-700">{t('newProduct')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_best_selling || false}
                      onChange={e => handleInputChange('is_best_selling', e.target.checked)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-gray-700">{t('bestSelling')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_deal_offer || false}
                      onChange={e => handleInputChange('is_deal_offer', e.target.checked)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium text-gray-700">{t('dealOffer')}</span>
                  </label>
                </div>
              </div>

              {/* Deal Offer Settings Card */}
              {formData.is_deal_offer && (
                <div className="rounded-xl border bg-white/90 shadow p-0">
                  <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}> 
                    <Percent className="w-7 h-7 text-pink-500" />
                    <h4 className="text-xl font-bold text-pink-900">{t('dealOfferSettings')}</h4>
                  </div>
                  <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('originalPrice')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.original_price || ''}
                        onChange={e => handleInputChange('original_price', parseFloat(e.target.value))}
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
                        onChange={e => handleInputChange('discount_percentage', parseFloat(e.target.value))}
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
                  {/* Main Image Preview and Delete */}
                  {formData.image_url && (
                    <div className="mb-4 flex items-center gap-4">
                      <div className="relative w-32 h-32 rounded overflow-hidden bg-gray-100 flex items-center justify-center border border-blue-300">
                        <ImageWithFallback
                          src={formData.image_url as string}
                          alt="Main product image"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-50 z-10"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          title={t('admin.removeMedia')}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded z-10">
                          {t('admin.main')}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Existing Media */}
                  {isLoadingMedia ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">{t('admin.loadingMedia')}</p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      {existingMedia.length > 0 ? (
                        <>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">
                            {t('admin.existingMedia')} ({existingMedia.length} items)
                          </h5>
                          <div className="flex flex-wrap gap-4">
                            {existingMedia.map((media, idx) => (
                              <div key={`existing-${media.id || media.url || idx}`} className="relative w-24 h-24 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                <button 
                                  type="button" 
                                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-50 z-10" 
                                  onClick={() => handleRemoveExistingMedia(media)}
                                  title={t('admin.removeMedia')}
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </button>
                                {media.type === 'image' && formData.image_url === media.url && (
                                  <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded z-10">
                                    {t('admin.main')}
                                  </div>
                                )}
                                {media.type === 'image' ? (
                                  <ImageWithFallback
                                    src={media.url} 
                                    alt="Product media" 
                                    className="w-full h-full object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                                    onClick={() => handleZoomMedia({ url: media.url, type: 'image' })}
                                  />
                                ) : (
                                  <div className="relative w-full h-full">
                                    {(isYouTubeUrl(media.url) || isVimeoUrl(media.url)) ? (
                                      <div 
                                        className="w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => handleZoomMedia({ url: media.url, type: 'video' })}
                                      >
                                        <iframe
                                          src={getVideoEmbedUrl(media.url)}
                                          className="w-full h-full"
                                          frameBorder="0"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      </div>
                                    ) : (
                                      <video 
                                        src={media.url} 
                                        className="w-full h-full object-cover"
                                        controls
                                        preload="metadata"
                                        onDoubleClick={() => handleZoomMedia({ url: media.url, type: 'video' })}
                                      />
                                    )}
                                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded z-10">
                                      {t('admin.productEdit.video')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">{t('admin.noMedia')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* New Images */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">{t('admin.newImages')}</h5>
                    <div className="flex flex-wrap gap-4">
                      {newImages.map((item, idx) => (
                        <div key={`new-image-${idx}-${item.type}-${item.value instanceof File ? item.value.name : item.value}`} className="relative w-24 h-24 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          <button type="button" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow" onClick={() => handleRemoveNewImage(idx)}>
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                          {item.type === 'file' ? (
                            <ImageWithFallback
                              src={URL.createObjectURL(item.value as File)} 
                              alt="img" 
                              className="w-full h-full object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={() => handleZoomMedia({ url: URL.createObjectURL(item.value as File), type: 'image' })}
                            />
                          ) : (
                            <ImageWithFallback 
                              src={item.value as string} 
                              alt="img" 
                              className="w-full h-full object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={() => handleZoomMedia({ url: item.value as string, type: 'image' })}
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
                        <div key={`new-video-${idx}-${item.type}-${item.value instanceof File ? item.value.name : item.value}`} className="relative w-32 h-24 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          <button type="button" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow" onClick={() => handleRemoveNewVideo(idx)}>
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                          {item.type === 'file' ? (
                            <div className="relative w-full h-full">
                              <video 
                                src={URL.createObjectURL(item.value as File)} 
                                controls 
                                className="w-full h-full object-cover"
                                preload="metadata"
                                onDoubleClick={() => handleZoomMedia({ url: URL.createObjectURL(item.value as File), type: 'video' })}
                              />
                            </div>
                          ) : (
                            <div className="relative w-full h-full">
                              {(isYouTubeUrl(item.value as string) || isVimeoUrl(item.value as string)) ? (
                                <div 
                                  className="w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleZoomMedia({ url: item.value as string, type: 'video' })}
                                >
                                  <iframe
                                    src={getVideoEmbedUrl(item.value as string)}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                                <video 
                                  src={item.value as string} 
                                  controls 
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                  onDoubleClick={() => handleZoomMedia({ url: item.value as string, type: 'video' })}
                                />
                              )}
                            </div>
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
                      <div className="flex gap-2 mt-2">
                        <input type="url" className="border rounded px-2 py-1 flex-1" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder={t('admin.videoURL')} />
                        <button type="button" className="px-3 py-1 bg-green-500 text-white rounded" onClick={handleAddVideoUrl}>{t('admin.add')}</button>
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
                      <Save className="w-4 h-4 mr-2" />
                      {t('admin.saveChanges')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && mediaToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] overflow-y-auto bg-black bg-opacity-50"
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('admin.productEdit.confirmDelete')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('admin.productEdit.deleteMediaConfirmation')} {mediaToDelete.type === 'image' ? t('admin.productEdit.image') : t('admin.productEdit.video')}?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDeleteMedia}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isDeletingMedia}
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMedia}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                  disabled={isDeletingMedia}
                >
                  {isDeletingMedia ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('admin.deleting')}...
                    </>
                  ) : (
                    t('admin.delete')
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Zoom Modal */}
      {zoomedVideo && (
        <AnimatePresence mode="wait">
          <motion.div
            key="zoom-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={handleCloseZoom}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseZoom}
                className="absolute top-4 right-4 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>

              {/* Media Content */}
              {zoomedVideo.type === 'image' ? (
                <ImageWithFallback
                  src={zoomedVideo.url}
                  alt="Zoomed media"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (isYouTubeUrl(zoomedVideo.url) || isVimeoUrl(zoomedVideo.url)) ? (
                <iframe
                  src={getVideoEmbedUrl(zoomedVideo.url)}
                  className="w-full h-full max-w-4xl max-h-[80vh]"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={zoomedVideo.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </AnimatePresence>
  );
}