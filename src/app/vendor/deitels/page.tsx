'use client';
import Footer from '@/components/Footer';
import { useI18n } from '@/contexts/I18nContext';
import React from 'react';
import { useRouter } from 'next/navigation';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

export default function VendorDeitelsPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const router = useRouter();

  const beneficiariesTitle = t('infoPages.vendorDeitels.beneficiaries.title') as string;

  // Get beneficiaries array directly from the translation file based on locale
  const beneficiaries: Array<{ title: string; desc: string }> =
    locale === 'ar'
      ? (ar.infoPages.vendorDeitels.beneficiaries.items as Array<{ title: string; desc: string }>)
      : (en.infoPages.vendorDeitels.beneficiaries.items as Array<{ title: string; desc: string }>);

  return (
    <>
      <main className="flex flex-col min-h-screen w-full bg-[#F7F7FA] font-tajawal">
        {/* Hero Section - Figma style */}
        <section className="w-full relative min-h-[420px] flex flex-col justify-center items-center transition-all duration-700 animate-fade-in-down" style={{background: 'linear-gradient(rgba(44,44,84,0.7),rgba(44,44,84,0.7)), url(/vendor-hero-bg.jpg) center/cover'}}>
          <div className="w-full flex flex-col items-center justify-center py-16 px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-8 font-tajawal animate-slide-in-top" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('infoPages.vendorHero.headline') as string}
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-8 font-tajawal animate-slide-in-top delay-150" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('infoPages.vendorHero.subheadline') as string}
            </h2>
            <button className="px-12 py-4 rounded-xl text-lg font-bold bg-[#2C2C54] text-white shadow hover:bg-[#474787] transition-all duration-300 transform hover:scale-105 font-tajawal animate-scale-in delay-300" style={{ minWidth: '260px' }}
              onClick={() => router.push('/vendor/signup')}
            >
              {t('infoPages.vendorHero.button1') as string}
            </button>
          </div>
        </section>
        {/* Why Roy Section */}
        <section className="w-full bg-white py-16 flex flex-col items-center justify-center animate-slide-in-left transition-all duration-700">
          <div className="max-w-4xl w-full flex flex-col items-center px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C2C54] text-center mb-6 font-tajawal animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('infoPages.vendorDeitels.title') as string}
            </h2>
            <p className="text-lg md:text-xl text-[#2C2C54] font-medium text-center mb-12 font-tajawal animate-fade-in delay-150" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('infoPages.vendorDeitels.description') as string}
            </p>
            <div className={`w-full flex flex-col md:flex-row gap-10 md:gap-6 justify-center items-stretch ${isRTL ? 'md:flex-row-reverse' : ''}`}> 
              {/* Marketing Feature */}
              <div className="flex-1 flex flex-col items-center text-center p-6 rounded-xl shadow-lg border border-[#2C2C54]/10 bg-[#F7F7FA] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up">
                {/* Lightbulb Icon */}
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-[#2C2C54]"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3.5 5.5V17a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2.5C17.5 13.5 19 11.5 19 9a7 7 0 0 0-7-7z"/></svg>
                <h3 className="text-xl font-bold mb-2 text-[#2C2C54] font-tajawal">{t('infoPages.vendorDeitels.features.marketing.title') as string}</h3>
                <p className="text-[#474787] text-base font-tajawal">{t('infoPages.vendorDeitels.features.marketing.desc') as string}</p>
              </div>
              {/* Ecommerce Feature */}
              <div className="flex-1 flex flex-col items-center text-center p-6 rounded-xl shadow-lg border border-[#2C2C54]/10 bg-[#F7F7FA] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up delay-150">
                {/* Gear Icon */}
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-[#2C2C54]"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2.34a1 1 0 0 0 .26-1.09l-1-1.73a1 1 0 0 1 .21-1.22l1.52-1.52a1 1 0 0 0 0-1.41l-2.12-2.12a1 1 0 0 0-1.41 0l-1.52 1.52a1 1 0 0 1-1.22.21l-1.73-1a1 1 0 0 0-1.09.26l-1.41 1.41a1 1 0 0 0-.26 1.09l1 1.73a1 1 0 0 1-.21 1.22l-1.52 1.52a1 1 0 0 0 0 1.41l2.12 2.12a1 1 0 0 0 1.41 0l1.52-1.52a1 1 0 0 1 1.22-.21l1.73 1a1 1 0 0 0 1.09-.26l1.41-1.41z"/></svg>
                <h3 className="text-xl font-bold mb-2 text-[#2C2C54] font-tajawal">{t('infoPages.vendorDeitels.features.ecommerce.title') as string}</h3>
                <p className="text-[#474787] text-base font-tajawal">{t('infoPages.vendorDeitels.features.ecommerce.desc') as string}</p>
              </div>
              {/* Growth Feature */}
              <div className="flex-1 flex flex-col items-center text-center p-6 rounded-xl shadow-lg border border-[#2C2C54]/10 bg-[#F7F7FA] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up delay-300">
                {/* Chart Icon */}
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-[#2C2C54]"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M8 17V9m4 8V5m4 12v-3"/></svg>
                <h3 className="text-xl font-bold mb-2 text-[#2C2C54] font-tajawal">{t('infoPages.vendorDeitels.features.growth.title') as string}</h3>
                <p className="text-[#474787] text-base font-tajawal">{t('infoPages.vendorDeitels.features.growth.desc') as string}</p>
              </div>
            </div>
          </div>
        </section>
        {/* Support Section */}
        <section className="w-full relative min-h-[320px] flex flex-col justify-center items-center py-12 px-4 animate-slide-in-right transition-all duration-700" style={{background:'linear-gradient(rgba(44,44,84,0.7),rgba(44,44,84,0.7)), url(/backgourndimagevendor.jpg) center/cover'}}>
          <div className="w-full max-w-3xl flex flex-col items-center justify-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-4 font-tajawal animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('infoPages.vendorDeitels.supportSection.title') as string}
            </h2>
            <p className="text-lg md:text-xl text-white font-medium text-center font-tajawal animate-fade-in delay-150" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('infoPages.vendorDeitels.supportSection.desc') as string}
            </p>
          </div>
        </section>
        {/* Beneficiaries Section */}
        <section className="w-full bg-white py-16 flex flex-col items-center justify-center animate-fade-in-up transition-all duration-700">
          <div className="max-w-5xl w-full flex flex-col items-center px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C2C54] text-center mb-10 font-tajawal animate-slide-in-top" dir={isRTL ? 'rtl' : 'ltr'}>
              {beneficiariesTitle}
            </h2>
            <div className={`w-full flex flex-col md:flex-row gap-8 justify-center items-stretch ${isRTL ? 'md:flex-row-reverse' : ''}`}> 
              {beneficiaries.map((item, idx) => (
                <div key={idx} className={`flex-1 flex flex-col items-center text-center p-8 rounded-xl border border-[#2C2C54]/20 bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up ${idx === 1 ? 'delay-150' : idx === 2 ? 'delay-300' : ''}`}>
                  <h3 className="text-2xl font-bold mb-4 text-[#2C2C54] font-tajawal">{item.title}</h3>
                  <p className="text-[#474787] text-base font-tajawal whitespace-pre-line">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

// Tailwind custom animations (add to your global CSS if not present):
// .animate-fade-in { @apply opacity-0 animate-[fadeIn_0.8s_ease-in-out_forwards]; }
// .animate-fade-in-up { @apply opacity-0 animate-[fadeInUp_0.8s_ease-in-out_forwards]; }
// .animate-fade-in-down { @apply opacity-0 animate-[fadeInDown_0.8s_ease-in-out_forwards]; }
// .animate-slide-in-left { @apply opacity-0 animate-[slideInLeft_0.8s_ease-in-out_forwards]; }
// .animate-slide-in-right { @apply opacity-0 animate-[slideInRight_0.8s_ease-in-out_forwards]; }
// .animate-slide-in-top { @apply opacity-0 animate-[slideInTop_0.8s_ease-in-out_forwards]; }
// .delay-150 { animation-delay: 150ms; }
// .delay-300 { animation-delay: 300ms; } 