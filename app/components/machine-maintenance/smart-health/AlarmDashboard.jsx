'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AlarmDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [deviceFilter, setDeviceFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the data once
  useEffect(() => {
    setIsLoading(true);
    Papa.parse('/Alarms.csv', {
      download: true,
      header: true,
      dynamicTyping: true, // Automatically convert numeric values
      skipEmptyLines: true, // Skip empty rows automatically
      complete: (results) => {
        // Pre-process data once during initial load
        const processedData = results.data
          .filter(row => row.AlaNum) // Remove empty rows
          .map(row => {
            // Parse date once and store formatted values
            const dateObj = row.date ? new Date(row.date) : null;
            const isValidDate = dateObj && !isNaN(dateObj.getTime());
            
            return {
              ...row,
              dateObj: isValidDate ? dateObj : null, // Store the actual date object
              monthDisplay: isValidDate ? 
                dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
              shortDate: isValidDate ? 
                dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
            };
          });
        setRawData(processedData);
        setIsLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setError("Failed to load alarm data");
        setIsLoading(false);
      }
    });
  }, []);

  // Memoize device options to avoid recalculation on every render
  const deviceOptions = useMemo(() => {
    return [...new Set(rawData.map(d => d.Device))];
  }, [rawData]);

  // Memoize month options to avoid recalculation on every render
  const monthOptions = useMemo(() => {
    return [...new Set(rawData.map(d => d.monthDisplay))]
      .filter(Boolean)
      .sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });
  }, [rawData]);

  // Memoize filtered data to avoid recalculation unless dependencies change
  const filteredData = useMemo(() => {
    return rawData.filter(d => {
      if (deviceFilter !== 'All' && d.Device !== deviceFilter) return false;
      if (monthFilter === 'All') return true;
      return d.monthDisplay === monthFilter;
    });
  }, [rawData, deviceFilter, monthFilter]);

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    // Pie chart data
    const pieData = Object.entries(
      filteredData.reduce((acc, curr) => {
        const category = curr['Alarm Category'] || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    ).map(([category, value]) => ({ name: category, value }));

    // Line chart data
    const dateCountMap = filteredData.reduce((acc, curr) => {
      if (curr.date) {
        acc[curr.date] = (acc[curr.date] || 0) + 1;
      }
      return acc;
    }, {});
    
    const lineData = Object.entries(dateCountMap)
      .map(([date, count]) => ({ 
        date, 
        count,
        shortDate: filteredData.find(d => d.date === date)?.shortDate || date
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Bar chart data
    const barData = Object.entries(
      filteredData.reduce((acc, curr) => {
        const device = curr.Device || 'Unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 devices

    // Summary stats
    const topCategory = pieData.length > 0 ? 
      pieData.reduce((max, curr) => curr.value > max.value ? curr : max, pieData[0]) : 
      null;
    
    const topDevice = barData.length > 0 ? barData[0] : null;

    return { pieData, lineData, barData, topCategory, topDevice };
  }, [filteredData]);

  // Extract chart data for easier access
  const { pieData, lineData, barData, topCategory, topDevice } = chartData;

  // Memoize tooltip components to prevent unnecessary re-creation
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow text-black">
          <p>{`Date: ${item.shortDate || label}`}</p>
          <p>{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  }, []);

  const CustomBarTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="text-black">{`Device: ${label}`}</p>
          <p className="text-black">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          <p className="mt-2">Loading alarm data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center bg-red-600 p-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            className="mt-2 bg-white text-red-600 px-3 py-1 rounded" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
              dataKey="shortDate" 
              stroke="#FFFFFF" 
              tick={{ fill: '#FFFFFF' }} 
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