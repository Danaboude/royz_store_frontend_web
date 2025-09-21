import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useRemoveFavorite, useAddFavorite, useAddToCart } from '@/services/api-client';
import { useUser } from '@/contexts/UserContext';
import { formatPrice } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import ImageWithFallback from '../components/ImageWithFallback';

interface FavoriteProductCardProps {
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
  product: FavoriteProductCardProps;
  onAddToCart?: (quantity: number) => void;
  onRemoveFromFavorites?: () => void;
}

export default function FavoriteProductCard({ product, onAddToCart, onRemoveFromFavorites }: Props) {
  const { locale, t } = useI18n();
  const isRTL = locale === 'ar';
  const { user, isLoggedIn } = useUser();
  const removeFavorite = useRemoveFavorite();
  const addFavorite = useAddFavorite();
  const addToCart = useAddToCart();
  const fetchCart = useUIStore(state => state.fetchCart);
  const [pending, setPending] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartEffect, setCartEffect] = useState(false);

  // Helper to ensure translation is always a string
  const getString = (val: unknown, fallback: string): string => typeof val === 'string' ? val : fallback;

  const handleRemoveFavorite = async () => {
    if (pending) return;
    if (!isLoggedIn || !user) {
      alert(t('common.pleaseLogin') || 'Please login to manage favorites');
      return;
    }
    setPending(true);
    try {
      await removeFavorite.mutateAsync(product.product_id);
      if (onRemoveFromFavorites) onRemoveFromFavorites();
    } catch {
      alert(t('common.errorOccurred') || 'An error occurred. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const handleAddFavorite = () => {
    if (!product.product_id) return;
    addFavorite.mutate(product.product_id);
  };

  const handleAddToCart = async () => {
    try {
       if (!isLoggedIn || !user) {
            alert(t('common.pleaseLogin') || 'Please login to add favorites');
            return;
        }
      await addToCart.mutateAsync({ product_id: product.product_id, quantity });
      await fetchCart();
      setCartEffect(true);
      setTimeout(() => setCartEffect(false), 500);
    } catch (error) {
      console.log(error);
            // Optionally handle error silently
    }
  };

  // Layout: horizontal card, image on right (LTR) or left (RTL)
  return (
    <Link
      href={`/products/${product.product_id}`}
      className="w-full bg-white rounded-xl sm:rounded-2xl border border-[#2C2C54]/10 shadow flex flex-col sm:flex-row items-stretch overflow-hidden relative max-w-none transition hover:shadow-lg cursor-pointer"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ minHeight: 180 }}
      tabIndex={0}
    >
      {/* Heart icon: static on mobile, absolute on sm+ */}
      {onAddToCart && (
        <button
          className={`sm:absolute sm:top-4 ${isRTL ? 'sm:right-6' : 'sm:left-6'} z-20 text-[#F8C291] hover:text-[#e17055] transition mx-auto mt-2 sm:mt-0`}
          onClick={e => { e.stopPropagation(); handleAddFavorite(); }}
          type="button"
          aria-label={getString(t('common.addToFavorite'), 'أضف إلى المفضلة')}
        >
          <Heart className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}
      {/* Stock status and quantity: hidden on mobile, absolute on sm+ */}
      <div className={`hidden sm:flex sm:absolute sm:top-4 ${isRTL ? 'sm:left-6 items-start' : 'sm:right-6 items-end'} flex-col gap-2 z-10`}>
        <span className={`text-base font-medium ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{product.stock > 0 ? getString(t('common.inStock'), 'In Stock') : getString(t('common.outOfStock'), 'Out of Stock')}</span>
        <div className="flex items-center bg-[#E5E5E5] rounded-full px-4 py-2 gap-4 text-lg font-bold select-none">
          <button
            className="text-2xl px-2 focus:outline-none"
            onClick={e => { e.stopPropagation(); setQuantity(q => Math.max(1, q - 1)); }}
            disabled={quantity <= 1}
            type="button"
          >
            –
          </button>
          <span className="w-6 text-center">{quantity}</span>
          <button
            className="text-2xl px-2 focus:outline-none"
            onClick={e => { e.stopPropagation(); setQuantity(q => Math.min(product.stock, q + 1)); }}
            disabled={quantity >= product.stock}
            type="button"
          >
            +
          </button>
        </div>
      </div>
      {/* Image and right-side info */}
      <div className="w-full aspect-square max-w-[140px] max-h-[140px] sm:min-w-[220px] sm:max-w-[220px] flex flex-col items-center justify-center bg-white border-l border-[#F8C291] py-2 sm:py-4 gap-1 sm:gap-3 mx-auto">
        <div className="w-full h-full flex items-center justify-center rounded-xl sm:rounded-2xl border border-[#F8C291] bg-white overflow-hidden">
          {product.image_url ? (
            <ImageWithFallback src={product.image_url} height={90} width={90} alt={product.name} className="object-cover w-full h-full rounded-xl sm:rounded-2xl" />
          ) : (
            <ImageWithFallback src={'/ROY.PNG'}  height={90} width={90} alt={product.name} className="object-cover w-full h-full rounded-xl sm:rounded-2xl" />
          )}
        </div>
      </div>
      {/* Info */}
      <div className="flex-1 flex flex-col justify-between p-2 sm:p-6 gap-1 sm:gap-2 w-full">
        {/* Product name, price, rating */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <span className="block text-base sm:text-lg font-bold text-[#2C2C54] mb-1 break-words whitespace-normal">{product.name}</span>
          <div className="flex items-center gap-3 sm:gap-6">
            {product.is_deal_offer ? (
              <span className="flex flex-col items-start">
                <span className="text-gray-400 text-sm line-through">{formatPrice(product.original_price, locale)}</span>
                <span className="text-[#F76B1C] text-lg font-extrabold">{formatPrice(product.final_price, locale)}</span>
              </span>
            ) : (
              <span className="text-base sm:text-xl font-bold text-[#2C2C54]">{formatPrice(product.price, locale)}</span>
            )}
            <span className="flex items-center gap-1 text-base sm:text-xl font-bold text-[#FFD700]">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="#FFD700" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
              <span className="text-black">{Number(product.average_rating).toFixed(1)}</span>
            </span>
          </div>
        </div>
        {/* Actions: static on mobile, absolute on sm+ */}
        <div className="flex justify-center items-center gap-2 sm:gap-4 mt-2 sm:mt-0 sm:absolute sm:left-0 sm:right-0 sm:bottom-4">
          <button
            className={`text-[#2C2C54] font-bold text-base sm:text-lg hover:underline focus:outline-none transition ${cartEffect ? 'bg-[#F8C291]/30 scale-105 text-green-600' : ''}`}
            onClick={e => { e.stopPropagation(); handleAddToCart(); }}
            disabled={product.stock === 0}
            type="button"
          >
            {getString(t('common.addToCart'), 'أضف إلى السلة')}
            <ShoppingCart className="inline-block w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </button>
          <span className="text-[#2C2C54]/40">|</span>
          <button
            className="text-red-500 font-bold text-base sm:text-lg hover:underline focus:outline-none"
            onClick={e => { e.stopPropagation(); handleRemoveFavorite(); }}
            disabled={pending}
            type="button"
          >
            {getString(t('common.delete'), 'حذف')}
          </button>
        </div>
      </div>
    </Link>
  );
} 