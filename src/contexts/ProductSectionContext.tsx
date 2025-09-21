'use client';

import React, { createContext, useState, ReactNode } from 'react';

export type ProductSection = 'best' | 'new' | 'deals' | 'favorites' | 'gift';

interface ProductSectionContextType {
  section: ProductSection;
  setSection: (section: ProductSection) => void;
}

export const ProductSectionContext = createContext<ProductSectionContextType>({
  section: 'best',
  setSection: () => {},
});

export const ProductSectionProvider = ({ children }: { children: ReactNode }) => {
  const [section, setSection] = useState<ProductSection>('best');
  return (
    <ProductSectionContext.Provider value={{ section, setSection }}>
      {children}
    </ProductSectionContext.Provider>
  );
}; 