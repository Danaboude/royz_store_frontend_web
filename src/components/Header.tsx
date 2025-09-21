'use client';

import Link from 'next/link';
import { ShoppingCart, User, Heart, X, Cog, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useState, useEffect } from 'react';
import ProductSearchSuggestions, { ProductSearchSuggestionProduct } from './ProductSearchSuggestions';
import SettingsDialog from './SettingsDialog';
import { useUser } from '@/contexts/UserContext';
import { useFavorites, loginUser, isVendorRole } from '@/services/api-client';
import { useUIStore } from '@/store/uiStore';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/services/api-client';
import Image from 'next/image';


interface Category {
  category_id: number;
  name_en: string;
  name_ar: string;
  description: string;
}

// Extend User type to include roleId
interface UserWithRoleId {
  id: number;
  name?: string;
  email?: string;
  profile_image?: string;
  roleId?: number;
}

export default function Header() {
  const { locale, setLocale, t } = useI18n();
  const isRTL = locale === 'ar';
  const { user, setUser, isLoggedIn, setIsLoggedIn } = useUser() as {
    user: UserWithRoleId | null,
    setUser: (user: UserWithRoleId | null) => void,
    isLoggedIn: boolean,
    setIsLoggedIn: (loggedIn: boolean) => void
  };
  const { checkAuth, initializeCart } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  // State hooks
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'signup' | null>(null);
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // Effects
  useEffect(() => {
    initializeCart();
    checkAuth();
  }, [checkAuth, initializeCart]);

  useEffect(() => {
    if (!showAuthModal) {
      setSignupData({ name: '', email: '', password: '', phone: '', address: '' });
      setLoginData({ identifier: '', password: '' });
      setErrorMsg('');

    }
  }, [showAuthModal]);




  // Hide header on admin or vendor-dashboard routes

  // Instead of early return, check in JSX
  const hideHeader = pathname.startsWith('/admin') || pathname.startsWith('/vendor-dashboard') || pathname.startsWith('/delivery-manager');







  function isAxiosError(error: unknown): error is { response?: { data?: { error?: string } } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as Record<string, unknown>).response === 'object'
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      // Always set roleId to 2 (customer) on signup
      const signupPayload = { ...signupData, roleId: 2 }; // Updated roleId
      await apiClient.post('/auth/signup', signupPayload);

      const result = await loginUser(signupData.email || signupData.phone, signupData.password);
      console.log(result);
      if (typeof window !== 'undefined' && result.token) {
        localStorage.setItem('token', result.token);
        setIsLoggedIn(true);
        await useUIStore.getState().checkAuth();
      }
      setShowAuthModal(null);

    } catch (err: unknown) {
      let msg = t('auth.signupFailed') as string;
      if (isAxiosError(err) && err.response?.data?.error) {
        const backendMsg = err.response.data.error;
        msg = backendMsg.includes('already exists') ? t('auth.signupPhoneOrEmailUsed') :
          backendMsg.includes('required') ? t('auth.emailOrPhoneRequired') :
            backendMsg;
      }
      setErrorMsg(msg);
    }
  };

  // Handle login submit
  // Handle login submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const result = await loginUser(loginData.identifier, loginData.password);
      if (typeof window !== 'undefined' && result.token) {
        localStorage.setItem('token', result.token);
        setIsLoggedIn(true);
        try {
          const payload = result.user;
          console.log(result);

          setIsLoggedIn(true);
          type RoleId = 1 | 10 | 11 | 12;
          setUser({ id: payload.id, name: payload.name, email: payload.email, roleId: payload.roleId });
          const roleRedirects: Record<RoleId, string> = {
            1: '/admin',
            12: '/delivery-manager',
            10: '/order-manager',
            11: '/product-manager',
          };
          // Use type assertion to ensure payload.roleId is of type RoleId
          if (roleRedirects[payload.roleId as RoleId]) {
            window.location.href = roleRedirects[payload.roleId as RoleId];
          } else if (isVendorRole(payload.roleId)) {
            window.location.href = '/vendor-dashboard';
          }


        } catch { }
        await useUIStore.getState().checkAuth();
      }
      setShowAuthModal(null);
    } catch (err: unknown) {
      let msg = t('auth.loginFailed') as string;
      if (isAxiosError(err) && err.response?.data?.error) {
        const backendMsg = err.response.data.error;
        if (backendMsg && typeof backendMsg === 'string') {
          if (backendMsg === 'Invalid credentials') {
            msg = t('auth.invalidCredentials') as string;
          } else if (backendMsg.includes('required')) {
            msg = t('auth.emailOrPhoneRequired') as string;
          } else {
            msg = backendMsg;
          }
        }
      }
      setErrorMsg(msg);
    }
  };


  // Add logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setIsLoggedIn(false);
    setUser(null);
    router.push('/'); // Use Next.js router for SPA navigation
  };

  return hideHeader ? null : (
    <header className={`w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="w-full bg-[#2C2C54] flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <Link href="/" aria-label={t('header.goToHomepage') as string}>
          <div className="select-none cursor-pointer">
            <Image
              width={150} // Specify the width
              height={150} // Specify the height
              src="/ROY.png"
              alt="Roy Store Logo"
              className="w-16 h-16 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 object-contain bg-[#2C2C54]"
            />
          </div>
        </Link>
        {/* Right: Auth */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            className="text-white text-sm font-medium px-2 border-l border-white/30 flex items-center gap-1 focus:outline-none"
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          >
            {locale === 'en' ? 'العربية' : 'English'}
          </button>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {user?.profile_image ? (
                <Image
                  width={150} // Specify the width
                  height={150} // Specify the height
                  src={user.profile_image}
                  alt={user?.name || 'User'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
              <span className="text-white text-sm font-medium">{user?.name || user?.email || t('header.welcome') as string}</span>
              {/* Admin button */}
              {user?.roleId === 1 && (
                <button
                  className="text-white text-xs border border-white/30 rounded px-2 py-1 ml-2 hover:bg-white/10 font-bold"
                  onClick={() => window.location.href = '/admin'}
                >
                  {t('header.adminPanel') as string || 'Admin'}
                </button>
              )}
              {/* Order Manager button */}
              {user?.roleId === 10 && (
                <button
                  className="text-white text-xs border border-white/30 rounded px-2 py-1 ml-2 hover:bg-white/10 font-bold"
                  onClick={() => window.location.href = '/order-manager'}
                >
                  {t('header.orderManager') as string || 'Order Manager'}
                </button>
              )}
              {/* Delivery Manager button */}
              {user?.roleId === 12 && (
                <button
                  className="text-white text-xs border border-white/30 rounded px-2 py-1 ml-2 hover:bg-white/10 font-bold"
                  onClick={() => window.location.href = '/delivery-manager'}
                >
                  {t('header.deliveryManager') as string || 'Order Manager'}
                </button>
              )}
              {/* Product Manager button */}
              {user?.roleId === 11 && (
                <button
                  className="text-white text-xs border border-white/30 rounded px-2 py-1 ml-2 hover:bg-white/10 font-bold"
                  onClick={() => window.location.href = '/product-manager'}
                >
                  {t('header.productManager') as string || 'Product Manager'}
                </button>
              )}
              {/* Vendor Dashboard button */}
              {user?.roleId && isVendorRole(user.roleId) && (
                <button
                  className="text-white text-xs border border-white/30 rounded px-2 py-1 ml-2 hover:bg-white/10 font-bold"
                  onClick={() => window.location.href = '/vendor-dashboard'}
                >
                  {t('header.vendorDashboard') as string || 'Vendor Dashboard'}
                </button>
              )}
              {/* Optionally add a logout button */}
              <button
                className="text-white text-xs border border-white/30 rounded px-2 py-1 ml-2 hover:bg-white/10"
                onClick={handleLogout}
              >
                {t('header.logout') as string}
              </button>
            </div>
          ) : (
            <>
              <button
                className="text-white text-sm font-medium px-2 border-l border-white/30 flex items-center gap-1 focus:outline-none"
                onClick={() => setShowAuthModal('login')}
              >
                {t('header.login') as string}
              </button>
              <button
                className="text-white text-sm font-medium px-2 flex items-center gap-1 focus:outline-none"
                onClick={() => setShowAuthModal('signup')}
              >
                {t('header.signup') as string}
                <User className="w-5 h-5 ml-1" />
              </button>
            </>
          )}
        </div>
      </div>
      {/* Custom Figma-style Section */}
      <nav className={`w-full bg-[#2C2C54] flex flex-row-reverse justify-end items-center py-1 px-6 gap-16 text-white text-xl font-tajawal select-none`} style={{ letterSpacing: '0.5px' }}>

        {pathname === '/vendor' && (
          <span
            className="cursor-pointer hover:underline"
            onClick={() => {
              const servicesSection = document.getElementById('services-tabs');
              if (servicesSection) {
                servicesSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {t('header.ourServices') as string}
          </span>
        )}
        <button
          className="hover:underline focus:outline-none"
          onClick={() => {
            const footer = document.querySelector('footer');
            if (footer) {
              footer.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          {t('header.contactUs') as string}
        </button>
        <button
          className="cursor-pointer hover:underline focus:outline-none"
          onClick={() => router.push('/vendor')}
        >
          {t('header.becomeVendor') as string}
        </button>

        <button
          className="hover:underline focus:outline-none"
          onClick={() => window.location.href = '/'}
        >
          {t('header.home') as string}
        </button>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative bg-[#F7F7FA] rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-2xl mx-4">
            {/* Close button */}
            <button
              className="absolute top-4 left-4 bg-[#F8C291]/30 hover:bg-[#F8C291]/60 rounded-full p-1.5 z-10"
              onClick={() => setShowAuthModal(null)}
              aria-label={t('auth.close') as string}
            >
              <X className="w-6 h-6 text-[#2C2C54]" />
            </button>
            {/* Form side */}
            <div className="flex-1 p-8 flex flex-col justify-center">
              <div className="mb-4 text-2xl font-bold text-[#2C2C54] text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Image
                  src="/ROY.png"
                  height={50}
                  width={50}

                  alt="Roy Store Logo"
                  className="mx-auto w-20 h-20 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 object-contain bg-[#2C2C54]"
                />
              </div>
              <div className="mb-6 text-2xl font-bold text-[#2C2C54] text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {showAuthModal === 'login' ? t('auth.login') as string : t('auth.signup') as string}
              </div>
              {(showAuthModal === 'login' || showAuthModal === 'signup') && (
                <form className="space-y-4" onSubmit={showAuthModal === 'login' ? handleLogin : handleSignup}>
                  {showAuthModal === 'signup' && (
                    <>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#2C2C54] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F8C291]"
                        placeholder={isRTL ? 'الاسم الكامل' : 'Full Name'}
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                        value={signupData.name}
                        onChange={e => setSignupData(s => ({ ...s, name: e.target.value }))}
                        required
                      />
                      <input
                        type="email"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#2C2C54] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F8C291]"
                        placeholder={isRTL ? 'البريد الالكتروني' : 'Email'}
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                        value={signupData.email}
                        onChange={e => setSignupData(s => ({ ...s, email: e.target.value }))}
                        required
                      />
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#2C2C54] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F8C291]"
                        placeholder={isRTL ? 'رقم الهاتف' : 'Phone'}
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                        value={signupData.phone}
                        onChange={e => setSignupData(s => ({ ...s, phone: e.target.value }))}
                        required
                      />
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#2C2C54] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F8C291]"
                        placeholder={isRTL ? 'العنوان' : 'Address'}
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                        value={signupData.address}
                        onChange={e => setSignupData(s => ({ ...s, address: e.target.value }))}
                        required
                      />
                      <input
                        type="password"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#2C2C54] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F8C291]"
                        placeholder={isRTL ? 'كلمة السر' : 'Password'}
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                        value={signupData.password}
                        onChange={e => setSignupData(s => ({ ...s, password: e.target.value }))}
                        required
                      />
                    </>
                  )}
                  {showAuthModal === 'login' && (
                    <>
                      <input
                        type="text"
                        name="identifier"
                        value={loginData.identifier}
                        onChange={e => setLoginData({ ...loginData, identifier: e.target.value })}
                        placeholder={t('auth.identifier') as string || 'Email or phone number'}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#2C2C54] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F8C291]"
                      />
                      <input
                        type="password"
                        name="password"
                        value={loginData.password}
                        onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder={t('auth.password') as string || 'Password'}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#2C2C54] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F8C291]"
                      />
                    </>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="accent-[#2C2C54]" />
                      <span>{isRTL ? 'تذكرني' : 'Remember me'}</span>
                    </label>

                  </div>
                  {errorMsg && <div className="text-red-500 text-sm text-center">{errorMsg}</div>}
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#2C2C54] text-white py-2 mt-2 font-bold text-lg hover:bg-[#23234a] transition-colors disabled:opacity-60"
                  >
                    {showAuthModal === 'login'
                      ? (isRTL ? 'تسجيل الدخول' : 'Login')
                      : (isRTL ? 'إنشاء حساب' : 'Sign Up')}
                  </button>
                </form>
              )}
              <div className="mt-6 text-center text-[#2C2C54] text-sm">
                {showAuthModal === 'login'
                  ? (isRTL ? 'ليس لديك حساب ؟ ' : "Don't have an account? ")
                  : (isRTL ? 'لديك حساب بالفعل ؟ ' : 'Already have an account? ')}
                <button
                  className="text-[#2C2C54] font-bold hover:underline focus:outline-none"
                  onClick={() => {
                    setShowAuthModal(showAuthModal === 'login' ? 'signup' : 'login');
                  }}
                >
                  {showAuthModal === 'login'
                    ? (isRTL ? 'انشاء حساب جديد' : 'Sign Up')
                    : (isRTL ? 'تسجيل الدخول' : 'Login')}
                </button>
              </div>

            </div>
            {/* Image side */}
            <div className="hidden md:flex flex-col items-center justify-center bg-[#2C2C54] rounded-b-2xl md:rounded-b-none md:rounded-e-2xl w-full md:w-80 min-h-[400px] p-8">
              <svg width="80" height="80" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="#fff" strokeWidth="2" fill="none" />
                <circle cx="9" cy="9" r="2" stroke="#fff" strokeWidth="2" />
                <path d="M21 15l-5-5-4 4-7 7" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      )}


    </header>
  );
}

// Extracted TopBar component
export function TopBar({
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  handleKeyPress,
  loading,
  error,
  categories,
  setShowSuggestions,
  showSuggestions,
  onSelectProduct,
  onFavoritesClick,
}: {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  loading: boolean;
  error: string | null;
  categories: Category[];
  setShowSuggestions: (show: boolean) => void;
  showSuggestions: boolean;
  onSelectProduct: (product: ProductSearchSuggestionProduct) => void;
  onFavoritesClick?: () => void;
}) {
  const { t, locale } = useI18n();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const { user, isLoggedIn } = useUser();
  const { data: favorites = [] } = useFavorites(isLoggedIn);
  const cartCount = useUIStore(state => state.cartCount);
  const cartLoaded = useUIStore(state => state.cartLoaded);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="w-full flex flex-col md:flex-row items-center md:justify-between px-4 py-3 gap-4 bg-white">
      {/* Logo faded for alignment (hidden on mobile) */}
      <div className="hidden md:block text-white/0 select-none">Logo</div>
      {/* Search Bar */}
      <div className={`relative w-full max-w-2xl flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
        {/* Dropdown for categories */}
        <select
          className="min-w-[170px] max-w-[170px] bg-transparent text-[#2C2C54] font-medium text-sm outline-none border-none focus:ring-0 z-10"
          style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={loading}
        >
          <option value="all" className="truncate" title={t('allCategories') as string}>
            {loading ? t('loading') : t('allCategories')}
          </option>
          {!loading && !error && categories.map((category) => (
            <option
              key={category.category_id}
              value={category.category_id}
              className="truncate"
              title={locale === 'ar' ? category.name_ar : category.name_en}
            >
              {locale === 'ar' ? category.name_ar : category.name_en}
            </option>
          ))}
        </select>
        {/* Search input and suggestions */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={t('homepage.searchPlaceholder')}
            className="w-full rounded-full py-2 pr-32 pl-12 bg-white text-[#2C2C54] placeholder-[#2C2C54]/60 border-2 border-[#2C2C54] focus:ring-2 focus:ring-[#F8C291] focus:outline-none shadow-sm text-sm"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyPress={handleKeyPress}
          />
          {/* Floating product suggestions below input */}
          <div className="absolute left-0 right-0 top-full z-50">
            <ProductSearchSuggestions
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onSelectProduct={(product) => {
                setShowSuggestions(false);
                setSearchQuery('');
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem(`product_${product.product_id}`, JSON.stringify(product));
                }
                router.push(`/products/${product.product_id}`);
                if (onSelectProduct) onSelectProduct(product);
              }}
              show={showSuggestions && !!searchQuery}
            />
          </div>
          {/* Search icon */}
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C2C54]">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
        </div>
      </div>
      {/* Icons */}
      <div className="flex flex-wrap justify-center gap-4 w-full md:w-auto">
        <button type="button" className="text-[#2C2C54] hover:text-[#F8C291] p-1" onClick={() => setShowSettingsDialog(true)}>
          <Cog className="w-6 h-6" />
        </button>
        <button
          type="button"
          className="relative text-[#2C2C54] hover:text-[#F8C291] p-1 transition-colors"
          onClick={onFavoritesClick}
          disabled={!isLoggedIn}
        >
          <Heart className={`w-6 h-6 ${!isLoggedIn ? 'opacity-50' : ''}`} />
          {isClient && isLoggedIn && favorites.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#F8C291] text-[#2C2C54] text-xs rounded-full flex items-center justify-center border-2 border-white font-bold">
              {favorites.length}
            </span>
          )}
        </button>
        {(user?.roleId === 2 || user?.roleId === 3) && (
          <Link href="/cart" className="relative text-[#2C2C54] hover:text-[#F8C291] p-1">
            <ShoppingCart className="w-6 h-6" />
            {isClient && cartLoaded && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#F8C291] text-[#2C2C54] text-xs rounded-full flex items-center justify-center border-2 border-white font-bold">
                {cartCount}
              </span>
            )}
          </Link>

        )}
        {(user?.roleId === 2) && (
          <Link href="/orders" className="relative text-[#2C2C54] hover:text-[#F8C291] p-1">
            <ShoppingBag className="w-6 h-6" />
            {isClient && cartLoaded && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#F8C291] text-[#2C2C54] text-xs rounded-full flex items-center justify-center border-2 border-white font-bold">
                {cartCount}
              </span>
            )}
          </Link>

        )}
      </div>
      {showSettingsDialog && (
        <SettingsDialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} userId={user?.id} />
      )}
    </div>
  );
} 