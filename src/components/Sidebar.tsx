"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import type { Category } from '@/views/admin/CategoryTable';

const STATIC_LINKS = [
  { label: 'sidebar.technicalSupport', href: '#' },
  { label: 'sidebar.contactUs', href: '#' },
  { label: 'sidebar.trackOrder', href: '#' },
];

interface SidebarProps {
  onCategorySelect?: (category: Category) => void;
}

export default function Sidebar(props: SidebarProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { isLoggedIn } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerServiceOpen, setCustomerServiceOpen] = useState(false);
  const [open, setOpen] = useState(false); // for mobile drawer
  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/categories');
        let cats = Array.isArray(res.data) ? res.data : (res.data.data || res.data.categories);
        cats = (cats || []).sort((a: Category, b: Category) => (a.order ?? 0) - (b.order ?? 0));
        setCategories(cats);
      } catch {
        setError(isRTL ? '\u0641\u0634\u0644 \u0641\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0641\u0626\u0627\u062a. \u064a\u0631\u062c\u0649 \u0627\u0644\u062a\u0623\u0643\u062f \u0645\u0646 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u062e\u0627\u062f\u0645 \u0627\u0644\u062e\u0644\u0641\u064a.' : 'Failed to load categories. Please make sure the backend server is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [isRTL]); 
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetch(`${API_URL}/static-pages/site-settings`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => setSettings(null));
  }, [API_URL]);
  const [settings, setSettings] = useState<{ tech_support?: string } | null>(null);

  const techSupportNumber = settings?.tech_support || '963968869999';
  const handleContactUsClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const footer = document.querySelector('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
    setOpen(false); // close mobile drawer if open
  };

  const handleTechnicalSupportClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    window.open('https://wa.me/963968869999', '_blank');
    setOpen(false); // close mobile drawer if open
  };

  const handleCategoryClick = (cat: Category) => {
    if (typeof props.onCategorySelect === 'function') {
      props.onCategorySelect(cat);
    }
  };



  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className={`lg:hidden fixed top-4 z-40 bg-white border border-gray-200 rounded-full p-2 shadow-md ${isRTL ? 'left-4' : 'right-4'}`}
        onClick={() => setOpen(true)}
        aria-label={isRTL ? 'فتح القائمة' : 'Open menu'}
      >
        <Menu className="w-7 h-7 text-[#2C2C54]" />
      </button>
      {/* Sidebar for desktop */}
      <aside className={`w-64 min-w-[220px] bg-white border-gray-200 p-6 pt-8 hidden lg:block ${isRTL ? 'border-l' : 'border-r'}`}>
        <h2 className={`text-xl font-bold mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('sidebar.allCategories') !== 'sidebar.allCategories' ? t('sidebar.allCategories') : isRTL ? 'جميع الفئات:' : 'All Categories:'}
        </h2>
        <div className="space-y-2 mb-8">
          {loading ? (
            <div className={`animate-pulse text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : error ? (
            <div className={`text-red-500 ${isRTL ? 'text-right' : 'text-left'}`}>{error}</div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.category_id}
                className={`py-2 border-b border-gray-200 last:border-b-0 hover:text-theme-main cursor-pointer transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {isRTL ? cat.name_ar : cat.name_en}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <button
            className={`flex items-center w-full justify-between text-lg font-medium mb-2 focus:outline-none ${isRTL ? 'text-right' : 'text-left'}`}
            onClick={() => setCustomerServiceOpen((v) => !v)}
            aria-expanded={customerServiceOpen}
          >
            {t('sidebar.customerService') !== 'sidebar.customerService' ? t('sidebar.customerService') : isRTL ? 'خدمة العملاء' : 'Customer Service'}
            {customerServiceOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {customerServiceOpen && (
            <ul className="space-y-2 mb-4">
              {STATIC_LINKS.filter(link => link.label !== 'sidebar.trackOrder' || isLoggedIn).map((link) => (
                <li key={link.label} className={`border-b border-gray-100 last:border-b-0 ${isRTL ? 'pr-2' : 'pl-2'}`}>
                  {link.label === 'sidebar.technicalSupport' ? (
                    <a
                      href={`https://wa.me/${techSupportNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleTechnicalSupportClick}
                      className={`block py-1 text-base hover:text-theme-main transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      {t(link.label) !== link.label ? t(link.label) : isRTL ? 'الدعم التقني' : 'Technical Support'}
                    </a>
                  ) : link.label === 'sidebar.contactUs' ? (
                    <a
                      href="#footer"
                      onClick={handleContactUsClick}
                      className={`block py-1 text-base hover:text-theme-main transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      {t(link.label) !== link.label ? t(link.label) : isRTL ? 'اتصل بنا' : 'Contact Us'}
                    </a>
                  ) : link.label === 'sidebar.trackOrder' ? (
                    <a
                      href="/orders"
                      onClick={e => { e.preventDefault(); router.push('/orders'); setOpen(false); }}
                      className={`block py-1 text-base hover:text-theme-main transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      {t(link.label) !== link.label ? t(link.label) : isRTL ? 'تتبع الطلب' : 'Track Order'}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className={`block py-1 text-base hover:text-theme-main transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      {t(link.label) !== link.label ? t(link.label) : isRTL ?
                        (link.label === 'sidebar.trackOrder' ? 'تتبع الطلب' : link.label) :
                        (link.label === 'sidebar.trackOrder' ? 'Track Order' : link.label)
                      }
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      {/* Drawer for mobile */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
          <aside className={`fixed top-0 h-full bg-white border-gray-200 p-6 pt-8 z-50 shadow-2xl flex flex-col w-72 max-w-full ${isRTL ? 'left-0 border-r' : 'right-0 border-l'}`}>
            <button
              className={`absolute top-4 text-[#2C2C54] bg-white border border-gray-200 rounded-full p-2 shadow-md ${isRTL ? 'right-4' : 'left-4'}`}
              onClick={() => setOpen(false)}
              aria-label={isRTL ? 'إغلاق القائمة' : 'Close menu'}
            >
              <X className="w-7 h-7" />
            </button>
            <h2 className={`text-xl font-bold mb-6 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('sidebar.allCategories') !== 'sidebar.allCategories' ? t('sidebar.allCategories') : isRTL ? 'جميع الفئات:' : 'All Categories:'}
            </h2>
            <div className="space-y-2 mb-8">
              {loading ? (
                <div className={`animate-pulse text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : error ? (
                <div className={`text-red-500 ${isRTL ? 'text-right' : 'text-left'}`}>{error}</div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.category_id}
                    className={`py-2 border-b border-gray-200 last:border-b-0 hover:text-theme-main cursor-pointer transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {isRTL ? cat.name_ar : cat.name_en}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                className={`flex items-center w-full justify-between text-lg font-medium mb-2 focus:outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={() => setCustomerServiceOpen((v) => !v)}
                aria-expanded={customerServiceOpen}
              >
                {t('sidebar.customerService') !== 'sidebar.customerService' ? t('sidebar.customerService') : isRTL ? 'خدمة العملاء' : 'Customer Service'}
                {customerServiceOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {customerServiceOpen && (
                <ul className="space-y-2 mb-4">
                  {STATIC_LINKS.filter(link => link.label !== 'sidebar.trackOrder' || isLoggedIn).map((link) => (
                    <li key={link.label} className={`border-b border-gray-100 last:border-b-0 ${isRTL ? 'pr-2' : 'pl-2'}`}>
                      {link.label === 'sidebar.technicalSupport' ? (
                        <a
                          href="https://wa.me/963968869999"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleTechnicalSupportClick}
                          className={`block py-1 text-base hover:text-theme-main transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          {t(link.label) !== link.label ? t(link.label) : isRTL ? 'الدعم التقني' : 'Technical Support'}
                        </a>
                      ) : link.label === 'sidebar.contactUs' ? (
                        <a
                          href="#footer"
                          onClick={handleContactUsClick}
                          className={`block py-1 text-base hover:text-theme-main transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          {t(link.label) !== link.label ? t(link.label) : isRTL ? 'اتصل بنا' : 'Contact Us'}
                        </a>
                      ):<h1></h1>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
