"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Papa from "papaparse";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

export default function EfficiencyMetricsPage() {
  const [ordersData, setOrdersData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedDay, setSelectedDay] = useState('All');
  const [selectedOrderState, setSelectedOrderState] = useState('All');
  const [selectedInventoryLocation, setSelectedInventoryLocation] = useState('All');
  const [selectedOrderID, setSelectedOrderID] = useState('All');
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/OTC_Updated.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            startTransition(() => {
              const processed = results.data.map(row => {
                const orderStartDate = row["Order Start Date"] ? new Date(row["Order Start Date"]) : null;
                const endDate = row["Sub Actual End Date"] ? new Date(row["Sub Actual End Date"]) : null;

                return {
                  orderID: row["Order ID"] || '',
                  orderState: row["Order State"] || '',
                  inventoryLocation: row["Inventory Location"] || '',
                  subprocess: row["Subprocess"] || '',
                  process: row["Process"] || '',
                  startDate: orderStartDate && !isNaN(orderStartDate.getTime()) ? orderStartDate : null,
                  endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
                  statusType: row["Status Type"] || '',
                  actualDays: parseFloat(row["Actual Days"]) || 0,
                  monthName: row["Month"] || '', // Use explicit month name from CSV
                  day: row["Day"] ? parseInt(row["Day"]) : null, // Use new Day column from CSV
                  dayValue: row["Day"] ? parseInt(row["Day"]) : null, // Use new Day column for filtering
                  subprocessSequence: parseInt(row['Subprocess Sequence']) || 9999
                };
              }).filter(item => 
                item.orderID && 
                item.startDate && 
                item.subprocess &&
                item.statusType
              );

              console.log('Processed data sample:', processed.slice(0, 3));
              console.log('Total processed records:', processed.length);

              setOrdersData(processed);
              setLoading(false);
            });
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV file:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get unique values for filters
  const months = useMemo(() => {
    const uniqueMonths = [...new Set(ordersData.map(order => order.monthName).filter(month => month))];
    return ['All', ...uniqueMonths.sort()];
  }, [ordersData]);

  const days = useMemo(() => {
    // Get unique day numbers from Day column
    const dayValues = ordersData
      .map(order => order.day)
      .filter(day => day !== null && day !== undefined && !isNaN(day));
    
    const uniqueDays = [...new Set(dayValues)];
    
    // Sort days numerically
    const sortedDays = uniqueDays.sort((a, b) => a - b);
    
    return ['All', ...sortedDays];
  }, [ordersData]);

  const orderStates = useMemo(() => {
    const uniqueStates = [...new Set(ordersData.map(order => order.orderState).filter(state => state))];
    return ['All', ...uniqueStates.sort()];
  }, [ordersData]);

  const inventoryLocations = useMemo(() => {
    const uniqueLocations = [...new Set(ordersData.map(order => order.inventoryLocation).filter(location => location))];
    return ['All', ...uniqueLocations.sort()];
  }, [ordersData]);

  const orderIDs = useMemo(() => {
    const uniqueIDs = [...new Set(ordersData.map(order => order.orderID).filter(id => id))];
    return ['All', ...uniqueIDs.sort()];
  }, [ordersData]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    const filtered = ordersData.filter(order => {
      // Day filter logic - using numeric Day column
      let dayMatches = selectedDay === 'All';
      if (!dayMatches && selectedDay !== 'All') {
        const orderDayValue = order.day; // This is now the numeric day from Day column
        
        // Direct numeric comparison for day values
        dayMatches = orderDayValue === parseInt(selectedDay);
      }
      
      return (selectedMonth === 'All' || order.monthName === selectedMonth) &&
             dayMatches &&
             (selectedOrderState === 'All' || order.orderState === selectedOrderState) &&
             (selectedInventoryLocation === 'All' || order.inventoryLocation === selectedInventoryLocation) &&
             (selectedOrderID === 'All' || order.orderID === selectedOrderID);
    });
    
    console.log('Filtered data count:', filtered.length);
    console.log('Selected filters:', { selectedMonth, selectedDay, selectedOrderState, selectedInventoryLocation, selectedOrderID });
    
    return filtered;
  }, [ordersData, selectedMonth, selectedDay, selectedOrderState, selectedInventoryLocation, selectedOrderID]);

  // Calculate metrics
  const totalOrders = useMemo(() => {
    return new Set(filteredData.map(order => order.orderID)).size;
  }, [filteredData]);

  // Calculate clear order metrics
  const orderMetrics = useMemo(() => {
    // Get unique subprocesses and locations for variety
    const uniqueSubprocesses = [...new Set(filteredData.map(order => order.subprocess))].length;
    const uniqueLocations = [...new Set(filteredData.map(order => order.inventoryLocation))].length;
    
    return {
      subprocesses: uniqueSubprocesses,
      locations: uniqueLocations
    };
  }, [filteredData]);

  // Process data for new charts
  const processData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      console.log('No filtered data available for process chart');
      return [];
    }
    
    const preferredProcessOrder = ['Procurement', 'Production', 'Invoice', 'Dispatch', 'Payment'];
    const result = preferredProcessOrder.map(proc => {
      const sum = filteredData
        .filter(item => item.process === proc)
        .reduce((acc, item) => acc + (item.actualDays || 0), 0);
      return { Process: proc, ActualDays: sum };
    }).filter(d => d.ActualDays > 0);
    
    console.log('Process data:', result);
    return result;
  }, [filteredData]);

  // Display data based on selected process
  const displayData = useMemo(() => {
    return selectedProcess
      ? filteredData.filter(item => item.process === selectedProcess)
      : filteredData;
  }, [filteredData, selectedProcess]);

  // Subprocess data with sequence ordering
  const subprocessDataNew = useMemo(() => {
    if (!displayData || displayData.length === 0) {
      console.log('No display data available for subprocess chart');
      return [];
    }
    
    const raw = displayData.reduce((acc, item) => {
      const key = item.subprocess;
      if (!key) return acc;
      if (!acc[key]) {
        acc[key] = { Subprocess: key, ActualDays: 0, Sequence: item.subprocessSequence || 9999 };
      }
      acc[key].ActualDays += (item.actualDays || 0);
      return acc;
    }, {});
    
    const result = Object.values(raw)
      .filter(item => item.ActualDays > 0)
      .sort((a, b) => (a.Sequence || 9999) - (b.Sequence || 9999));
    
    console.log('Subprocess data:', result);
    return result;
  }, [displayData]);

  // Additional metrics
  const totalActualDays = displayData.reduce((sum, d) => sum + (d.actualDays || 0), 0);
  const formatThousands = (num) => num >= 1000 ? `${(num / 1000).toFixed(2)}K` : num;

  // Generate subprocess data from filtered results with fixed order
  const subprocessData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      console.log('No filtered data available for subprocess status chart');
      return [];
    }
    
    // Fixed order of subprocesses to maintain consistent chart layout
    const fixedSubprocessOrder = [
      'Prepare PO',
      'Quality Check',
      'Receive Raw Material',
      'Receive Raw Material in Store',
      'Review Request',
      'Send PO to Supplier',
      'Submit New Request'
    ];
    
    const subprocessCounts = {};
    
    filteredData.forEach(order => {
      if (order.subprocess) {
        if (!subprocessCounts[order.subprocess]) {
          subprocessCounts[order.subprocess] = { onTime: 0, delay: 0 };
        }
        
        if (order.statusType === 'On Time') {
          subprocessCounts[order.subprocess].onTime++;
        } else if (order.statusType === 'Delay') {
          subprocessCounts[order.subprocess].delay++;
        }
      }
    });
    
    // Return data in fixed order, showing 0 counts for subprocesses not in filtered data
    const result = fixedSubprocessOrder.map(subprocess => ({
      name: subprocess.length > 20 ? subprocess.substring(0, 17) + '...' : subprocess,
      fullName: subprocess,
      'On Time': subprocessCounts[subprocess]?.onTime || 0,
      'Delay': subprocessCounts[subprocess]?.delay || 0,
      total: (subprocessCounts[subprocess]?.onTime || 0) + (subprocessCounts[subprocess]?.delay || 0)
    }));
    
    console.log('Subprocess status data:', result);
    return result;
  }, [filteredData]);

  // Calculate average days
  const averageDays = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const totalDays = filteredData.reduce((sum, order) => sum + order.actualDays, 0);
    const avg = (totalDays / filteredData.length).toFixed(2);
    console.log('Average Days Calculation:', { 
      filteredDataLength: filteredData.length, 
      totalDays, 
      averageDays: avg,
      selectedFilters: { selectedMonth, selectedDay, selectedOrderState, selectedInventoryLocation, selectedOrderID }
    });
    return avg;
  }, [filteredData, selectedMonth, selectedDay, selectedOrderState, selectedInventoryLocation, selectedOrderID]);

  // Enhanced gauge chart component
  const GaugeChart = ({ value, max = 10 }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    const numValue = parseFloat(value) || 0;
    const percentage = Math.min((numValue / max) * 100, 100); // Cap at 100%
    const angle = (percentage / 100) * 180; // Convert to degrees for rotation
    
    // Calculate min and max from filtered data
    const minDays = filteredData.length > 0 ? Math.min(...filteredData.map(order => order.actualDays)) : 0;
    const maxDays = filteredData.length > 0 ? Math.max(...filteredData.map(order => order.actualDays)) : 0;
    
    console.log('Gauge Chart Min/Max:', { 
      minDays, 
      maxDays, 
      filteredDataLength: filteredData.length,
      value: numValue
    });
    
    // Animate the gauge progress
    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedValue(numValue);
      }, 200); // Small delay before animation starts
      
      return () => clearTimeout(timer);
    }, [numValue]);
    
    // Calculate animated angle
    const animatedPercentage = Math.min((animatedValue / max) * 100, 100);
    const animatedAngle = (animatedPercentage / 100) * 180;
    
    return (
      <div className="relative flex flex-col items-center">
        {/* Gauge Container */}
        <div className="relative mb-6">
          <svg width="240" height="140" viewBox="0 0 240 140" className="filter drop-shadow-lg">
            {/* Background arc with gradient */}
            <defs>
              <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#6b7280" />
              </linearGradient>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#ffb347" />
                <stop offset="100%" stopColor="#ff8c00" />
              </linearGradient>
            </defs>
            
            {/* White border/outline */}
            <path
              d="M 40,120 A 80,80 0 0,1 200,120"
              fill="none"
              stroke="#ffffff"
              strokeWidth="34"
              strokeLinecap="butt"
            />
            
            {/* Background arc */}
            <path
              d="M 40,120 A 80,80 0 0,1 200,120"
              fill="none"
              stroke="url(#backgroundGradient)"
              strokeWidth="28"
              strokeLinecap="butt"
            />
            
            {/* Progress arc */}
            <path
              d="M 40,120 A 80,80 0 0,1 200,120"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="28"
              strokeLinecap="butt"
              strokeDasharray="251.33"
              strokeDashoffset={251.33 - (animatedAngle / 180) * 251.33}
              style={{
                transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            
                       </svg>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          <div className="bg-gradient-to-br from-blue-600/60 to-blue-800/60 backdrop-blur-sm rounded-xl p-4 text-center border-2 border-blue-400/50 shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-blue-500/20">
            <div className="text-2xl font-bold text-blue-100 transition-all duration-1000 mb-1">{minDays}</div>
            <div className="text-sm text-blue-200 uppercase tracking-wider font-semibold">Min Days</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/60 to-green-800/60 backdrop-blur-sm rounded-xl p-4 text-center border-2 border-green-400/50 shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-green-500/20 animate-pulse">
            <div className="text-2xl font-bold text-green-100 transition-all duration-1000 mb-1">{animatedValue.toFixed(2)}</div>
            <div className="text-sm text-green-200 uppercase tracking-wider font-semibold">Avg Days</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/60 to-purple-800/60 backdrop-blur-sm rounded-xl p-4 text-center border-2 border-purple-400/50 shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-purple-500/20">
            <div className="text-2xl font-bold text-purple-100 transition-all duration-1000 mb-1">{maxDays}</div>
            <div className="text-sm text-purple-200 uppercase tracking-wider font-semibold">Max Days</div>
          </div>
        </div>
      </div>
    );
  };

  // Generate table data from filtered results
  const tableData = useMemo(() => {
    const uniqueOrderIDs = [...new Set(filteredData.map(order => order.orderID))];
    
    return uniqueOrderIDs.map(orderID => {
      const orderRecords = filteredData.filter(order => order.orderID === orderID);
      const startDates = orderRecords.map(order => order.startDate).filter(date => date);
      const endDates = orderRecords.map(order => order.endDate).filter(date => date);
      const actualDays = Math.max(...orderRecords.map(order => order.actualDays));
      
      const earliestStart = startDates.length > 0 ? new Date(Math.min(...startDates)) : null;
      const latestEnd = endDates.length > 0 ? new Date(Math.max(...endDates)) : null;
      
      return {
        orderID,
        startDate: earliestStart ? format(earliestStart, 'dd MMM yyyy') : 'N/A',
        endDate: latestEnd ? format(latestEnd, 'dd MMM yyyy') : 'N/A',
        actualDays
      };
    }).sort((a, b) => a.orderID.localeCompare(b.orderID)); // Sort by Order ID for consistency
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6 flex items-center justify-center">
        <div className="text-xl">Loading efficiency metrics data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Efficiency Metrics</h1>
      </div>

      {/* Filters */}
      <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              {months.map(month => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              {days.map(day => (
                <option key={day} value={day}>
                  {day === 'All' ? 'All' : `Day ${day}`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Order State</label>
            <select
              value={selectedOrderState}
              onChange={(e) => setSelectedOrderState(e.target.value)}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              {orderStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Inventory Location</label>
            <select
              value={selectedInventoryLocation}
              onChange={(e) => setSelectedInventoryLocation(e.target.value)}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              {inventoryLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Order ID</label>
            <select
              value={selectedOrderID}
              onChange={(e) => setSelectedOrderID(e.target.value)}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              {orderIDs.slice(0, 100).map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Order to Cash Credit Timeline Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-left text-white">
          Order to Cash Credit Timeline
        </h2>
        
        {/* Process Chart */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Sum of Actual Days by Process</h3>
            {selectedProcess && (
              <button 
                onClick={() => setSelectedProcess(null)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Clear Filter ({selectedProcess})
              </button>
            )}
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={processData}
                margin={{ left: 120, top: 20, right: 30, bottom: 20 }}
                onClick={(data) => {
                  const process = data?.activePayload?.[0]?.payload?.Process;
                  if (process) setSelectedProcess(process);
                }}
              >
                <XAxis type="number" tick={{ fill: '#ffffff', fontSize: 12 }} />
                <YAxis 
                  dataKey="Process" 
                  type="category" 
                  width={150} 
                  tick={{ fill: '#ffffff', fontSize: 12 }} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1e3a8a', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [value, 'Actual Days']}
                  labelFormatter={(label) => `Process: ${label}`}
                />
                <Bar dataKey="ActualDays" cursor="pointer">
                  {processData.map((entry, index) => (
                    <Cell key={index} fill="#39FF14" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subprocess Chart */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-white">
            Sum of Actual Days by Subprocess {selectedProcess ? `(Filtered: ${selectedProcess})` : ''}
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={subprocessDataNew} 
                margin={{ left: 180, top: 20, right: 30, bottom: 20 }}
              >
                <XAxis type="number" tick={{ fill: '#ffffff', fontSize: 12 }} />
                <YAxis 
                  dataKey="Subprocess" 
                  type="category" 
                  width={200} 
                  tick={{ fill: '#ffffff', fontSize: 11 }} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1e3a8a', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [value, 'Actual Days']}
                  labelFormatter={(label) => `Subprocess: ${label}`}
                />
                <Bar dataKey="ActualDays" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Details Table */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Order Details</h3>
            <div className="text-sm text-gray-300">
              Showing {tableData.length} orders
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto border-t border-b border-blue-600 rounded-lg">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-950/80 backdrop-blur-sm border-b border-blue-600">
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 text-sm uppercase tracking-wider border-b border-blue-600">Order ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 text-sm uppercase tracking-wider border-b border-blue-600">Start Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 text-sm uppercase tracking-wider border-b border-blue-600">End Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 text-sm uppercase tracking-wider border-b border-blue-600">Actual Days</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index} className="bg-blue-950/80 hover:bg-blue-600/50 transition-colors duration-200 border-b border-blue-600">
                      <td className="py-4 px-6 text-white font-medium border-b border-blue-600">{row.orderID}</td>
                      <td className="py-4 px-6 text-gray-200 border-b border-blue-600">{row.startDate}</td>
                      <td className="py-4 px-6 text-gray-200 border-b border-blue-600">{row.endDate}</td>
                      <td className="py-4 px-6 text-gray-200 font-medium border-b border-blue-600">{row.actualDays}</td>
                    </tr>
                  ))}
                  {tableData.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 px-6 text-center text-gray-400 bg-blue-950/80 border-b border-blue-600">
                        No orders found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Procurement Timeline Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-left text-white">
          Procurement Timeline
        </h2>
        
        {/* Metrics Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Number of Orders Card */}
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Number of Orders
            </h3>
            <div className="text-4xl font-bold text-blue-400 mb-2">{totalOrders}</div>
            <div className="text-xs text-gray-300 uppercase tracking-wider">Total Orders</div>
          </div>

          {/* Actual Days Card */}
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
              Actual Days
            </h3>
            <div className="text-4xl font-bold text-green-400 mb-2">{formatThousands(totalActualDays)}</div>
            <div className="text-xs text-gray-300 uppercase tracking-wider">Total Days</div>
          </div>

          {/* Average Days Gauge */}
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Average Days Analysis
            </h3>
            <GaugeChart value={averageDays} />
          </div>
        </div>

        {/* Subprocess Bar Chart */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
          <h3 className="text-xl font-semibold mb-4">Count of Order ID by Subprocess and Status Type</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subprocessData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 14, fill: '#ffffff', fontWeight: 600 }}
                  height={60}
                />
                <YAxis tick={{ fill: '#ffffff' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a365d', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value, name, props) => [
                    value,
                    name,
                    `Full name: ${props.payload?.fullName || 'N/A'}`
                  ]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={50}
                  wrapperStyle={{ 
                    paddingTop: '25px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  iconType="rect"
                  iconSize={18}
                  itemStyle={{
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginRight: '30px'
                  }}
                />
                <Bar dataKey="Delay" stackId="a" fill="#ef4444" name="Delay" />
                <Bar dataKey="On Time" stackId="a" fill="#10b981" name="On Time" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.location.href = "/"}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// Helper Components
function Dropdown({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium mb-2 text-white">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
      >
        <option value="All">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'All' ? 'All' : (label === 'Day' ? `Day ${opt}` : opt)}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({ title, value, className = "" }) {
  return (
    <div className={`bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center text-center ${className}`}>
      <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
        {title}
      </h3>
      <div className="text-4xl font-bold text-blue-400 mb-2">{value}</div>
      <div className="text-xs text-gray-300 uppercase tracking-wider">Total</div>
    </div>
  );
}