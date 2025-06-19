
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function SKUTrendGraph() {
  const [rawData, setRawData] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState('All');
  const [selectedSKU, setSelectedSKU] = useState('All');

  useEffect(() => {
    Papa.parse('/Dataset - SKU Trend Revised.csv', {
      header: true,
      download: true,
      complete: (results) => {
        const filtered = results.data.filter(
          row => row['Quarter'] && row['Finacial Year'] && row['Sum of QTY']
        );
        setRawData(filtered);
      }
    });
  }, []);

  const depotOptions = useMemo(() => [...new Set(['All', ...rawData.map(row => row.Depot)])], [rawData]);
  const skuOptions = useMemo(() => [...new Set(['All', ...rawData.map(row => row.SKU)])], [rawData]);

  const formattedData = useMemo(() => {
    const filtered = rawData.filter(row =>
      (selectedDepot === 'All' || row.Depot === selectedDepot) &&
      (selectedSKU === 'All' || row.SKU === selectedSKU)
    );

    const grouped = {};
    filtered.forEach(row => {
      const quarter = row.Quarter;
      const year = row['Finacial Year'];
      const qty = parseInt(row['Sum of QTY']) || 0;

      if (!grouped[quarter]) grouped[quarter] = { name: quarter };
      grouped[quarter][year] = (grouped[quarter][year] || 0) + qty;
    });

    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawData, selectedDepot, selectedSKU]);

  const colors = {
    '2022-2023': '#22C55E',
    '2023-2024': '#FFD700',
    '2024-2025': '#000000'
  };

  return (
    <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-xl shadow-md p-6 mt-8 border border-blue-200">
      <h2 className="text-white text-lg font-semibold mb-4">SKU Trend Graph</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <select value={selectedDepot} onChange={e => setSelectedDepot(e.target.value)} className="px-2 py-1 rounded-md">
          <option value="All" disabled>Depot</option>
          {depotOptions.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>
        <select value={selectedSKU} onChange={e => setSelectedSKU(e.target.value)} className="px-2 py-1 rounded-md">
          <option value="All" disabled>SKU</option>
          {skuOptions.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />

            <Legend
              content={() => (
                <ul className="flex gap-4 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm text-white">
                  {Object.keys(colors).filter(year => year !== '2021-2022').map(year => (
                    <li key={year} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-sm inline-block" style={{ backgroundColor: colors[year] }}></span>
                      {year}
                    </li>
                  ))}
                </ul>
              )}
            />

            {Object.keys(colors).filter(year => year !== '2021-2022').map(year => (
              <Line
                key={year}
                type="monotone"
                dataKey={year}
                stroke={colors[year]}
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

//SKU GRAPH CHANGE.