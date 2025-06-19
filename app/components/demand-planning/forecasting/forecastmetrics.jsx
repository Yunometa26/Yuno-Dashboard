'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function DemandForecasting() {
  const [rawData, setRawData] = useState([]);
  const [filters, setFilters] = useState({
    product: 'All',
    sku: 'All',
    depot: 'All',
    month: 'All',
  });

  useEffect(() => {
    fetch('/Dashboard-Forecasting_output.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: (results) => {
            const data = results.data.filter(row => row.Forecast && !isNaN(parseInt(row.Forecast)));
            setRawData(data);
          }
        });
      });
  }, []);

  const latestForecast = useMemo(() => {
    const sorted = [...rawData].sort((a, b) => new Date(b.Month) - new Date(a.Month));
    return sorted.length ? parseInt(sorted[0].Forecast) : 0;
  }, [rawData]);

  const averageAccuracy = 80.07;

  const filteredData = useMemo(() => {
    return rawData.filter(row =>
      (filters.product === 'All' || row["Product Category"] === filters.product) &&
      (filters.sku === 'All' || row.SKU === filters.sku) &&
      (filters.depot === 'All' || row.Depot === filters.depot) &&
      (filters.month === 'All' || row.Month === filters.month)
    );
  }, [rawData, filters]);

  const productOptions = [...new Set(['All', ...rawData.map(row => row["Product Category"])])];
  const skuOptions = [...new Set(['All', ...rawData.map(row => row.SKU)])];
  const depotOptions = [...new Set(['All', ...rawData.map(row => row.Depot)])];
  const monthOptions = [...new Set(['All', ...rawData.map(row => row.Month)])];

  return (
    <div className="p-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/20 shadow-md text-white">
      <div className="flex flex-wrap gap-4 mb-6">
        <select className="bg-white/8 text-white px-2 py-1 rounded-md" value={filters.product} onChange={e => setFilters(prev => ({ ...prev, product: e.target.value }))}>
          {productOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
        <select className="bg-white/8 text-white px-2 py-1 rounded-md" value={filters.sku} onChange={e => setFilters(prev => ({ ...prev, sku: e.target.value }))}>
          {skuOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
        <select className="bg-white/8 text-white px-2 py-1 rounded-md" value={filters.depot} onChange={e => setFilters(prev => ({ ...prev, depot: e.target.value }))}>
          {depotOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
        <select className="bg-white/8 text-white px-2 py-1 rounded-md" value={filters.month} onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}>
          {monthOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="backdrop-blur-md bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-sm text-white/80">Latest Forecast</h3>
          <p className="text-2xl font-bold text-white">{latestForecast.toLocaleString()}</p>
        </div>
        <div className="backdrop-blur-md bg-white/5 p-4 rounded-lg border border-white/10">
          <h3 className="text-sm text-white/80">Average Accuracy</h3>
          <p className="text-2xl font-bold text-white">{averageAccuracy}%</p>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[400px] rounded-lg backdrop-blur-md bg-white/5 border border-white/10">
        <table className="min-w-full text-sm text-white">
          <thead className="text-left border-b border-white/20">
            <tr>
              <th className="p-2">Month</th>
              <th className="p-2">Depot</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Product</th>
              <th className="p-2">Forecast</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="border-b border-white/10">
                <td className="p-2">{row.Month}</td>
                <td className="p-2">{row.Depot}</td>
                <td className="p-2">{row.SKU}</td>
                <td className="p-2">{row["Product Category"]}</td>
                <td className="p-2">{row.Forecast}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}




