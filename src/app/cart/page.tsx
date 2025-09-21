"use client";
import Footer from '@/components/Footer';
import { useI18n } from '@/contexts/I18nContext';
import { useUIStore } from '@/store/uiStore';
import CartProductCard from '@/views/CartProductCard';
import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api-client';

// Type for the actual backend cart item structure
type BackendCartItem = {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product_name: string;
  product_price: string;
  product_image: string | null;
  total_price: string;
  stock?: number;
  description?: string;
  category_name?: string;
  vendor_name?: string;
  average_rating?: number;
  review_count?: number;
  is_new?: boolean;
  is_best_selling?: boolean;
  is_deal_offer?: boolean;
  original_price?: string | null;
  discount_percentage?: number | null;
  has_active_discount?: boolean;
};

export default function CartPage() {
  const { locale, t } = useI18n();
  const isRTL = locale === 'ar';
  const cart = useUIStore((s) => s.cart);
  const [clearing, setClearing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [couponMessage, setCouponMessage] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const router = useRouter();
  const setCouponZustand = useUIStore((s) => s.setCoupon);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-[#A5A6F6] text-xl">Loading...</span>
      </div>
    );
  }

  // Debug: log cart data
  if (typeof window !== 'undefined') {
        if (cart && cart.items.length > 0) {
          }
  }

  const handleClearCart = async () => {
        setClearing(true);
    try {
      // Clear cart in both backend and frontend
      await useUIStore.getState().clearCart(true);
          } catch (err) {
      console.error('Failed to clear cart', err);
      alert('Failed to clear cart: ' + err);
    } finally {
      setClearing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!coupon) return;
    setCouponStatus('checking');
    setCouponMessage('');
    const url = `/coupons/code/${encodeURIComponent(coupon)}?cart_total=${subtotal}`;
    try {
      const res = await apiClient.get(url, { withCredentials: true });
      const data = res.data;
      if (res.status === 200 && data && data.valid) {
        setCouponStatus('valid');
        setCouponMessage(t('cartSummary.couponValid') as string);
        setAppliedCoupon({
          code: data.code || coupon,
          discount: data.discount_percentage || 0
        });
        setCouponZustand({ code: data.code || coupon, discount: data.discount_percentage || 0 });
      } else {
        setCouponStatus('invalid');
        const reason = data?.reason || res.data?.reason;
        if (reason === 'expired') setCouponMessage(t('cartSummary.couponExpired') as string);
        else if (reason === 'max_uses') setCouponMessage(t('cartSummary.couponMaxUses') as string);
        else if (reason === 'not_found') setCouponMessage(t('cartSummary.couponNotFound') as string);
        else if (reason === 'min_order') setCouponMessage(t('cartSummary.couponMinOrder') as string);
        else setCouponMessage(t('cartSummary.couponInvalid') as string);
        setAppliedCoupon(null);
        setCouponZustand(null);
      }
    } catch (err: unknown) {
      setCouponStatus('invalid');
      const reason = (err as { response?: { data?: { reason?: string } } })?.response?.data?.reason;
      if (reason === 'expired') setCouponMessage(t('cartSummary.couponExpired') as string);
      else if (reason === 'max_uses') setCouponMessage(t('cartSummary.couponMaxUses') as string);
      else if (reason === 'not_found') setCouponMessage(t('cartSummary.couponNotFound') as string);
      else if (reason === 'min_order') setCouponMessage(t('cartSummary.couponMinOrder') as string);
      else setCouponMessage(t('cartSummary.couponInvalid') as string);
      setCouponZustand(null);
    }
  };

  // Compute totalProducts, totalQuantity, and subtotal
  const subtotal = cart
    ? (cart.items as unknown as BackendCartItem[]).reduce(
        (sum, item) => {
          const price = parseFloat(item.total_price);
          return sum + (isNaN(price) ? 0 : price);
        },
        0
      ).toFixed(2)
    : '0.00';
  const discountAmount = appliedCoupon ? (parseFloat(subtotal) * appliedCoupon.discount / 100) : 0;
  const discountedTotal = (parseFloat(subtotal) - discountAmount).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className={`flex flex-1 w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
        <main className="flex-1 p-6 flex flex-col">
          <div className="bg-white rounded-2xl shadow-lg p-8 flex-1">
            {/* Cart Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-[#2C2C54]">{String(t('cart.myCart')) || 'عربة التسوق الخاصة بي'}</h1>
              <button
                className="border border-[#A5A6F6] rounded-lg px-6 py-2 text-[#A5A6F6] font-bold bg-transparent hover:bg-[#A5A6F6]/10 transition"
                onClick={handleClearCart}
                disabled={clearing}
              >
                {clearing ? (isRTL ? '...جاري التفريغ' : 'Clearing...') : (String(t('cart.clearCart')) || 'تفريغ عربة التسوق')}
              </button>
            </div>
            {/* Cart Items */}
            {cart && cart.items.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {(cart.items as unknown as BackendCartItem[]).map((item) => {
                    // The backend returns flattened cart items with product data directly on the item
                    return (
                      <CartProductCard
                        key={item.id}
                        product={{
                          product_id: item.product_id,
                          name: item.product_name || 'Unknown Product',
                          price: item.product_price || '0',
                          image_url: item.product_image || '',
                          stock: item.stock || 1,
                          quantity: item.quantity,
                          description: item.description || '',
                          category_name: item.category_name || '',
                          vendor_name: item.vendor_name || '',
                          average_rating: item.average_rating || 0,
                          review_count: item.review_count || 0,
                          is_new: item.is_new || false,
                          is_best_selling: item.is_best_selling || false,
                          is_deal_offer: item.is_deal_offer || false,
                          original_price: item.original_price || null,
                          discount_percentage: item.discount_percentage || null,
                          final_price: item.total_price || (parseFloat(item.product_price || '0') * item.quantity).toFixed(2),
                          has_active_discount: item.has_active_discount || false,
                          is_favorite: false,
                        }}
                      />
                    );
                  })}
                </div>
                {/* Cart Summary Section */}
                <div className="mt-10 border border-[#2C2C54] rounded-2xl p-8 bg-white w-full" style={{direction: isRTL ? 'rtl' : 'ltr'}}>
                  <div className="flex items-center mb-6">
                    <div className="w-2 h-8 bg-[#2C2C54] rounded-r-lg mr-2" />
                    <h2 className="text-2xl font-bold text-[#2C2C54]">{String(t('cartSummary.title'))}</h2>
                  </div>
                  {/* Coupon input */}
                  <div className="flex items-center mb-6 justify-end gap-2">
                    <input
                      type="text"
                      value={coupon}
                      onChange={e => { setCoupon(e.target.value); setCouponStatus('idle'); setCouponMessage(''); }}
                      placeholder={String(t('cartSummary.couponPlaceholder'))}
                      className="bg-[#FFD97A]/60 rounded-full px-6 py-2 text-base border-none focus:ring-2 focus:ring-[#FFD97A] focus:outline-none w-56 text-right placeholder-[#2C2C54] font-medium"
                      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                    />
                    <button
                      className="bg-[#FFD97A] text-[#2C2C54] font-bold rounded-full px-5 py-2 text-base shadow hover:bg-[#ffe9b3] transition border border-[#FFD97A]"
                      onClick={handleApplyCoupon}
                      type="button"
                      disabled={!coupon || couponStatus === 'checking'}
                    >
                      {String(t('cartSummary.applyCoupon'))}
                    </button>
                  </div>
                  {couponMessage && (
                    <div className={`text-sm font-semibold mb-2 ${couponStatus === 'valid' ? 'text-green-600' : 'text-red-500'}`}>{couponMessage}</div>
                  )}
                  {/* Coupon info row */}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center mt-4 mb-2 text-green-700 font-bold text-lg relative">
                      <span>
                        {String(t('cartSummary.coupon'))}: {appliedCoupon.code}
                        {' - '}
                        {appliedCoupon.discount}% {String(t('cartSummary.discount'))}
                      </span>
                      <button
                        className="ml-4 bg-transparent text-[#2C2C54] hover:text-red-500 text-xl font-bold px-2 focus:outline-none"
                        aria-label={String(t('cartSummary.removeCoupon'))}
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCoupon('');
                          setCouponStatus('idle');
                          setCouponMessage('');
                        }}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {/* Product subtotals */}
                  {(cart.items as unknown as BackendCartItem[]).map((item) => (
                    <div key={item.id} className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#2C2C54] text-lg">{parseFloat(item.total_price).toLocaleString()} ل.س</span>
                        <span className="font-bold text-[#2C2C54] text-lg">{item.product_name} {String(t('cartSummary.productQuantitySeparator'))} {item.quantity}</span>
                      </div>
                      <hr className="border-[#2C2C54]/40 mb-2" />
                    </div>
                  ))}
                  {/* Cart total */}
                  <div className="flex justify-between items-center mt-4 mb-2">
                    <span className="font-bold text-[#2C2C54] text-xl">{appliedCoupon ? parseFloat(discountedTotal).toLocaleString() : parseFloat(subtotal).toLocaleString()} ل.س</span>
                    <span className="font-bold text-[#2C2C54] text-xl">{String(t('cartSummary.totalLabel'))}</span>
                  </div>
                  <hr className="border-[#2C2C54]/40 mb-6" />
                  {/* Checkout button */}
                  <button
                    className="w-full flex items-center justify-center gap-2 bg-[#2C2C54] text-white text-lg font-bold rounded-2xl py-3 mt-2 hover:bg-[#23234c] transition"
                    onClick={() => {
                      router.push('/checkout');
                    }}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {String(t('cartSummary.checkout'))}
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg border border-[#A5A6F6]/20 p-12 min-h-[300px] flex items-center justify-center text-[#A5A6F6]/60 text-xl">
                {String(t('cart.empty')) || 'عربة التسوق فارغة'}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
} 