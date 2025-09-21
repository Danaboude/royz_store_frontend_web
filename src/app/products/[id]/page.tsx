"use client";
import Footer from '@/components/Footer';
import Image from 'next/image';

import { useProduct, useFavorites, useAddFavorite, useRemoveFavorite, useAddToCart, useCategories } from '@/services/api-client';
import { useParams } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { useState, useEffect, useRef, useMemo } from 'react';
import { create } from 'zustand';
import { FaPlayCircle, FaPauseCircle, FaForward, FaBackward } from 'react-icons/fa';
import { Heart, ShoppingCart } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useUIStore } from '@/store/uiStore';
import { TopBar } from '@/components/Header';
import { api } from '@/services/api';
import type { Review } from '@/services/api';
import type { ProductCardProps } from '@/views/ProductCard';
import toast, { Toaster } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatPrice } from '@/lib/utils';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Zustand store for product media
interface ProductMedia {
  id?: number;
  url: string;
  type?: string;
  media_id?: number;
  media_url?: string;
  media_type?: string;
}
interface ProductMediaState {
  mediaCache: Record<number, ProductMedia[]>;
  setMedia: (productId: number, media: ProductMedia[]) => void;
}
const useProductMediaStore = create<ProductMediaState>((set) => ({
  mediaCache: {},
  setMedia: (productId, media) => set((state) => ({
    mediaCache: { ...state.mediaCache, [productId]: media }
  })),
}));

export default function ProductDetailsPage() {
  const { t } = useI18n();
  const params = useParams();
  const id = params?.id ? Number(params.id) : undefined;
  // Try to get product data from sessionStorage if available
  const [productData, setProductData] = useState<ProductCardProps | null>(null);
  useEffect(() => {
    if (!id) return;
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem(`product_${id}`);
      if (stored) {
        try {
          setProductData(JSON.parse(stored));
        } catch { }
      }
    }
  }, [id]);
  // Fallback to API if not found in sessionStorage
  const { data: apiProduct } = useProduct(id || 0);
  const product = useMemo(() => productData || apiProduct, [productData, apiProduct]);
  const [quantity, setQuantity] = useState(1);

  // Zustand for product media
  const mediaCache = useProductMediaStore((state) => state.mediaCache);
  const setMedia = useProductMediaStore((state) => state.setMedia);
  const [images, setImages] = useState<ProductMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<{ media_url: string; media_type?: string } | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const mediaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [zoomed, setZoomed] = useState(false);

  // Carousel state for media thumbnails
  const [thumbStart, setThumbStart] = useState(0);
  const THUMBS_VISIBLE = 5;
  const totalThumbs = (images.length + (product?.image_url ? 1 : 0));
  const canScrollLeft = thumbStart > 0;
  const canScrollRight = thumbStart + THUMBS_VISIBLE < totalThumbs;

  // Helper to get all thumbnails (main + media)
  const allThumbs = [
    ...(product?.image_url ? [{ media_id: 'main', media_url: product.image_url, media_type: 'image', isMain: true }] : []),
    ...images.map(img => ({
      media_id: img.id,
      media_url: img.url,
      media_type: img.type,
      isMain: false
    }))
  ];
  const visibleThumbs = allThumbs.slice(thumbStart, thumbStart + THUMBS_VISIBLE);

  // --- Favorite & Add to Cart logic (from ProductCard) ---
  const { user, isLoggedIn } = useUser();
  const { data: favorites = [], isLoading: favLoading } = useFavorites(isLoggedIn);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addToCart = useAddToCart();
  const fetchCart = useUIStore(state => state.fetchCart);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const favoritesArray = Array.isArray(favorites) ? favorites : [];
  const isFavorite = isLoggedIn && product?.product_id && favoritesArray.includes(product.product_id);
  const [pending, setPending] = useState(false);
  const [stockLimitMessage, setStockLimitMessage] = useState<string | null>(null);

  const handleFavorite = async () => {
    if (favLoading || pending) return;
    if (!isLoggedIn || !user) {
      alert(t('common.pleaseLogin') || 'Please login to add favorites');
      return;
    }
    setPending(true);
    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync(product.product_id);
      } else {
        await addFavorite.mutateAsync(product.product_id);
      }
    } catch (error) {
      alert(t('common.errorOccurred') || 'An error occurred. Please try again. ' + error);
    } finally {
      setPending(false);
    }
  };

  const handleAddToCart = async () => {
    setCartMessage(null);
    setCartError(null);
    try {
      const result = await addToCart.mutateAsync({ product_id: product.product_id, quantity });
      await fetchCart();
      if (result && typeof result === 'object') {
        if (result.quantityLimited) {
          const translatedMessage = t(result.message) || result.message;
          setCartMessage(`${translatedMessage} (Limited to ${result.maxQuantity} items)`);
        } else {
          const translatedMessage = t(result.message) || result.message;
          setCartMessage(translatedMessage);
        }
      } else {
        setCartMessage(String(t('common.addedToCart')) || 'Added to cart!');
      }
      setTimeout(() => setCartMessage(null), 3000);
    } catch (error) {
      let backendMsg = '';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        backendMsg = (error.response.data as { error?: string }).error || '';
      } else if (error instanceof Error) {
        backendMsg = error.message;
      }
      setCartError(backendMsg || String(t('common.errorAddToCart')) || 'Error adding to cart');
      setTimeout(() => setCartError(null), 3000);
    }
  };

  // Quantity change logic (like CartProductCard)
  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;
    if (newQuantity === quantity) return;
    if (product.stock > 0 && newQuantity > product.stock) {
      setStockLimitMessage(String(t('common.stockLimitMessage')) || 'Reached stock limit');
      setTimeout(() => setStockLimitMessage(null), 2000);
      return;
    }
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  useEffect(() => {
    if (!id) return;
    if (mediaCache[id]) {
      setImages(mediaCache[id]);
      return;
    }
    fetch(`${API_URL}/product-media/products/${id}/media`)
      .then(res => res.json())
      .then(data => {
        const media = Array.isArray(data?.data) ? data.data : [];
        setImages(media);
        setMedia(id, media);
      });
  }, [id, mediaCache, setMedia]);

  // Set default selected image to product image or first media image
  useEffect(() => {
    if (selectedMedia) return;
    if (product?.image_url) setSelectedMedia({ media_url: product.image_url, media_type: 'image' });
    else if (images[0]?.media_url) setSelectedMedia({ media_url: images[0].media_url, media_type: images[0].media_type });
  }, [product?.image_url, images, selectedMedia]);

  // When user selects a new media, set loading to true only for video/YouTube
  const handleSelectMedia = (media: { media_url: string; media_type?: string }) => {
    setSelectedMedia(media);
    // Only show loader for video or YouTube
    const url = media.media_url || '';
    const isVideo = media.media_type === 'video' || /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url) || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
    if (isVideo) {
      setMediaLoading(true);
      if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
      mediaTimeoutRef.current = setTimeout(() => setMediaLoading(false), 7000); // fallback 7s
    } else {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
    };
  }, []);

  // Custom video player for main display and zoom
  function CustomVideoPlayer({ src, autoPlay = false, onLoadedData }: { src: string; autoPlay?: boolean; onLoadedData?: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(autoPlay);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play();
        setPlaying(true);
      } else {
        video.pause();
        setPlaying(false);
      }
    };
    const skip = (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
    };
    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video) return;
      setProgress(video.currentTime);
    };
    const handleLoadedMetadata = () => {
      const video = videoRef.current;
      if (!video) return;
      setDuration(video.duration);
      if (onLoadedData) onLoadedData();
    };
    const handleProgressBar = (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const value = Number(e.target.value);
      video.currentTime = value;
      setProgress(value);
    };
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          src={src}
          className="object-cover w-60 h-60 md:w-96 md:h-96 rounded-md bg-black"
          style={{ maxHeight: 384 }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          autoPlay={autoPlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {/* Custom Controls */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%] bg-black/60 rounded-lg flex items-center gap-2 px-3 py-2">
          <button onClick={() => skip(-10)} className="text-white hover:text-primary-400"><FaBackward size={22} /></button>
          <button onClick={togglePlay} className="text-white hover:text-primary-400">
            {playing ? <FaPauseCircle size={28} /> : <FaPlayCircle size={28} />}
          </button>
          <button onClick={() => skip(10)} className="text-white hover:text-primary-400"><FaForward size={22} /></button>
          <input
            type="range"
            min={0}
            max={duration}
            value={progress}
            onChange={handleProgressBar}
            className="flex-1 mx-2 accent-primary-500 h-1 rounded-lg"
          />
          <span className="text-xs text-white min-w-[48px] text-right">
            {Math.floor(progress / 60)}:{('0' + Math.floor(progress % 60)).slice(-2)} / {Math.floor(duration / 60)}:{('0' + Math.floor(duration % 60)).slice(-2)}
          </span>
        </div>
      </div>
    );
  }

  // Helper to render media (image or video)
  function renderMedia(media: { media_url: string; media_type?: string }, isMain = false) {
    if (!media.media_url) return null;
    if (media.media_type === 'video') {
      const url = media.media_url;
      // YouTube
      const youtubeMatch = url.match(
        /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/
      );
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        return (
          <iframe
            width={isMain ? 360 : 64}
            height={isMain ? 240 : 64}
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={isMain ? 'rounded-md w-full h-full' : 'rounded-md'}
            onLoad={() => setMediaLoading(false)}
            style={{ display: mediaLoading ? 'none' : 'block' }}
          />
        );
      }
      // Facebook, Instagram, TikTok (basic support: show link or fallback)
      if (/facebook\.com|instagram\.com|tiktok\.com/.test(url)) {
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            View on Social Media
          </a>
        );
      }
      // Direct video file (mp4, webm, ogg)
      if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
        if (isMain) {
          return <CustomVideoPlayer src={url} onLoadedData={() => setMediaLoading(false)} />;
        }
        // Thumbnail for video
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              src={url}
              className="object-cover w-full h-full rounded-md bg-black"
              style={{ maxHeight: 64, display: mediaLoading ? 'none' : 'block' }}
              muted
              preload="metadata"
              onLoadedData={() => setMediaLoading(false)}
            />
            <FaPlayCircle className="absolute text-white text-2xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow" />
          </div>
        );
      }
      // Fallback: show as link
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          View Video
        </a>
      );
    }
    // Image
    return (
      <Image
        src={media.media_url}
        alt={isMain ? (product?.name || 'main image') : (product?.name || 'thumbnail') + ' thumbnail'}
        className={isMain ? 'object-cover w-60 h-60 md:w-96 md:h-96 rounded-md' : 'object-cover w-full h-full rounded-md'}
        onLoad={() => setMediaLoading(false)}
        style={{ display: mediaLoading ? 'none' : 'block' }}
        width={isMain ? 384 : 64} // Specify the width
        height={isMain ? 384 : 64} // Specify the height
      />

    );
  }

  // TopBar state and handlers (copied from HomePage)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const [showSuggestions, setShowSuggestions] = useState(false);
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Implement search logic here (optional)
    }
  };
  const handleSelectProduct = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    // Optionally: navigate to product page
  };

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewError, setReviewError] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState<'summary' | 'list'>('summary');

  // Fetch reviews for this product (for both tabs)
  useEffect(() => {
    if (!id) return;
    setLoadingReviews(true);
    api.reviews.getByProduct(id)
      .then((productReviews) => {
        setReviews(Array.isArray(productReviews) ? productReviews : []);
        setLoadingReviews(false);
      })
      .catch(() => {
        setReviewError('فشل تحميل التقييمات');
        setLoadingReviews(false);
      });
  }, [id]);

  // Calculate average and breakdown
  const totalReviews = reviews.length;
  const averageRating = totalReviews ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(star => reviews.filter(r => r.rating === star).length);

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRating || !userComment.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({
          product_id: id,
          rating: userRating,
          comment: userComment
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg = typeof errorData?.error === 'string' ? errorData.error : 'فشل إرسال التقييم';
        // Map backend error to localized string
        if (errorMsg === 'You have already reviewed this product') {
          errorMsg = t('product.alreadyReviewed') || t('product.errorSubmit') || 'You have already reviewed this product';
        } else if (errorMsg === 'Rating must be between 1 and 5') {
          errorMsg = t('product.ratingRange') || t('product.errorSubmit') || 'Rating must be between 1 and 5';
        } else if (errorMsg === 'You can only review products you have purchased and received') {
          errorMsg = t('product.mustPurchase') || t('product.errorSubmit') || 'You can only review products you have purchased and received';
        } else {
          errorMsg = t('product.errorSubmit') || errorMsg;
        }
        if (typeof errorMsg !== 'string') errorMsg = 'Review error';
        toast.error(errorMsg, { duration: 2000 });
        setSubmitting(false);
        return;
      }
      setUserRating(0);
      setUserComment('');
      // Refresh reviews
      const allReviews = await api.reviews.getAll();
      setReviews(Array.isArray(allReviews) ? allReviews.filter(r => r.product_id === id) : []);
    } catch {
      toast.error(t('product.errorSubmit') || 'فشل إرسال التقييم', { duration: 2000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Toaster position="top-center" />
      {/* TopBar under header */}
      <TopBar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleKeyPress={handleKeyPress}
        loading={categoriesLoading}
        error={categoriesError ? String(categoriesError) : null}
        categories={categories}
        setShowSuggestions={setShowSuggestions}
        showSuggestions={showSuggestions}
        onSelectProduct={handleSelectProduct}
      />
      <div className="w-full px-2 md:px-8 py-4">
        {/* Main two-column layout for desktop, stacked for mobile */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Gallery (left on desktop, top on mobile) */}
          <section className="flex-1 flex flex-col items-center justify-start">
            {/* Thumbnails: horizontal carousel with arrows on desktop, horizontal scroll on mobile */}
            <div className="relative w-full max-w-xs lg:max-w-md mx-auto mb-4">
              {/* Arrow left */}
              {canScrollLeft && (
                <button
                  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full shadow p-1 hover:bg-gray-100"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setThumbStart(s => Math.max(0, s - 1))}
                  aria-label="Scroll left"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              {/* Thumbnails row */}
              <div className="flex flex-row gap-2 overflow-x-auto lg:overflow-x-visible justify-center lg:justify-start px-8 lg:px-0">
                {visibleThumbs.map((thumb, idx) => (
                  <div
                    key={thumb.media_id ?? thumb.media_url ?? idx}
                    className={`bg-white border ${selectedMedia && selectedMedia.media_url === thumb.media_url ? 'border-primary-500 ring-2 ring-primary-400' : 'border-gray-300'} rounded-2xl shadow-sm flex items-center justify-center p-2 cursor-pointer min-w-[64px] min-h-[64px]`}
                    style={{ width: 64, height: 64 }}
                    onClick={() => handleSelectMedia({ media_url: thumb.media_url, media_type: thumb.media_type })}
                    onMouseEnter={() => handleSelectMedia({ media_url: thumb.media_url, media_type: thumb.media_type })}
                  >
                    {renderMedia(thumb, false)}
                  </div>
                ))}
              </div>
              {/* Arrow right */}
              {canScrollRight && (
                <button
                  className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full shadow p-1 hover:bg-gray-100"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setThumbStart(s => Math.min(totalThumbs - THUMBS_VISIBLE, s + 1))}
                  aria-label="Scroll right"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>
            {/* Main image/video display */}
            <div
              className="bg-white rounded-2xl border border-gray-300 shadow-sm flex items-center justify-center p-2 md:p-6 transition-all duration-300 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full mx-auto"
              style={{ minHeight: 200, maxHeight: 420 }}
            >
              {mediaLoading && selectedMedia && (selectedMedia.media_type === 'video' || /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(selectedMedia.media_url)) && <LoadingSpinner />}
              {(!mediaLoading || (selectedMedia && selectedMedia.media_type !== 'video' && !/(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(selectedMedia.media_url))) && selectedMedia && renderMedia(selectedMedia, true)}
            </div>
            {/* Zoom Modal/Overlay */}
            {zoomed && (() => {
              const mainMedia =
                images.find(img => img.media_url === selectedMedia?.media_url) ||
                (selectedMedia?.media_url === product?.image_url
                  ? { media_url: product?.image_url, media_type: 'image' }
                  : images[0]);
              if (!mainMedia) return null;
              if (mainMedia.media_type === 'video') return null;
              return (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 cursor-zoom-out p-4"
                  onClick={() => setZoomed(false)}
                >
                  <Image
                    src={mainMedia.media_url}
                    alt={product?.name || 'zoomed image'}
                    className="object-contain max-w-full max-h-full rounded-lg shadow-2xl"
                  />
                </div>
              );
            })()}
          </section>
          {/* Info (right on desktop, below gallery on mobile) */}
          <section className="flex-1 flex flex-col gap-6 bg-white rounded-2xl border border-gray-300 shadow-sm p-4 md:p-6 relative">
            {/* Favorite Icon - moved to top left */}
            <div className="flex justify-start mb-4">
              <button
                className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 z-10 ${isFavorite ? 'bg-[#F8C291]' : 'bg-white hover:bg-gray-50'} ${pending ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFavorite();
                }}
                type="button"
                disabled={pending || favLoading}
              >
                {pending ? (
                  <svg className="animate-spin w-6 h-6 md:w-8 md:h-8 text-[#2C2C54]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <Heart
                    className={`w-6 h-6 md:w-8 md:h-8 transition-all duration-300 ${isFavorite ? 'text-white fill-white scale-110' : 'text-[#2C2C54] hover:text-[#F8C291]'}`}
                  />
                )}
              </button>
            </div>
            {/* Product Name - aligned to left */}
            <div className="mb-4">
              <h1 className="text-xl md:text-2xl font-bold text-primary-900 text-right">{product?.name || 'اسم المنتج'}</h1>
            </div>
            {/* Price and Stock */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 md:gap-4 mb-4 w-full">
              {product?.is_deal_offer ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-end gap-2">
                    <span className="font-extrabold text-2xl md:text-3xl text-green-600 bg-green-50 rounded-lg px-4 py-2 shadow-sm border border-green-200 flex items-center">
                      {formatPrice(product.final_price, t('common.locale'))}
                    </span>
                    <span className="text-base md:text-lg font-normal line-through text-gray-400 ml-2">
                      {formatPrice(product.original_price, t('common.locale'))}
                    </span>
                    {product.discount_percentage && (
                      <span className="bg-gradient-to-r from-green-200 to-green-400 text-green-900 font-bold rounded-full px-3 py-1 text-xs md:text-sm shadow border border-green-300 animate-pulse">
                        -{product.discount_percentage}%
                      </span>
                    )}
                  </div>
                  {product.discount_end_date && (
                    <span className="text-xs md:text-sm text-green-700 font-semibold mt-1 bg-green-50 rounded px-2 py-1 inline-block">
                      <DealCountdown endDate={product.discount_end_date} />
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-bold text-lg md:text-xl text-[#2C2C54] bg-gray-100 rounded px-3 md:px-4 py-2 flex items-center">
                  {formatPrice(product?.price, t('common.locale'))}
                  <span className="text-sm md:text-base font-normal ml-1">{t('common.currency') || 'ل.س'}</span>
                </span>
              )}
              <span className={`flex items-center font-bold text-sm md:text-base ${product?.stock > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {product?.stock > 0 ? (
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
                {product?.stock > 0 ? `${String(t('common.inStock'))}: ${product?.stock}` : String(t('common.outOfStock'))}
              </span>
            </div>
            {/* Toast messages */}
            {cartMessage && (
              <div className="mb-2 px-3 py-2 rounded bg-green-100 text-green-800 text-center text-xs md:text-sm font-bold animate-fade-in">
                {cartMessage}
              </div>
            )}
            {cartError && (
              <div className="mb-2 px-3 py-2 rounded bg-red-100 text-red-800 text-center text-xs md:text-sm font-bold animate-fade-in">
                {cartError}
              </div>
            )}
            {stockLimitMessage && (
              <div className="mb-2 px-3 py-2 rounded bg-orange-100 text-orange-700 text-center text-xs md:text-sm font-bold animate-fade-in">
                {stockLimitMessage}
              </div>
            )}
            {/* Add to Cart and Quantity Counter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 mt-4 md:mt-6 w-full">
              <div className="flex items-center bg-[#E5E5E5] rounded-full px-3 md:px-4 py-2 gap-3 md:gap-4 text-base md:text-lg font-bold select-none w-full sm:w-auto">
                <button
                  className={`text-xl md:text-2xl px-1 md:px-2 focus:outline-none cursor-pointer transition-colors ${quantity <= 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  type="button"
                >
                  –
                </button>
                <span className="w-6 text-center">{quantity}</span>
                <button
                  className={`text-xl md:text-2xl px-1 md:px-2 focus:outline-none cursor-pointer transition-colors ${product?.stock > 0 && quantity >= product.stock ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={product?.stock > 0 && quantity >= product.stock}
                  type="button"
                >
                  +
                </button>
              </div>
              <button
                className={`bg-[#2C2C54] text-white font-bold px-4 md:px-6 py-2 rounded-lg shadow hover:bg-[#23234a] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto text-sm md:text-base ${product?.stock === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                aria-label={String(t('common.addToCart'))}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart();
                }}
                type="button"
                disabled={addToCart.isPending || product?.stock === 0}
              >
                <span>{product?.stock === 0 ? String(t('common.outOfStock')) : String(t('common.addToCart'))}</span>
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            {/* Product Description (HTML) */}
            {product?.description && (
              <div className="mt-6 md:mt-8">
                <h3 className="font-bold text-primary-900 mb-2 text-sm md:text-base">{String(t('product.description')) || 'وصف المنتج'}</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-800 bg-gray-50 border border-gray-200 rounded p-3 md:p-4 text-xs md:text-sm"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </section>
        </div>
        {/* Reviews: always full width, below main row */}
        <section className="w-full mt-8">
          <section className="w-full my-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 font-tajawal">
            {/* Tab Bar */}
            <div className="flex flex-row gap-2 mb-4 md:mb-6 border-b border-gray-100 overflow-x-auto">
              <button
                className={`px-3 md:px-4 py-2 font-bold rounded-t-md transition-colors whitespace-nowrap text-sm md:text-base ${activeReviewTab === 'summary' ? 'text-[#F8C291] border-b-2 border-[#F8C291] bg-white' : 'text-gray-400 bg-gray-50'}`}
                onClick={() => setActiveReviewTab('summary')}
                type="button"
              >
                Reviews & Ratings
              </button>
              <button
                className={`px-3 md:px-4 py-2 font-bold rounded-t-md transition-colors whitespace-nowrap text-sm md:text-base ${activeReviewTab === 'list' ? 'text-[#F8C291] border-b-2 border-[#F8C291] bg-white' : 'text-gray-400 bg-gray-50'}`}
                onClick={() => setActiveReviewTab('list')}
                type="button"
              >
                User Reviews
              </button>
            </div>
            {/* Tab Content */}
            {activeReviewTab === 'summary' ? (
              <div>
                <div className="flex flex-col lg:flex-row gap-4 md:gap-8 items-center justify-between">
                  {/* Left: Rating breakdown */}
                  <div className="flex-1 min-w-0 w-full lg:min-w-[220px]">
                    <div className="border-b border-gray-200 mb-4"></div>
                    {[5, 4, 3, 2, 1].map((star, i) => (
                      <div key={star} className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold w-8">{((ratingCounts[i] / (totalReviews || 1)) * 100).toFixed(1)}%</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-2 bg-[#F8C291]" style={{ width: `${(ratingCounts[i] / (totalReviews || 1)) * 100}%` }}></div>
                        </div>
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-[#F8C291] ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" /></svg>
                      </div>
                    ))}
                  </div>
                  {/* Right: Average and stars */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-xl md:text-2xl font-bold text-[#2C2C54]">
                      <span>{averageRating.toFixed(1)}</span>
                      <span className="text-sm md:text-base font-normal">{String(t('common.of'))} 5</span>
                    </div>
                    <div className="flex gap-1 my-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className="w-6 h-6 md:w-7 md:h-7" fill={averageRating >= star ? '#F8C291' : 'none'} stroke="#F8C291" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" /></svg>
                      ))}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 text-center">{String(t('common.basedOn'))} {totalReviews} {String(t('common.reviewsCount')) || 'تقييمات'}</div>
                  </div>
                </div>
                {/* Add Review Form */}
                {isLoggedIn && (
                  <form onSubmit={handleSubmitReview} className="mt-6 md:mt-8 flex flex-col gap-3">
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button type="button" key={star} onClick={() => setUserRating(star)} className="focus:outline-none">
                          <svg className={`w-6 h-6 md:w-7 md:h-7 ${userRating >= star ? 'text-[#F8C291]' : 'text-gray-300'}`} fill={userRating >= star ? '#F8C291' : 'none'} stroke="#F8C291" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" /></svg>
                        </button>
                      ))}
                    </div>
                    <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#F8C291]" rows={3} maxLength={300} value={userComment} onChange={e => setUserComment(e.target.value)} placeholder="Write your review here..." required />
                    <button type="submit" className="bg-[#F8C291] text-[#2C2C54] font-bold px-4 md:px-6 py-2 rounded-lg shadow hover:bg-[#f7b87b] transition disabled:opacity-60 text-sm md:text-base" disabled={submitting || !userRating || !userComment.trim()}>{submitting ? 'Sending...' : 'Add Review'}</button>
                    {reviewError && <div className="text-red-500 text-sm mt-2">{reviewError}</div>}
                  </form>
                )}
              </div>
            ) : (
              <div className="mt-4 max-h-60 md:max-h-72 overflow-y-auto pr-2">
                {loadingReviews ? (
                  <div className="text-center text-gray-400 py-8">{String(t('common.loading')) || 'جاري التحميل...'}</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">{String(t('product.noReviews')) || 'لا توجد تقييمات بعد.'}</div>
                ) : (
                  <ul className="space-y-4 md:space-y-6">
                    {reviews.map((review, idx) => (
                      <li key={review.id || idx} className="border-b border-gray-100 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-bold text-[#2C2C54] text-sm md:text-base">{review.customer_name || 'مستخدم'}</span>
                          <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('ar-EG')}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <svg key={star} className="w-3 h-3 md:w-4 md:h-4" fill={review.rating >= star ? '#F8C291' : 'none'} stroke="#F8C291" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" /></svg>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs md:text-sm text-gray-700">{review.comment}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </section>
      </div>
      <Footer />
    </div>
  );
}

// Countdown timer for deal offers
function DealCountdown({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  useEffect(() => {
    function updateCountdown() {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft('انتهى العرض');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${days}ي ${hours}س ${minutes}د ${seconds}ث`);
    }
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [endDate]);
  return <span className="text-base font-bold text-green-700">ينتهي خلال: {timeLeft}</span>;
}
