'use client';

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface CategoryPieChartProps {
  categoryData: {
    category_name: string;
    total_revenue: number;
    total_products: number;
  }[];
}

interface TooltipContext {
  label?: string;
  parsed?: number;
  dataset: {
    data: number[];
  };
}

export default function CategoryPieChart({ categoryData }: CategoryPieChartProps) {
  const { t } = useI18n();
  
  // Generate colors for each category
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const chartData = {
    labels: categoryData.map(cat => cat.category_name),
    datasets: [
      {
        data: categoryData.map(cat => cat.total_revenue),
        backgroundColor: colors.slice(0, categoryData.length),
        borderColor: colors.slice(0, categoryData.length).map(color => color + '80'),
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
        text: t('admin.revenueByCategory'),
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipContext) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatPrice(value, 'en')} (${percentage}%)`;
          }
        }
      }
    },
  };

  return <Pie data={chartData} options={options} />;
} 