'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  Clock,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  getDashboardStats, 
  getSalesByMonth, 
  getCustomerAnalytics,
  getTopSellingProducts,
  getCategoryAnalytics,
  getRevenueAnalytics,
  getProductPerformanceAnalytics
} from '@/services/admin-api';
import SalesChart from '@/views/admin/SalesChart';
import RevenueChart from '@/views/admin/RevenueChart';
import CategoryPieChart from '@/views/admin/CategoryPieChart';
import CustomerRetentionChart from '@/views/admin/CustomerRetentionChart';
import ProductPerformanceChart from '@/views/admin/ProductPerformanceChart';
import StatCard from '@/components/StatCard';
import RealTimeStats from '@/views/admin/RealTimeStats';
import { MotionContainer, MotionItem } from '@/components/Motion';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils';

interface TopProduct {
  product_id: number;
  product_name: string;
  price: number;
  vendor_name: string;
  total_quantity_sold: number;
  total_revenue: number;
  average_rating: number;
}

interface CategoryAnalytic {
  category_id: number;
  category_name: string;
  total_products: number;
  total_revenue: number;
  total_quantity_sold: number;
}



function toNumber(val: unknown) {
  if (val === null || val === undefined) return 0;
  return typeof val === 'number' ? val : Number(val);
}

