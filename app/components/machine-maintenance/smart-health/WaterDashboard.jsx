import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const WaterDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    Papa.parse('/water.csv', {
      header: true,
      download: true,
      complete: (results) => {
        const parsed = results.data
          .filter(row => row.Date && row.Date.trim()) // Filter out empty rows
          .map(row => ({
            ...row,
            Date: row.Date.trim(),
            UG1_Inflow_L: parseFloat(row.UG1_Inflow_L) || 0,
            Water_Consumed_L: parseFloat(row.Water_Consumed_L) || 0,
            UG1_Level: parseFloat(row.UG1_Level) || 0,
            UG1_Volume_L: parseFloat(row.UG1_Volume_L) || 0,
            UG2_Level: parseFloat(row.UG2_Level) || 0,
            UG2_Volume_L: parseFloat(row.UG2_Volume_L) || 0,
            UG2_TDS: parseFloat(row.UG2_TDS) || 0,
            UG2_pH: parseFloat(row.UG2_pH) || 0,
            UG3_Level: parseFloat(row.UG3_Level) || 0,
            UG3_Volume_L: parseFloat(row.UG3_Volume_L) || 0,
            UG3_TDS: parseFloat(row.UG3_TDS) || 0,
          }));
        setData(parsed);
        setFilteredData(parsed);
      }
    });
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const newData = data.filter(row => {
        try {
          // Assuming date format is DD-MM-YYYY based on your split('-').reverse().join('-')
          const dateParts = row.Date.split('-');
          if (dateParts.length !== 3) return false;
          
          const rowDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          return rowDate >= start && rowDate <= end;
        } catch (error) {
          return false;
        }
      });
      setFilteredData(newData);
    } else if (startDate && !endDate) {
      // If only start date is selected, show from start date onwards
      const newData = data.filter(row => {
        try {
          const dateParts = row.Date.split('-');
          if (dateParts.length !== 3) return false;
          
          const rowDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
          const start = new Date(startDate);
          
          return rowDate >= start;
        } catch (error) {
          return false;
        }
      });
      setFilteredData(newData);
    } else if (!startDate && endDate) {
      // If only end date is selected, show up to end date
      const newData = data.filter(row => {
        try {
          const dateParts = row.Date.split('-');
          if (dateParts.length !== 3) return false;
          
          const rowDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
          const end = new Date(endDate);
          
          return rowDate <= end;
        } catch (error) {
          return false;
        }
      });
      setFilteredData(newData);
    } else {
      // No date filter applied, show all data
      setFilteredData(data);
    }
  }, [startDate, endDate, data]);

  const sumField = (field) => filteredData.reduce((acc, row) => acc + (row[field] || 0), 0);
  
  // Get the most recent entry with actual data, fallback to empty object
  const getLatestEntry = () => {
    if (filteredData.length === 0) return {};
    
    // Try to find the most recent entry with actual volume/level data
    for (let i = filteredData.length - 1; i >= 0; i--) {
      const entry = filteredData[i];
      if (entry.UG1_Volume_L > 0 || entry.UG1_Level > 0 || 
          entry.UG2_Volume_L > 0 || entry.UG2_Level > 0 || 
          entry.UG3_Volume_L > 0 || entry.UG3_Level > 0) {
        return entry;
      }
    }
    
    // If no entry with volume/level data found, return the last entry
    return filteredData[filteredData.length - 1] || {};
  };

  const lastEntry = getLatestEntry();

  const barLineChartData = {
    labels: filteredData.map(row => row.Date),
    datasets: [
      {
        label: 'Water Consumed (L)',
        data: filteredData.map(row => row.Water_Consumed_L),
        backgroundColor: 'rgba(255, 193, 7, 0.8)',
        yAxisID: 'y',
        type: 'bar',
        borderRadius: 4,
      },
      {
        label: 'Water Inflow (L)',
        data: filteredData.map(row => row.UG1_Inflow_L),
        borderColor: 'rgb(255, 87, 51)',
        backgroundColor: 'rgba(255, 87, 51, 0.1)',
        yAxisID: 'y1',
        type: 'line',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineTDSChartData = {
    labels: filteredData.map(row => row.Date),
    datasets: [
      {
        label: 'UG2 TDS',
        data: filteredData.map(row => row.UG2_TDS),
        borderColor: 'rgb(255, 215, 0)',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'UG3 TDS',
        data: filteredData.map(row => row.UG3_TDS),
        borderColor: 'rgb(255, 140, 0)',
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ]
  };

  const linePHChartData = {
    labels: filteredData.map(row => row.Date),
    datasets: [
      {
        label: 'UG2 pH',
        data: filteredData.map(row => row.UG2_pH),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: 'white',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: 'white',
          font: { size: 11 }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: 'white',
          font: { size: 11 }
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    interaction: { mode: 'index' },
    stacked: false,
    scales: {
      ...chartOptions.scales,
      y: { 
        ...chartOptions.scales.y,
        type: 'linear', 
        position: 'left' 
      }, 
      y1: { 
        ...chartOptions.scales.y,
        type: 'linear', 
        position: 'right', 
        grid: { drawOnChartArea: false, color: 'rgba(255, 255, 255, 0.3)' },
        ticks: {
          color: 'white',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">

        {/* Top Row - KPI Cards and Date Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Water Inflow Card */}
          <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium mb-1">Total Water Inflow</p>
                <p className="text-3xl font-bold text-white">{sumField('UG1_Inflow_L').toLocaleString()}</p>
                <p className="text-white text-sm">Plant in litres</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Total Consumption Card */}
          <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium mb-1">Total Consumption</p>
                <p className="text-3xl font-bold text-white">{sumField('Water_Consumed_L').toLocaleString()}</p>
                <p className="text-white text-sm">in litres</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Date Selection Card */}
          <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-4">Date Selection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">From</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white border rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">To</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white border rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row - Main Chart and UG1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Consumption vs Water Inflow Chart */}
          <div className="lg:col-span-2 bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white text-xl font-semibold mb-6">Consumption Vs Water Inflow</h3>
            <div className="h-80">
              <Bar data={barLineChartData} options={barChartOptions} />
            </div>
          </div>

          {/* UG1 Level/Volume Card */}
          <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-4">UG1 Level/Volume</h3>
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white text-sm">Volume</p>
                <p className="text-2xl font-bold text-white">{(lastEntry.UG1_Volume_L || 0).toLocaleString()} L</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white text-sm">Level</p>
                <p className="text-2xl font-bold text-white">{(lastEntry.UG1_Level || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - TDS Chart, pH Chart, and UG2/UG3 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* TDS Chart */}
          <div className="lg:col-span-1 bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-4">TDS (UG2, UG3)</h3>
            <div className="h-64">
              <Line data={lineTDSChartData} options={chartOptions} />
            </div>
          </div>

          {/* pH Chart */}
          <div className="lg:col-span-1 bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-4">pH (UG2)</h3>
            <div className="h-64">
              <Line data={linePHChartData} options={chartOptions} />
            </div>
          </div>

          {/* UG2 Level/Volume Card */}
          <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-4">UG2 Level/Volume</h3>
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white text-sm">Volume</p>
                <p className="text-2xl font-bold text-white">{(lastEntry.UG2_Volume_L || 0).toLocaleString()} L</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white text-sm">Level</p>
                <p className="text-2xl font-bold text-white">{(lastEntry.UG2_Level || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* UG3 Level/Volume Card */}
          <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-4">UG3 Level/Volume</h3>
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white text-sm">Volume</p>
                <p className="text-2xl font-bold text-white">{(lastEntry.UG3_Volume_L || 0).toLocaleString()} L</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-white text-sm">Level</p>
                <p className="text-2xl font-bold text-white">{(lastEntry.UG3_Level || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterDashboard;