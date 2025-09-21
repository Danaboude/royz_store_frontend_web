// CartProductCard: For use in the cart page, main action is Add to Favorite.
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAddFavorite, useRemoveFavorite, useFavorites, useRemoveCartItem, useUpdateCartItem } from '@/services/api-client';
import { useUser } from '@/contexts/UserContext';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';


interface CartProductCardProps {
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
    quantity: number;
}

interface Props {
    product: CartProductCardProps;
}

export default function CartProductCard({ product }: Props) {
    const { locale, t } = useI18n();
    const isRTL = locale === 'ar';
    const { user, isLoggedIn } = useUser();
    const addFavorite = useAddFavorite();
    const removeFavorite = useRemoveFavorite();
    const { data: favorites = [], isLoading: favLoading } = useFavorites(isLoggedIn);
    const favoritesArray = Array.isArray(favorites) ? favorites : [];
    const isFavorite = isLoggedIn && favoritesArray.includes(product.product_id);
    const [pending, setPending] = useState(false);
    const [quantity, setQuantity] = useState(product.quantity);
    const [favEffect, setFavEffect] = useState(false);
    const [stockLimitMessage, setStockLimitMessage] = useState<string | null>(null);
    const removeCartItem = useRemoveCartItem();
    const updateCartItem = useUpdateCartItem();

    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity === quantity) {
            return;
        }

        // Check stock limit before making API call
        if (product.stock > 0 && newQuantity > product.stock) {
            setStockLimitMessage(t('common.stockLimitMessage'));
            setTimeout(() => setStockLimitMessage(null), 2000);
            return;
        }

        try {
            const result = await updateCartItem.mutateAsync({ product_id: product.product_id, quantity: newQuantity });
            // Handle the new response format from backend
            if (result && typeof result === 'object') {
                if (result.quantityLimited) {
                    const translatedMessage = t(result.message) || result.message;
                    setStockLimitMessage(`${translatedMessage} (Limited to ${result.maxQuantity} items)`);
                    // Update local quantity to match what backend actually set
                    setQuantity(result.maxQuantity || newQuantity);
                } else {
                    setQuantity(newQuantity);
                }
            } else {
                setQuantity(newQuantity);
            }

        } catch (error) {
            console.error('=== QUANTITY UPDATE ERROR ===');
            console.error('Failed to update quantity:', error);

            // Check if it's a stock limit error
            if (error instanceof Error && error.message.includes('Insufficient stock')) {
                setStockLimitMessage(t('common.stockLimitMessage'));
                setTimeout(() => setStockLimitMessage(null), 2000);
            }

            setQuantity(product.quantity);
        }
    };

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
            setFavEffect(true);
            setTimeout(() => setFavEffect(false), 500);
        } catch (error) {
            alert(t('common.errorOccurred') || 'An error occurred. Please try again.' + error);
        } finally {
            setPending(false);
        }
    };

    return (
        <div
            className="w-full bg-white rounded-xl sm:rounded-2xl border border-[#2C2C54]/10 shadow flex flex-col sm:flex-row items-stretch overflow-hidden relative max-w-none"
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{ minHeight: 180 }}
        >
            {/* Stock status and quantity: hidden on mobile, absolute on sm+ */}
            <div
                className={`hidden sm:flex sm:absolute sm:top-4 ${isRTL ? 'sm:left-6 items-start' : 'sm:right-6 items-end'} flex-col gap-2 z-10`}>
                {/* Stock limit message */}
                {stockLimitMessage && (
                    <div className={`bg-orange-100 border border-orange-400 text-orange-700 px-3 py-2 rounded-md text-sm font-medium shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                        {stockLimitMessage}
                    </div>
                )}
                <span className={`text-base font-medium ${product.stock > 0 ? 'text-green-500' : 'text-orange-500'}`}>{product.stock > 0 ? t('common.inStock') : 'Out of Stock (Can still order)'}</span>
                <div className="flex items-center bg-[#E5E5E5] rounded-full px-4 py-2 gap-4 text-lg font-bold select-none">
                    <button
                        className={`text-2xl px-2 focus:outline-none cursor-pointer transition-colors ${quantity <= 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'
                            }`}
                        onClick={() => {
                            if (quantity > 1) {
                                handleQuantityChange(quantity - 1);
                            }
                        }}
                        disabled={quantity <= 1}
                        type="button"
                    >
                        –
                    </button>
                    <span className="w-6 text-center">{quantity}</span>
                    <button
                        className={`text-2xl px-2 focus:outline-none cursor-pointer transition-colors ${product.stock > 0 && quantity >= product.stock
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'hover:bg-gray-200'
                            }`}
                        onClick={() => {
                            if (product.stock === 0 || quantity < product.stock) {
                                handleQuantityChange(quantity + 1);
                            } else {
                                setStockLimitMessage(t('common.stockLimitMessage'));
                                setTimeout(() => setStockLimitMessage(null), 2000);
                            }
                        }}
                        disabled={product.stock > 0 && quantity >= product.stock}
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
                        <Image
                            width={150} // Specify the width
                            height={150} // Specify the height
                            src={product.image_url}
                            alt={product.name}
                            className="object-cover w-full h-full rounded-xl sm:rounded-2xl"
                        />
                    ) : (
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="10" y="20" width="60" height="40" rx="15" stroke="#F8C291" strokeWidth="2.5" />
                            <circle cx="28" cy="34" r="5" stroke="#F8C291" strokeWidth="2.5" />
                            <path d="M20 60L40 40L60 60" stroke="#F8C291" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
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
                {/* Actions at the bottom */}
                <div className="flex justify-center items-center gap-2 sm:gap-4 mt-2 sm:mt-4 z-50 relative">
                    <button
                        className={`text-[#2C2C54] font-bold text-base sm:text-lg hover:underline focus:outline-none transition cursor-pointer px-4 py-2 rounded ${favEffect ? 'bg-[#F8C291]/30 scale-105 text-green-600' : 'hover:bg-gray-100'}`}
                        onClick={handleFavorite}
                        type="button"
                        disabled={pending || favLoading}
                    >
                        {t('common.addToFavorite') || 'أضف إلى المفضلة'}
                        <Heart className={`inline-block w-4 h-4 sm:w-5 sm:h-5 ml-2 ${isFavorite ? 'text-[#F8C291] fill-[#F8C291]' : ''}`} />
                    </button>
                    <span className="text-[#2C2C54]/40">|</span>
                    <button
                        className="text-red-500 font-bold text-base sm:text-lg hover:underline focus:outline-none cursor-pointer px-4 py-2 rounded hover:bg-red-50"
                        onClick={() => {
                            removeCartItem.mutate(product.product_id);
                        }}
                        disabled={removeCartItem.isPending}
                        type="button"
                    >
                        {t('common.removeFromCart') || 'Remove from Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
} 