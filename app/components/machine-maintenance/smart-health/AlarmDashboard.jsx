// components/AlarmDashboard.jsx
'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AlarmDashboard = () => {
  const [data, setData] = useState([]);
  const [deviceFilter, setDeviceFilter] = useState('All');

  useEffect(() => {
    Papa.parse('/Alarms.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const parsedData = results.data.filter(row => row['AlaNum']); // Clean empty rows
        setData(parsedData);
      },
    });
  }, []);

  const filteredData = deviceFilter === 'All'
    ? data
    : data.filter(d => d.Device === deviceFilter);

  const deviceOptions = [...new Set(data.map(d => d.Device))];

  const pieData = Object.entries(
    filteredData.reduce((acc, curr) => {
      acc[curr['Alarm Category']] = (acc[curr['Alarm Category']] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ name: category, value: count }));

  const lineData = Object.entries(
    filteredData.reduce((acc, curr) => {
      const date = curr.date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {})
  ).map(([date, count]) => ({ date, count }));

  // Custom tooltip style
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow text-black">
          <p>{`Date: ${label}`}</p>
          <p>{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Component 1: Device Filter */}
      <div className="space-y-2">
        <label className="font-semibold">Filter by Device:</label>
        <select
          className="p-2 border rounded text-black bg-white"
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
        >
          <option value="All">All</option>
          {deviceOptions.map(device => (
            <option key={device} value={device}>{device}</option>
          ))}
        </select>
      </div>

      {/* Component 2: Pie Chart + Card */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-4 text-white">Alarms by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">Total Alarms</h3>
            <p className="text-4xl font-extrabold text-white mt-2">
              {filteredData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Component 3: Line Chart */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-4 text-white">Alarm Trend Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
            <XAxis 
              dataKey="date" 
              stroke="#FFFFFF" 
              tick={{ fill: '#FFFFFF' }} 
            />
            <YAxis 
              stroke="#FFFFFF" 
              tick={{ fill: '#FFFFFF' }} 
            />
            <ReTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#FFFFFF' }} />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#FF8C00" // Orange color
              strokeWidth={2}
              activeDot={{ r: 8, fill: '#FF8C00' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AlarmDashboard;