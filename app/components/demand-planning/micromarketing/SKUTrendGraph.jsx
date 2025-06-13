'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import rawData from '@/public/sku_trend_data.json'; // Use JSON file

export default function SKUTrendGraph() {
  const [viewMode, setViewMode] = useState('quarterly');
  const [selectedDepot, setSelectedDepot] = useState('All');
  const [selectedSKU, setSelectedSKU] = useState('All');

  const depotOptions = [...new Set(['All', ...rawData.map(row => row.Depot)])];
  const skuOptions = [...new Set(['All', ...rawData.map(row => row["New Code"])])];

  const formattedData = useMemo(() => {
    const filtered = rawData.filter(row =>
      (selectedDepot === 'All' || row.Depot === selectedDepot) &&
      (selectedSKU === 'All' || row["New Code"] === selectedSKU)
    );

    const grouped = {};

    filtered.forEach(row => {
      const quarter = row.Quarter;
      const year = row["Finacial Year"];
      const qty = parseInt(row["Sum of QTY"]) || 0;

      if (!grouped[quarter]) grouped[quarter] = { name: quarter };
      grouped[quarter][year] = (grouped[quarter][year] || 0) + qty;
    });

    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  }, [viewMode, selectedDepot, selectedSKU]);

  const lineColors = {
    '2021-2022': '#8884d8',
    '2022-2023': '#82ca9d',
    '2023-2024': '#ffc658',
    '2024-2025': '#ff7300'
  };

  return (
    <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-xl shadow-md p-6 mt-8 border border-blue-200">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <h2 className="text-white text-lg font-semibold">SKU Trend Graph</h2>
        <div className="flex gap-4 flex-wrap">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="px-2 py-1 rounded-md">
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select value={selectedDepot} onChange={(e) => setSelectedDepot(e.target.value)} className="px-2 py-1 rounded-md">
            {depotOptions.map((depot, i) => (
              <option key={i} value={depot}>{depot}</option>
            ))}
          </select>
          <select value={selectedSKU} onChange={(e) => setSelectedSKU(e.target.value)} className="px-2 py-1 rounded-md">
            {skuOptions.map((sku, i) => (
              <option key={i} value={sku}>{sku}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="white" />
            <YAxis stroke="white" />
            <Tooltip />
            <Legend />
            {['2021-2022', '2022-2023', '2023-2024', '2024-2025'].map(year => (
              <Line
                key={year}
                type="monotone"
                dataKey={year}
                stroke={lineColors[year]}
                name={year}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}