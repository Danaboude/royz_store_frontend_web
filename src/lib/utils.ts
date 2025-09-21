import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string | null | undefined, locale: string = 'en'): string {
  // Handle null, undefined, or invalid values
  if (price === null || price === undefined || price === '') {
    return '0 ل.س';
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Handle NaN values
  if (isNaN(numPrice)) {
    return '0 ل.س';
  }
  
  const isRTL = locale === 'ar';

  // Format price: remove unnecessary trailing zeros
  let formatted: string;
  if (Number.isInteger(numPrice)) {
    formatted = numPrice.toLocaleString(isRTL ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 });
  } else {
    formatted = numPrice.toLocaleString(isRTL ? 'ar-EG' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  if (isRTL) {
    // For Arabic, use ل.س (Syrian Pound)
    return `${formatted} ل.س`;
  } else {
    // For English, use ل.س as well but with English number formatting
    return `${formatted} ل.س`;
  }
}

export function formatPriceWithoutSymbol(price: number | string | null | undefined, locale: string = 'en'): string {
  // Handle null, undefined, or invalid values
  if (price === null || price === undefined || price === '') {
    return '0';
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Handle NaN values
  if (isNaN(numPrice)) {
    return '0';
  }

  // Format price: remove unnecessary trailing zeros
  if (Number.isInteger(numPrice)) {
    return numPrice.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 });
  } else {
    return numPrice.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
} 