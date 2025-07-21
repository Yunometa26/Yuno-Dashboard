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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedSubprocessFilter, setSelectedSubprocessFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const itemsPerPage = 10;

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
                // Add subActualStartDate and subActualEndDate as raw string fields
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
                  monthName: row["Month"] || '',
                  day: row["Day"] ? parseInt(row["Day"]) : null,
                  dayValue: row["Day"] ? parseInt(row["Day"]) : null,
                  subprocessSequence: parseInt(row['Subprocess Sequence']) || 9999,
                  subActualStartDate: row["Sub Actual Start Date"] || '',
                  subActualEndDate: row["Sub Actual End Date"] || ''
                };
              }).filter(item => 
                item.orderID && 
                item.startDate && 
                item.subprocess &&
                item.statusType
              );

              setOrdersData(processed);
              setLoading(false);
            });
          },
          error: (error) => {
            setLoading(false);
          }
        });
      } catch (error) {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Dynamic filter options based on current selections
  const dynamicFilteredData = useMemo(() => {
    return ordersData.filter(order => {
      let monthMatch = selectedMonth === 'All' || order.monthName === selectedMonth;
      let dayMatch = selectedDay === 'All' || order.day === parseInt(selectedDay);
      let orderStateMatch = selectedOrderState === 'All' || order.orderState === selectedOrderState;
      let inventoryLocationMatch = selectedInventoryLocation === 'All' || order.inventoryLocation === selectedInventoryLocation;
      let orderIDMatch = selectedOrderID === 'All' || order.orderID === selectedOrderID;
      return monthMatch && dayMatch && orderStateMatch && inventoryLocationMatch && orderIDMatch;
    });
  }, [ordersData, selectedMonth, selectedDay, selectedOrderState, selectedInventoryLocation, selectedOrderID]);

  // For each filter, options depend on the other filters' selections
  const months = useMemo(() => {
    const filtered = ordersData.filter(order => {
      let dayMatch = selectedDay === 'All' || order.day === parseInt(selectedDay);
      let orderStateMatch = selectedOrderState === 'All' || order.orderState === selectedOrderState;
      let inventoryLocationMatch = selectedInventoryLocation === 'All' || order.inventoryLocation === selectedInventoryLocation;
      let orderIDMatch = selectedOrderID === 'All' || order.orderID === selectedOrderID;
      return dayMatch && orderStateMatch && inventoryLocationMatch && orderIDMatch;
    });
    const uniqueMonths = [...new Set(filtered.map(order => order.monthName).filter(month => month))];
    return ['All', ...uniqueMonths.sort()];
  }, [ordersData, selectedDay, selectedOrderState, selectedInventoryLocation, selectedOrderID]);

  const days = useMemo(() => {
    const filtered = ordersData.filter(order => {
      let monthMatch = selectedMonth === 'All' || order.monthName === selectedMonth;
      let orderStateMatch = selectedOrderState === 'All' || order.orderState === selectedOrderState;
      let inventoryLocationMatch = selectedInventoryLocation === 'All' || order.inventoryLocation === selectedInventoryLocation;
      let orderIDMatch = selectedOrderID === 'All' || order.orderID === selectedOrderID;
      return monthMatch && orderStateMatch && inventoryLocationMatch && orderIDMatch;
    });
    const dayValues = filtered.map(order => order.day).filter(day => day !== null && day !== undefined && !isNaN(day));
    const uniqueDays = [...new Set(dayValues)];
    const sortedDays = uniqueDays.sort((a, b) => a - b);
    return ['All', ...sortedDays];
  }, [ordersData, selectedMonth, selectedOrderState, selectedInventoryLocation, selectedOrderID]);

  const orderStates = useMemo(() => {
    const filtered = ordersData.filter(order => {
      let monthMatch = selectedMonth === 'All' || order.monthName === selectedMonth;
      let dayMatch = selectedDay === 'All' || order.day === parseInt(selectedDay);
      let inventoryLocationMatch = selectedInventoryLocation === 'All' || order.inventoryLocation === selectedInventoryLocation;
      let orderIDMatch = selectedOrderID === 'All' || order.orderID === selectedOrderID;
      return monthMatch && dayMatch && inventoryLocationMatch && orderIDMatch;
    });
    const uniqueStates = [...new Set(filtered.map(order => order.orderState).filter(state => state))];
    return ['All', ...uniqueStates.sort()];
  }, [ordersData, selectedMonth, selectedDay, selectedInventoryLocation, selectedOrderID]);

  const inventoryLocations = useMemo(() => {
    const filtered = ordersData.filter(order => {
      let monthMatch = selectedMonth === 'All' || order.monthName === selectedMonth;
      let dayMatch = selectedDay === 'All' || order.day === parseInt(selectedDay);
      let orderStateMatch = selectedOrderState === 'All' || order.orderState === selectedOrderState;
      let orderIDMatch = selectedOrderID === 'All' || order.orderID === selectedOrderID;
      return monthMatch && dayMatch && orderStateMatch && orderIDMatch;
    });
    const uniqueLocations = [...new Set(filtered.map(order => order.inventoryLocation).filter(location => location))];
    return ['All', ...uniqueLocations.sort()];
  }, [ordersData, selectedMonth, selectedDay, selectedOrderState, selectedOrderID]);

  const orderIDs = useMemo(() => {
    const filtered = ordersData.filter(order => {
      let monthMatch = selectedMonth === 'All' || order.monthName === selectedMonth;
      let dayMatch = selectedDay === 'All' || order.day === parseInt(selectedDay);
      let orderStateMatch = selectedOrderState === 'All' || order.orderState === selectedOrderState;
      let inventoryLocationMatch = selectedInventoryLocation === 'All' || order.inventoryLocation === selectedInventoryLocation;
      return monthMatch && dayMatch && orderStateMatch && inventoryLocationMatch;
    });
    const uniqueIDs = [...new Set(filtered.map(order => order.orderID).filter(id => id))];
    return ['All', ...uniqueIDs.sort()];
  }, [ordersData, selectedMonth, selectedDay, selectedOrderState, selectedInventoryLocation]);

  // Filter data based on selected filters (using dynamicFilteredData)
  const filteredData = dynamicFilteredData;

  // Calculate metrics
  const totalOrders = useMemo(() => {
    return new Set(filteredData.map(order => order.orderID)).size;
  }, [filteredData]);

  // Calculate total actual days and average days for all filtered data
  const totalActualDaysAll = useMemo(() => filteredData.reduce((sum, d) => sum + (d.actualDays || 0), 0), [filteredData]);
  const averageDaysAll = useMemo(() => filteredData.length === 0 ? 0 : (filteredData.reduce((sum, d) => sum + (d.actualDays || 0), 0) / filteredData.length).toFixed(2), [filteredData]);

  // Calculate clear order metrics
  const orderMetrics = useMemo(() => {
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
      return [];
    }
    const preferredProcessOrder = ['Procurement', 'Production', 'Invoice', 'Dispatch', 'Payment'];
    const result = preferredProcessOrder.map(proc => {
      const sum = filteredData
        .filter(item => item.process === proc)
        .reduce((acc, item) => acc + (item.actualDays || 0), 0);
      return { Process: proc, ActualDays: sum };
    }).filter(d => d.ActualDays > 0);
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
    return result;
  }, [displayData]);

  // Additional metrics
  const formatThousands = (num) => num >= 1000 ? `${(num / 1000).toFixed(2)}K` : num;

  // Generate subprocess data from filtered results with fixed order
  const subprocessData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }
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
    const result = fixedSubprocessOrder.map(subprocess => ({
      name: subprocess.length > 20 ? subprocess.substring(0, 17) + '...' : subprocess,
      fullName: subprocess,
      'On Time': subprocessCounts[subprocess]?.onTime || 0,
      'Delay': subprocessCounts[subprocess]?.delay || 0,
      total: (subprocessCounts[subprocess]?.onTime || 0) + (subprocessCounts[subprocess]?.delay || 0)
    }));
    return result;
  }, [filteredData]);

  // Calculate min, max, and average of process-level actual days per order for gauge meter
  const processActualDaysStats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }
    // Group by process: for each process, sum actual days and count unique order IDs
    const processStats = {};
    filteredData.forEach(order => {
      if (!processStats[order.process]) {
        processStats[order.process] = { sum: 0, orderIDs: new Set() };
      }
      processStats[order.process].sum += order.actualDays || 0;
      if (order.orderID) processStats[order.process].orderIDs.add(order.orderID);
    });
    // For each process, calculate average days per order
    const avgs = Object.values(processStats)
      .map(stat => stat.orderIDs.size > 0 ? stat.sum / stat.orderIDs.size : 0)
      .filter(avg => !isNaN(avg));
    if (avgs.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...avgs);
    const max = Math.max(...avgs);
    const avg = (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2);
    return { min, max, avg };
  }, [filteredData]);

  // Enhanced gauge chart component (crisp, dynamic, and visually impressive)
  // For Order to Cash Credit Timeline, use processActualDaysStats
  const GaugeChart = ({ value, min, max }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    const numValue = parseFloat(value) || 0;
    // Use provided min and max for gauge
    const gaugeMin = min !== undefined ? min : 0;
    const gaugeMax = max !== undefined && max > gaugeMin ? max : gaugeMin + 1;
    // Animate the value for smooth transition
    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedValue(numValue);
      }, 200);
      return () => clearTimeout(timer);
    }, [numValue]);
    // Gauge layout constants
    const arcStartX = 60;
    const arcEndX = 280;
    const arcY = 170;
    const numberY = 200; // below arc
    const labelY = 218; // further below
    const centerX = 170;
    const centerY = 170;
    return (
      <div className="relative flex flex-col items-center">
        <div className="relative mb-2">
          <svg width="340" height="280" viewBox="0 0 340 280" className="filter drop-shadow-lg">
            {/* Arc background with gradient */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            {/* Arc */}
            <path
              d="M 60,170 A 110,110 0 0,1 280,170"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="32"
              strokeLinecap="round"
            />
            {/* Value label (big, center) - positioned in center of semi-circle */}
            <text x={centerX} y="135" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#fff" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }}>
              {animatedValue.toFixed(2)}
            </text>
            {/* Label below value */}
            <text x={centerX} y="155" textAnchor="middle" fontSize="14" fill="#a3e635" fontWeight="bold">
              Avg Days
            </text>
            {/* Min/Max value labels below arc */}
            <g>
              {/* CHANGED: show only integer values for min and max */}
              <text x="60" y={numberY + 20} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#fff">{Math.round(gaugeMin)}</text>
              <text x="280" y={numberY + 20} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#fff">{Math.round(gaugeMax)}</text>
              {/* Small 'min' and 'max' text below numbers */}
              <text x="60" y={labelY + 20} textAnchor="middle" fontSize="11" fill="#a3e635">min</text>
              <text x="280" y={labelY + 20} textAnchor="middle" fontSize="11" fill="#a3e635">max</text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // Generate table data from filtered results
  const tableData = useMemo(() => {
    const uniqueOrderIDs = [...new Set(filteredData.map(order => order.orderID))];
    return uniqueOrderIDs.map(orderID => {
      const orderRecords = filteredData.filter(order => order.orderID === orderID);
      // Use Sub Actual Start Date and Sub Actual End Date for date columns
      const subActualStartDates = orderRecords.map(order => order.startDate).filter(date => date);
      const subActualEndDates = orderRecords.map(order => order.endDate).filter(date => date);
      const actualDays = Math.max(...orderRecords.map(order => order.actualDays));
      const earliestStart = subActualStartDates.length > 0 ? new Date(Math.min(...subActualStartDates)) : null;
      const latestEnd = subActualEndDates.length > 0 ? new Date(Math.max(...subActualEndDates)) : null;
      return {
        orderID,
        startDate: earliestStart ? format(earliestStart, 'dd MMM yyyy') : 'N/A',
        endDate: latestEnd ? format(latestEnd, 'dd MMM yyyy') : 'N/A',
        actualDays
      };
    }).sort((a, b) => a.orderID.localeCompare(b.orderID));
  }, [filteredData]);

  // Procurement-specific filtered data
  const procurementData = useMemo(() => filteredData.filter(d => d.process === 'Procurement'), [filteredData]);

  // Procurement metrics
  const procurementTotalOrders = useMemo(() => new Set(procurementData.map(order => order.orderID)).size, [procurementData]);
  const procurementTotalActualDays = useMemo(() => procurementData.reduce((sum, d) => sum + (d.actualDays || 0), 0), [procurementData]);
  const procurementAverageDays = useMemo(() => {
    // Calculate average days per order (sum of actual days for each order, then average)
    if (procurementData.length === 0) return 0;
    const orderIDs = [...new Set(procurementData.map(order => order.orderID))];
    const orderSums = orderIDs.map(orderID => {
      return procurementData.filter(order => order.orderID === orderID).reduce((sum, d) => sum + (d.actualDays || 0), 0);
    });
    return orderSums.length === 0 ? 0 : (orderSums.reduce((a, b) => a + b, 0) / orderSums.length).toFixed(2);
  }, [procurementData]);

  // Generate table data with status and pagination
  const { procurementTableData, totalPages, totalFilteredOrders } = useMemo(() => {
    const uniqueOrderIDs = [...new Set(procurementData.map(order => order.orderID))];
    const allOrders = uniqueOrderIDs.map(orderID => {
      const orderRecords = procurementData.filter(order => order.orderID === orderID);
      // Start Date: earliest valid Sub Actual Start Date from original CSV field
      const subStartDates = orderRecords
        .map(order => {
          if (!order.subActualStartDate || order.subActualStartDate === 'N/A') return null;
          const d = new Date(order.subActualStartDate);
          return isNaN(d) ? null : d;
        })
        .filter(date => date);
      // End Date: latest valid Sub Actual End Date from original CSV field
      const subEndDates = orderRecords
        .map(order => {
          if (!order.subActualEndDate || order.subActualEndDate === 'N/A') return null;
          const d = new Date(order.subActualEndDate);
          return isNaN(d) ? null : d;
        })
        .filter(date => date);
      // Actual Days: sum of 'Actual Days' for all subprocesses of that order
      const actualDaysSum = orderRecords.reduce((sum, order) => sum + (order.actualDays || 0), 0);
      const earliestSubStart = subStartDates.length > 0 ? new Date(Math.min(...subStartDates)) : null;
      const latestSubEnd = subEndDates.length > 0 ? new Date(Math.max(...subEndDates)) : null;
      
      // Determine overall status based on procurement processes only
      const procurementProcesses = orderRecords.filter(record => record.process === 'Procurement');
      const procurementStatuses = procurementProcesses.map(record => record.statusType?.trim()).filter(Boolean);
      const hasDelay = procurementStatuses.some(status => status === 'Delay');
      const hasOnTime = procurementStatuses.some(status => status === 'On Time');
      
      let overallStatus = 'Unknown';
      if (hasDelay) {
        overallStatus = 'Delay';
      } else if (hasOnTime) {
        overallStatus = 'On Time';
      }
      
      return {
        orderID,
        startDate: earliestSubStart ? format(earliestSubStart, 'dd MMM yyyy') : 'N/A',
        endDate: latestSubEnd ? format(latestSubEnd, 'dd MMM yyyy') : 'N/A',
        actualDays: actualDaysSum,
        status: overallStatus
      };
    }).sort((a, b) => a.orderID.localeCompare(b.orderID));
    
    // Apply filters
    let filteredOrders;
    if (selectedSubprocessFilter) {
      // Apply subprocess filter first
      filteredOrders = allOrders.filter(order => {
        const orderRecords = procurementData.filter(record => record.orderID === order.orderID);
        const hasMatch = orderRecords.some(record => 
          record.subprocess?.trim() === selectedSubprocessFilter.subprocess?.trim() && 
          record.statusType?.trim() === selectedSubprocessFilter.statusType?.trim()
        );
        return hasMatch;
      });
      
      // Then apply status filter on top of subprocess filter if not 'All'
      if (selectedStatusFilter !== 'All') {
        filteredOrders = filteredOrders.filter(order => order.status?.trim() === selectedStatusFilter?.trim());
      }
      
      console.log('Subprocess filter active:', selectedSubprocessFilter);
      console.log('Status filter active:', selectedStatusFilter);
      console.log('Filtered orders:', filteredOrders.length, 'out of', allOrders.length);
    } else {
      // Only apply status filter if no subprocess filter is active
      filteredOrders = selectedStatusFilter === 'All' 
        ? allOrders 
        : allOrders.filter(order => order.status?.trim() === selectedStatusFilter?.trim());
      console.log('Status filter active:', selectedStatusFilter);
      console.log('Filtered orders:', filteredOrders.length, 'out of', allOrders.length);
    }
    
    // Calculate pagination
    const totalFilteredOrders = filteredOrders.length;
    const totalPages = Math.ceil(totalFilteredOrders / itemsPerPage);
    
    // Get current page data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    return {
      procurementTableData: paginatedOrders,
      totalPages,
      totalFilteredOrders
    };
  }, [procurementData, selectedStatusFilter, selectedSubprocessFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatusFilter, selectedSubprocessFilter]);

  // Allow both filters to work together - no need to clear subprocess filter when status filter changes

  // Procurement subprocess bar chart data (ordered by Subprocess Sequence from CSV)
  const procurementSubprocessData = useMemo(() => {
    if (!procurementData || procurementData.length === 0) return [];
    // Group by subprocess and get min sequence for each
    const subprocessMap = {};
    procurementData.forEach(order => {
      if (order.subprocess) {
        if (!subprocessMap[order.subprocess]) {
          subprocessMap[order.subprocess] = {
            name: order.subprocess.length > 20 ? order.subprocess.substring(0, 17) + '...' : order.subprocess,
            fullName: order.subprocess,
            'On Time': 0,
            'Delay': 0,
            total: 0,
            sequence: order.subprocessSequence || 9999
          };
        }
        if (order.statusType === 'On Time') {
          subprocessMap[order.subprocess]['On Time']++;
        } else if (order.statusType === 'Delay') {
          subprocessMap[order.subprocess]['Delay']++;
        }
        subprocessMap[order.subprocess].total++;
        // Always keep the minimum sequence for this subprocess
        if (order.subprocessSequence && order.subprocessSequence < subprocessMap[order.subprocess].sequence) {
          subprocessMap[order.subprocess].sequence = order.subprocessSequence;
        }
      }
    });
    // Sort by sequence
    return Object.values(subprocessMap)
      .sort((a, b) => (a.sequence || 9999) - (b.sequence || 9999));
  }, [procurementData]);

  // Calculate procurement min/max/avg for gauge
  const procurementGaugeStats = useMemo(() => {
    if (procurementData.length === 0) return { min: 0, max: 1, avg: 0 };
    const orderIDs = [...new Set(procurementData.map(order => order.orderID))];
    const orderSums = orderIDs.map(orderID => {
      return procurementData.filter(order => order.orderID === orderID).reduce((sum, d) => sum + (d.actualDays || 0), 0);
    });
    if (orderSums.length === 0) return { min: 0, max: 1, avg: 0 };
    const min = Math.min(...orderSums);
    const max = Math.max(...orderSums);
    const avg = orderSums.reduce((a, b) => a + b, 0) / orderSums.length;
    // If all values are the same, expand the range for better visual
    if (min === max) {
      return { min: Math.max(0, avg - 1), max: avg + 1, avg: avg.toFixed(2) };
    }
    return { min, max, avg: avg.toFixed(2) };
  }, [procurementData]);

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

      {/* Order to Cash Credit Timeline Section (title) */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-left text-white">
          Order to Cash Credit Timeline
        </h2>

        {/* Filters (dynamic, below Order to Cash Credit Timeline title) */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedDay('All');
                  setSelectedOrderState('All');
                  setSelectedInventoryLocation('All');
                  setSelectedOrderID('All');
                }}
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
                onChange={(e) => {
                  setSelectedDay(e.target.value);
                  setSelectedOrderState('All');
                  setSelectedInventoryLocation('All');
                  setSelectedOrderID('All');
                }}
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
                onChange={(e) => {
                  setSelectedOrderState(e.target.value);
                  setSelectedInventoryLocation('All');
                  setSelectedOrderID('All');
                }}
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
                onChange={(e) => {
                  setSelectedInventoryLocation(e.target.value);
                  setSelectedOrderID('All');
                }}
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

        {/* Metrics Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Number of Orders Card */}
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Number of Orders
            </h3>
            <div className="text-4xl font-bold text-blue-400 mb-2">{totalOrders}</div>
            <div className="text-xs text-gray-300 uppercase tracking-wider">Total Orders</div>
          </div>
          {/* Average Days Gauge (average for all filtered data) */}
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Average Days Analysis
            </h3>
            <GaugeChart value={processActualDaysStats.avg} min={processActualDaysStats.min} max={processActualDaysStats.max} />
          </div>
        </div>

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
                    <Cell key={index} fill="#00FF7F" />
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
      </div>

      {/* Procurement Timeline Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-left text-white">
          Procurement Timeline
        </h2>
        {/* Filters (dynamic, below Procurement Timeline title) */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedDay('All');
                  setSelectedOrderState('All');
                  setSelectedInventoryLocation('All');
                  setSelectedOrderID('All');
                }}
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
                onChange={(e) => {
                  setSelectedDay(e.target.value);
                  setSelectedOrderState('All');
                  setSelectedInventoryLocation('All');
                  setSelectedOrderID('All');
                }}
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
                onChange={(e) => {
                  setSelectedOrderState(e.target.value);
                  setSelectedInventoryLocation('All');
                  setSelectedOrderID('All');
                }}
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
                onChange={(e) => {
                  setSelectedInventoryLocation(e.target.value);
                  setSelectedOrderID('All');
                }}
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
        {/* Metrics Cards Row (Procurement only) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Number of Orders Card */}
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Number of Orders
            </h3>
            <div className="text-4xl font-bold text-blue-400 mb-2">{procurementTotalOrders}</div>
            <div className="text-xs text-gray-300 uppercase tracking-wider">Total Orders</div>
          </div>
          {/* Average Days Gauge */}
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Average Days Analysis
            </h3>
            <GaugeChart value={procurementGaugeStats.avg} min={procurementGaugeStats.min} max={procurementGaugeStats.max} />
          </div>
        </div>
        {/* Subprocess Bar Chart (Procurement only, ordered by sequence) */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Count of Order ID by Subprocess and Status Type</h3>
            {selectedSubprocessFilter && (
              <button 
                onClick={() => setSelectedSubprocessFilter(null)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Clear Filter ({selectedSubprocessFilter.subprocess})
              </button>
            )}
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={procurementSubprocessData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                <Bar 
                  dataKey="Delay" 
                  stackId="a" 
                  fill="#ef4444" 
                  name="Delay" 
                  cursor="pointer"
                  onClick={(data) => {
                    console.log('Delay bar clicked:', data);
                    if (data && data.payload) {
                      setSelectedSubprocessFilter({
                        subprocess: data.payload.fullName,
                        statusType: "Delay"
                      });
                    }
                  }}
                />
                <Bar 
                  dataKey="On Time" 
                  stackId="a" 
                  fill="#10b981" 
                  name="On Time" 
                  cursor="pointer"
                  onClick={(data) => {
                    console.log('On Time bar clicked:', data);
                    if (data && data.payload) {
                      setSelectedSubprocessFilter({
                        subprocess: data.payload.fullName,
                        statusType: "On Time"
                      });
                    }
                  }}
                />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-400 mt-2 text-center">
              Click on any bar to filter the Order Details table by that subprocess and status combination
            </p>
          </div>
          {/* Procurement Order Details Table (Procurement only, at bottom of page) */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mt-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">
                Order Details
                {selectedSubprocessFilter && (
                  <span className="ml-2 text-sm font-normal text-blue-300">
                    (Filtered by: {selectedSubprocessFilter.subprocess})
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-300">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalFilteredOrders)} of {totalFilteredOrders} orders
              </div>
            </div>
            {/* Status Filter Switch - Left Aligned */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Filter by Status:</span>
              {selectedSubprocessFilter && (
                <span className="text-xs text-green-400 font-medium">
                  (Combined with subprocess filter)
                </span>
              )}
              <div className="flex bg-blue-900/50 rounded-lg p-1">
                {['All', 'On Time', 'Delay'].map(status => {
                  const isSelected = selectedStatusFilter === status;
                  let selectedClasses = '';
                  let hoverClasses = 'text-gray-300 hover:text-white hover:bg-blue-700/50';
                  
                  if (isSelected) {
                    if (status === 'On Time') {
                      selectedClasses = 'bg-green-600 text-white shadow-md shadow-green-600/50 ring-2 ring-green-400/30';
                    } else if (status === 'Delay') {
                      selectedClasses = 'bg-red-600 text-white shadow-md shadow-red-600/50 ring-2 ring-red-400/30';
                    } else {
                      selectedClasses = 'bg-blue-600 text-white shadow-md';
                    }
                  } else {
                    if (status === 'On Time') {
                      hoverClasses = 'text-gray-300 hover:text-white hover:bg-green-700/50';
                    } else if (status === 'Delay') {
                      hoverClasses = 'text-gray-300 hover:text-white hover:bg-red-700/50';
                    }
                  }
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatusFilter(status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                        isSelected ? selectedClasses : hoverClasses
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 text-sm uppercase tracking-wider border-b border-blue-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {procurementTableData.map((row, index) => (
                    <tr key={index} className="bg-blue-950/80 hover:bg-blue-600/50 transition-colors duration-200 border-b border-blue-600">
                      <td className="py-4 px-6 text-white font-medium border-b border-blue-600">{row.orderID}</td>
                      <td className="py-4 px-6 text-gray-200 border-b border-blue-600">{row.startDate}</td>
                      <td className="py-4 px-6 text-gray-200 border-b border-blue-600">{row.endDate}</td>
                      <td className="py-4 px-6 text-gray-200 font-medium border-b border-blue-600">{row.actualDays}</td>
                      <td className="py-4 px-6 border-b border-blue-600">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'On Time' 
                            ? 'bg-green-600 text-white shadow-md' 
                            : row.status === 'Delay' 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'bg-gray-500 text-white'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {procurementTableData.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 px-6 text-center text-gray-400 bg-blue-950/80 border-b border-blue-600">
                        No orders found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-blue-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
              
              <div className="text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
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
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === "All" ? "All" : (label === "Day" ? `Day ${opt}` : opt)}
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

//Fixed Gauge number to being shown centre aligned 
