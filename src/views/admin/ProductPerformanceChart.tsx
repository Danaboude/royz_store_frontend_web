'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  TooltipModel,
} from 'chart.js';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductPerformanceChartProps {
  productData: {
    product_name: string;
    total_revenue: number;
    total_quantity_sold: number;
    average_rating: number;
  }[];
}

export default function ProductPerformanceChart({ productData }: ProductPerformanceChartProps) {
  const { t } = useI18n();
  
  // Sort by revenue and take top 10
  const topProducts = productData
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10);

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: t('admin.topProductsByRevenue'),
      },
      tooltip: {
        callbacks: {
          label: function(this: TooltipModel<'bar'>, tooltipItem: TooltipItem<'bar'>) {
            let label = tooltipItem.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (tooltipItem.parsed.x !== null) {
              if (tooltipItem.dataset.label?.includes(t('admin.revenue'))) {
                label += formatPrice(tooltipItem.parsed.x, 'en');
              } else {
                label += `${tooltipItem.parsed.x} ${t('admin.quantitySoldUnits').toLowerCase()}`;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: t('admin.products'),
        },
      },
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: t('admin.revenueDollar'),
        },
      },
      x1: {
        type: 'linear' as const,
        position: 'top' as const,
        title: {
          display: true,
          text: t('admin.quantitySoldUnits'),
        },
        grid: {
          drawOnChartArea: false, // only draw grid lines for the first x-axis
        },
      },
    },
  };

  const chartData = {
    labels: topProducts.map(p => p.product_name.length > 20 ? p.product_name.substring(0, 20) + '...' : p.product_name),
    datasets: [
      {
        label: t('admin.revenueDollar'),
        data: topProducts.map(p => p.total_revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        xAxisID: 'x',
      },
      {
        label: t('admin.quantitySoldUnits'),
        data: topProducts.map(p => p.total_quantity_sold),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        xAxisID: 'x1',
      },
    ],
  };

  return <Bar data={chartData} options={options} />;
} 