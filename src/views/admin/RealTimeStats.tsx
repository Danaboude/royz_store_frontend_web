'use client';

import StatCard from '@/components/StatCard';
import { Activity, TrendingUp, Users, Star } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils';

interface RealTimeStatsProps {
  stats: {
    orders_24h?: number;
    revenue_24h?: number;
    new_customers_24h?: number;
    active_customers_7d?: number;
  };
}

export default function RealTimeStats({ stats }: RealTimeStatsProps) {
  const { t } = useI18n();

  const realTime = stats || {
    orders_24h: 0,
    revenue_24h: 0,
    new_customers_24h: 0,
    active_customers_7d: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title={t('admin.orders24h')}
        value={realTime.orders_24h?.toLocaleString() || '0'}
        icon={Activity}
        color="bg-blue-500"
        subtitle={t('admin.last24h')}
      />
      <StatCard
        title={t('admin.revenue24h')}
        value={formatPrice(realTime.revenue_24h || 0, 'en')}
        icon={TrendingUp}
        color="bg-green-600"
        subtitle={t('admin.last24h')}
      />
      <StatCard
        title={t('admin.newCustomers24h')}
        value={realTime.new_customers_24h?.toLocaleString() || '0'}
        icon={Users}
        color="bg-purple-600"
        subtitle={t('admin.last24h')}
      />
      <StatCard
        title={t('admin.activeCustomers7d')}
        value={realTime.active_customers_7d?.toLocaleString() || '0'}
        icon={Star}
        color="bg-yellow-500"
        subtitle={t('admin.last7d')}
      />
    </div>
  );
} 