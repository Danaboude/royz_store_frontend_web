import React from 'react';
import type { Product, Review } from '@/models/types';

const ProductDetailsClient = ({ product, initialReviews }: { product: Product; initialReviews: Review[] }) => {
  return (
    <div>
      Product details client placeholder
      <div>Product: {typeof product?.name === 'string' ? product.name : 'N/A'}</div>
      <div>Reviews count: {Array.isArray(initialReviews) ? initialReviews.length : 0}</div>
    </div>
  );
};

export default ProductDetailsClient; 