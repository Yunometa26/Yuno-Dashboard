'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  BarChart, Bar, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const InventoryDashboard = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    itemId: '',
    month: '',
    day: '',
  });

  useEffect(() => {
    Papa.parse('/store.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const parsed = results.data
          .filter(row => row.Date && row['Opening Stock']) // basic validation
          .map((row) => ({
            ...row,
            date: dayjs(row.Date, 'DD-MM-YYYY'),
            openingStock: parseFloat(row['Opening Stock']),
            closingStock: parseFloat(row['Closing Stock']),
            consumption: parseFloat(row.Consumption),
            msl: parseFloat(row.MSL),
          }));
        setData(parsed);
        setFiltered(parsed);
      },
    });
  }, []);

  useEffect(() => {
    let temp = data;

    if (filters.category) temp = temp.filter(d => d.Category === filters.category);
    if (filters.itemId) temp = temp.filter(d => d['Item ID'] === filters.itemId);
    if (filters.month) temp = temp.filter(d => d.date.format('MM') === filters.month);
    if (filters.day) temp = temp.filter(d => d.date.format('DD') === filters.day);

    setFiltered(temp);
  }, [filters, data]);

  const inventoryTurnover = (() => {
    const totalConsumption = filtered.reduce((sum, d) => sum + d.consumption, 0);
    const avgInventory = filtered.length === 0 ? 0 :
      filtered.reduce((sum, d) => sum + (d.openingStock + d.closingStock) / 2, 0) / filtered.length;
    return avgInventory ? (totalConsumption / avgInventory).toFixed(2) : '0';
  })();

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const unique = (key) => [...new Set(data.map((d) => d[key]))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] text-white p-6 space-y-6">
      {/* Header */}
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              {/* Left side with text content */}
              <div className="flex-1 space-y-5 align-middle text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  <span className="text-white">Store Inventory Dashboard</span>
                </h2>
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] border rounded-xl mt-5 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Category</label>
            <select 
              name="category" 
              onChange={handleFilterChange} 
              className="w-full bg-white border text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {unique('Category').map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Item ID</label>
            <select 
              name="itemId" 
              onChange={handleFilterChange} 
              className="w-full bg-white text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Item IDs</option>
              {unique('Item ID').map((id, idx) => (
                <option key={idx} value={id}>{id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Month</label>
            <select 
              name="month" 
              onChange={handleFilterChange} 
              className="w-full bg-white text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Months</option>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={String(i + 1).padStart(2, '0')}>
                  {dayjs().month(i).format('MMMM')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Day</label>
            <select 
              name="day" 
              onChange={handleFilterChange} 
              className="w-full bg-white text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Days</option>
              {[...Array(31)].map((_, i) => (
                <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Turnover Card */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Inventory Turnover</h2>
            <p className="text-4xl font-bold text-[#F57C00]">{inventoryTurnover}</p>
          </div>
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Line Graph */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Average Closing Stock & MSL by Day</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={Object.values(filtered.filter(d => d.date.isValid()).reduce((acc, row) => {
                const day = row.date.format('DD-MM-YYYY');
                if (!acc[day]) acc[day] = { day, closing: [], msl: [] };
                acc[day].closing.push(row.closingStock);
                acc[day].msl.push(row.msl);
                return acc;
              }, {})).map(d => ({
                day: d.day,
                avgClosing: d.closing.reduce((a, b) => a + b, 0) / d.closing.length,
                avgMSL: d.msl.reduce((a, b) => a + b, 0) / d.msl.length,
              }))}
            >
              <XAxis 
                dataKey="day" 
                tick={{ fill: '#ffffff', fontSize: 12 }}
                axisLine={{ stroke: '#ffffff', strokeOpacity: 0.3 }}
                tickLine={{ stroke: '#ffffff', strokeOpacity: 0.3 }}
              />
              <YAxis 
                tick={{ fill: '#ffffff', fontSize: 12 }}
                axisLine={{ stroke: '#ffffff', strokeOpacity: 0.3 }}
                tickLine={{ stroke: '#ffffff', strokeOpacity: 0.3 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(2, 70, 115, 0.95)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend wrapperStyle={{ color: '#ffffff' }} />
              <Line type="monotone" dataKey="avgClosing" stroke="#F57C00" strokeWidth={3} name="Avg Closing" />
              <Line type="monotone" dataKey="avgMSL" stroke="#ffffff" strokeWidth={3} name="Avg MSL" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Category-wise Item Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(filtered.filter(d => d.date.isValid()).reduce((acc, row) => {
                    acc[row.Category] = (acc[row.Category] || 0) + 1;
                    return acc;
                  }, {})).map(([key, value]) => ({ name: key, value }))}
                  cx="50%" cy="50%" outerRadius={100}
                  label={{ fill: '#ffffff', fontSize: 12 }}
                  dataKey="value"
                >
                  {COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                </Pie>
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Graph */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Consumption</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.values(filtered.filter(d => d.date.isValid()).reduce((acc, row) => {
                  const day = row.date.format('DD-MM-YYYY');
                  acc[day] = acc[day] || { day, consumption: 0 };
                  acc[day].consumption += row.consumption;
                  return acc;
                }, {}))}
              >
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: '#ffffff', fontSize: 12 }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                />
                <YAxis 
                  tick={{ fill: '#ffffff', fontSize: 12 }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(2, 70, 115, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="consumption" fill="#F57C00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
          <button 
            onClick={() => window.location.href = '/inventory-position'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Inventory position
          </button>
        </div>
        
    </div>
  );
};

export default InventoryDashboard;