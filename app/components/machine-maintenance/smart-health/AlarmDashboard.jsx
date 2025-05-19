'use client';
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AlarmDashboard = () => {
  const [data, setData] = useState([]);
  const [deviceFilter, setDeviceFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');

  useEffect(() => {
    Papa.parse('/Alarms.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const parsedData = results.data
          .filter(row => row['AlaNum']) // Remove empty rows
          .map(row => ({
            ...row,
            date: row['date'],
            // Format month as YYYY-MM for better sorting and display
            month: row['date'] ? formatMonthDisplay(row['date']) : '',
          }));
        setData(parsedData);
      },
    });
  }, []);

  // Function to format month in a readable way
  const formatMonthDisplay = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Invalid date
      
      // Format as "MMM YYYY" (e.g., "Oct 2023")
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  const deviceOptions = [...new Set(data.map(d => d.Device))];
  const monthOptions = [...new Set(data.map(d => d.month))]
    // Filter out empty values
    .filter(month => month)
    // Sort months chronologically
    .sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

  // Helper function to use for checking date equality for month filtering
  const isSameMonth = (date1, monthDisplay) => {
    if (!date1 || !monthDisplay) return false;
    try {
      const d1 = new Date(date1);
      if (isNaN(d1.getTime())) return false;
      
      const formattedMonth = d1.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return formattedMonth === monthDisplay;
    } catch (error) {
      return false;
    }
  };

  const filteredData = data.filter(d => {
    if (deviceFilter !== 'All' && d.Device !== deviceFilter) return false;
    if (monthFilter === 'All') return true;
    
    // Use proper month comparison
    return isSameMonth(d.date, monthFilter);
  });

  const pieData = Object.entries(
    filteredData.reduce((acc, curr) => {
      acc[curr['Alarm Category']] = (acc[curr['Alarm Category']] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, value]) => ({ name: category, value }));

  const lineData = Object.entries(
    filteredData.reduce((acc, curr) => {
      const date = curr.date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort dates in ascending order

  const barData = Object.entries(
    filteredData.reduce((acc, curr) => {
      acc[curr.Device] = (acc[curr.Device] || 0) + 1;
      return acc;
    }, {})
  ).map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 devices

  // Optimize line chart display for dates
  const formatXAxis = (tickItem) => {
    // Format date to show in a more readable format
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const topCategory = pieData.reduce((max, curr) => curr.value > (max?.value || 0) ? curr : max, null);
  const topDevice = barData[0];

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

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="text-black">{`Device: ${label}`}</p>
          <p className="text-black">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 1. FILTERS SECTION */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Device Filter */}
        <div className="space-y-2">
          <label className="font-semibold text-white">Filter by Device:</label>
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
        {/* Month Filter */}
        <div className="space-y-2">
          <label className="font-semibold text-white">Filter by Month:</label>
          <select
            className="p-2 border rounded text-black bg-white w-40"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="All">All</option>
            {monthOptions.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Three Cards */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">Total Alarms</h3>
            <p className="text-4xl font-extrabold text-white mt-2">{filteredData.length}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">Top Alarm Category</h3>
            <p className="text-2xl text-white mt-2">{topCategory?.name || 'N/A'}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">Top Device</h3>
            <p className="text-2xl text-white mt-2">{topDevice?.device || 'N/A'}</p>
          </div>
        </div>
      </div>
        
      {/* 3. PIE CHART AND BAR CHART ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4">
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
        
        {/* Bar Chart */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-4 text-white">Top Devices by Alarm Count</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
              <XAxis dataKey="device" stroke="#FFFFFF" tick={{ fill: '#FFFFFF' }} />
              <YAxis stroke="#FFFFFF" tick={{ fill: '#FFFFFF' }} />
              <ReTooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. LINE CHART */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-4 text-white">Alarm Trend Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
            <XAxis 
              dataKey="date" 
              stroke="#FFFFFF" 
              tick={{ fill: '#FFFFFF' }} 
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#FFFFFF" tick={{ fill: '#FFFFFF' }} />
            <ReTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#FFFFFF' }} />
            <Line type="monotone" dataKey="count" stroke="#FF8C00" strokeWidth={2} activeDot={{ r: 8, fill: '#FF8C00' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AlarmDashboard;