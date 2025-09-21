'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  revenueData: {
    date: string;
    daily_revenue: number;
    orders_count: number;
  }[];
}

export default function RevenueChart({ revenueData }: RevenueChartProps) {
  const { t } = useI18n();
  
  const chartData = {
    labels: revenueData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: t('admin.dailyRevenue'),
        data: revenueData.map(d => d.daily_revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: t('admin.ordersCount'),
        data: revenueData.map(d => d.orders_count),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: t('admin.dailyRevenueOrdersTrend'),
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('admin.date'),
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: t('admin.revenueDollar'),
        },
        ticks: {
          callback: function(value: string | number) {
            return formatPrice(value, 'en');
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: t('admin.ordersCount'),
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
} 