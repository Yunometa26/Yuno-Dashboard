'use client';
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  BarChart, Bar, Legend, ResponsiveContainer
} from 'recharts';
import FilterPage from './FilterPO';

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
  const [selectedABCClass, setSelectedABCClass] = useState(null);
  const [showABCTable, setShowABCTable] = useState(false);

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
            inventoryTurnoverRatio: parseFloat(row['Inventory Turnover ratio']) || 0,
          }));
        setData(parsed);
        setFiltered(parsed);
      },
    });
  }, []);

  // Get filtered data for cascading filters
  const getFilteredDataForOptions = () => {
    let temp = data;
    
    // Apply filters in order to create cascading effect
    if (filters.category) {
      temp = temp.filter(d => d.Category === filters.category);
    }
    if (filters.itemId) {
      temp = temp.filter(d => d['Item ID'] === filters.itemId);
    }
    if (filters.month) {
      temp = temp.filter(d => d.date.format('MM') === filters.month);
    }
    
    return temp;
  };

  // Get unique values for each filter based on current selections
  const getFilterOptions = () => {
    const baseData = getFilteredDataForOptions();
    
    return {
      categories: [...new Set(data.map(d => d.Category))], // Always show all categories
      itemIds: [...new Set(baseData.map(d => d['Item ID']))], // Based on category selection
      months: [...new Set(baseData.map(d => d.date.format('MM')))], // Based on category + itemId
      days: [...new Set(baseData.map(d => d.date.format('DD')))] // Based on all previous filters
    };
  };

  useEffect(() => {
    let temp = data;

    if (filters.category) temp = temp.filter(d => d.Category === filters.category);
    if (filters.itemId) temp = temp.filter(d => d['Item ID'] === filters.itemId);
    if (filters.month) temp = temp.filter(d => d.date.format('MM') === filters.month);
    if (filters.day) temp = temp.filter(d => d.date.format('DD') === filters.day);

    setFiltered(temp);
  }, [filters, data]);

  // Updated inventory turnover calculation using average method
  const inventoryTurnover = (() => {
    if (filtered.length === 0) return '0';
    
    const totalTurnoverRatio = filtered.reduce((sum, d) => {
      const turnoverValue = parseFloat(d['Inventory Turnover ratio']) || 0;
      return sum + turnoverValue;
    }, 0);
    
    const averageTurnover = totalTurnoverRatio / filtered.length * 10;
    return averageTurnover.toFixed(2);
  })();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      
      // Reset dependent filters when parent filter changes
      if (name === 'category') {
        newFilters.itemId = '';
        newFilters.month = '';
        newFilters.day = '';
      } else if (name === 'itemId') {
        newFilters.month = '';
        newFilters.day = '';
      } else if (name === 'month') {
        newFilters.day = '';
      }
      
      return newFilters;
    });
  };

  const filterOptions = getFilterOptions();

  // ABC Analysis data
  const abcAnalysisData = (() => {
    const uniqueItems = {};
    filtered.forEach(row => {
      if (!uniqueItems[row['Item ID']]) {
        uniqueItems[row['Item ID']] = {
          itemId: row['Item ID'],
          itemName: row['Item Name'],
          category: row.Category,
          abcClass: row['ABC Class'],
          unit: row.Unit,
          price: parseFloat(row.Price || row['Unit Price'] || row.price) || 0
        };
      }
    });

    const abcCounts = {};
    Object.values(uniqueItems).forEach(item => {
      abcCounts[item.abcClass] = (abcCounts[item.abcClass] || 0) + 1;
    });

    const totalItems = Object.values(abcCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(abcCounts).map(([abcClass, count]) => ({
      name: `Class ${abcClass}`,
      value: count,
      percentage: totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : 0
    }));
  })();

  // Get items for selected ABC class with latest closing stock
  const getItemsForABCClass = (abcClass) => {
    const uniqueItems = {};
    filtered.forEach(row => {
      if (row['ABC Class'] === abcClass) {
        if (!uniqueItems[row['Item ID']]) {
          uniqueItems[row['Item ID']] = {
            itemId: row['Item ID'],
            itemName: row['Item Name'],
            category: row.Category,
            abcClass: row['ABC Class'],
            unit: row.Unit,
            price: parseFloat(row.Price || row['Unit Price'] || row.price) || 0,
            closingStock: row.closingStock,
            date: row.date
          };
        } else {
          // Keep the latest record for closing stock
          if (row.date.isAfter(uniqueItems[row['Item ID']].date)) {
            uniqueItems[row['Item ID']].closingStock = row.closingStock;
            uniqueItems[row['Item ID']].date = row.date;
          }
        }
      }
    });
    return Object.values(uniqueItems);
  };

  const handlePieClick = (data, index) => {
    const abcClass = data.name.replace('Class ', '');
    setSelectedABCClass(abcClass);
    setShowABCTable(true);
  };

  const closeABCTable = () => {
    setShowABCTable(false);
    setSelectedABCClass(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] text-white p-6 space-y-6">
      {/* Header */}
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
        <div className="p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex-1 space-y-5 align-middle text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                <span className="text-white">Raw Material Inventory Analysis</span>
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
              value={filters.category}
              onChange={handleFilterChange} 
              className="w-full bg-white border text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Item ID 
              {filters.category && (
                <span className="text-xs text-gray-300 ml-1">
                  ({filterOptions.itemIds.length} available)
                </span>
              )}
            </label>
            <select 
              name="itemId" 
              value={filters.itemId}
              onChange={handleFilterChange} 
              className="w-full bg-white text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={filterOptions.itemIds.length === 0}
            >
              <option value="">All Item IDs</option>
              {filterOptions.itemIds.map((id, idx) => (
                <option key={idx} value={id}>{id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Month
              {(filters.category || filters.itemId) && (
                <span className="text-xs text-gray-300 ml-1">
                  ({filterOptions.months.length} available)
                </span>
              )}
            </label>
            <select 
              name="month" 
              value={filters.month}
              onChange={handleFilterChange} 
              className="w-full bg-white text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={filterOptions.months.length === 0}
            >
              <option value="">All Months</option>
              {filterOptions.months.map((month, idx) => (
                <option key={idx} value={month}>
                  {dayjs().month(parseInt(month) - 1).format('MMMM')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Day
              {(filters.category || filters.itemId || filters.month) && (
                <span className="text-xs text-gray-300 ml-1">
                  ({filterOptions.days.length} available)
                </span>
              )}
            </label>
            <select 
              name="day" 
              value={filters.day}
              onChange={handleFilterChange} 
              className="w-full bg-white text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={filterOptions.days.length === 0}
            >
              <option value="">All Days</option>
              {filterOptions.days.map((day, idx) => (
                <option key={idx} value={day}>{parseInt(day)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ABC Analysis Pie Chart */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ABC Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={abcAnalysisData}
                cx="50%" 
                cy="50%" 
                outerRadius={100}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                labelStyle={{ fill: '#ffffff', fontSize: 12 }}
                dataKey="value"
                onClick={handlePieClick}
                style={{ cursor: 'pointer' }}
              >
                {abcAnalysisData.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 70, 115, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value, name) => [
                  `${value} items (${abcAnalysisData.find(d => d.name === name)?.percentage}%)`,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ color: '#ffffff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-200 mt-2 text-center">Click on any segment to view items in that ABC class</p>
      </div>

      {/* ABC Class Table Modal */}
      {showABCTable && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-xl p-6 max-w-6xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Items in ABC Class {selectedABCClass}</h3>
              <button 
                onClick={closeABCTable}
                className="text-white hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-white">
                <thead className="bg-opacity-20">
                  <tr>
                    <th className="px-4 py-3 text-left">Item ID</th>
                    <th className="px-4 py-3 text-left">Item Name</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">ABC Class</th>
                    <th className="px-4 py-3 text-left">Closing Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {getItemsForABCClass(selectedABCClass).map((item, idx) => (
                    <tr key={idx} className="border-b border-white border-opacity-20 hover:bg-opacity-10">
                      <td className="px-4 py-3">{item.itemId}</td>
                      <td className="px-4 py-3">{item.itemName}</td>
                      <td className="px-4 py-3">{item.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          item.abcClass === 'A' ? 'bg-green-500' : 
                          item.abcClass === 'B' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          {item.abcClass}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.closingStock.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Turnover Card */}
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Average Inventory Turnover Ratio</h2>
            <p className="text-4xl font-bold text-[#F57C00]">{inventoryTurnover}</p>
            <p className="text-sm text-gray-200 mt-1">Based on {filtered.length} records</p>
          </div>
      {/* Avg Monthly Inventory Turnover Ratio Chart */}
      <div className="w-full min-w-[900px] h-[450px] mt-6 overflow-x-auto">
        <ResponsiveContainer>
          <BarChart
            data={Object.entries(
  filtered.filter(d => d.date.isValid()).reduce((acc, row) => {
              const month = row.date.format('MMMM YYYY');
              if (!acc[month]) acc[month] = { month, totalITR: 0, count: 0 };
              acc[month].totalITR += row.inventoryTurnoverRatio || 0;
              acc[month].count += 1;
              return acc;
            }, {})).map(([month, val]) => ({
              month,
              avgITR: parseFloat((val.totalITR / val.count).toFixed(2)),
            }))}
            barCategoryGap="20%"
            barGap={5}
          >
            <XAxis dataKey="month" tick={{ fill: '#ffffff', fontSize: 12 }} />
            <YAxis tick={{ fill: '#ffffff', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(2, 70, 115, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Bar dataKey="avgITR" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Total Closing Stock & MSL by Day</h3>
          <div className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
            Below MSL: {(() => {
              const chartData = Object.values(filtered.filter(d => d.date.isValid()).reduce((acc, row) => {
                const day = row.date.format('DD-MM-YYYY');
                if (!acc[day]) acc[day] = { day, closing: [], msl: [] };
                acc[day].closing.push(row.closingStock);
                acc[day].msl.push(row.msl);
                return acc;
              }, {})).map(d => ({
                day: d.day,
                totalClosing: d.closing.reduce((a, b) => a + b, 0),
                totalMSL: d.msl.reduce((a, b) => a + b, 0),
              }));
              return chartData.filter(d => d.totalClosing < d.totalMSL).length;
            })()}
          </div>
        </div>
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
                totalClosing: d.closing.reduce((a, b) => a + b, 0),
                totalMSL: d.msl.reduce((a, b) => a + b, 0),
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
              <Line type="monotone" dataKey="totalClosing" stroke="#F57C00" strokeWidth={3} name="Total Closing" />
              <Line type="monotone" dataKey="totalMSL" stroke="#ffffff" strokeWidth={3} name="Total MSL" />
            </LineChart>
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

      <FilterPage/>

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

//Inventory-Dashboard Change
