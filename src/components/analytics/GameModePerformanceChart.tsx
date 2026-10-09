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

interface ChartProps {
  chartData: number[];
}

export const GameModePerformanceChart: React.FC<ChartProps> = ({ chartData }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#cbd5e1' }
      },
      title: { display: false },
    },
    scales: {
      y: {
        ticks: { color: '#64748b' },
        grid: { color: '#334155' },
        beginAtZero: true
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false }
      }
    }
  };

  const data = {
    labels: ['Virus ID (01)', 'Boss Battle (02)', 'Matching (03)', 'Outbreak Sim (04)'],
    datasets: [
      {
        label: 'คะแนนเฉลี่ย (EXP)',
        data: chartData,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="w-full h-[300px]">
      <Bar options={options} data={data} />
    </div>
  );
};
