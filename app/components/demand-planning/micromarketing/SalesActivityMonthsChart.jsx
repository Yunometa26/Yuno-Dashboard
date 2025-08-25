'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Custom Tooltip to round AvgMonthsBought
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const roundedAvg = payload[0].payload.AvgMonthsBought !== undefined ? Math.round(payload[0].payload.AvgMonthsBought) : '';
    return (
      <div className="bg-[#013554] p-2 rounded shadow text-white border border-blue-700">
        <div><strong>Year:</strong> {label}</div>
        <div><strong>Avg. Months Bought:</strong> {roundedAvg}</div>
      </div>
    );
  }
  return null;
};

const SalesActivityMonthsChart = ({
  salesActivityData = [],
  className = '',
  axisStroke = '#fff',
  labelColor = '#fff',
}) => {
  const chartData = useMemo(() => {
    if (!salesActivityData || salesActivityData.length === 0) return [];
    return salesActivityData;
  }, [salesActivityData]);

  if (!chartData || chartData.length === 0) {
    return <div className="text-white">No data available.</div>;
  }

  // Color logic for grouped ranges
  const getBarColor = (val) => {
    if (val === 0) return '#d1d5db'; // gray for 0
    if ([1, 2, 3].includes(val)) return '#ef4444'; // red
    if ([4, 5, 6].includes(val)) return '#facc15'; // yellow
    if ([7, 8, 9].includes(val)) return '#4ade80'; // light green
    if ([10, 11, 12].includes(val)) return '#22C55E'; // dark green
    return '#d1d5db'; // fallback gray
  };

  return (
    <div className={`bg-[#013554] p-4 rounded-lg border border-blue-700 shadow-xl ${className}`}>
      <h2 className="font-semibold text-white mb-4">Sales Activity</h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="FinancialYear" stroke={axisStroke} />
          <YAxis stroke={axisStroke} domain={[0, 12]} ticks={[0, 3, 6, 9, 12]} label={{ value: 'Avg. Months Bought', angle: -90, position: 'insideLeft', fill: labelColor }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="AvgMonthsBought"
            name="Avg. Months Bought"
            radius={[4, 4, 0, 0]}
            animationDuration={1200}
            animationEasing="ease-in-out"
          >
            {chartData.map((entry, idx) => {
              const val = typeof entry.AvgMonthsBought === 'number' && !isNaN(entry.AvgMonthsBought) ? Math.round(entry.AvgMonthsBought) : 0;
              const fill = getBarColor(val);
              console.log('Bar', idx, 'AvgMonthsBought:', entry.AvgMonthsBought, 'Rounded:', val, 'Color:', fill);
              return <Cell key={`cell-${idx}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-white justify-center items-center">
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-none" style={{ background: '#ef4444', display: 'inline-block' }}></span> 1–3 months</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-none" style={{ background: '#facc15', display: 'inline-block' }}></span> 4–6 months</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-none" style={{ background: '#4ade80', display: 'inline-block' }}></span> 7–9 months</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-none" style={{ background: '#22C55E', display: 'inline-block' }}></span> 10–12 months</div>
      </div>
      <div className="mt-2 text-sm text-white">Y-axis: Average number of months each product was bought in that year (for selected customer)</div>
    </div>
  );
};

export default SalesActivityMonthsChart;
