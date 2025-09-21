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
} from 'chart.js';
import { formatPrice } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SalesChartProps {
  salesData: {
    month: string;
    total_revenue: number;
  }[];
}

export default function SalesChart({ salesData }: SalesChartProps) {
  const chartData = {
    labels: salesData.map(d => d.month),
    datasets: [
      {
        label: 'Monthly Revenue',
        data: salesData.map(d => d.total_revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Sales Revenue',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            return formatPrice(value, 'en');
          }
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
} 