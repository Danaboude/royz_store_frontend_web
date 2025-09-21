'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useI18n } from '@/contexts/I18nContext';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface CustomerRetentionChartProps {
  customerData: {
    total_customers: number;
    customers_with_orders: number;
    active_customers_30d: number;
    high_value_customers: number;
  };
}

export default function CustomerRetentionChart({ customerData }: CustomerRetentionChartProps) {
  const { t } = useI18n();
  
  const inactiveCustomers = customerData.total_customers - customerData.customers_with_orders;
  const regularCustomers = customerData.customers_with_orders - customerData.active_customers_30d - customerData.high_value_customers;

  const chartData = {
    labels: [
      t('admin.highValueCustomers'), 
      t('admin.activeCustomers30d'), 
      t('admin.regularCustomers'), 
      t('admin.inactiveCustomers')
    ],
    datasets: [
      {
        data: [
          customerData.high_value_customers,
          customerData.active_customers_30d,
          regularCustomers,
          inactiveCustomers
        ],
        backgroundColor: [
          '#10B981', // Green for high value
          '#3B82F6', // Blue for active
          '#F59E0B', // Yellow for regular
          '#EF4444', // Red for inactive
        ],
        borderColor: [
          '#059669',
          '#2563EB',
          '#D97706',
          '#DC2626',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: t('admin.customerDistribution'),
      },
      tooltip: {
        callbacks: {
          label: function(context: { label: string; parsed: number; dataset: { data: number[] } }) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return <Doughnut data={chartData} options={options} />;
} 