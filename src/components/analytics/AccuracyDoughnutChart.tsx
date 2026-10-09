"use client";

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartProps {
  accuracy: number;
}

export const AccuracyDoughnutChart: React.FC<ChartProps> = ({ accuracy }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cbd5e1',
          padding: 20
        }
      },
    },
  };

  const data = {
    labels: ['ตอบถูก', 'ตอบผิด'],
    datasets: [
      {
        data: [accuracy, 100 - accuracy],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Secondary (Green)
          'rgba(239, 68, 68, 0.8)',  // Danger (Red)
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="relative flex items-center justify-center w-full h-[250px]">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
        <span className="text-3xl font-black text-white">{accuracy}%</span>
        <span className="text-xs text-slate-400 font-mono">ACCURACY</span>
      </div>
    </div>
  );
};
