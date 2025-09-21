'use client';

import { I18nProvider } from '@/contexts/I18nContext';
import { ProductSectionProvider } from '@/contexts/ProductSectionContext';
import { useUIStore } from '@/store/uiStore';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Image from 'next/image';


export default function Providers({ children }: { children: React.ReactNode }) {
  const { checkAuth, initializeCart } = useUIStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Initialize cart from localStorage immediately
    initializeCart();
    // Then check auth
    checkAuth();
  }, [checkAuth, initializeCart]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="bg-green-600 text-white">
          <div className="container mx-auto px-4 py-2 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-4">
              <span className="text-sm">Loading...</span>
            </div>
          </div>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-8">
              <div className="text-2xl font-bold">
                <Image
                  width={150} // Specify the width
                  height={150} // Specify the height
                  src="/ROY.png"
                  alt="Roy Store Logo"
                  className="w-16 h-16 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 object-contain"
                />
              </div>
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="w-full py-2 px-4 pr-12 rounded-lg bg-white/10 border border-white/20 placeholder-white/60"
                    disabled
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span>Loading...</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-2xl font-bold text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ProductSectionProvider>
      <I18nProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          {children}
        </div>
      </I18nProvider>
    </ProductSectionProvider>
  );
} 