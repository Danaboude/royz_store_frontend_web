'use client';
import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useI18n } from '@/contexts/I18nContext';

const navLinks = [
  { href: '/about', key: 'infoPages.nav.about' },
  { href: '/privacy-policy', key: 'infoPages.nav.privacy' },
  { href: '/return-policy', key: 'infoPages.nav.return' },
  { href: '/faq', key: 'infoPages.nav.faq' },
];

export default function AboutPage() {
  const { t, locale } = useI18n();
  // Helper to bold section titles and bullets in about2
  function renderAboutText(text: string) {
    // Split by line, wrap section titles and bullets in <strong>
    return text.split('\n').map((line, idx) => {
      // Bold section titles (lines ending with ':')
      if (/[:：]$/.test(line.trim())) {
        return <div key={idx} className="mb-2"><strong>{line}</strong></div>;
      }
      // Bold bullets
      if (/^\s*[•\-]/.test(line)) {
        return <div key={idx} className="mb-1"><strong>{line}</strong></div>;
      }
      // Main headline (first line)
      if (idx === 0 && line.trim()) {
        return <div key={idx} className="mb-4 text-2xl font-extrabold">{line}</div>;
      }
      // Normal text
      return <div key={idx} className="mb-2">{line}</div>;
    });
  }
  return (
    <>
      <main className="flex flex-col min-h-screen w-full bg-[#F7F7FA] font-tajawal">
        <div className="flex-1 flex flex-col w-full h-full bg-white rounded-none shadow-none p-0 justify-center items-center relative">
          <nav className="flex justify-center gap-4 mb-10 mt-4 w-full px-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded font-bold transition-colors text-[#2C2C54] hover:bg-[#F8C291]/30 font-tajawal text-lg ${link.href === '/about' ? 'bg-[#F8C291]/60 text-[#2C2C54]' : ''}`}
                style={{textDecoration: 'none'}}>
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="flex-1 flex flex-col justify-center items-center w-full px-6">
            <h1 className="text-3xl font-extrabold mb-6 text-[#2C2C54] font-tajawal">
              {t('infoPages.about.title')}
            </h1>
            <div
              className={`text-lg text-gray-700 font-tajawal mb-8 px-2 whitespace-pre-line ${locale === 'ar' ? 'text-right' : 'text-left'}`}
              style={{direction: locale === 'ar' ? 'rtl' : 'ltr'}}
            >
              {renderAboutText(t('infoPages.about.about2'))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 