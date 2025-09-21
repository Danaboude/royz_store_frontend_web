'use client';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';


type SiteSettings = { email: string; phone: string; whatsapp: string; facebook?: string; x?: string; instagram?: string };

export default function Footer() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [showPhoneMenu, setShowPhoneMenu] = useState(false);
  const phoneMenuRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetch(`${API_URL}/static-pages/site-settings`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, [API_URL]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (phoneMenuRef.current && !phoneMenuRef.current.contains(event.target as Node)) {
        setShowPhoneMenu(false);
      }
    }
    if (showPhoneMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPhoneMenu]);

  return (
    <footer className={`w-full bg-[#2C2C54] pt-6 pb-4 text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-start justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Contact Info */}
        <div
          className={`flex flex-col gap-3 text-lg ${isRTL ? 'text-right items-end' : 'text-left items-start'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className={`font-bold text-xl mb-2 underline decoration-[#F5CD79] decoration-4 underline-offset-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('homepage.contactInfo') !== 'homepage.contactInfo' ? t('homepage.contactInfo') : isRTL ? 'معلومات التواصل :' : 'Contact Info:'}
          </div>
          <div className={`opacity-90 ${isRTL ? 'text-right items-end' : 'text-left items-start'} relative`} dir={isRTL ? 'rtl' : 'ltr'}>
            {loading ? (
              <span className="text-xs text-gray-400">{t('loading')}</span>
            ) : settings ? (
              <>
                <span className="cursor-pointer hover:underline" onClick={() => setShowPhoneMenu(v => !v)}>
                  {settings.phone}
                </span>
                {showPhoneMenu && (
                  <div
                    ref={phoneMenuRef}
                    className="z-50 mt-2 bg-white text-[#2C2C54] rounded shadow-lg border p-2 flex flex-col min-w-[160px] absolute"
                    style={isRTL ? { right: '0' } : { left: '0' }}
                  >
                    <a href={`tel:${settings.phone}`} className="py-1 px-2 hover:bg-[#F8C291]/30 rounded transition" target="_blank" rel="noopener noreferrer">{isRTL ? 'اتصال' : 'Call'}</a>
                    <a href={`sms:${settings.phone}`} className="py-1 px-2 hover:bg-[#F8C291]/30 rounded transition" target="_blank" rel="noopener noreferrer">{isRTL ? 'رسالة نصية' : 'Text'}</a>
                    <a href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, '')}`} className="py-1 px-2 hover:bg-[#F8C291]/30 rounded transition" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-red-400">{t('banners.failedToFetchBanners')}</span>
            )}
          </div>
          <div className={`opacity-90 ${isRTL ? 'text-right' : 'text-left'}`}>
            {loading ? (
              <span className="text-xs text-gray-400">{t('loading')}</span>
            ) : settings ? (
              <a
                href={`mailto:${settings.email}`}
                className="hover:underline text-[#F8C291]"
                target="_blank"
                rel="noopener noreferrer"
              >
                {settings.email}
              </a>
            ) : (
              <span className="text-xs text-red-400">{t('banners.failedToFetchBanners')}</span>
            )}
          </div>

          <div className={`flex gap-4 mt-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <a href={settings?.facebook || '#'} aria-label={isRTL ? "فيسبوك" : "Facebook"} className="hover:text-[#F5CD79] transition-colors" target="_blank" rel="noopener noreferrer">
              <Facebook className="w-6 h-6" />
            </a>
            <a href={settings?.x || '#'} aria-label={isRTL ? "تويتر" : "Twitter"} className="hover:text-[#F5CD79] transition-colors" target="_blank" rel="noopener noreferrer">
              <Twitter className="w-6 h-6" />
            </a>
            <a href={settings?.instagram || '#'} aria-label={isRTL ? "إنستغرام" : "Instagram"} className="hover:text-[#F5CD79] transition-colors" target="_blank" rel="noopener noreferrer">
              <Instagram className="w-6 h-6" />
            </a>
          </div>
        </div>
        {/* Logo */}
        <div className={`flex ${isRTL ? 'mb-8 md:mb-0' : 'mb-8 md:mb-0'}`}>
          <Link href="/" aria-label={isRTL ? 'الانتقال إلى الرئيسية' : 'Go to homepage'}>
            <div className="w-36 h-36 flex items-center justify-center text-3xl font-bold cursor-pointer transition">
              <Image
                width={150} // Specify the width
                height={150} // Specify the height

                src="/ROY.png"
                alt="Roy Store Logo"
                className="w-32 h-32 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 object-contain"
              />
            </div>
          </Link>
        </div>
      </div>
      <div className="w-full flex justify-center mt-4">
        <span className="text-xs opacity-80 text-center font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          © {new Date().getFullYear()}  Powered by Beacon Studio
        </span>
      </div>
    </footer>
  );
}
