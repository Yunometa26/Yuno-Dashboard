'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const BuyingFrequencyDropdownChart = () => {
  const [rawData, setRawData] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetch('/buying_frequency.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').filter(Boolean);
        const rows = lines.slice(1).map(line => {
          const [Customer, FinancialYear, ActiveMonths] = line.split(',');
          return {
            Customer,
            FinancialYear,
            ActiveMonths: parseInt(ActiveMonths, 10)
          };
        });

        setRawData(rows);
        const uniqueCustomers = [...new Set(rows.map(r => r.Customer))];
        setCustomers(uniqueCustomers);
        setSelectedCustomer(uniqueCustomers[0]);
      });
  }, []);

  const filteredData = rawData.filter(row => row.Customer === selectedCustomer);

  const getColor = (months) => {
    if (months >= 12) return '#22C55E';       // Excellent
    if (months >= 9) return '#4ade80';        // Good
    if (months >= 5) return '#facc15';        // Average
    return '#f87171';                         // Poor
  };

  return (
    <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-xl shadow-md p-6 mt-8 mb-8 border border-blue-200">
      <h2 className="text-white text-lg font-semibold mb-4">Buying Frequency by Year</h2>
      <div className="mb-4">
        <label className="text-white mr-2">Select Customer:</label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="px-2 py-1 rounded-md"
        >
          {customers.map((c, idx) => (
            <option key={idx} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="FinancialYear" stroke="#fff" />
          <YAxis stroke="#fff" domain={[0, 12]} ticks={[0, 3, 6, 9, 12]} />
          <Tooltip />
          <Bar dataKey="ActiveMonths" name="Active Months">
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.ActiveMonths)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-white">
        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-[#22C55E] rounded-full"></span> Excellent (12 months)</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-[#4ade80] rounded-full"></span> Good (9–11 months)</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-[#facc15] rounded-full"></span> Average (5–8 months)</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-[#f87171] rounded-full"></span> Poor (1–4 months)</div>
      </div>
    </div>
  );
};

export default BuyingFrequencyDropdownChart;
//New buying Frequency Chart Code