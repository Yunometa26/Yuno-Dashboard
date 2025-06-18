'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function ClientFrequencyPanel() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Papa.parse('/lifecycle_weighted_sales_values.csv', {
      header: true,
      download: true,
      complete: (results) => {
        const validData = results.data.filter(row => row.Product && row.Month);
        const productSet = Array.from(new Set(validData.map(row => row.Product)));
        setProducts(['All', ...productSet]);
        setData(validData);
        setFilteredData(validData);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedProduct === 'All') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(row => row.Product === selectedProduct));
    }
  }, [selectedProduct, data]);

  const frequencyByMonth = filteredData.reduce((acc, row) => {
    acc[row.Month] = (acc[row.Month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(frequencyByMonth).map(([month, count]) => ({
    month,
    count
  }));

  return (
    <div className="p-6 text-white bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-xl">
      <h2 className="text-2xl font-bold mb-4">Client Buying Frequency</h2>
      <div className="mb-4">
        <label className="mr-2">Filter by Product:</label>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="text-black p-2 rounded"
        >
          {products.map((prod, idx) => (
            <option key={idx} value={prod}>{prod}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="month" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Bar dataKey="count" fill="#60a5fa" />
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto mt-6 bg-white/10 rounded-xl backdrop-blur-md">
        <table className="min-w-full text-white">
          <thead>
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Month</th>
              <th className="px-4 py-2">Year</th>
              <th className="px-4 py-2">Sales</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i} className="border-t border-white/20">
                <td className="px-4 py-2">{row.Customer}</td>
                <td className="px-4 py-2">{row.Product}</td>
                <td className="px-4 py-2">{row.Month}</td>
                <td className="px-4 py-2">{row.Year}</td>
                <td className="px-4 py-2">{row.Sales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

//try

