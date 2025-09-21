'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isDeliverySignin = pathname === '/delivery-signin';
  const isDeliveryDashboard = pathname === '/delivery-dashboard';
  const isOrderManager = pathname.startsWith('/order-manager');
  const isProductManager = pathname.startsWith('/product-manager');
  const shouldHideHeader = isDeliverySignin || isDeliveryDashboard || isOrderManager || isProductManager;

  return (
    <>
      {!shouldHideHeader && <Header />}
      {children}
    </>
  );
} 