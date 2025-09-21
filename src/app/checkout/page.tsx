"use client";
import { useUIStore } from '@/store/uiStore';
import { useI18n } from '@/contexts/I18nContext';
import React, { useState, useEffect,useMemo  } from 'react';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { createOrder, useDeliveryZones } from '@/services/api-client';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const COUNTRIES = [
  // Middle East
  { code: '+963', name: 'Syria', flag: '🇸🇾' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+970', name: 'Palestine', flag: '🇵🇸' },
  { code: '+249', name: 'Sudan', flag: '🇸🇩' },
  { code: '+218', name: 'Libya', flag: '🇱🇾' },
  // Africa
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: '+225', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+221', name: 'Senegal', flag: '🇸🇳' },
  { code: '+237', name: 'Cameroon', flag: '🇨🇲' },
  { code: '+249', name: 'Sudan', flag: '🇸🇩' },
  // North America
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  // Europe (major countries)
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+40', name: 'Romania', flag: '🇷🇴' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮' },
  { code: '+386', name: 'Slovakia', flag: '🇸🇰' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+372', name: 'Estonia', flag: '🇪🇪' },
  { code: '+371', name: 'Latvia', flag: '🇱🇻' },
  { code: '+370', name: 'Lithuania', flag: '🇱🇹' },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮' },
  { code: '+385', name: 'Croatia', flag: '🇭🇷' },
  { code: '+359', name: 'Bulgaria', flag: '🇧🇬' },
  { code: '+421', name: 'Slovakia', flag: '🇸🇰' },
  { code: '+357', name: 'Cyprus', flag: '🇨🇾' },
  { code: '+356', name: 'Malta', flag: '🇲🇹' },
  { code: '+352', name: 'Luxembourg', flag: '🇱🇺' },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮' },
];

export default function CheckoutPage() {
  const { t, locale } = useI18n();
  const cart = useUIStore((s) => s.cart);
  const coupon = useUIStore((s) => s.coupon);
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [country, setCountry] = useState(COUNTRIES.find(c => c.name === 'Syria') || COUNTRIES[0]);
  const [localPhone, setLocalPhone] = useState('');
  const phone = country.code + localPhone;
  const [region, setRegion] = useState(''); // Will be set to selected zone name
  const [address, setAddress] = useState(''); // User input address
  const [addressDetails, setAddressDetails] = useState(''); // User input address details
  const [notes, setNotes] = useState('');
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'syriatelMtn' | ''>('');
  const [paymentCode, setPaymentCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [walletPin, setWalletPin] = useState('');
 


  const [error, setError] = useState<string | null>(null);


  // Fetch delivery zones
  const { data: zonesData, isLoading: zonesLoading } = useDeliveryZones();
  const zones =useMemo(() => zonesData?.data || [], [zonesData]);
  // Calculate subtotal, discount, total
  const subtotal = cart
  ? ((cart.items as unknown) as Array<{ product_price: string | number; quantity: number }>).reduce(
      (sum, item) => sum + Number(item.product_price) * item.quantity,
      0
    )
  : 0;

const discount = coupon ? (subtotal * coupon.discount) / 100 : 0;

const selectedZoneData = zones.find(
  (zone: { zone_id: number; delivery_fee: number }) => zone.zone_id === selectedZone
);
const deliveryFee = selectedZoneData ? Number(selectedZoneData.delivery_fee) : 0;

const total = Number(subtotal) - Number(discount) + Number(deliveryFee);

  // Set default zone when zones are loaded
  useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      const defaultZone = zones[0];
      setSelectedZone(defaultZone.zone_id);
      // Set region to the zone name based on localization
      setRegion(locale === 'ar' ? defaultZone.name_ar : defaultZone.name_en);
    }
  }, [zones, selectedZone, locale]);

  // Validation handler
  const handleConfirm = async () => {
    setError(null);
    // Phone validation: require at least 8 digits after country code
    if (!name || !localPhone || !address || !selectedZone) {
      setError(String(t('common.pleaseFillAllFields')));
      return;
    }
    if (!/^\d{8,}$/.test(localPhone)) {
      setError(String(t('common.invalidPhone')));
      return;
    }
    if (!paymentMethod) {
      setError(String(t('common.pleaseSelectPaymentMethod')));
      return;
    }
    if (paymentMethod === 'syriatelMtn' && (!paymentCode || !paymentAmount || !walletPin)) {
      setError(String(t('common.pleaseFillPaymentFields')));
      return;
    }

    try {
      // First, create delivery address
      const addressResponse = await fetch(`${API_URL}/delivery-addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          address: `${address}, ${addressDetails}, ${region}`,
          phone: phone
        })
      });

      if (!addressResponse.ok) {
        throw new Error('Failed to create delivery address');
      }

      const addressData = await addressResponse.json();
      const delivery_address_id = addressData.address_id;

      // Create order with cart items from Zustand store
      // Flatten cart items to match backend expectations
      const flattenedCartItems = await Promise.all(
        cart?.items?.map(async (item) => {
          // Log the item structure to debug
          // If item doesn't have product details, fetch them from the backend
          let productDetails = null;
          if (!item.product) {
            try {
              const response = await fetch(`${API_URL}/products/${item.product_id}`);
              if (response.ok) {
                productDetails = await response.json();
              }

            } catch (error) {
              console.error('Failed to fetch product details:', error);
            }
          }

          // Extract price from the product object or fetched details
          const productPrice = item.product?.price || item.product?.final_price ||
            productDetails?.price || productDetails?.final_price ||
            item.price || 0;
          const productName = item.product?.name || productDetails?.name || 'Unknown Product';
          const vendorId = item.product?.vendor_id || productDetails?.vendor_id;
          const finalPrice = item.product?.final_price || item.product?.price ||
            productDetails?.final_price || productDetails?.price ||
            item.price || 0;

          // Ensure we have a valid price
          const numericPrice = Number(productPrice);
          if (!numericPrice || numericPrice <= 0) {
            console.error('Invalid product price for item:', item);
            return null;
          }

          return {
            product_id: item.product_id,
            quantity: item.quantity,
            product_price: numericPrice,
            product_name: productName,
            vendor_id: vendorId,
            final_price: Number(finalPrice)
          };
        }) || []
      );

      // Filter out null items
      const validCartItems = flattenedCartItems.filter(Boolean);

      // Check if we have valid cart items
      if (validCartItems.length === 0) {
        setError('No valid cart items found. Please check your cart.');
        return;
      }


      const orderPayload = {
        delivery_address_id,
        delivery_zone_id: selectedZone,
        delivery_fee: deliveryFee,
        payment_method: paymentMethod === 'cash' ? 'cash' :
          paymentMethod === 'syriatelMtn' ? 'transfer' : 'card',
        ...(coupon?.code && { coupon_code: coupon.code }),
        cart_items: validCartItems,
      };

  
      // OTP verified, now create order
      const data = await createOrder(orderPayload);
      setOrderNumber(data.orders?.[0]?.order_id?.toString() || '');
      setShowSuccess(true);

      // Clear cart in both backend and frontend after successful order
      try {

        // Clear cart in both backend and frontend
        await useUIStore.getState().clearCart(true);

      } catch (error) {
        console.error('Failed to clear cart after order:', error);
        // Still clear frontend state even if backend fails
        useUIStore.getState().clearCart(false);
      }

      setTimeout(() => {
        setShowSuccess(false);
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Order creation error:', error);
      setError(String(t('common.errorOccurred')));
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FA] pt-6 pb-8">
      <div className="flex flex-col lg:flex-row-reverse gap-4 lg:gap-12 w-full max-w-7xl mx-auto px-2">
        {/* Right: Billing Details */}
        <div className="flex-1 flex flex-col gap-6 mb-8 lg:mb-0">
          <h2 className="text-3xl font-bold mb-4 text-right">{String(t('checkout.completeOrder'))}</h2>
          <h3 className="text-2xl font-bold mb-8 text-right">{String(t('checkout.billingDetails'))}</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-lg text-right" placeholder={String(t('common.name'))} value={name} onChange={e => setName(e.target.value)} />
              <div className="flex gap-2 items-center">
                <select
                  className="rounded-xl border border-gray-300 px-2 py-3 text-lg text-right bg-white"
                  value={country.code}
                  onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value) || COUNTRIES[0])}
                >
                  {COUNTRIES.map((c, idx) => (
                    <option key={c.code + c.name + idx} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <input
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-lg text-right"
                  placeholder={String(t('common.phone'))}
                  value={localPhone}
                  onChange={e => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={9}
                />
              </div>
            </div>
            {/* Hidden region input - removed from UI but kept for backend */}
            <input type="hidden" value={region} onChange={e => setRegion(e.target.value)} />
            <input className="rounded-xl border border-gray-300 px-4 py-3 text-lg text-right" placeholder={String(t('common.address'))} value={address} onChange={e => setAddress(e.target.value)} />
            {/* Hidden address details input - removed from UI but kept for backend */}
            <input type="hidden" value={addressDetails} onChange={e => setAddressDetails(e.target.value)} />

            {/* Delivery Zone Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 text-right">
                {String(t('checkout.deliveryZone') || 'Delivery Zone')}
              </label>
              <select
                className="rounded-xl border border-gray-300 px-4 py-3 text-lg text-right bg-white"
                value={selectedZone || ''}
                onChange={(e) => {
                  const zoneId = Number(e.target.value);
                  setSelectedZone(zoneId);
                  // Update region to the selected zone name based on localization
                  const selectedZoneData = zones.find((zone: { zone_id: number; name_en: string; name_ar: string }) => zone.zone_id === zoneId);
                  if (selectedZoneData) {
                    setRegion(locale === 'ar' ? selectedZoneData.name_ar : selectedZoneData.name_en);
                  }
                }}
                disabled={zonesLoading}
              >
                {zonesLoading ? (
                  <option>{String(t('common.loading') || 'Loading...')}</option>
                ) : zones.length > 0 ? (
                  zones.map((zone: { zone_id: number; name_en: string; name_ar: string; delivery_fee: number; estimated_delivery_time: number }) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {locale === 'ar' ? zone.name_ar : zone.name_en} - {zone.delivery_fee.toLocaleString()} ل.س
                    </option>
                  ))
                ) : (
                  <option value="">{String(t('checkout.noZonesAvailable') || 'No zones available')}</option>
                )}
              </select>
              {selectedZoneData && (
                <div className="text-sm text-gray-600 text-right">
                  {String(t('checkout.estimatedDelivery') || 'Estimated delivery')}: {selectedZoneData.estimated_delivery_time} {String(t('checkout.hours') || 'hours')}
                </div>
              )}
            </div>

            <textarea className="rounded-xl border border-gray-300 px-4 py-3 text-lg text-right min-h-[80px]" placeholder={String(t('checkout.notes')) || 'Notes'} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        {/* Left: Order Summary */}
        <div className="w-full lg:w-[420px] bg-white rounded-2xl border border-gray-300 p-6 flex flex-col gap-4">
          <h2 className="text-3xl font-bold text-center mb-4">{String(t('common.orderSummary'))}</h2>
          <table className="w-full text-right mb-4">
            <thead>
              <tr className="border-b">
                <th className="py-2 font-bold">{String(t('common.product')) || 'Product'}</th>
                <th className="py-2 font-bold">{String(t('common.quantity')) || 'Qty'}</th>
                <th className="py-2 font-bold">{String(t('common.total')) || 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {cart && cart.items.length > 0 ? ((cart.items as unknown) as Array<{ product_id: number; product_name: string; product_price: string | number; quantity: number }>).map((item, idx) => (
                <tr key={item.product_id || idx}>
                  <td>{item.product_name || '—'}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {(typeof item.product_price === 'number' || !isNaN(Number(item.product_price)))
                      ? (Number(item.product_price) * item.quantity).toLocaleString() + ' ل.س'
                      : '—'}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="text-center text-gray-400">{String(t('cart.empty'))}</td></tr>
              )}
            </tbody>
          </table>
          <div className="border-t pt-4 flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="font-bold">{String(t('cartSummary.subtotal'))}</span>
              <span>{subtotal.toLocaleString()} ل.س</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-green-700">
                <span className="font-bold">{String(t('cartSummary.coupon'))}</span>
                <span>
                  -{discount.toLocaleString()} ل.س
                  {coupon.discount ? ` (${coupon.discount}%)` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-bold">{String(t('cartSummary.shipping'))}</span>
              <span>{deliveryFee.toLocaleString()} ل.س</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">{String(t('cartSummary.totalLabel'))}</span>
              <span>{total.toLocaleString()} ل.س</span>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="font-bold text-lg mb-2">{String(t('cartSummary.paymentMethod'))}</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 text-base font-semibold text-[#2C2C54]">
                <input
                  type="radio"
                  name="payment"
                  className="w-5 h-5 accent-[#2C2C54] border-2 border-[#2C2C54] focus:ring-2 focus:ring-[#F8C291] transition-all duration-150"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                {String(t('cartSummary.cashOnDelivery'))}
              </label>
              {/*   <label className="flex items-center gap-3 text-base font-semibold text-[#2C2C54]">
              <input
                  type="radio"
                  name="payment"
                  className="w-5 h-5 accent-[#2C2C54] border-2 border-[#2C2C54] focus:ring-2 focus:ring-[#F8C291] transition-all duration-150"
                  value="syriatelMtn"
                  checked={paymentMethod === 'syriatelMtn'}
                  onChange={() => setPaymentMethod('syriatelMtn')}
                />
                {String(t('cartSummary.syriatelMtn'))}
              </label>*/}
            </div>
            {paymentMethod === 'syriatelMtn' && (
              <>
                <input className="mt-2 rounded-xl border border-gray-300 px-4 py-2 text-lg text-right" placeholder={String(t('cartSummary.paymentCode'))} value={paymentCode} onChange={e => setPaymentCode(e.target.value)} />
                <input className="mt-2 rounded-xl border border-gray-300 px-4 py-2 text-lg text-right" placeholder={String(t('cartSummary.paymentAmount'))} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                <input className="mt-2 rounded-xl border border-gray-300 px-4 py-2 text-lg text-right" placeholder={String(t('cartSummary.walletPin'))} value={walletPin} onChange={e => setWalletPin(e.target.value)} />
              </>
            )}
           
            {error && <div className="text-red-600 font-bold mt-2 text-center">{error}</div>}
            <button className="w-full bg-[#2C2C54] text-white font-bold rounded-xl py-3 mt-4 hover:bg-[#23234c] transition" onClick={handleConfirm}>{String(t('cartSummary.confirmTransaction'))}</button>
          </div>
        </div>
      </div>
      <Footer />
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <div className="text-green-600 text-3xl font-bold mb-4">{String(t('common.orderSubmitted'))}</div>
            <div className="text-lg text-[#2C2C54] font-semibold mb-2">
              {String(t('common.yourOrderNumberIs'))} <span className="text-[#F8C291] font-bold">#{orderNumber}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 