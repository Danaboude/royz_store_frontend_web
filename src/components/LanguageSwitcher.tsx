'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
      aria-label="Switch language"
    >
      <Globe className="w-5 h-5" />
      <span>{locale === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
} 