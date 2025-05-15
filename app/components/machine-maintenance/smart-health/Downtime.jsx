import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProductionDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedDevice, setSelectedDevice] = useState('All');

  useEffect(() => {
    Papa.parse('/Downtime.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const parsedData = results.data.map(row => {
          // Parse date in DD-MM-YYYY format
          const dateParts = row.Dates.split('-');
          // Create date as DD-MM-YYYY (note: month is 0-indexed in JavaScript Date)
          const parsedDate = new Date(
            parseInt(dateParts[2]), // year
            parseInt(dateParts[1]) - 1, // month (0-indexed)
            parseInt(dateParts[0]) // day
          );
          
          return {
            ...row,
            Dates: parsedDate,
            FinalDowntime: Number(row['Final downtime']),
            Device: row.Device,
          };
        });
        
        setData(parsedData);
        setFilteredData(parsedData);
      },
    });
  }, []);

  // Get unique months and devices
  const months = Array.from(new Set(data.map(d => d.Dates.toLocaleString('default', { month: 'long', year: 'numeric' }))));
  const devices = Array.from(new Set(data.map(d => d.Device)));

  // Filter logic
  useEffect(() => {
    let newData = [...data];
    if (selectedMonth !== 'All') {
      newData = newData.filter(d => d.Dates.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth);
    }
    if (selectedDevice !== 'All') {
      newData = newData.filter(d => d.Device === selectedDevice);
    }
    setFilteredData(newData);
  }, [selectedMonth, selectedDevice, data]);

  // Group by Month for chart
  const downtimeByMonth = filteredData.reduce((acc, curr) => {
    const month = curr.Dates.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += curr.FinalDowntime;
    return acc;
  }, {});

  const chartData = Object.entries(downtimeByMonth).map(([month, downtime]) => ({
    month,
    downtime,
  }));

  return (
    <div className="p-6 bg-gradient-to-r from-[#024673] to-[#5C99E3]rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-white">Production Dashboard</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)} 
          className="border border-blue-300 px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
        >
          <option value="All">All Months</option>
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>

        <select 
          value={selectedDevice} 
          onChange={(e) => setSelectedDevice(e.target.value)} 
          className="border border-blue-300 px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
        >
          <option value="All">All Devices</option>
          {devices.map(device => (
            <option key={device} value={device}>{device}</option>
          ))}
        </select>
      </div>

      {/* Bar Chart */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-lg shadow-lg border border-blue-100">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fill: '#ffffff' }} />
            <YAxis tick={{ fill: '#ffffff' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                color: '#1e3a8a'
              }} 
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Bar dataKey="downtime" fill="#ff8c00" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductionDashboard;