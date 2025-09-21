import React from 'react';
import { useState } from 'react';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useFavorites, useAddFavorite, useRemoveFavorite, useAddToCart } from '@/services/api-client';
import { useUser } from '@/contexts/UserContext';
import { formatPrice } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';


export interface ProductCardProps {
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  description: string;
  category_name: string;
  vendor_name: string;
  stock: number;
  average_rating: number;
  review_count: number;
  is_new: boolean;
  is_best_selling: boolean;
  is_deal_offer: boolean;
  original_price: string | null;
  discount_percentage: number | null;
  final_price: string;
  has_active_discount: boolean;
  is_favorite?: boolean;
}

interface Props {
  product: ProductCardProps;
  onToggleFavorite?: () => void;
}

export default function ProductCard({ product }: Props) {
  const { locale, t } = useI18n();
  const isRTL = locale === 'ar';
  const { user, isLoggedIn } = useUser();
  const { data: favorites = [], isLoading: favLoading } = useFavorites(isLoggedIn);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addToCart = useAddToCart();
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const fetchCart = useUIStore(state => state.fetchCart);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [cardLoading, setCardLoading] = useState(false); // New state for card click loading


  // Ensure favorites is always an array and handle edge cases
  const favoritesArray = Array.isArray(favorites) ? favorites : [];
  const isFavorite = isLoggedIn && favoritesArray.includes(product.product_id);




  const handleFavorite = async () => {
    if (favLoading || pending) return;

    if (!isLoggedIn || !user) {
      // Show alert for unauthenticated users
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
      console.error('❌ Error toggling favorite:', error);
      alert(t('common.errorOccurred') || 'An error occurred. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const handleAddToCart = async () => {
    setCartMessage(null);
    setCartError(null);
    try {
      if (!isLoggedIn || !user) {
        setCartMessage(t('common.pleaseLogincart') || 'Please login to add favorites');
        return;
      }
      const result = await addToCart.mutateAsync({ product_id: product.product_id, quantity: 1 });
      await fetchCart();

      // Handle the new response format from backend
      if (result && typeof result === 'object') {
        if (result.quantityLimited) {
          const translatedMessage = String(t(result.message) || result.message);
          setCartMessage(`${translatedMessage} (Limited to ${result.maxQuantity} items)`);
        } else {
          const translatedMessage = String(t(result.message) || result.message);
          setCartMessage(translatedMessage);
        }
      } else {
        setCartMessage(String(t('common.addedToCart') || 'Added to cart!'));
      }

      setTimeout(() => setCartMessage(null), 3000);
    } catch (error: unknown) {
      // Show backend error message if available
      let backendMsg = '';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        backendMsg = (error.response.data as { error?: string }).error || '';
      } else if (error instanceof Error) {
        backendMsg = error.message;
      }
      setCartError(String(backendMsg || t('common.errorAddToCart') || 'Error adding to cart'));
      setTimeout(() => setCartError(null), 3000);
    }
  };

  const handleCardClick = () => {
    setCardLoading(true);
    router.push(`/products/${product.product_id}`);
  };

  if (!product || !product.product_id || !product.name) {
    return <div className="bg-red-100 text-red-700 p-2 rounded">Invalid product data</div>;
  }

  return (
    <div
      className="flex flex-col items-stretch w-full max-w-[260px] mx-auto cursor-pointer min-h-[420px] relative"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Loader overlay when navigating */}
      {cardLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 rounded-xl">
          <svg className="animate-spin w-12 h-12 text-[#2C2C54]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}
      {/* Card */}
      <div className="relative bg-white border-2 border-[#2C2C54] rounded-xl shadow overflow-hidden flex flex-col w-full">
        {/* Image area */}
        <div className="w-full aspect-[4/5] min-h-[160px] max-h-[210px] rounded-xl overflow-hidden flex items-center justify-center bg-[#979797]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={150} // Specify the width
              height={150} // Specify the height
              className="object-cover object-center w-full h-full rounded-xl"
            />
          ) : (
            <svg width="80" height="90" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="15" width="60" height="60" rx="15" stroke="white" strokeWidth="2.5" />
              <circle cx="28" cy="40" r="7" stroke="white" strokeWidth="2.5" />
              <path d="M20 75L40 45L60 75" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        {/* Heart button */}
        <button
          className={`absolute top-4 right-4 w-16 h-16 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 z-10 ${isFavorite
            ? 'bg-[#F8C291]'
            : 'bg-white hover:bg-gray-50'
            } ${pending ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
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
            <svg className="animate-spin w-8 h-8 text-[#2C2C54]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <Heart
              className={`w-8 h-8 transition-all duration-300 ${isFavorite
                ? 'text-white fill-white scale-110'
                : 'text-[#2C2C54] hover:text-[#F8C291]'
                }`}
            />
          )}
        </button>
        {/* Product Name */}
        <div className="px-6 pt-6 pb-2">
          <div
            className="font-bold text-lg text-primary-900 break-words whitespace-normal product-name-clamp"
            style={{
              minHeight: '48px', // Ensures space for 2 lines
              maxHeight: '48px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: product.name.length > 32 ? '1rem' : '1.125rem', // Reduce font size for long names
              lineHeight: '1.2',
            }}
            title={product.name}
          >
            {product.name}
          </div>
        </div>
      </div>
      {/* Under-card content: price/rating row and add-to-cart button, perfectly aligned */}
      <div className="max-w-[260px] mx-auto w-full">
        {/* Toast messages */}
        {cartMessage && (
          <div className="mb-2 px-3 py-2 rounded bg-green-100 text-green-800 text-center text-sm font-bold animate-fade-in">
            {cartMessage}
          </div>
        )}
        {cartError && (
          <div className="mb-2 px-3 py-2 rounded bg-red-100 text-red-800 text-center text-sm font-bold animate-fade-in">
            {cartError}
          </div>
        )}
        <div className="bg-white flex items-center justify-between px-6 pt-6 py-2" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {/* Price display with deal/discount UI */}
          <span className="font-bold text-base text-black flex flex-col items-start">
            {product.is_deal_offer ? (
              <>
                <span className="text-gray-400 text-sm line-through">{formatPrice(product.original_price, locale)}</span>
                <span className="text-[#F76B1C] text-lg font-extrabold">{formatPrice(product.final_price, locale)}</span>
              </>
            ) : (
              formatPrice(product.price, locale)
            )}
          </span>
          <span className="flex items-center gap-1 font-bold text-base text-black">
            <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
            {Number(product.average_rating).toFixed(1)}
          </span>
        </div>
        <button
          className={`mt-0 py-2 bg-[#2C2C54] text-white border-2 border-white rounded-xl flex items-center justify-center gap-2 font-bold text-base transition-colors hover:bg-[#23234a] w-full disabled:opacity-60 disabled:cursor-not-allowed ${product.stock === 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          style={{ maxWidth: '100%' }}
          aria-label={String(t('common.addToCart'))}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddToCart();
          }}
          type="button"
          disabled={addToCart.isPending || product.stock === 0}
        >
          <span>{product.stock === 0 ? String(t('common.outOfStock')) : String(t('common.addToCart'))}</span>
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 