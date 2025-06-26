"use client";

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { ResponsiveBar } from '@nivo/bar';

export default function ProductionPlanningPage() {
  const [productionData, setProductionData] = useState([]);
  const [selectedLine, setSelectedLine] = useState('All');
  const [selectedSKU, setSelectedSKU] = useState('All');
  const [selectedDate, setSelectedDate] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('June'); // New month selector
  const [isLineDropdownOpen, setIsLineDropdownOpen] = useState(false);
  const [isSKUDropdownOpen, setIsSKUDropdownOpen] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  const [selectedChartDate, setSelectedChartDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Colors for priority
  const PRIORITY_COLORS = {
    High: "#ef4444",
    Medium: "#f59e0b",
    Low: "#10b981",
    Normal: "#3b82f6"
  };

  // Get unique production lines
  const productionLines = useMemo(() => {
    const lines = new Set(productionData.map(item => item.ProductionLine));
    const sortedLines = Array.from(lines).sort((a, b) => {
      // Extract numbers from Line-X format and sort numerically
      const numA = parseInt(a.replace('Line-', '')) || 0;
      const numB = parseInt(b.replace('Line-', '')) || 0;
      return numA - numB;
    });
    return ['All', ...sortedLines].filter(Boolean);
  }, [productionData]);

  // Get unique SKUs
  const skuList = useMemo(() => {
    const skus = new Set(productionData.map(item => item.SKU));
    return ['All', ...Array.from(skus)].filter(Boolean).sort();
  }, [productionData]);

  // Sort production lines numerically
  const sortedProductionLines = useMemo(() => {
    const lines = productionLines.filter(line => line !== 'All');
    return ['All', ...lines.sort((a, b) => {
      const numA = parseInt(a.replace('Line-', ''));
      const numB = parseInt(b.replace('Line-', ''));
      return numA - numB;
    })];
  }, [productionLines]);

  // Get unique dates for the date filter
  const dates = useMemo(() => {
    return Array.from(new Set(productionData.map(item => 
      item.StartDate.toISOString().split('T')[0]
    ))).sort();
  }, [productionData]);

  // Handle line filter changes
  const handleLineFilterChange = (line) => {
    setSelectedLine(line);
    setIsLineDropdownOpen(false);
  };

  // Handle SKU filter changes
  const handleSKUFilterChange = (sku) => {
    setSelectedSKU(sku);
    setIsSKUDropdownOpen(false);
  };

  // Handle tooltip show
  const handleTooltipShow = (event, orderData) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: event.clientX + 10,
      y: event.clientY - 10,
      data: orderData
    });
  };

  // Handle tooltip hide
  const handleTooltipHide = () => {
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  // Handle chart bar click
  const handleChartBarClick = (data, index) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedDate = data.activePayload[0].payload.fullDate;
      setSelectedChartDate(clickedDate === selectedChartDate ? null : clickedDate);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const lineDropdown = document.getElementById('line-filter-dropdown');
      const skuDropdown = document.getElementById('sku-filter-dropdown');
      
      if (lineDropdown && !lineDropdown.contains(event.target)) {
        setIsLineDropdownOpen(false);
      }
      if (skuDropdown && !skuDropdown.contains(event.target)) {
        setIsSKUDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load CSV data from 'Merged_FMCG_Production_Data.csv'
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/Merged_FMCG_Production_Data.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("Raw CSV Parse Results:", results.data);

            // Remove duplicates and process data
            const uniqueRows = [];
            const seenKeys = new Set();

            results.data.forEach(row => {
              // Create a unique key for each production entry
              const uniqueKey = `${row["Order ID"]}-${row.Line}-${row.SKU}-${row["Production Start DateTime"]}-${row["Production End DateTime"]}`;
              
              if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                uniqueRows.push(row);
              }
            });

            const processed = uniqueRows.map(row => {
              const line = row.Line || '';
              const sku = row.SKU || '';
              const quantity = parseFloat(row.Quantity || '0');
              const plannedQuantity = parseFloat(row["Planned Quantity"] || '0');
              const speed = parseFloat(row["Speed (Units/hr)"] || '0');
              const startDateTime = row["Production Start DateTime"] || '';
              const endDateTime = row["Production End DateTime"] || '';
              const priority = row.Priority || 'Normal';
              const orderId = row["Order ID"] || 'N/A';
              const orderDateStr = row["Order Date"] || '';

              // Clean up datetime strings - remove milliseconds if present
              const cleanStartDateTime = startDateTime.replace(/\.\d+$/, '');
              const cleanEndDateTime = endDateTime.replace(/\.\d+$/, '');

              const startDate = new Date(cleanStartDateTime);
              const endDate = new Date(cleanEndDateTime);
              const orderDate = orderDateStr ? new Date(orderDateStr) : null;

              return {
                ProductionLine: line.trim(),
                SKU: sku.trim(),
                Quantity: quantity,
                PlannedQuantity: plannedQuantity,
                Speed: speed,
                StartDate: isNaN(startDate.getTime()) ? null : startDate,
                EndDate: isNaN(endDate.getTime()) ? null : endDate,
                OrderDate: orderDate && !isNaN(orderDate.getTime()) ? orderDate : null,
                Priority: priority.trim(),
                OrderID: String(orderId).trim(),
                line: line.trim(),
                startDateTime: cleanStartDateTime,
                endDateTime: cleanEndDateTime,
                orderId: String(orderId).trim(),
                priority: priority.trim(),
                sku: sku.trim()
              };
            }).filter(item =>
              item.StartDate !== null &&
              item.ProductionLine !== '' &&
              item.SKU !== ''
            );

            console.log("Processed data:", processed.slice(0, 5));
            console.log("Total processed items:", processed.length);
            setProductionData(processed);
            setLoading(false);
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Month-based date range function
  const getMonthDateRange = (month) => {
    // Base year for consistency
    const year = 2025;
    
    let startMonth, endMonth, startDay = 1, endDay;
    
    switch (month) {
      case 'June':
        startMonth = 5; // June is month 5 (0-indexed)
        endMonth = 5;
        endDay = 30;
        break;
      case 'July':
        startMonth = 6; // July is month 6 (0-indexed)
        endMonth = 6;
        endDay = 31;
        break;
      case 'August':
        startMonth = 7; // August is month 7 (0-indexed)
        endMonth = 7;
        endDay = 31;
        break;
      default:
        startMonth = 5;
        endMonth = 5;
        endDay = 30;
    }

    // Scan the production data to find actual order dates within this month
    const monthlyOrders = productionData.filter(order => {
      if (!order.StartDate) return false;
      const orderMonth = order.StartDate.getMonth();
      const orderYear = order.StartDate.getFullYear();
      return orderYear === year && orderMonth === startMonth;
    });

    if (monthlyOrders.length === 0) {
      // If no orders found, return the default full month range
      const firstDate = new Date(year, startMonth, startDay);
      const lastDate = new Date(year, endMonth, endDay);
      const totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        first: firstDate.toISOString().split('T')[0],
        last: lastDate.toISOString().split('T')[0],
        totalDays
      };
    }

    // Find the actual range of order dates
    const orderDates = monthlyOrders.map(order => order.StartDate);
    const minDate = new Date(Math.min(...orderDates));
    const maxDate = new Date(Math.max(...orderDates));
    
    // Ensure we show the complete range from first order through end of month
    const firstOrderDate = minDate;
    const endOfMonth = new Date(year, endMonth, endDay);
    
    const totalDays = Math.ceil((endOfMonth - firstOrderDate) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      first: firstOrderDate.toISOString().split('T')[0],
      last: endOfMonth.toISOString().split('T')[0],
      totalDays
    };
  };

  // Filter data based on selected month, line, SKU, and date
  const filteredData = useMemo(() => {
    let filtered = productionData;

    // Filter by month first
    const monthDateRange = getMonthDateRange(selectedMonth);
    const startDate = new Date(monthDateRange.first);
    const endDate = new Date(monthDateRange.last);
    
    filtered = filtered.filter(item => {
      if (!item.StartDate) return false;
      const itemDate = new Date(item.StartDate);
      return itemDate >= startDate && itemDate <= endDate;
    });

    // Apply other filters
    if (selectedLine !== 'All') {
      filtered = filtered.filter(item => item.ProductionLine === selectedLine);
    }
    if (selectedSKU !== 'All') {
      filtered = filtered.filter(item => item.SKU === selectedSKU);
    }
    if (selectedDate !== 'All') {
      filtered = filtered.filter(item => 
        item.StartDate && item.StartDate.toISOString().split('T')[0] === selectedDate
      );
    }
    if (selectedChartDate) {
      filtered = filtered.filter(item => 
        item.StartDate && item.StartDate.toISOString().split('T')[0] === selectedChartDate
      );
    }

    return filtered;
  }, [productionData, selectedMonth, selectedLine, selectedSKU, selectedDate, selectedChartDate]);

  // Generate schedule data for the selected month
  const scheduleData = useMemo(() => {
    if (!productionData || productionData.length === 0) {
      return { dates: [], data: {}, totalDays: 0 };
    }

    const monthDateRange = getMonthDateRange(selectedMonth);
    const startDate = new Date(monthDateRange.first);
    const endDate = new Date(monthDateRange.last);
    const totalDays = monthDateRange.totalDays;

    console.log(`${selectedMonth} Schedule Data:`, {
      selectedMonth,
      dateRange: monthDateRange,
      filteredDataCount: filteredData.length,
      sampleOrders: filteredData.slice(0, 3).map(o => ({
        id: o.OrderID,
        line: o.ProductionLine,
        start: o.StartDate?.toISOString(),
        end: o.EndDate?.toISOString()
      })),
      allDatesShown: Array.from({ length: totalDays }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date.toISOString().split('T')[0];
      })
    });

    // Generate all dates for the month range
    const dates = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Group orders by production line
    const dataByLine = {};
    filteredData.forEach(item => {
      if (!item || !item.StartDate || !item.ProductionLine) return;
      
      const line = item.ProductionLine;
      if (!dataByLine[line]) {
        dataByLine[line] = [];
      }
      dataByLine[line].push(item);
    });

    return { dates, data: dataByLine, totalDays };
  }, [filteredData, selectedMonth, productionData]);

  // Process data for Gantt chart visualization
  const ganttData = useMemo(() => {
    if (!scheduleData.dates || scheduleData.dates.length === 0) {
      return [];
    }

    return Object.entries(scheduleData.data).map(([line, orders]) => {
      return {
        line,
        orders: orders.map((order, idx) => {
          const startTime = new Date(order.StartDate);
          const endTime = new Date(order.EndDate);
          
          // Calculate position within the date range
          const firstDate = new Date(scheduleData.dates[0]);
          const lastDate = new Date(scheduleData.dates[scheduleData.dates.length - 1]);
          
          const totalRangeMs = lastDate.getTime() - firstDate.getTime();
          const startOffsetMs = startTime.getTime() - firstDate.getTime();
          const orderDurationMs = endTime.getTime() - startTime.getTime();
          
          const startPosition = (startOffsetMs / totalRangeMs) * scheduleData.totalDays;
          const endPosition = ((startOffsetMs + orderDurationMs) / totalRangeMs) * scheduleData.totalDays;
          
          return {
            ...order,
            idx,
            startTime,
            endTime,
            startPosition: Math.max(0, startPosition),
            endPosition: Math.min(scheduleData.totalDays, endPosition),
            totalDays: scheduleData.totalDays
          };
        })
      };
    });
  }, [scheduleData]);

  // Generate filtered SKU quantities
  const skuQuantities = useMemo(() => {
    const skuTotals = filteredData.reduce((acc, item) => {
      if (!acc[item.SKU]) {
        acc[item.SKU] = 0;
      }
      acc[item.SKU] += item.PlannedQuantity;
      return acc;
    }, {});

    return Object.entries(skuTotals)
      .map(([sku, quantity]) => ({
        sku,
        quantity: Math.round(quantity / 100000) // Convert to lakhs
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10 SKUs
  }, [filteredData]);

  // Generate filtered scheduling data
  const filteredSchedulingData = useMemo(() => {
    if (!scheduleData.dates || scheduleData.dates.length === 0) {
      return null;
    }

    const data = {};
    Object.entries(scheduleData.data).forEach(([line, orders]) => {
      data[line] = {};
      
      // Group orders by SKU for this line
      const skuOrders = {};
      orders.forEach(order => {
        if (!skuOrders[order.SKU]) {
          skuOrders[order.SKU] = {};
        }
        
        // For each day the order runs, add its quantity
        const startDate = new Date(order.StartDate);
        const endDate = new Date(order.EndDate);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          if (scheduleData.dates.includes(dateStr)) {
            if (!skuOrders[order.SKU][dateStr]) {
              skuOrders[order.SKU][dateStr] = 0;
            }
            // Distribute quantity evenly across the production days
            const productionDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            skuOrders[order.SKU][dateStr] += order.PlannedQuantity / productionDays;
          }
        }
      });
      
      data[line] = skuOrders;
    });

    return { dates: scheduleData.dates, data };
  }, [scheduleData]);

  if (!productionData || productionData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6 flex items-center justify-center">
        <div className="text-xl">Loading production data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Production Planning</h1>
      </div>

      {/* Month Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="relative bg-gray-700/50 backdrop-blur-sm rounded-xl p-1 border border-gray-600/50 shadow-lg">
          <div 
            className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-300 ease-out shadow-md"
            style={{
              left: selectedMonth === 'June' ? '4px' : selectedMonth === 'July' ? '124px' : '244px',
              width: '120px'
            }}
          />
          {['June', 'July', 'August'].map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`relative z-10 px-6 py-3 min-w-[120px] text-sm font-semibold rounded-lg transition-all duration-300 ${
                selectedMonth === month
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Production Line Filter */}
          <div className="relative" id="line-filter-dropdown">
            <label className="block text-sm font-medium mb-2">Production Line</label>
            <button
              onClick={() => setIsLineDropdownOpen(!isLineDropdownOpen)}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white text-left flex justify-between items-center"
            >
              <span>{selectedLine}</span>
              <span className={`transform transition-transform ${isLineDropdownOpen ? 'rotate-180' : ''}`}>↓</span>
            </button>
            {isLineDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a365d] border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {sortedProductionLines.map(line => (
                  <div
                    key={line}
                    onClick={() => handleLineFilterChange(line)}
                    className="px-3 py-2 hover:bg-blue-600 cursor-pointer text-white"
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SKU Filter */}
          <div className="relative" id="sku-filter-dropdown">
            <label className="block text-sm font-medium mb-2">SKU</label>
            <button
              onClick={() => setIsSKUDropdownOpen(!isSKUDropdownOpen)}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white text-left flex justify-between items-center"
            >
              <span>{selectedSKU.length > 20 ? `${selectedSKU.substring(0, 20)}...` : selectedSKU}</span>
              <span className={`transform transition-transform ${isSKUDropdownOpen ? 'rotate-180' : ''}`}>↓</span>
            </button>
            {isSKUDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a365d] border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {skuList.map(sku => (
                  <div
                    key={sku}
                    onClick={() => handleSKUFilterChange(sku)}
                    className="px-3 py-2 hover:bg-blue-600 cursor-pointer text-white text-sm"
                  >
                    {sku}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedLine !== 'All' || selectedSKU !== 'All' || selectedChartDate) && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setSelectedLine('All');
                setSelectedSKU('All');
                setSelectedChartDate(null);
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
            >
              Clear All Filters
            </button>
            {selectedChartDate && (
              <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">
                Date: {selectedChartDate} 
                <button 
                  onClick={() => setSelectedChartDate(null)}
                  className="ml-2 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Production Timeline - Gantt Chart */}
      <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Production Timeline ({selectedMonth})</h2>
        
        {/* Gantt Chart Container */}
        <div className="relative">
          {/* Date Headers */}
          <div className="flex mb-2 overflow-x-auto">
            <div className="min-w-[150px] p-2 bg-blue-900/50 border-r border-blue-600 font-semibold text-center">
              Production Line
            </div>
            <div 
              className="flex"
              style={{ 
                width: `${scheduleData.totalDays * 400}px`, // Dynamic width based on days
                minWidth: `${scheduleData.totalDays * 400}px`
              }}
            >
              {scheduleData.dates && scheduleData.dates.map(date => (
                <div 
                  key={date} 
                  className="min-w-[400px] p-2 bg-blue-900/50 border-r border-blue-600 text-center font-semibold text-sm"
                  style={{ 
                    width: '400px',
                    borderRight: '2px solid #2563eb'
                  }}
                >
                  {format(new Date(date), 'MMM dd')}
                </div>
              ))}
            </div>
          </div>

          {/* Gantt Rows */}
          <div className="overflow-x-auto">
            {ganttData && ganttData.map(({ line, orders }) => {
              return (
              <div key={line} className="flex border-b border-blue-600 min-h-[90px]">
                <div className="min-w-[150px] p-3 bg-blue-950/80 border-r border-blue-600 flex items-center font-medium">
                  {line}
                </div>
                <div 
                  className="relative flex-1 bg-blue-900/30"
                  style={{ 
                    width: `${scheduleData.totalDays * 400}px`,
                    minWidth: `${scheduleData.totalDays * 400}px`
                  }}
                  id={`gantt-row-${line}`}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {scheduleData.dates && scheduleData.dates.map(date => (
                      <div 
                        key={date} 
                        className="border-r border-blue-600/30"
                        style={{ width: '400px' }}
                      />
                    ))}
                  </div>
                  
                  {/* Order blocks */}
                  <div className="relative h-full">
                   {(() => {
                     if (!orders || orders.length === 0) return null;

                     // Enhanced non-overlapping positioning algorithm
                     const positionedOrders = [];
                     const ROW_HEIGHT = 52; // Increased height for better horizontal boundary spacing
                     const COLUMN_WIDTH = 400; // Column width constant
                     const PADDING = 20; // Increased padding for better boundary spacing
                     const MIN_GAP = 15; // Minimum gap between order blocks
                     const rows = []; // Track occupied ranges in each row
                     
                     // Pre-calculate pixel positions for all orders with proper minimum width
                     const ordersWithPixels = orders.map(item => {
                       const startDayIndex = Math.floor(item.startPosition);
                       const endDayIndex = Math.floor(item.endPosition);
                       const idealLeftPx = (startDayIndex * COLUMN_WIDTH) + PADDING;
                       const idealRightPx = Math.min(((endDayIndex + 1) * COLUMN_WIDTH) - PADDING, (item.totalDays * COLUMN_WIDTH) - PADDING);
                       const idealWidthPx = idealRightPx - idealLeftPx;
                       
                       // Enforce minimum width and calculate actual dimensions
                       const actualWidthPx = Math.max(idealWidthPx, 180);
                       const actualRightPx = idealLeftPx + actualWidthPx;
                       
                       return {
                         ...item,
                         leftPx: idealLeftPx,
                         rightPx: actualRightPx,
                         widthPx: actualWidthPx
                       };
                     });
                     
                     // Sort orders by start position, then by end position for consistent placement
                     const sortedOrders = ordersWithPixels.sort((a, b) => {
                       if (a.leftPx === b.leftPx) {
                         return a.rightPx - b.rightPx; // If same start, place shorter one first
                       }
                       return a.leftPx - b.leftPx;
                     });
                     
                     sortedOrders.forEach((item, index) => {
                       let assignedRow = -1;
                       
                       // Try to find an existing row where this order can fit
                       for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                         let canFitInRow = true;
                         
                         // Check for overlap with ALL existing orders in this row
                         for (let existingOrder of rows[rowIndex]) {
                           // Check if there's overlap with sufficient gap
                           const hasOverlap = !(
                             item.rightPx + MIN_GAP <= existingOrder.leftPx || 
                             item.leftPx >= existingOrder.rightPx + MIN_GAP
                           );
                           
                           if (hasOverlap) {
                             canFitInRow = false;
                             break;
                           }
                         }
                         
                         if (canFitInRow) {
                           assignedRow = rowIndex;
                           rows[rowIndex].push({
                             leftPx: item.leftPx,
                             rightPx: item.rightPx,
                             order: item.order
                           });
                           break;
                         }
                       }
                       
                       // If no existing row works, create a new row
                       if (assignedRow === -1) {
                         assignedRow = rows.length;
                         rows.push([{
                           leftPx: item.leftPx,
                           rightPx: item.rightPx,
                           order: item.order
                         }]);
                       }
                       
                       const verticalOffset = assignedRow * ROW_HEIGHT;
                       positionedOrders.push({ ...item, verticalOffset, rowIndex: assignedRow });
                     });

                     // Calculate actual row height needed and update container with horizontal boundary padding
                     const maxOffset = positionedOrders.length > 0 ? Math.max(...positionedOrders.map(o => o.verticalOffset)) : 0;
                     const actualRowHeight = Math.max(90, maxOffset + 50); // Increased minimum height and bottom padding
                     
                     // Update the container height
                     setTimeout(() => {
                       const container = document.getElementById(`gantt-row-${line}`);
                       if (container) {
                         container.style.height = `${actualRowHeight}px`;
                       }
                     }, 0);

                     return positionedOrders.map(({ order, idx, startTime, endTime, startPosition, endPosition, totalDays, verticalOffset, leftPx, rightPx, widthPx }) => {
                       // Use pre-calculated pixel positions for accurate placement
                       const containerWidthPx = totalDays * COLUMN_WIDTH;
                       const leftPercent = (leftPx / containerWidthPx) * 100;
                       const widthPercent = (widthPx / containerWidthPx) * 100;
                    
                                           // Calculate duration in days and hours
                       const durationMs = endTime.getTime() - startTime.getTime();
                       const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
                       const durationHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                       
                       return (
                         <div
                           key={`${order.OrderID}-${idx}`}
                           className={`absolute rounded text-xs font-medium flex items-center justify-center text-center transition-all duration-200 hover:opacity-90 hover:scale-105 border-2 cursor-pointer shadow-sm ${
                             (order.Priority || order.priority) === 'High' ? 'bg-red-500/95 text-white border-red-300/50' :
                             (order.Priority || order.priority) === 'Medium' ? 'bg-yellow-500/95 text-black border-yellow-300/50' :
                             'bg-green-500/95 text-white border-green-300/50'
                           } ${widthPercent < 3 ? 'border-white/40' : ''}`}
                           style={{
                             left: `${Math.max(leftPercent, 0)}%`,
                             width: `${widthPercent}%`,
                             top: `${16 + verticalOffset}px`, // Increased top padding for horizontal boundaries
                             height: '36px',
                             minWidth: '180px',
                           }}
                           onMouseEnter={(e) => handleTooltipShow(e, {
                             orderID: order.OrderID || order.orderId || 'N/A',
                             sku: order.SKU || order.sku || 'N/A',
                             priority: order.Priority || order.priority || 'Normal',
                             productionLine: order.ProductionLine || order.line || 'N/A',
                             plannedQuantity: order.PlannedQuantity || 0,
                             speed: order.Speed || 0,
                             startTime: startTime.toLocaleString(),
                             endTime: endTime.toLocaleString(),
                             durationDays,
                             durationHours
                           })}
                           onMouseLeave={handleTooltipHide}
                         >
                           <span className="truncate px-1 text-xs font-medium whitespace-nowrap overflow-hidden">
                             {widthPercent < 3 ? (order.OrderID || order.orderId || 'N/A').replace('ORD', '').slice(-3) : (order.OrderID || order.orderId || 'N/A').replace('ORD', '')}
                           </span>
                         </div>
                       );
                     });
                   })()}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SKU Scheduling Section */}
      <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Scheduling of SKU (Quantity)</h2>
        
        {/* Scheduling Table */}
        <div className="relative mb-6">
          <div className="max-h-[500px] overflow-auto border-t border-b border-blue-600 rounded-lg">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 z-20 border-t border-b border-blue-600 bg-blue-950/80 p-2 text-left min-w-[120px] font-semibold text-gray-200 text-sm uppercase tracking-wider">Line</th>
                  <th className="sticky left-[120px] z-20 border-t border-b border-blue-600 bg-blue-950/80 p-2 text-left min-w-[150px] font-semibold text-gray-200 text-sm uppercase tracking-wider">SKU</th>
                  {filteredSchedulingData && filteredSchedulingData.dates && filteredSchedulingData.dates.map(date => (
                    <th key={date} className="border-t border-b border-blue-600 bg-blue-950/80 p-2 text-center min-w-[100px] whitespace-nowrap font-semibold text-gray-200 text-sm uppercase tracking-wider">
                      {format(new Date(date), 'yyyy-MM-dd')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSchedulingData && filteredSchedulingData.data && Object.entries(filteredSchedulingData.data).map(([line, skus]) =>
                  Object.entries(skus).map(([sku, dates]) => (
                    <tr key={`${line}-${sku}`} className="bg-blue-950/80 hover:bg-blue-600/50 transition-colors duration-200 border-b border-blue-600">
                      <td className="sticky left-0 z-10 border-b border-blue-600 bg-blue-950/80 p-2 min-w-[120px] text-white font-medium">{line}</td>
                      <td className="sticky left-[120px] z-10 border-b border-blue-600 bg-blue-950/80 p-2 min-w-[150px] text-white font-medium">{sku}</td>
                      {filteredSchedulingData && filteredSchedulingData.dates && filteredSchedulingData.dates.map(date => (
                        <td key={date} className="border-b border-blue-600 p-2 text-right min-w-[100px] text-gray-200">
                          {dates[date]?.toLocaleString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SKU Quantities Bar Chart */}
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-6">Top SKUs by Quantity (Lakhs)</h2>
          <div className="h-80">
            {skuQuantities && skuQuantities.length > 0 ? (
            <ResponsiveBar
              data={skuQuantities}
              keys={['quantity']}
              indexBy="sku"
              margin={{ top: 30, right: 30, bottom: 70, left: 80 }}
              padding={0.4}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={'#ff69b4'}
              borderRadius={4}
              borderColor={{
                from: 'color',
                modifiers: [['darker', 1.6]]
              }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 12,
                tickRotation: 0,
                legend: 'SKU',
                legendPosition: 'middle',
                legendOffset: 45,
                truncateTickAt: 0,
                tickComponent: ({ x, y, value }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fill: '#ffffff', fontSize: '10px' }}
                    >
                      {value}
                    </text>
                  </g>
                )
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Quantity (Lakhs)',
                legendPosition: 'middle',
                legendOffset: -60,
                tickValues: [0, 1, 2, 3, 4, 5, 6, 7],
                format: value => value === 0 ? '0' : `${value}L`,
              }}
              enableGridY={true}
              gridYValues={[0, 1, 2, 3, 4, 5, 6, 7]}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{
                from: 'color',
                modifiers: [['darker', 3]]
              }}
              role="application"
              ariaLabel="SKU quantities bar chart"
              barAriaLabel={e => `${e.id}: ${e.formattedValue} lakh units`}
              theme={{
                axis: {
                  domain: {
                    line: {
                      stroke: '#526488'
                    }
                  },
                  ticks: {
                    line: {
                      stroke: '#526488',
                      strokeWidth: 1
                    },
                    text: {
                      fill: '#ffffff',
                      fontSize: 11
                    }
                  },
                  legend: {
                    text: {
                      fill: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600
                    }
                  }
                },
                grid: {
                  line: {
                    stroke: '#526488',
                    strokeWidth: 1
                  }
                },
                legends: {
                  text: {
                    fill: '#ffffff'
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No data available for the selected filters</p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="fixed bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-600 z-50 max-w-xs"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-sm space-y-1">
            <div><strong>Order:</strong> {tooltip.data.orderID}</div>
            <div><strong>SKU:</strong> {tooltip.data.sku}</div>
            <div><strong>Priority:</strong> {tooltip.data.priority}</div>
            <div><strong>Line:</strong> {tooltip.data.productionLine}</div>
            <div><strong>Quantity:</strong> {tooltip.data.plannedQuantity?.toLocaleString()}</div>
            <div><strong>Speed:</strong> {tooltip.data.speed} units/hr</div>
            <div><strong>Start:</strong> {tooltip.data.startTime}</div>
            <div><strong>End:</strong> {tooltip.data.endTime}</div>
            <div><strong>Duration:</strong> {tooltip.data.durationDays}d {tooltip.data.durationHours}h</div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.location.href = "/production"}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Back to Production Dashboard
        </button>
      </div>
    </div>
  );
} 