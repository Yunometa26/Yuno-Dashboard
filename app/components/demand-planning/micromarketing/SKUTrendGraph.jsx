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
    Papa.parse('/Dataset - SKU Trend Revised 1.csv', {
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

  // --- DYNAMIC BIDIRECTIONAL FILTERS FOR DEPOT & SKU ---
  const sortWithAllFirst = arr => {
    if (!arr || arr.length === 0) return arr;
    const allIdx = arr.indexOf('All');
    const sorted = arr.filter(x => x !== 'All').sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return allIdx !== -1 ? ['All', ...sorted] : sorted;
  };

  const depotOptions = useMemo(() => {
    let filtered = rawData;
    if (selectedSKU && selectedSKU !== 'All') {
      filtered = filtered.filter(row => row.SKU === selectedSKU);
    }
    return sortWithAllFirst(['All', ...new Set(filtered.map(row => row.Depot).filter(Boolean))]);
  }, [rawData, selectedSKU]);

  const skuOptions = useMemo(() => {
    let filtered = rawData;
    if (selectedDepot && selectedDepot !== 'All') {
      filtered = filtered.filter(row => row.Depot === selectedDepot);
    }
    return sortWithAllFirst(['All', ...new Set(filtered.map(row => row.SKU).filter(Boolean))]);
  }, [rawData, selectedDepot]);

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
    '2022-2023': '#39FF14', // Neon green
    '2023-2024': '#FFD700', // Gold
    '2024-2025': '#FF0000'  // Red
  };

  return (
    <div className="bg-[#013554] rounded-lg shadow-xl p-6 mt-8 border border-blue-700">
      <h2 className="text-white text-lg font-semibold mb-4">SKU Trend Graph</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <select 
          value={selectedDepot} 
          onChange={e => setSelectedDepot(e.target.value)} 
          className="px-2 py-1 rounded-md bg-[#013554] border border-white border-opacity-20 text-white"
        >
          <option value="All" disabled>Depot</option>
          {depotOptions.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>
        <select 
          value={selectedSKU} 
          onChange={e => setSelectedSKU(e.target.value)} 
          className="px-2 py-1 rounded-md bg-[#013554] border border-white border-opacity-20 text-white"
        >
          <option value="All" disabled>SKU</option>
          {skuOptions.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{ top: 20, right: 40, left: 50, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              stroke="#fff"
              angle={-25}
              textAnchor="end"
              interval={0}
              dy={10}
              height={60}
            />
            <YAxis stroke="#fff" tickMargin={10} />
            <Tooltip />
            <Legend
              content={() => (
                <ul className="flex gap-4 justify-center text-white">
                  {Object.keys(colors).map(year => (
                    <li key={year} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-sm inline-block" style={{ backgroundColor: colors[year] }}></span>
                      {year}
                    </li>
                  ))}
                </ul>
              )}
            />
            {Object.keys(colors).map(year => (
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
