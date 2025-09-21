'use client';
import React, { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';

export default function VendorPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'factories' | 'malls' | 'shops' | 'services'>('factories');
  const [isContentVisible, setIsContentVisible] = useState(false);
  const router = useRouter();

  // Add scroll animations
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.8;
        
        if (isVisible) {
          section.classList.add('animate-slide-up');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tab content animation
  useEffect(() => {
    setIsContentVisible(false);
    const timer = setTimeout(() => setIsContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabClick = (tab: 'factories' | 'malls' | 'shops' | 'services') => {
    setActiveTab(tab);
  };

  return (
    <>
      <main className="flex flex-col min-h-screen w-full bg-[#F7F7FA] font-tajawal animate-fade-in">
        {/* Vendor Hero Section - Figma style */}
        <section className="w-full relative min-h-[420px] flex flex-col justify-center items-center animate-slide-up transition-all duration-700" style={{background: 'linear-gradient(rgba(44,44,84,0.7),rgba(44,44,84,0.7)), url(/vendor-hero-bg.jpg) center/cover'}}>
          <div className="w-full flex flex-col items-center justify-center py-16 px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-8 font-tajawal animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('infoPages.vendorHero.headline') as string}
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-8 font-tajawal animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('infoPages.vendorHero.subheadline') as string}
            </h2>
            <div className={`flex flex-col sm:flex-row gap-4 mb-12 items-center justify-center ${isRTL ? 'flex-row-reverse' : ''} animate-slide-up`}> 
              <button
                className="px-8 py-3 rounded-lg text-lg font-bold bg-[#2C2C54] text-white shadow hover:bg-[#474787] transition-all duration-300 transform hover:scale-105 font-tajawal"
                onClick={() => router.push('/vendor/deitels')}
              >
                {t('infoPages.vendorHero.button1') as string}
              </button>
              <button className="px-8 py-3 rounded-lg text-lg font-bold bg-[#F8C291] text-[#2C2C54] shadow hover:bg-[#f7b87b] transition-all duration-300 transform hover:scale-105 font-tajawal"
                onClick={() => router.push('/vendor/signup')}
              >
                {t('infoPages.vendorHero.button2') as string}
              </button>
            </div>
            <div className={`w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0 mt-8 animate-fade-in`}>
              <span className="text-white text-lg font-bold font-tajawal text-center transition-all duration-300 hover:text-[#F8C291]">{t('infoPages.vendorHero.feature1') as string}</span>
              <span className="text-white text-lg font-bold font-tajawal text-center transition-all duration-300 hover:text-[#F8C291]">{t('infoPages.vendorHero.feature2') as string}</span>
              <span className="text-white text-lg font-bold font-tajawal text-center transition-all duration-300 hover:text-[#F8C291]">{t('infoPages.vendorHero.feature3') as string}</span>
            </div>
          </div>
        </section>
        {/* Services Tabs Section - Figma style */}
        <section id="services-tabs" className="w-full bg-[#2C2C54] py-12 px-4 flex flex-col items-center animate-slide-up transition-all duration-700">
          <h2 className={`text-3xl md:text-4xl font-extrabold text-white mb-8 w-full max-w-5xl ${isRTL ? 'text-right' : 'text-left'} animate-fade-in`} dir={isRTL ? 'rtl' : 'ltr'}>
            {t('infoPages.servicesTabs.title') as string}
          </h2>
          <div className={`w-full max-w-5xl flex flex-row-reverse justify-end gap-12 mb-8 ${isRTL ? 'flex-row-reverse' : ''} animate-slide-up`}> 
            {(['factories', 'malls', 'shops', 'services'] as const).map(tab => (
              <button
                key={tab}
                className={`text-lg md:text-xl font-extrabold transition-all duration-300 pb-2 relative ${activeTab === tab ? 'text-[#F8C291] border-b-4 border-[#F8C291]' : 'text-white hover:text-[#F8C291]'} font-tajawal focus:outline-none transform hover:scale-105`}
                style={{ minWidth: '120px' }}
                onClick={() => handleTabClick(tab)}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {t(`infoPages.servicesTabs.${tab}`) as string}
                {activeTab === tab && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#F8C291] animate-scale-in"></div>
                )}
              </button>
            ))}
          </div>
          <div className="w-full max-w-5xl min-h-[120px] bg-transparent flex items-center justify-end animate-fade-in">
            <div
              className={`text-white text-lg font-tajawal w-full ${isRTL ? 'text-right' : 'text-left'} transition-all duration-500 ${
                isContentVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-lg">
                <p className="leading-relaxed">
                  {t(`infoPages.servicesTabs.${activeTab}Content`) as string}
                </p>
              </div>
            </div>
          </div>
          <hr className="w-full max-w-5xl border-t border-white/60 mt-8 animate-fade-in" />
        </section>
        {/* Become Vendor Section - Figma style */}
        <section className="w-full bg-[#2C2C54] py-20 flex flex-col items-center justify-center animate-slide-up transition-all duration-700">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-8 font-tajawal animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
            {t('infoPages.becomeVendorSection.title') as string}
          </h2>
          <p className="text-lg md:text-xl text-white font-bold text-center mb-12 max-w-4xl font-tajawal animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
            {t('infoPages.becomeVendorSection.description') as string}
          </p>
          <button
            className="px-12 py-4 rounded-xl text-lg font-bold bg-[#F8C291] text-[#2C2C54] shadow hover:bg-[#f7b87b] transition-all duration-300 transform hover:scale-105 font-tajawal animate-scale-in"
            style={{ minWidth: '260px' }}
            onClick={() => router.push('/vendor/signup')}
          >
            {t('infoPages.becomeVendorSection.button') as string}
          </button>
        </section>
        {/* Main Content (future sections go here) */}
        <div className="flex-1 flex flex-col justify-center items-center w-full px-6 bg-white text-lg animate-fade-in">
          {/* Add more sections below as needed */}
        </div>
      </main>
      <Footer />
    </>
  );
} 