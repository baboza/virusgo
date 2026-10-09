"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChapterData {
  chapter: number;
  title: string;
  count: number;
}

interface ChartProps {
  data: ChapterData[];
}

export const ChapterMasteryChart: React.FC<ChartProps> = ({ data }) => {
  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (items: any) => {
            const idx = items[0]?.dataIndex;
            return `บทที่ ${data[idx]?.chapter}: ${data[idx]?.title}`;
          },
          label: (item: any) => `จำนวนข้อสอบ/เนื้อหา: ${item.raw} ข้อ`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(51, 65, 85, 0.4)' },
        beginAtZero: true,
      },
      y: {
        ticks: { 
          color: '#cbd5e1',
          font: { size: 11 }
        },
        grid: { display: false },
      },
    },
  };

  const chartConfig = {
    labels: data.map((d) => `Ch.${d.chapter} ${d.title.length > 18 ? d.title.slice(0, 18) + '...' : d.title}`),
    datasets: [
      {
        label: 'จำนวนข้อสอบ/กรณีศึกษา',
        data: data.map((d) => d.count),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(52, 211, 153, 0.9)',
      },
    ],
  };

  return (
    <div className="w-full h-[320px]">
      <Bar options={options} data={chartConfig} />
    </div>
  );
};
