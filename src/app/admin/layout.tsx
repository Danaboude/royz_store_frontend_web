'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Home,
  ShoppingCart,
  Users,
  Settings,
  BarChart2,
  CreditCard,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bell
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useUser } from '@/contexts/UserContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [siteSettingsOpen, setSiteSettingsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setUser, setIsLoggedIn } = useUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    router.push('/');
  };

  const menuItems = [
    { name: t('admin.dashboard'), href: '/admin', icon: Home },
    { name: t('products'), href: '/admin/products', icon: ShoppingCart },
    { name: t('admin.orders'), href: '/admin/orders', icon: BarChart2 },
    { name: t('admin.payments'), href: '/admin/payments', icon: CreditCard },
    { name: t('admin.users'), href: '/admin/users', icon: Users },
    { name: t('admin.vendors'), href: '/admin/vendors', icon: Users },
    { name: t('admin.categories'), href: '/admin/categories', icon: Settings },
    { name: t('admin.subscriptionPackages'), href: '/admin/subscription-packages', icon: BarChart2 },
    { name: t('deliverys'), href: '/admin/delivery', icon: BarChart2 },
    { name: t('admin.couponsPromotions'), href: '/admin/coupons', icon: CreditCard },
    { name: t('admin.notifications'), href: '/admin/notifications', icon: Bell },
    { name: t('common.reviews'), href: '/admin/reviews', icon: MessageSquare },
    {
      name: t('admin.settings'),
      icon: Settings,
      subItems: [
        { name: t('banners.banners'), href: '/admin/site-settings/banners' },
        { name: t('admin.phoneNumbers'), href: '/admin/site-settings/phone-numbers' },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Floating hamburger menu button for mobile */}
      <button
        type="button"
        className={`fixed top-4 left-4 z-50 bg-white rounded-full shadow-lg p-3 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-theme-main md:hidden${sidebarOpen ? ' hidden' : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Hamburger icon */}
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white">
            <div className="absolute top-0 right-0 pt-2 -mr-12">
              <button
                type="button"
                className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                {/* X icon */}
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 flex-col gap-2 py-4">
                <span className="text-xl font-bold text-gray-900">{t('header.admin')}</span>
                <Link href="/" className="text-theme-main hover:underline flex items-center gap-1" title={t('header.homepage') || 'Go to Main Page'} style={{ color: '#2C2C54' }}>
                  <Home className="w-5 h-5" style={{ color: '#2C2C54' }} />
                  <span className="text-base font-normal" style={{ color: '#2C2C54' }}>{t('header.goToMainPage') || 'Go to Main Page'}</span>
                </Link>
                <div className="mt-2">
                  <LanguageSwitcher />
                </div>
              </div>
              <nav className="px-2 mt-5 space-y-1">
                {menuItems.map((item) => (
                  item.subItems ? (
                    <div key={item.name}>
                      <button
                        type="button"
                        className={`flex items-center w-full px-2 py-2 text-base font-medium rounded-md focus:outline-none ${pathname.startsWith('/admin/site-settings') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        onClick={() => setSiteSettingsOpen((v) => !v)}
                      >
                        <item.icon className="w-6 h-6 mr-4" />
                        {item.name}
                        {siteSettingsOpen ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
                      </button>
                      {siteSettingsOpen && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.subItems.map((sub) => (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${pathname === sub.href ? 'bg-gray-100 text-theme-main' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${pathname === item.href
                          ? 'bg-gray-200 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <item.icon className="w-6 h-6 mr-4" />
                      {item.name}
                    </Link>
                  )
                ))}
              </nav>
            </div>
            <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-2 py-2 text-base font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="w-6 h-6 mr-4" />
                {t('header.logout')}
              </button>
            </div>
          </div>
          <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex items-center justify-center h-24 bg-white border-b flex-col gap-2">
            <span className="text-xl font-bold text-gray-900">{t('header.admin')}</span>
            <Link href="/" className="text-theme-main hover:underline flex items-center gap-1" title={t('header.homepage') || 'Go to Main Page'} style={{ color: '#2C2C54' }}>
              <Home className="w-5 h-5" style={{ color: '#2C2C54' }} />
              <span className="text-base font-normal" style={{ color: '#2C2C54' }}>{t('header.goToMainPage') || 'Go to Main Page'}</span>
            </Link>
            <div className="mt-1">
              <LanguageSwitcher />
            </div>
          </div>
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white">
            <nav className="flex-1 px-2 space-y-1">
              {menuItems.map((item) => (
                item.subItems ? (
                  <div key={item.name}>
                    <button
                      type="button"
                      className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md focus:outline-none ${pathname.startsWith('/admin/site-settings') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                      onClick={() => setSiteSettingsOpen((v) => !v)}
                    >
                      <item.icon className="w-6 h-6 mr-3" />
                      {item.name}
                      {siteSettingsOpen ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
                    </button>
                    {siteSettingsOpen && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${pathname === sub.href ? 'bg-gray-100 text-theme-main' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${pathname === item.href
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className="w-6 h-6 mr-3" />
                    {item.name}
                  </Link>
                )
              ))}
            </nav>
            <div className="px-2 py-4 mt-auto">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="w-6 h-6 mr-3" />
                {t('header.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="relative flex-1 p-4 overflow-y-auto focus:outline-none sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
