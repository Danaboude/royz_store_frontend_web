"use client";

import React, { useState } from 'react';
import { useProductStore } from '@/store/productStore';
interface Product {
  product_id: number;
  vendor_id: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string;
  category_name: string;
  vendor_name: string;
  average_rating: number;
  review_count: number;
  is_new: boolean;
  is_best_selling: boolean;
  is_deal_offer: boolean;
  original_price: string | null;
  discount_percentage: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  final_price: string;
  has_active_discount: boolean;
}
interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const { cart, favorites, addToCart, addFavorite, removeFavorite } = useProductStore();
  const [pending, setPending] = useState(false);
  const isInCart = cart.some((p) => p.product_id === product.product_id);
  const isFavorite = favorites.includes(product.product_id);

  return (
    <div className="flex gap-4 mt-2">
      <button
        className={`px-4 py-2 rounded-xl font-bold border-2 transition-colors ${isInCart ? 'bg-gray-200 text-gray-600 border-gray-300' : 'bg-[#2C2C54] text-white border-[#2C2C54] hover:bg-[#23234a]'} disabled:opacity-60`}
        disabled={pending || product.stock === 0 || isInCart}
        onClick={() => {
          setPending(true);
          addToCart(product);
          setTimeout(() => setPending(false), 500);
        }}
      >
        {isInCart ? 'In Cart' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
      <button
        className={`px-4 py-2 rounded-xl font-bold border-2 transition-colors ${isFavorite ? 'bg-[#F8C291] text-white border-[#F8C291]' : 'bg-white text-[#2C2C54] border-[#2C2C54] hover:bg-gray-50'} disabled:opacity-60`}
        disabled={pending}
        onClick={() => {
          setPending(true);
          if (isFavorite) {
            removeFavorite(product.product_id);
          } else {
            addFavorite(product.product_id);
          }
          setTimeout(() => setPending(false), 500);
        }}
      >
        {isFavorite ? 'Remove Favorite' : 'Add to Favorite'}
      </button>
    </div>
  );
} 