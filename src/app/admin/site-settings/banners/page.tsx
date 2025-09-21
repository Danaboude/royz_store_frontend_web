'use client';
import { useEffect, useState } from 'react';
import { getAdminBanners, createBanner, updateBanner, deleteBanner, Banner as BannerType } from '@/services/admin-api';
import { useI18n } from '@/contexts/I18nContext';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import ImageWithFallback from '@/components/ImageWithFallback';

type Banner = BannerType & { is_active?: number | boolean; width?: number; height?: number };
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function BannerForm({ initial, onSave, onCancel, bannersLength }: {
  initial?: Partial<Banner>;
  onSave: (banner: Partial<Banner>) => void;
  onCancel: () => void;
  bannersLength: number;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'url' | 'file'>(initial?.image_url ? 'url' : 'file');
  const [image_url, setImageUrl] = useState(initial?.image_url || '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState(initial?.link || '');
  const [order, setOrder] = useState(initial?.order ?? (bannersLength ? bannersLength + 1 : 1));
  const [isActive, setIsActive] = useState(initial?.is_active === 0 ? 0 : 1);
  // Banner size for HeroBanner (example: 1200x400)
  const requiredWidth = 1200;
  const requiredHeight = 400;

  // Upload file to backend
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('banner_image', file);
    try {
    
const res = await fetch(`${API_URL}/banners/upload`, {
  method: 'POST',
  body: formData,
});
      const data = await res.json();
      setImageUrl(data.url);
    } catch {
      alert(t('admin.banners.failedToUploadImage'));
    } finally {
      setUploading(false);
    }
  };

  // Automatically upload image when selected
  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <form
      className="space-y-6"
      onSubmit={async e => {
        e.preventDefault();
        if (uploading) return; // Don't allow submit while uploading
        if (!image_url) {
          alert(t('admin.banners.failedToUploadImage'));
          return;
        }
        onSave({ image_url, link, order, is_active: isActive });
      }}
    >
      {/* Image Upload Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold mb-4 text-gray-800">{t('admin.banners.bannerImage')}</h4>
        
        <div className="mb-4 text-sm text-gray-600 text-center">
          {t('admin.banners.youCanEither')} <span className="font-semibold text-blue-600">{t('admin.banners.uploadABannerImageFile')}</span> {t('admin.banners.or')} <span className="font-semibold text-blue-600">{t('admin.banners.enterAnImageURLBelow')}</span>
        </div>
        
        <div className="flex gap-2 mb-4 justify-center">
          <button 
            type="button" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'url' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`} 
            onClick={() => setMode('url')}
          >
            {t('admin.banners.useURL')}
          </button>
          <button 
            type="button" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'file' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`} 
            onClick={() => setMode('file')}
          >
            {t('admin.banners.uploadFile')}
          </button>
        </div>
        
        {mode === 'url' ? (
          <div>
            <label className="block font-medium mb-2 text-gray-700">{t('admin.banners.imageURL')}</label>
            <input 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              value={image_url} 
              onChange={e => setImageUrl(e.target.value)} 
              required={mode === 'url'}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        ) : (
          <div>
            <label className="block font-medium mb-2 text-gray-700">{t('admin.banners.uploadImage')}</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="banner-file"
                onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
                setImageUrl('');
              }
                }} 
                required={mode === 'file'} 
              />
              <label htmlFor="banner-file" className="cursor-pointer">
                <div className="text-gray-600">
                  <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-lg font-medium">{t('admin.banners.clickToUpload')}</p>
                  <p className="text-sm">{t('admin.banners.orDragAndDrop')}</p>
                </div>
              </label>
            </div>
            {file && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm text-green-700 font-medium">{t('admin.banners.selected')}: {file.name}</span>
              </div>
            )}
            {uploading && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-blue-700">{t('admin.banners.uploading')}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Image Preview */}
        <div className="mt-4 flex flex-col items-center">
          {image_url && (
            <div className="relative">
              <ImageWithFallback
                src={image_url}
                alt="preview"
                className="rounded-lg shadow-lg border-2 border-gray-200"
                width={requiredWidth/4}
                height={requiredHeight/4}
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {t('admin.banners.preview')}
              </div>
            </div>
          )}
          <div className="mt-3 text-xs text-gray-500 text-center max-w-md">
            {t('admin.banners.bannerImageShouldBeExactly')} <span className="font-semibold">{requiredWidth}x{requiredHeight}</span> {t('admin.banners.pixelsForBestAppearanceInTheHomepageSlider')}
          </div>
        </div>
      </div>

      {/* Banner Details Section */}
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2 text-gray-700">{t('admin.banners.link')}</label>
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
            value={link} 
            onChange={e => setLink(e.target.value)}
            placeholder="https://example.com/product/123"
          />
          <p className="text-xs text-gray-500 mt-1">{t('admin.banners.linkDescription')}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2 text-gray-700">{t('admin.banners.order')}</label>
            <input 
              type="number" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              value={order} 
              onChange={e => setOrder(Math.max(1, Number(e.target.value)))} 
              min={1} 
            />
          </div>
          <div className="flex items-center">
            <div className="flex items-center h-12">
              <input 
                type="checkbox" 
                checked={!!isActive} 
                onChange={e => setIsActive(e.target.checked ? 1 : 0)} 
                id="is_active" 
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700">
                {t('admin.banners.active')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button 
          type="button" 
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200" 
          onClick={onCancel}
        >
          {t('admin.banners.cancel')}
        </button>
        <button 
          type="submit" 
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            uploading || (mode === 'file' && !image_url)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
          disabled={uploading || (mode === 'file' && !image_url)}
        >
          {uploading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('admin.banners.uploading')}
      </div>
          ) : (
            t('admin.banners.save')
          )}
        </button>
      </div>
    </form>
  );
}

