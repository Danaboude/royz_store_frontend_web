'use client';
import Image from 'next/image';

import { motion, AnimatePresence } from 'framer-motion';
import { useNewProducts, useBestSellingProducts, useDealProducts, useDiscountedProducts, useFavoritedProducts, useGiftProducts, useHomeData } from '@/services/api-client';
import ProductCard from '@/views/ProductCard';
import Sidebar from '@/components/Sidebar';
import { useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { ProductSectionContext } from '../contexts/ProductSectionContext';
import FeatureCard from '../components/FeatureCard';
import { Truck, Headphones, BadgeCheck, Heart } from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import { useI18n } from '@/contexts/I18nContext';
import { TopBar } from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/contexts/UserContext';
import FavoriteProductCard from './FavoriteProductCard';
import CategoryCard from './CategoryCard';
import { ProductCardProps } from './ProductCard';
// import Category from '@/components/Sidebar';

// Define Category type inline (matching expected structure)
type Category = {
  category_id: number;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
};

// Define the Product type to fix TypeScript errors
interface Product {
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  description: string;
  category_id: number;
  category_name: string;
  vendor_name: string;
  stock: number;
  average_rating: number;
  review_count: number;
  is_new: boolean;
  is_best_selling: boolean;
  is_deal_offer: boolean;
  is_gift: boolean;
  original_price: string | null;
  discount_percentage: number | null;
  final_price: string;
  has_active_discount: boolean;
}

export default function HomePage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { section, setSection } = useContext(ProductSectionContext);
  const { isLoggedIn } = useUser();
  const [pageBest, setPageBest] = useState(1);
  const [pageNew, setPageNew] = useState(1);
  const [pageDeals, setPageDeals] = useState(1);
  const pageSize = 10;

  const { data: bestSellingData = { products: [], total: 0 }, isLoading: bestSellingLoading } = useBestSellingProducts(pageBest, pageSize);
  const { data: newProductsData = { products: [], total: 0 }, isLoading: newProductsLoading } = useNewProducts(pageNew, pageSize);
  const { data: dealsData = { products: [], total: 0 }, isLoading: dealsLoading } = useDealProducts(pageDeals, pageSize);
  const { data: discountedData = { products: [], total: 0 }, isLoading: discountedLoading } = useDiscountedProducts(pageDeals, pageSize);
  const { data: favoritedProducts = [], isLoading: favoritedLoading } = useFavoritedProducts(isLoggedIn && section === 'favorites');
  const { data: giftProductsData = { products: [], total: 0 }, isLoading: giftProductsLoading } = useGiftProducts(1, pageSize);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 20 }
  };

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.4
  };

  let productsToShow: Product[] = [];
  let isLoading = false;
  let sectionTitle = '';
  let total = 0;
  let page = 1;
  let setPage: Dispatch<SetStateAction<number>> = () => { };
  let showPagination = false;
  if (section === 'best') {
    productsToShow = bestSellingData.products;
    isLoading = bestSellingLoading;
    sectionTitle = t('homepage.bestSelling') || t('header.bestselling') || 'Best Selling';
    total = bestSellingData.total;
    page = pageBest;
    setPage = setPageBest;
    showPagination = total > pageSize;
    if (!showPagination) page = 1;
  } else if (section === 'new') {
    productsToShow = newProductsData.products;
    isLoading = newProductsLoading;
    sectionTitle = t('homepage.newProducts') || t('header.new') || 'New Products';
    total = newProductsData.total;
    page = pageNew;
    setPage = setPageNew;
    showPagination = total > pageSize;
    if (!showPagination) page = 1;
  } else if (section === 'deals') {
    const dealsArr = Array.isArray(dealsData.products) ? dealsData.products : [];
    const discountedArr = Array.isArray(discountedData.products) ? discountedData.products : [];
    // Deduplicate by product_id
    const combined = [...dealsArr, ...discountedArr];
    const seen = new Set();
    productsToShow = combined.filter(product => {
      if (seen.has(product.product_id)) return false;
      seen.add(product.product_id);
      return true;
    });
    isLoading = dealsLoading || discountedLoading;
    sectionTitle = t('homepage.deals') || t('header.deals') || 'Deals & Offers';
    total = productsToShow.length;
    page = pageDeals;
    setPage = setPageDeals;
    showPagination = total > pageSize;
    if (!showPagination) page = 1;
    // If pagination, slice the combined array for the current page
    if (showPagination) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      productsToShow = productsToShow.slice(start, end);
    }
  } else if (section === 'favorites') {
    productsToShow = Array.isArray(favoritedProducts) ? favoritedProducts : [];
    isLoading = favoritedLoading;
    sectionTitle = locale === 'ar' ? 'المفضلة' : 'Favorites';
    total = productsToShow.length;
    showPagination = false;
  } else if (section === 'gift') {
    productsToShow = giftProductsData.products;
    isLoading = giftProductsLoading;
    sectionTitle = t('header.gift') || 'Gift Products';
    total = giftProductsData.total;
    page = 1;
    setPage = () => { };
    showPagination = false;
  }

  const totalPages = Math.ceil(total / pageSize);

  // Remove 'deals' and 'gift' from navTabs
  const navTabs = [
    { key: 'home', label: t('header.home'), section: 'best' },
    { key: 'new', label: t('header.new'), section: 'new' },
  ];

  // State for TopBar
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Fetch categories from batched home API
  const { data: homeData, isLoading: homeLoading, error: homeError } = useHomeData();
  const categories = Array.isArray(homeData?.categories) ? homeData.categories : [];
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Implement search logic here
    }
  };

  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- Popup Ad Logic ---
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adProducts, setAdProducts] = useState<Product[]>([]);

  // Handler to close the ad popup and set localStorage flag
  const handleCloseAdPopup = () => {
    setShowAdPopup(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenAdPopup', 'true');
    }
  };

  // Helper to get up to 3 unique random products
  function getRandomProducts(arr: Product[], count: number) {
    // Fisher-Yates shuffle for true randomness
    const shuffled = arr.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  useEffect(() => {
    if (
      !giftProductsLoading &&
      !dealsLoading &&
      !discountedLoading
    ) {
      const combinedAdProducts = [
        ...(Array.isArray(giftProductsData.products) ? giftProductsData.products : []),
        ...(Array.isArray(dealsData.products) ? dealsData.products : []),
        ...(Array.isArray(discountedData.products) ? discountedData.products : []),
      ];
      // Deduplicate by product_id
      const seenAd = new Set();
      const uniqueAdProducts = combinedAdProducts.filter(product => {
        if (seenAd.has(product.product_id)) return false;
        seenAd.add(product.product_id);
        return true;
      });
      // Only show popup if not already shown in this browser
      const hasSeenPopup = typeof window !== 'undefined' && localStorage.getItem('hasSeenAdPopup') === 'true';
      if (uniqueAdProducts.length > 0 && !hasSeenPopup) {
        setAdProducts(getRandomProducts(uniqueAdProducts, 3));
        setShowAdPopup(false); // Reset popup to force rerender
        setTimeout(() => setShowAdPopup(true), 0); // Show popup with new random products
      }
    }
  }, [
    giftProductsData,
    dealsData,
    discountedData,
    giftProductsLoading,
    dealsLoading,
    discountedLoading,
  ]);

  // Fallback image for product
  const fallbackImg = "/public/file.svg";

  // Filter products by selected category (for main product grid)
  let filteredProducts = productsToShow;
  if (selectedCategory !== 'all') {
    filteredProducts = productsToShow.filter(
      (p) => String(p.category_id) === String(selectedCategory)
    );
  }

  // Handler for selecting a product from suggestions
  const handleSelectProduct = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    // TODO: Navigate to product page or show product modal
    // router.push(`/products/${product.product_id}`);
  };

  // Handler for favorites click
  const handleFavoritesClick = () => {
    if (!isLoggedIn) {
      alert(t('common.pleaseLogin') || 'Please login to view favorites');
      return;
    }
    setSection('favorites');
    // Clear selected category when favorites is clicked
    setSelectedCategoryObj(null);
    setCategoryProducts([]);
    setCategoryError('');
  };

  const [selectedCategoryObj, setSelectedCategoryObj] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<ProductCardProps[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const handleCategorySelect = async (cat: Category) => {
    setSelectedCategoryObj(cat);
    setCategoryLoading(true);
    setCategoryError('');
    try {
      const { api } = await import('@/services/api');
      const products = await api.products.getByCategory(cat.category_id);
      setCategoryProducts(products);
    } catch {
      setCategoryError(isRTL ? 'فشل في تحميل المنتجات.' : 'Failed to load products.');
      setCategoryProducts([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  if (homeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loader" />
        {/* Or a styled loading text */}
        {/* <span>Loading...</span> */}
      </div>
    );
  }
  if (homeError) {
    return <div>{String(homeError)}</div>;
  }

  return (
    <>
      {/* --- Popup Ad Modal --- */}
      {showAdPopup && adProducts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          {/* Glassmorphism background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-[#F8C291]/20 to-[#2C2C54]/10 backdrop-blur-xl" style={{ zIndex: 0 }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ duration: 0.45, type: 'spring', bounce: 0.32 }}
            className="relative bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl px-4 py-8 w-[96vw] max-w-3xl flex flex-col items-center glassmorphism-popup"
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)', zIndex: 1 }}
          >
            <button
              className="absolute top-3 right-3 text-[#2C2C54] hover:text-[#F8C291] text-2xl font-bold focus:outline-none transition rounded-full bg-white/70 shadow p-1"
              onClick={handleCloseAdPopup}
              aria-label="Close"
              style={{ boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.10)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <div className="w-full flex flex-col gap-6 sm:gap-8 md:flex-row md:gap-6 justify-center items-center">
              {adProducts.map((product) => (
                <div key={product.product_id} className="flex flex-col items-center bg-white/70 rounded-2xl shadow-md px-3 py-5 w-full max-w-xs md:w-64 border border-[#F8C291]/20">
                  <div className="relative mb-3 w-full flex justify-center">
                    <Image
                      width={150} // Specify the width
                      height={150} // Specify the height
                      src={product.image_url}
                      alt={product.name}
                      className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-xl border bg-white/80 shadow ring-2 ring-[#F8C291]/20"
                      style={{ filter: 'drop-shadow(0 0 12px #F8C29144)' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-1 text-center line-clamp-2 max-w-[90%] text-[#2C2C54] drop-shadow-sm">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-1">
                    {product.original_price && product.original_price !== product.final_price ? (
                      <>
                        <span className="text-sm font-semibold text-orange-400 line-through">
                          {parseFloat(product.original_price).toLocaleString()} ل.س
                        </span>
                        <span className="text-base font-bold text-[#F8C291] drop-shadow">
                          {parseFloat(product.final_price).toLocaleString()} ل.س
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-[#F8C291] drop-shadow">
                        {parseFloat(product.final_price).toLocaleString()} ل.س
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <svg className="w-4 h-4 text-yellow-400 drop-shadow" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                    <span className="text-sm font-medium text-gray-700">{typeof product.average_rating === 'number' ? product.average_rating.toFixed(1) : '0.0'}</span>
                    <span className="text-xs text-gray-400">({product.review_count || 0})</span>
                  </div>
                  <a
                    href={`/products/${product.product_id}`}
                    className="inline-block px-5 py-1.5 bg-gradient-to-r from-[#2C2C54] to-[#F8C291] text-white rounded-lg font-semibold shadow hover:from-[#F8C291] hover:to-[#2C2C54] hover:text-[#2C2C54] transition text-sm sm:text-base mt-1 tracking-wide"
                    onClick={handleCloseAdPopup}
                    style={{ boxShadow: '0 2px 8px 0 #2C2C5440' }}
                  >
                    {t('homepage.viewProduct') || 'View Product'}
                  </a>
                </div>
              ))}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="px-4 py-2 bg-[#2C2C54] text-white rounded-lg shadow hover:bg-[#F8C291] hover:text-[#2C2C54] transition"
              >
                {t('homepage.sharelink')}
              </button>

            </div>
          </motion.div>
        </div>
      )}
      {/* --- End Popup Ad Modal --- */}
      <TopBar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleKeyPress={handleKeyPress}
        loading={homeLoading}
        error={homeError ? String(homeError) : null}
        categories={categories}
        setShowSuggestions={setShowSuggestions}
        showSuggestions={showSuggestions}
        onSelectProduct={handleSelectProduct}
        onFavoritesClick={handleFavoritesClick}
      />
      {/* Hero Banner Section (full width, above sidebar) */}
      <HeroBanner />
      <main className={`min-h-screen bg-[#F7F8FA] flex flex-row ${isRTL ? 'rtl' : 'ltr'} animate-fade-in`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Sidebar (left side) */}
        <Sidebar onCategorySelect={handleCategorySelect} />
        {/* Main Content */}
        <div className="flex-1 text-lg">
          {/* Navigation moved to just above product cards */}
          <nav className="bg-white/10">
            <div className="container mx-auto px-4">
              <ul className="flex gap-8 py-3">
                {navTabs.map(tab => (
                  <li key={tab.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setSection(tab.section as 'best' | 'new' | 'deals' | 'gift');
                        if (tab.section !== 'best') {
                          setSelectedCategoryObj(null);
                          setCategoryProducts([]);
                          setCategoryError('');
                        }
                      }}
                      className={`transition font-medium text-lg px-2 py-1 rounded-md border-b-2 ${section === tab.section ? 'text-[#F8C291] font-bold border-[#F8C291]' : 'text-black border-transparent'} hover:text-[#F8C291]`}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
          <AnimatePresence mode="wait">
            {selectedCategoryObj ? (
              <motion.section
                key={`category-${selectedCategoryObj.category_id}`}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="w-full px-4 pt-8"
              >
                {categoryLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-400 py-8"
                  >
                    {isRTL ? 'جاري تحميل المنتجات...' : 'Loading products...'}
                  </motion.div>
                ) : categoryError ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-red-500 py-8"
                  >
                    {categoryError}
                  </motion.div>
                ) : (
                  <CategoryCard category={selectedCategoryObj} products={categoryProducts} />
                )}
              </motion.section>
            ) : (
              <motion.section
                key={`section-${section}`}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="w-full px-4 py-16"
              >
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7 }}
                  className={`mb-10 ${isRTL ? 'text-right' : 'text-left'} text-lg font-medium`}
                >
                  <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${section === 'favorites'
                    ? 'text-[#F8C291]'
                    : 'text-primary-800'
                    } mb-2`}>
                    {section === 'favorites' && (
                      <span className="inline-block mr-3">
                        <Heart className="w-8 h-8 inline-block" />
                      </span>
                    )}
                    {sectionTitle}
                  </h2>
                </motion.div>
                {isLoading ? (
                  <div className="min-h-[300px] flex items-center justify-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-2xl font-bold text-primary-800"
                    >
                      {t('homepage.loading') || 'Loading Products...'}
                    </motion.div>
                  </div>
                ) : (
                  <>
                    <motion.div
                      key={section + page}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className={section === 'favorites' ? 'grid grid-cols-2 gap-2 lg:grid-cols-1' : 'grid grid-cols-2 gap-2 lg:grid-cols-5'}
                    >
                      {!Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center text-neutral-400 py-24 text-xl font-semibold">
                          {t('homepage.noProducts') || 'No products available.'}
                        </div>
                      ) : (
                        filteredProducts.map((product, idx) => (
                          <motion.div key={`${product.product_id}-${idx}`} variants={itemVariants} whileHover={{ scale: 1.03 }}>
                            {section === 'favorites' ? (
                              <FavoriteProductCard product={product} />
                            ) : (
                              <ProductCard product={product} />
                            )}
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                    {/* Pagination Controls */}
                    {showPagination && totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition ${p === page ? 'bg-[#2C2C54] text-white' : 'bg-white text-[#2C2C54] border-[#2C2C54] hover:bg-[#F8C291]'}`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.section>
            )}
          </AnimatePresence>
          {/* Feature Cards Section */}
          <section className="w-full max-w-7xl mx-auto px-4 py-8">
            <div className={`text-2xl font-bold text-[#2C2C54] mb-6 ${isRTL ? 'text-right' : 'text-left'} text-lg font-medium`}>
              {t('homepage.whyUs')}
            </div>
            <div className={`flex flex-row flex-wrap justify-center gap-8 md:gap-12 lg:gap-16`}>
              <FeatureCard
                icon={<Truck className="w-8 h-8 text-[#2C2C54]" />}
                title={t('homepage.fastDelivery')}
                description={t('homepage.fastDeliveryDesc')}
              />
              <FeatureCard
                icon={<Headphones className="w-8 h-8 text-[#2C2C54]" />}
                title={t('homepage.support247')}
                description={t('homepage.support247Desc')}
              />
              <FeatureCard
                icon={<BadgeCheck className="w-8 h-8 text-[#2C2C54]" />}
                title={t('homepage.originalProducts')}
                description={t('homepage.originalProductsDesc')}
              />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
} 