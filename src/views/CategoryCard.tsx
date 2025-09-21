import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { useI18n } from '@/contexts/I18nContext';
import { ProductCardProps } from './ProductCard';
import { motion } from 'framer-motion';

interface CategoryCardProps {
  category: {
    category_id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
  };
  products: ProductCardProps[];
}

export default function CategoryCard({ category, products }: CategoryCardProps) {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const name = isRTL ? category.name_ar : category.name_en;
  const description = isRTL ? category.description_ar : category.description_en;

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(products.length / pageSize);
  const paginatedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div 
      key={category.category_id}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-7xl mx-auto px-4 py-16"
    >
      <motion.div variants={itemVariants} className="mb-10">
        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight text-primary-800 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {name}
        </h2>
        {description && (
          <p className={`text-gray-600 text-lg ${isRTL ? 'text-right' : 'text-left'}`}>{description}</p>
        )}
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {products.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center text-neutral-400 py-24 text-xl font-semibold"
          >
            {isRTL ? 'لا توجد منتجات في هذه الفئة.' : 'No products in this category.'}
          </motion.div>
        ) : (
          paginatedProducts.map(product => (
            <motion.div key={product.product_id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))
        )}
      </motion.div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
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
    </motion.div>
  );
} 