export default function BannersPage() {
  const { t } = useI18n();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);

  useEffect(() => {
    setLoading(true);
    getAdminBanners()
      .then(setBanners)
      .catch(() => setError(t('admin.banners.failedToFetchBanners')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleAdd = async (banner: Partial<Banner>) => {
    setLoading(true);
    try {
      const newOrder = banner.order ?? 1;
      // Shift orders of existing banners to make room for new banner
      await Promise.all(
        banners
          .filter(b => (b.order ?? 1) >= newOrder)
          .map(async b => {
            await updateBanner(b.id!, {
              id: b.id!,
              image_url: b.image_url,
              link: b.link,
              order: (b.order ?? 1) + 1,
              is_active: b.is_active,
              created_at: b.created_at,
              updated_at: b.updated_at
            });
          })
      );
      await createBanner({ ...banner, order: newOrder } as Banner);
      const updated = await getAdminBanners();
      setBanners(updated);
      setShowDialog(false);
    } catch {
      alert(t('admin.banners.failedToAddBanner'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (banner: Partial<Banner>) => {
    if (!editBanner) return;
    setLoading(true);
    try {
      const oldOrder = editBanner.order ?? 1;
      const newOrder = banner.order ?? 1;
      if (oldOrder !== newOrder) {
        // If moving up (to a lower order number)
        if (newOrder < oldOrder) {
          await Promise.all(
            banners
              .filter(b => (b.order ?? 1) >= newOrder && (b.order ?? 1) < oldOrder && b.id !== editBanner.id)
              .map(async b => {
                await updateBanner(b.id!, {
                  id: b.id!,
                  image_url: b.image_url,
                  link: b.link,
                  order: (b.order ?? 1) + 1,
                  is_active: b.is_active,
                  created_at: b.created_at,
                  updated_at: b.updated_at
                });
              })
          );
        } else {
          // Moving down (to a higher order number)
          await Promise.all(
            banners
              .filter(b => (b.order ?? 1) <= newOrder && (b.order ?? 1) > oldOrder && b.id !== editBanner.id)
              .map(async b => {
                await updateBanner(b.id!, {
                  id: b.id!,
                  image_url: b.image_url,
                  link: b.link,
                  order: (b.order ?? 1) - 1,
                  is_active: b.is_active,
                  created_at: b.created_at,
                  updated_at: b.updated_at
                });
              })
          );
        }
      }
      await updateBanner(editBanner.id!, { ...banner, id: editBanner.id } as Banner);
      const updated = await getAdminBanners();
      setBanners(updated);
      setShowDialog(false);
      setEditBanner(null);
    } catch {
      alert(t('admin.banners.failedToUpdateBanner'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.banners.confirmDelete'))) return;
    setLoading(true);
    try {
      await deleteBanner(id);
      const updated = await getAdminBanners();
      setBanners(updated);
    } catch {
      alert(t('admin.banners.failedToDeleteBanner'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">{t('admin.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.banners.title')}</h1>
              <p className="text-gray-600 mt-1">{t('admin.banners.description')}</p>
            </div>
            <button
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={() => {
                setEditBanner(null);
                setShowDialog(true);
              }}
            >
              <FiPlus className="w-5 h-5 mr-2" />
              {t('admin.banners.addBanner')}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Banners Grid */}
        {banners.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{t('admin.banners.noBanners')}</h3>
              <p className="mt-2 text-gray-500">{t('admin.banners.noBannersDescription')}</p>
              <button
                className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
                onClick={() => {
                  setEditBanner(null);
                  setShowDialog(true);
                }}
              >
                <FiPlus className="w-5 h-5 mr-2" />
                {t('admin.banners.addFirstBanner')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {banners
              .sort((a, b) => (a.order ?? 1) - (b.order ?? 1))
              .map((banner) => (
                <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                  <div className="p-6">
                    {/* Header */}
      <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <span className="text-blue-600 font-bold text-lg">{banner.order}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {t('admin.banners.banner')} #{banner.id}
                          </h3>
                          <p className="text-sm text-gray-500">{t('admin.banners.order')} {banner.order}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          banner.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {banner.is_active ? (
                            <>
                              <FiEye className="w-3 h-3 mr-1" />
                              {t('admin.banners.active')}
                            </>
                          ) : (
                            <>
                              <FiEyeOff className="w-3 h-3 mr-1" />
                              {t('admin.banners.inactive')}
                            </>
                          )}
                        </span>
                        <button
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                          onClick={() => {
                            setEditBanner(banner);
                            setShowDialog(true);
                          }}
                        >
                          <FiEdit className="w-4 h-4 mr-1" />
                          {t('admin.edit')}
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-all duration-200"
                          onClick={() => handleDelete(banner.id!)}
                        >
                          <FiTrash2 className="w-4 h-4 mr-1" />
                          {t('admin.delete')}
        </button>
      </div>
                    </div>

                    {/* Banner Content */}
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <ImageWithFallback
                          src={banner.image_url}
                          alt="banner"
                          className="rounded-lg shadow-md border border-gray-200"
                          width={300}
                          height={100}
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t('admin.banners.link')}</label>
                          <p className="text-sm text-gray-900 break-all">
                            {banner.link ? (
                              <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                {banner.link}
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">{t('admin.banners.noLink')}</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t('admin.banners.status')}</label>
                          <p className="text-sm text-gray-900">
                            {banner.is_active ? t('admin.banners.active') : t('admin.banners.inactive')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      )}

        {/* Modal Dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {editBanner ? t('admin.banners.editBanner') : t('admin.banners.addBanner')}
                </h3>
              </div>
              <div className="p-6">
            <BannerForm
              initial={editBanner || undefined}
              onSave={editBanner ? handleEdit : handleAdd}
                  onCancel={() => {
                    setShowDialog(false);
                    setEditBanner(null);
                  }}
              bannersLength={banners.length}
            />
              </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 