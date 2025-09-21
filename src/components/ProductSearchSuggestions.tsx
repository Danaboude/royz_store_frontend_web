import React from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils';
import { useSearchProducts } from '@/services/api-client';
import ImageWithFallback from './ImageWithFallback';

export interface ProductSearchSuggestionProduct {
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  is_deal_offer?: boolean;
  original_price?: string | null;
  final_price?: string;
}

interface ProductData {
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  category_id: number;
  is_deal_offer?: boolean;
  original_price?: string | null;
  final_price?: string;
}

interface Props {
  searchQuery: string;
  selectedCategory: string;
  onSelectProduct: (product: ProductSearchSuggestionProduct) => void;
  show: boolean;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductSearchSuggestions({ searchQuery, selectedCategory, onSelectProduct, show }: Props) {
  const { locale } = useI18n();
  const [loading, setLoading] = React.useState(false); // New state for click loading
  // Debounce the search query
  const debouncedQuery = useDebounce(searchQuery, 400);
  // Use the search hook with debounced query
  const { data, isLoading } = useSearchProducts(debouncedQuery, selectedCategory, 5);
  
  // Map results to the expected format
  const results = React.useMemo(() => {
    if (!data?.products) return [];
    
    return data.products.map((p: ProductData) => ({
      product_id: p.product_id,
      name: p.name,
      price: p.price,
      image_url: p.image_url,
      is_deal_offer: p.is_deal_offer,
      original_price: p.original_price,
      final_price: p.final_price,
    }));
  }, [data?.products]);

  if (!show || !searchQuery) return null;

  return (
    <div className="absolute left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-2 max-h-96 overflow-y-auto">
      {/* Loader overlay when navigating */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 rounded-lg">
          <svg className="animate-spin w-10 h-10 text-[#2C2C54]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}
      {isLoading ? (
        <div className="p-4 text-center text-gray-400">Loading...</div>
      ) : results.length === 0 ? (
        <div className="p-4 text-center text-gray-400">No products found</div>
      ) : (
        <ul>
          {results.map((product: ProductSearchSuggestionProduct) => (
            <li
              key={product.product_id}
              className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer ${loading ? 'pointer-events-none opacity-60' : ''}`}
              onClick={() => {
                setLoading(true);
                onSelectProduct(product);
              }}
            >
              <ImageWithFallback src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
              <div className="flex-1">
                <div className="font-medium text-sm truncate">{product.name}</div>
                {product.is_deal_offer ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs line-through">{formatPrice(product.original_price, locale)}</span>
                    <span className="text-[#F76B1C] text-sm font-extrabold">{formatPrice(product.final_price, locale)}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">{formatPrice(product.price, locale)}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 