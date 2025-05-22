"use client";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const EnergyDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");

  useEffect(() => {
    Papa.parse("/Energy1.csv", {
      download: true,
      header: true,
      complete: (result) => {
        const parsed = result.data
          .filter((row) => row.date && row["Actual Production"])
          .map((row) => {
            const avgEnergy = parseFloat(row["Average Energy per good part"]);
            const carbon = parseFloat(row["Carbon emission(0.716 g ofCO2/kWh)"]);
            return {
              ...row,
              date: new Date(row.date),
              ActualProduction: parseFloat(row["Actual Production"]) || 0,
              EnergyConsumption: parseFloat(row["Energy consumption"]) || 0,
              AvgEnergy: isNaN(avgEnergy) ? 0 : avgEnergy,
              Carbon: isNaN(carbon) ? 0 : carbon,
              Device: row.Device || "Unknown",
              // Format month like in AlarmDashboard
              month: row.date ? formatMonthDisplay(row.date) : '',
            };
          });
        setData(parsed);
      },
    });
  }, []);

  // Function to format month in a readable way (copied from AlarmDashboard)
  const formatMonthDisplay = (dateString) => {
    try {
      if (dateString instanceof Date) {
        // Format as "MMM YYYY" (e.g., "Oct 2023")
        return dateString.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Invalid date
      
      // Format as "MMM YYYY" (e.g., "Oct 2023")
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    let filtered = [...data];
    if (selectedMachine !== "All") {
      filtered = filtered.filter((d) => d.Device === selectedMachine);
    }
    if (selectedMonth !== "All") {
      filtered = filtered.filter((d) => {
        const monthStr = d.date instanceof Date 
          ? formatMonthDisplay(d.date)
          : '';
        return monthStr === selectedMonth;
      });
    }
    setFilteredData(filtered);
  }, [data, selectedMachine, selectedMonth]);

  const totalEnergy = filteredData.reduce((sum, d) => sum + d.EnergyConsumption, 0).toFixed(2);
  const avgEnergyPerPart = (
    filteredData.reduce((sum, d) => sum + d.AvgEnergy, 0) / (filteredData.length || 1)
  ).toFixed(3);
  const totalCarbon = filteredData.reduce((sum, d) => sum + d.Carbon, 0).toFixed(2);
  
  // Find most efficient device
  const mostEfficient = [...filteredData]
    .sort((a, b) => a.AvgEnergy - b.AvgEnergy)
    .filter(d => d.AvgEnergy > 0)[0]?.Device || "N/A";

  const uniqueDevices = [...new Set(data.map((d) => d.Device))];
  const uniqueMonths = [...new Set(data
    .filter(d => d.date instanceof Date)
    .map(d => formatMonthDisplay(d.date)))]
    .filter(month => month)
    .sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

  // Aggregated data for BarChart
  const aggregatedByDevice = Object.values(
    filteredData.reduce((acc, item) => {
      if (!acc[item.Device]) {
        acc[item.Device] = {
          Device: item.Device,
          EnergyConsumption: 0,
          Carbon: 0,
        };
      }
      acc[item.Device].EnergyConsumption += item.EnergyConsumption;
      acc[item.Device].Carbon += item.Carbon;
      return acc;
    }, {})
  );

  // Daily data for line chart
  const dailyDataMap = new Map();
  filteredData.forEach((item) => {
    const day = item.date instanceof Date ? item.date.toISOString().split("T")[0] : ''; // yyyy-mm-dd
    if (!day) return;
    
    if (!dailyDataMap.has(day)) {
      dailyDataMap.set(day, { date: day, EnergyConsumption: 0, ActualProduction: 0 });
    }
    const dayEntry = dailyDataMap.get(day);
    dayEntry.EnergyConsumption += item.EnergyConsumption;
    dayEntry.ActualProduction += item.ActualProduction;
  });
  const dailyData = Array.from(dailyDataMap.values())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Energy distribution by device for pie chart
  const pieData = Object.entries(
    filteredData.reduce((acc, curr) => {
      acc[curr.Device] = (acc[curr.Device] || 0) + curr.EnergyConsumption;
      return acc;
    }, {})
  ).map(([device, value]) => ({ name: device, value: parseFloat(value.toFixed(2)) }));

  // Custom tooltips like in AlarmDashboard
  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow text-black">
          <p>{`Date: ${label}`}</p>
          <p>{`Energy: ${payload[0].value.toFixed(2)} kWh`}</p>
          <p>{`Production: ${payload[1].value} units`}</p>
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
          <p className="text-black">{`Energy: ${payload[0].value.toFixed(2)} kWh`}</p>
          <p className="text-black">{`Carbon: ${payload[1].value.toFixed(2)} kg CO₂`}</p>
        </div>
      );
    }
    return null;
  };

  // Format date for x-axis
  const formatXAxis = (tickItem) => {
    // Format date to show in a more readable format
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* 1. FILTERS SECTION */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Device Filter */}
        <div className="space-y-2">
          <label className="font-semibold text-white">Filter by Machine:</label>
          <select
            className="p-2 border rounded text-black bg-white"
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
          >
            <option value="All">All Machines</option>
            {uniqueDevices.map((dev, i) => (
              <option key={i} value={dev}>{dev}</option>
            ))}
          </select>
        </div>
        {/* Month Filter */}
        <div className="space-y-2">
          <label className="font-semibold text-white">Filter by Month:</label>
          <select
            className="p-2 border rounded text-black bg-white w-40"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="All">All Months</option>
            {uniqueMonths.map((month, i) => (
              <option key={i} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-md font-bold text-white">Total Energy</h3>
            <p className="text-xl font-extrabold text-white mt-2">{totalEnergy} kWh</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-md font-bold text-white">Avg Energy / Unit</h3>
            <p className="text-xl font-extrabold text-white mt-2">{avgEnergyPerPart} kWh</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-md font-bold text-white">Carbon Emission</h3>
            <p className="text-xl font-extrabold text-white mt-2">{totalCarbon} kg</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-md font-bold text-white">Most Efficient</h3>
            <p className="text-xl font-extrabold text-white mt-2">{mostEfficient}</p>
          </div>
        </div>
      </div>

      {/* 3. PIE CHART AND BAR CHART ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-4 text-white">Energy Distribution by Device</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
          <h2 className="text-lg font-semibold mb-4 text-white">Energy & Carbon by Device</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregatedByDevice}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
              <XAxis dataKey="Device" stroke="#FFFFFF" tick={{ fill: '#FFFFFF' }} />
              <YAxis stroke="#FFFFFF" tick={{ fill: '#FFFFFF' }} />
              <ReTooltip content={<CustomBarTooltip />} />
              <Legend wrapperStyle={{ color: '#FFFFFF' }} />
              <Bar dataKey="EnergyConsumption" fill="#00C49F" name="Energy (kWh)" />
              <Bar dataKey="Carbon" fill="#FFBB28" name="Carbon (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. LINE CHART */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-4 text-white">Energy Consumption vs Production Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
            <XAxis 
              dataKey="date" 
              stroke="#FFFFFF" 
              tick={{ fill: '#FFFFFF' }} 
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#FFFFFF" tick={{ fill: '#FFFFFF' }} />
            <ReTooltip content={<CustomLineTooltip />} />
            <Legend wrapperStyle={{ color: '#FFFFFF' }} />
            <Line 
              type="monotone" 
              dataKey="EnergyConsumption" 
              stroke="#0088FE" 
              strokeWidth={2} 
              activeDot={{ r: 8, fill: '#0088FE' }} 
              name="Energy (kWh)" 
            />
            <Line 
              type="monotone" 
              dataKey="ActualProduction" 
              stroke="#FF8C00" 
              strokeWidth={2} 
              activeDot={{ r: 8, fill: '#FF8C00' }} 
              name="Production" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnergyDashboard;