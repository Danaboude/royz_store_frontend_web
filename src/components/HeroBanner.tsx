import React, { useEffect, useState, useRef,useMemo } from 'react';
import { useHomeData } from '@/services/api-client';
import Image from 'next/image';


interface Banner {
  id: number;
  image_url: string;
  link?: string;
}

export default function HeroBanner() {
  const { data, isLoading, error } = useHomeData();

  const banners: Banner[] =   useMemo(() => data?.banners  || [], [data]);
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    if (!banners.length) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [banners, current]);

  if (isLoading) {
    return (
      <section className="w-full flex flex-col items-center justify-center my-8">
        <div className="w-full h-[180px] md:h-[320px] bg-primary-800 rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-white text-lg">Loading banners...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full flex flex-col items-center justify-center my-8">
        <div className="w-full h-[180px] md:h-[320px] bg-primary-800 rounded-xl flex items-center justify-center">
          <span className="text-red-200 text-lg">{typeof error === 'string' ? error : 'Failed to load banners.'}</span>
        </div>
      </section>
    );
  }

  if (!banners.length) {
    // Fallback placeholder
    return (
      <section className="w-full flex flex-col items-center justify-center my-8">
        <div className="w-full h-[180px] md:h-[320px] bg-primary-800 rounded-xl flex items-center justify-center">
          <div className="flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-lg border-2 border-white/30">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="16" fill="#fff" fillOpacity="0.08" />
              <path d="M16 48L32 32L48 48" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="24" r="4" fill="#fff" fillOpacity="0.3" />
            </svg>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col items-center justify-center mt-8 mb-12 px-2 md:px-8">
      <div className="w-full relative h-[180px] md:h-[320px] rounded-xl overflow-hidden bg-primary-800 transition-all duration-700">
        {banners.map((banner, idx) => {
          const isActive = idx === current;
          const image = (
            <Image
              width={720} // Specify the width
              height={1280} // Specify the height
              src={banner.image_url}
              alt={`Banner ${idx + 1}`}
              className={`w-full h-full object-cover object-center transition-transform duration-700 ease-in-out ${isActive ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
              draggable={false}
              style={{ pointerEvents: isActive ? 'auto' : 'none', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          );
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              aria-hidden={!isActive}
            >
              {banner.link ? (
                <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  {image}
                </a>
              ) : (
                image
              )}
            </div>
          );
        })}
      </div>
      {/* Slider dots */}
      <div className="flex gap-2 mt-4">
        {banners.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${current === idx ? 'bg-accent-400' : 'bg-gray-300'}`}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </section>
  );
} 