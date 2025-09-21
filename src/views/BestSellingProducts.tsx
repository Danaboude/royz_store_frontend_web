import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { useI18n } from '@/contexts/I18nContext';

interface ProductCardProps {
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

export default function BestSellingProducts() {
  const { t, locale } = useI18n();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([]);
  const pageSize = 8;

  // Fetch favorites on mount
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch('/favorites', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        }
      } catch {}
    }
    fetchFavorites();
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/products/best-selling?page=${page}&pageSize=${pageSize}`);
        const data = await res.json();
        // Map API data to ProductCardProps, filling missing fields with defaults
        const mapped = (data.products || []).map((p: unknown) => {
          const prod = p as Partial<ProductCardProps>;
          return {
            product_id: prod.product_id || 0,
            name: prod.name || '',
            price: prod.price || '',
            image_url: prod.image_url || '/placeholder-product.jpg',
            description: prod.description || '',
            category_name: prod.category_name || '',
            vendor_name: prod.vendor_name || '',
            stock: prod.stock || 0,
            average_rating: prod.average_rating || 0,
            review_count: prod.review_count || 0,
            is_new: prod.is_new || false,
            is_best_selling: prod.is_best_selling || false,
            is_deal_offer: prod.is_deal_offer || false,
            original_price: prod.original_price || null,
            discount_percentage: prod.discount_percentage || null,
            final_price: prod.final_price || prod.price || '',
            has_active_discount: prod.has_active_discount || false,
            is_favorite: false, // will be set below
          };
        });
        // Mark favorites
        const withFavs = mapped.map((prod: Partial<ProductCardProps>) => ({
          ...prod,
          is_favorite: favorites.includes(prod.product_id!),
        }));
        setProducts(withFavs);
      } catch {
        setError(String(t('failed_to_load_products')));
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [page, t, favorites]);

  // Toggle favorite handler
  const handleToggleFavorite = async (product_id: number, isFav: boolean) => {
    if (!isFav) {
      // Add to favorites
      await fetch('/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id }),
      });
      setFavorites(favs => [...favs, product_id]);
    } else {
      // Remove from favorites
      await fetch(`/favorites/${product_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setFavorites(favs => favs.filter(id => id !== product_id));
    }
  };

  return (
    <section className="my-12" dir={dir}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        {String(t('best_selling'))} :
      </h2>
      {loading ? (
        <div className="text-gray-400 text-center py-8">{String(t('loading'))}...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products
            .filter(
              (product) =>
                product &&
                typeof product === 'object' &&
                typeof product.product_id === 'number' &&
                typeof product.is_favorite !== 'undefined'
            )
            .map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onToggleFavorite={() => handleToggleFavorite(product.product_id, product.is_favorite || false)}
              />
            ))}
        </div>
      )}
      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-8">
        {[1,2,3,4,5].map((p) => (
          <button
            key={p}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition ${p === page ? 'bg-primary-800 text-white' : 'bg-white text-primary-800 border-primary-800 hover:bg-primary-100'}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </section>
  );
} 