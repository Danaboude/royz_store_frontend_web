import type { Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '@/contexts/I18nContext';
import { ProductSectionProvider } from '@/contexts/ProductSectionContext';
import { UserProvider } from '@/contexts/UserContext';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';
import ClientLayout from './ClientLayout';

export const metadata = {
  metadataBase: new URL('https://royzstore.com/'),
  title: {
    default: 'Royz Store | متجر رويز',
    template: `%s | Royz Store`,
  },
  description: 'Your premium online shopping destination for electronics, fashion, and home goods. | وجهتك للتسوق الإلكتروني للأجهزة الإلكترونية، الأزياء، والمنتجات المنزلية',
  keywords: [
    'ecommerce',
    'online shopping',
    'Royz Store',
    'electronics',
    'fashion',
    'home goods',
    'best deals',
    'متجر إلكتروني',
    'تسوق عبر الإنترنت',
    'متجر رويز',
    'إلكترونيات',
    'أزياء',
    'منتجات منزلية',
    'عروض رائعة'
  ],
  authors: [{ name: 'Royz Store', url: 'https://royzstore.com' }],
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  openGraph: {
    title: 'Royz Store | Your One-Stop Shop | متجر رويز',
    description: 'Your premium online shopping destination for electronics, fashion, and home goods.',
    type: 'website',
    url: 'https://royzstore.com/',
    siteName: 'Royz Store',
    locale: 'en_US',
    images: [
      {
        url: '/ROY.PNG',
        width: 1200,
        height: 630,
        alt: 'Royz Store ecommerce website showcasing products',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royz Store | Your One-Stop Shop | متجر رويز',
    description: 'Your premium online shopping destination for electronics, fashion, and home goods.',
    images: ['/ROY.PNG'],
    creator: '@royzstore'
  },
  alternates: {
    canonical: 'https://royzstore.com/',
    languages: {
      'en-US': 'https://royzstore.com/',
      'ar-AE': 'https://royzstore.com/',
    },
  },
  other: {
    'og:image:secure_url': '/ROY.PNG',
    'twitter:image:alt': 'Royz Store product showcase'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    
      </head>
      <body className="font-tajawal" suppressHydrationWarning={true}>
        <Toaster position="top-left" />
        <ProductSectionProvider>
          <UserProvider>
            <I18nProvider>
              <QueryProvider>
                <ClientLayout>
                {children}
                </ClientLayout>
              </QueryProvider>
            </I18nProvider>
          </UserProvider>
        </ProductSectionProvider>
      </body>
    </html>
  );
}