export default function AdminDashboard() {
  const { t, locale } = useI18n();
  const [currentYear] = useState(new Date().getFullYear());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Verify token is valid by checking if it's a valid JWT
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        // Token expired
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        router.push('/login');
        return;
      }
      
      setIsAuthenticated(true);
    } catch {
      // Invalid token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      router.push('/login');
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: isAuthenticated,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['admin-sales-by-month', currentYear],
    queryFn: () => getSalesByMonth(currentYear),
    enabled: isAuthenticated,
  });

  const { data: customerAnalytics, isLoading: customerLoading } = useQuery({
    queryKey: ['admin-customer-analytics'],
    queryFn: getCustomerAnalytics,
    enabled: isAuthenticated,
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: () => getTopSellingProducts(5, '30'),
    enabled: isAuthenticated,
  });

  const { data: categoryAnalytics, isLoading: categoryLoading } = useQuery({
    queryKey: ['admin-category-analytics'],
    queryFn: getCategoryAnalytics,
    enabled: isAuthenticated,
  });

  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue-analytics'],
    queryFn: () => getRevenueAnalytics(),
    enabled: isAuthenticated,
  });

  const { data: productPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['admin-product-performance'],
    queryFn: getProductPerformanceAnalytics,
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('admin.loading')}</div>
      </div>
    );
  }

  if (statsLoading || salesLoading || customerLoading || productsLoading || categoryLoading || revenueLoading || performanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('admin.loadingDashboard')}</div>
      </div>
    );
  }

  const isRTL = locale === 'ar';

  const stats = dashboardStats
    ? {
        total_revenue: toNumber(dashboardStats.total_revenue),
        total_orders: toNumber(dashboardStats.total_orders),
        total_customers: toNumber(dashboardStats.total_customers),
        total_products: toNumber(dashboardStats.total_products),
        today_revenue: toNumber(dashboardStats.today_revenue),
        today_orders: toNumber(dashboardStats.today_orders),
        month_revenue: toNumber(dashboardStats.month_revenue),
        month_orders: toNumber(dashboardStats.month_orders),
        pending_orders: toNumber(dashboardStats.pending_orders),
        out_of_stock_products: toNumber(dashboardStats.out_of_stock_products),
        average_order_value: toNumber(dashboardStats.average_order_value),
      }
    : {
        total_revenue: 0,
        total_orders: 0,
        total_customers: 0,
        total_products: 0,
        today_revenue: 0,
        today_orders: 0,
        month_revenue: 0,
        month_orders: 0,
        pending_orders: 0,
        out_of_stock_products: 0,
        average_order_value: 0,
      };

  const customerStats = customerAnalytics || {
    total_customers: 0,
    customers_with_orders: 0,
    active_customers_30d: 0,
    active_customers_7d: 0,
    average_customer_spend: 0,
    high_value_customers: 0,
    new_customers_24h: 0,
  };

  return (
    <MotionContainer className="space-y-6">
      {/* Page Header */}
      <MotionItem>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
          <p className="mt-2 text-gray-600">{t('admin.overview')}</p>
        </div>
      </MotionItem>

      {/* Main Stats Grid */}
      <MotionContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MotionItem>
          <StatCard
            title={t('admin.totalRevenue')}
            value={formatPrice(stats.total_revenue || 0, locale)}
            icon={DollarSign}
            color="bg-green-500"
          />
        </MotionItem>
        <MotionItem>
          <StatCard
            title={t('admin.totalOrders')}
            value={stats.total_orders?.toLocaleString() || '0'}
            icon={ShoppingCart}
            color="bg-cyan-500"
          />
        </MotionItem>
        <MotionItem>
          <StatCard
            title={t('admin.totalCustomers')}
            value={stats.total_customers?.toLocaleString() || '0'}
            icon={Users}
            color="bg-purple-500"
          />
        </MotionItem>
        <MotionItem>
          <StatCard
            title={t('admin.totalProducts')}
            value={stats.total_products?.toLocaleString() || '0'}
            icon={Package}
            color="bg-orange-500"
          />
        </MotionItem>
      </MotionContainer>

      {/* Real-time Stats */}
      <MotionItem>
        <RealTimeStats 
          stats={{
            orders_24h: stats.today_orders,
            revenue_24h: stats.today_revenue,
            new_customers_24h: customerStats.new_customers_24h,
            active_customers_7d: customerStats.active_customers_7d
          }}
        />
      </MotionItem>

      {/* Additional Stats */}
      <MotionContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MotionItem>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.todayRevenue')}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPrice(stats.today_revenue || 0, locale)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </MotionItem>

        <MotionItem>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.monthRevenue')}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPrice(stats.month_revenue || 0, locale)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </MotionItem>

        <MotionItem>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.avgOrderValue')}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPrice(stats.average_order_value || 0, locale)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </MotionItem>
      </MotionContainer>

      {/* Customer Analytics */}
      <MotionContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MotionItem>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.activeCustomers30d')}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {customerStats.active_customers_30d?.toLocaleString() || '0'}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </MotionItem>
        <MotionItem>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.highValueCustomers')}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {customerStats.high_value_customers?.toLocaleString() || '0'}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </MotionItem>
        <MotionItem>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.outOfStockProducts')}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.out_of_stock_products?.toLocaleString() || '0'}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </MotionItem>
      </MotionContainer>

      {/* Charts Section */}
      <MotionItem>
        <div className="space-y-6">
          {/* Sales and Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            {salesData && salesData.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <SalesChart salesData={salesData} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                {t('admin.noSalesData')}
              </div>
            )}

            {/* Revenue Chart */}
            {revenueAnalytics && revenueAnalytics.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <RevenueChart revenueData={revenueAnalytics} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                {t('admin.noRevenueData')}
              </div>
            )}
          </div>

          {/* Category and Customer Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            {categoryAnalytics && categoryAnalytics.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <CategoryPieChart categoryData={categoryAnalytics} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                {t('admin.noCategoryData')}
              </div>
            )}

            {/* Customer Retention Chart */}
            {customerStats && customerStats.total_customers > 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <CustomerRetentionChart customerData={customerStats} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                {t('admin.noCustomerData')}
              </div>
            )}
          </div>

          {/* Product Performance Chart */}
          {productPerformance && productPerformance.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <ProductPerformanceChart productData={productPerformance} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              {t('admin.noProductPerformanceData')}
            </div>
          )}
        </div>
      </MotionItem>

      {/* Top Selling Products Table */}
      {topProducts && topProducts.length > 0 && (
        <MotionItem>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.topSellingProducts')}</h3>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y divide-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.quantitySold')}
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.product')}
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.vendor')}
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.revenue')}
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.rating')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProducts.slice(0, 5).map((product: TopProduct) => (
                    <tr key={product.product_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.total_quantity_sold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                        <div className="text-sm text-gray-500">{formatPrice(product.price, locale)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.vendor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(product.total_revenue, locale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof product.average_rating === 'number' ? `${isRTL ? '' : ''}⭐ ${product.average_rating.toFixed(1)}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </MotionItem>
      )}

      {/* Category Performance Grid */}
      {categoryAnalytics && categoryAnalytics.length > 0 && (
        <MotionItem>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.categoryPerformance')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAnalytics.slice(0, 6).map((category: CategoryAnalytic) => (
                <div key={category.category_id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{category.category_name}</h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('admin.productsLabel')}</span>
                      <span className="font-medium">{category.total_products}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('admin.revenueLabel')}</span>
                      <span className="font-medium">{formatPrice(category.total_revenue, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('admin.soldLabel')}</span>
                      <span className="font-medium">{category.total_quantity_sold || '0'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MotionItem>
      )}
    </MotionContainer>
  );
} 