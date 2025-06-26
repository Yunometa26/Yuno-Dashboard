'use client'

import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function ProductionPlanningPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedLine, setSelectedLine] = useState('All')
  const [selectedSKU, setSelectedSKU] = useState('All')
  const [selectedDate, setSelectedDate] = useState('All')
  
  // Month toggle states
  const [selectedMonths, setSelectedMonths] = useState({
    june: true,
    july: true,
    august: true
  })
  
  // Filter options
  const [lines, setLines] = useState(['All'])
  const [skus, setSKUs] = useState(['All'])
  const [dates, setDates] = useState(['All'])
  
  // Filtered data for Gantt chart
  const [filteredData, setFilteredData] = useState([])
  
  // Additional state for new charts
  const [selectedChartDate, setSelectedChartDate] = useState(null)

  // Load CSV data
  useEffect(() => {
    fetch('/Merged_FMCG_Production_Data.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            console.log('Production data loaded:', result.data.length, 'records')
            setData(result.data)
            
            // Extract unique values for filters
            const uniqueLines = [...new Set(result.data.map(item => item.Line).filter(Boolean))]
            const uniqueSKUs = [...new Set(result.data.map(item => item.SKU).filter(Boolean))]
            const uniqueDates = [...new Set(result.data.map(item => {
              if (item['Production Start DateTime']) {
                return item['Production Start DateTime'].split(' ')[0] // Extract date part
              }
              return null
            }).filter(Boolean))]
            
            console.log('Unique lines found:', uniqueLines)
            console.log('Unique SKUs found:', uniqueSKUs.length, 'SKUs')
            console.log('Unique dates found:', uniqueDates.length, 'dates')
            
            // Sort lines in numeric order (Line-1, Line-2, ..., Line-10, Line-11, etc.)
            const sortedLines = uniqueLines.sort((a, b) => {
              const numA = parseInt(a.replace('Line-', ''))
              const numB = parseInt(b.replace('Line-', ''))
              return numA - numB
            })
            setLines(['All', ...sortedLines])
            setSKUs(['All', ...uniqueSKUs.sort()])
            setDates(['All', ...uniqueDates.sort()])
            setLoading(false)
          },
          error: (error) => {
            console.error('Error parsing CSV:', error)
            setLoading(false)
          }
        })
      })
      .catch(error => {
        console.error('Error fetching CSV:', error)
        setLoading(false)
      })
  }, [])

  // Filter data based on selected filters
  useEffect(() => {
    let filtered = [...data]
    
    if (selectedLine !== 'All') {
      filtered = filtered.filter(item => item.Line === selectedLine)
    }
    
    if (selectedSKU !== 'All') {
      filtered = filtered.filter(item => item.SKU === selectedSKU)
    }
    
    if (selectedDate !== 'All') {
      filtered = filtered.filter(item => {
        if (item['Production Start DateTime']) {
          return item['Production Start DateTime'].split(' ')[0] === selectedDate
        }
        return false
      })
    }
    
    // Filter by selected months
    const activeMonths = Object.keys(selectedMonths).filter(month => selectedMonths[month])
    if (activeMonths.length > 0 && activeMonths.length < 3) {
      filtered = filtered.filter(item => {
        if (item['Production Start DateTime']) {
          const date = new Date(item['Production Start DateTime'])
          const month = date.getMonth() + 1 // getMonth() returns 0-11
          
          return (
            (activeMonths.includes('june') && month === 6) ||
            (activeMonths.includes('july') && month === 7) ||
            (activeMonths.includes('august') && month === 8)
          )
        }
        return false
      })
    }
    
    setFilteredData(filtered)
  }, [data, selectedLine, selectedSKU, selectedDate, selectedMonths])

  // Handle month toggle
  const handleMonthToggle = (month) => {
    setSelectedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }))
  }

  // Additional data processing for new charts
  const isSameDate = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()

  const chartFilteredData = selectedChartDate
    ? data.filter((d) => {
        const orderDate = new Date(d['Order Date'])
        return !isNaN(orderDate) && isSameDate(orderDate, selectedChartDate)
      })
    : data

  const totalOrders = new Set(chartFilteredData.map((d) => d['Order ID'])).size
  const totalSKUs = new Set(chartFilteredData.map((d) => d['SKU'])).size
  const totalQty = chartFilteredData.reduce((sum, d) => sum + (parseFloat(d.Quantity) || 0), 0)

  const qtyByPriority = chartFilteredData.reduce((acc, row) => {
    const p = row['Priority'] || 'Unknown'
    const q = parseFloat(row.Quantity) || 0
    acc[p] = (acc[p] || 0) + q
    return acc
  }, {})
  const priorityTotal = Object.values(qtyByPriority).reduce((a, b) => a + b, 0)

  const groupByDate = (arr, field, key) => {
    const map = {}
    arr.forEach((row) => {
      const dateObj = new Date(row[field])
      if (!dateObj || isNaN(dateObj)) return
      const dateStr = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      map[dateStr] = map[dateStr] || { dateStr, dateObj, value: 0 }
      map[dateStr].value += parseFloat(row[key]) || 0
    })
    return Object.values(map)
      .sort((a, b) => a.dateObj - b.dateObj)
      .map(({ dateStr, value }) => ({ date: dateStr, value }))
  }

  const orderReceivedData = groupByDate(data, 'Order Date', 'Quantity')
  const productionStartData = groupByDate(
    chartFilteredData,
    'Production Start DateTime',
    'Planned Quantity'
  )

  const handleChartClick = (e) => {
    if (!e || !e.activeLabel) return
    const parts = e.activeLabel.split(' ')
    const day = parseInt(parts[0], 10)
    const month = new Date(`${parts[1]} 1`).getMonth()
    const year = parseInt(parts[2], 10)
    setSelectedChartDate(new Date(year, month, day))
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-blue-800 text-white p-2 rounded shadow text-sm">
          <p className="font-semibold">{label}</p>
          <p>Order Qty: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] flex items-center justify-center">
        <div className="text-white text-xl">Loading Production Data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673]">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-12 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 align-middle text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    Production Planning
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* KPI Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-6">
          <div className="p-4 rounded-xl shadow flex flex-col justify-center items-center text-center" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="text-3xl font-bold text-white">{totalOrders}</div>
            <div className="text-sm text-gray-300">Total Orders</div>
          </div>
          <div className="p-4 rounded-xl shadow flex flex-col justify-center items-center text-center" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="text-3xl font-bold text-white">{totalSKUs}</div>
            <div className="text-sm text-gray-300">Total Number of SKU</div>
          </div>
          <div className="p-4 rounded-xl shadow flex flex-col justify-center items-center text-center" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="text-3xl font-bold text-white">{(totalQty / 1_000).toFixed(1)}K</div>
            <div className="text-sm text-gray-300">Sum of Quantity</div>
          </div>
          <div className="p-4 rounded-xl shadow" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <table className="text-sm w-full">
              <thead>
                <tr>
                  <th className="text-left text-white">Priority</th>
                  <th className="text-right text-white">Sum of Quantity</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(qtyByPriority).map(([p, sum]) => (
                  <tr key={p}>
                    <td className="text-gray-300">{p}</td>
                    <td className="text-right text-gray-300">{sum.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-gray-600">
                  <td className="text-white">Total</td>
                  <td className="text-right text-white">{priorityTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders Received Per Day Chart */}
        <div className="rounded-lg shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Orders Received Per Day
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={orderReceivedData} onClick={handleChartClick}>
                <XAxis
                  dataKey="date"
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12, angle: -45, textAnchor: 'end' }}
                  interval={0}
                  height={80}
                />
                <YAxis stroke="#fff" tick={{ fill: '#fff', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#39FF14" cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
            <p
              className="text-sm text-center mt-2 cursor-pointer underline text-white"
              onClick={() => setSelectedChartDate(null)}
            >
              {selectedChartDate ? 'Reset to Total' : ''}
            </p>
          </div>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' }}></div>
        </div>

        {/* Orders Planned Per Day Chart */}
        <div className="rounded-lg shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Orders Planned Per Day
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={productionStartData}>
                <XAxis
                  dataKey="date"
                  stroke="#fff"
                  tick={{ fill: '#fff', fontSize: 12, angle: -45, textAnchor: 'end' }}
                  interval={0}
                  height={80}
                />
                <YAxis stroke="#fff" tick={{ fill: '#fff', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#00FFFF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' }}></div>
        </div>

        {/* Filter Section */}
        <div className="rounded-lg shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Line Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Line</label>
                <select
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#024673] focus:border-[#024673]"
                >
                  {lines.map(line => (
                    <option key={line} value={line}>{line}</option>
                  ))}
                </select>
              </div>

              {/* SKU Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">SKU</label>
                <select
                  value={selectedSKU}
                  onChange={(e) => setSelectedSKU(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#024673] focus:border-[#024673]"
                >
                  {skus.map(sku => (
                    <option key={sku} value={sku}>{sku}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Production Start Date</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#024673] focus:border-[#024673]"
                >
                  {dates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' }}></div>
        </div>

        {/* Gantt Chart Section */}
        <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h3 className="text-xl font-semibold text-white">Production Schedule - Gantt Chart</h3>
              
              {/* Month Toggle Controls */}
              <div className="flex gap-6 items-center">
                {[
                  { key: 'june', label: 'June', color: '#10b981' },
                  { key: 'july', label: 'July', color: '#3b82f6' },
                  { key: 'august', label: 'August', color: '#8b5cf6' }
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-white text-sm font-medium">{label}</span>
                    <button
                      onClick={() => handleMonthToggle(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent ${
                        selectedMonths[key]
                          ? 'shadow-lg'
                          : 'bg-gray-600/40'
                      }`}
                      style={{
                        backgroundColor: selectedMonths[key] ? color : undefined,
                        boxShadow: selectedMonths[key] 
                          ? `0 4px 12px ${color}40, 0 0 0 1px rgba(255, 255, 255, 0.1)` 
                          : '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-in-out ${
                          selectedMonths[key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                        style={{
                          boxShadow: selectedMonths[key]
                            ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                            : '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <GanttChart data={filteredData} />
          </div>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' }}></div>
        </div>

        {/* Production Summary Table */}
        <div className="rounded-lg shadow-md overflow-hidden mt-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Scheduling of SKU (Quantity)</h3>
            <ProductionSummaryTable data={filteredData} />
          </div>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' }}></div>
        </div>

        {/* Top SKUs Chart */}
        <div className="rounded-lg shadow-md overflow-hidden mt-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Top SKUs by Quantity (Thousands)</h3>
            <TopSKUsChart data={filteredData} />
          </div>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' }}></div>
        </div>

      </div>
    </div>
  )
} 

// Production Summary Table Component
function ProductionSummaryTable({ data }) {
  // Generate filtered scheduling data like the reference code
  const filteredSchedulingData = useMemo(() => {
    if (!data || data.length === 0) {
      return { dates: [], data: {} };
    }

    // Get all unique dates from the data
    const allDates = [...new Set(data.map(item => {
      if (item['Production Start DateTime']) {
        return item['Production Start DateTime'].split(' ')[0];
      }
      return null;
    }).filter(Boolean))].sort();

    // Group orders by line
    const dataByLine = {};
    data.forEach(item => {
      if (!item || !item['Production Start DateTime'] || !item.Line) return;
      
      const line = item.Line;
      if (!dataByLine[line]) {
        dataByLine[line] = [];
      }
      dataByLine[line].push(item);
    });

    // Process data similar to reference code
    const processedData = {};
    Object.entries(dataByLine).forEach(([line, orders]) => {
      processedData[line] = {};
      
      // Group orders by SKU for this line
      const skuOrders = {};
      orders.forEach(order => {
        if (!skuOrders[order.SKU]) {
          skuOrders[order.SKU] = {};
        }
        
        // For each day the order runs, add its quantity
        const startDate = new Date(order['Production Start DateTime']);
        const endDate = new Date(order['Production End DateTime']);
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (allDates.includes(dateStr)) {
              if (!skuOrders[order.SKU][dateStr]) {
                skuOrders[order.SKU][dateStr] = 0;
              }
              // Distribute quantity evenly across the production days
              const productionDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
              const plannedQuantity = parseFloat(order['Planned Quantity']) || 0;
              skuOrders[order.SKU][dateStr] += plannedQuantity / productionDays;
            }
          }
        }
      });
      
      processedData[line] = skuOrders;
    });

    return { dates: allDates, data: processedData };
  }, [data]);

  const scheduleData = filteredSchedulingData;

  if (!scheduleData.dates || scheduleData.dates.length === 0 || !scheduleData.data || Object.keys(scheduleData.data).length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">
        No production data available for schedule table.
      </div>
    )
  }

  // Function to format quantity values
  const formatQuantity = (value) => {
    if (!value || value === 0) return '-'
    return value.toLocaleString()
  }

  // Function to get color for quantity values
  const getQuantityColor = (value) => {
    if (!value || value === 0) return 'text-gray-500'
    return 'text-white'
  }

  return (
    <div className="overflow-auto rounded-xl" style={{ 
      backgroundColor: '#001F47',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      maxHeight: '400px'
    }}>
      <table className="w-full">
        {/* Table Header */}
        <thead>
          <tr style={{ backgroundColor: '#002654', borderBottom: '2px solid rgba(59, 130, 246, 0.3)' }}>
            <th className="text-left text-white font-semibold py-4 px-4 text-sm" style={{ 
              backgroundColor: 'rgba(0, 31, 71, 0.9)',
              borderRight: '1px solid rgba(59, 130, 246, 0.2)',
              position: 'sticky',
              left: 0,
              zIndex: 10,
              minWidth: '80px'
            }}>
              Line
            </th>
            <th className="text-left text-white font-semibold py-4 px-4 text-sm" style={{ 
              backgroundColor: 'rgba(0, 31, 71, 0.9)',
              borderRight: '1px solid rgba(59, 130, 246, 0.2)',
              position: 'sticky',
              left: '80px',
              zIndex: 10,
              minWidth: '100px'
            }}>
              SKU
            </th>
            {scheduleData.dates.map((date, index) => (
              <th 
                key={date} 
                className="text-center text-white font-semibold py-4 px-3 text-xs"
                style={{ 
                  backgroundColor: '#002654',
                  borderRight: index < scheduleData.dates.length - 1 ? '1px solid rgba(59, 130, 246, 0.2)' : 'none',
                  minWidth: '100px'
                }}
              >
                {date}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {Object.entries(scheduleData.data).map(([line, skus], lineIndex) =>
            Object.entries(skus).map(([sku, dates], skuIndex) => {
              const itemIndex = lineIndex * Object.keys(skus).length + skuIndex;
              return (
                <tr 
                  key={`${line}-${sku}`} 
                  className="group hover:bg-blue-900/20 transition-all duration-200"
                  style={{ 
                    backgroundColor: itemIndex % 2 === 0 ? 'rgba(0, 31, 71, 0.8)' : 'rgba(0, 31, 71, 0.6)',
                    borderBottom: '1px solid rgba(59, 130, 246, 0.15)'
                  }}
                >
                  <td className="text-white font-semibold py-3 px-4 text-sm" style={{ 
                    backgroundColor: itemIndex % 2 === 0 ? 'rgba(0, 31, 71, 0.9)' : 'rgba(0, 31, 71, 0.7)',
                    borderRight: '1px solid rgba(59, 130, 246, 0.2)',
                    position: 'sticky',
                    left: 0,
                    zIndex: 5
                  }}>
                    <span className="relative">
                      {line}
                      <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-400 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </span>
                  </td>
                  <td className="text-white font-semibold py-3 px-4 text-sm" style={{ 
                    backgroundColor: itemIndex % 2 === 0 ? 'rgba(0, 31, 71, 0.9)' : 'rgba(0, 31, 71, 0.7)',
                    borderRight: '1px solid rgba(59, 130, 246, 0.2)',
                    position: 'sticky',
                    left: '80px',
                    zIndex: 5
                  }}>
                    {sku}
                  </td>
                  {scheduleData.dates.map((date, dateIndex) => {
                    const quantity = dates[date] || 0
                    return (
                      <td 
                        key={date} 
                        className={`text-center py-3 px-3 text-xs font-medium ${getQuantityColor(quantity)}`}
                        style={{ 
                          borderRight: dateIndex < scheduleData.dates.length - 1 ? '1px solid rgba(59, 130, 246, 0.1)' : 'none'
                        }}
                      >
                        {formatQuantity(quantity)}
                      </td>
                    )
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// Top SKUs by Quantity Chart Component
function TopSKUsChart({ data }) {
  const [hoveredItem, setHoveredItem] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Aggregate quantities by SKU and collect additional info
  const skuData = data.reduce((acc, item) => {
    const sku = item.SKU
    const quantity = parseFloat(item['Planned Quantity']) || 0
    
    if (!sku || quantity === 0) return acc
    
    if (!acc[sku]) {
      acc[sku] = {
        totalQuantity: 0,
        orders: [],
        lines: new Set(),
        avgSpeed: 0,
        speedCount: 0
      }
    }
    
    acc[sku].totalQuantity += quantity
    acc[sku].orders.push(item['Order ID'])
    acc[sku].lines.add(item.Line)
    
    const speed = parseFloat(item['Speed (Units/hr)']) || 0
    if (speed > 0) {
      acc[sku].avgSpeed += speed
      acc[sku].speedCount += 1
    }
    
    return acc
  }, {})

  // Convert to array and sort by quantity (descending), take top 10
  const topSKUs = Object.entries(skuData)
    .sort(([,a], [,b]) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10)
         .map(([sku, data]) => ({
       sku,
       quantity: (data.totalQuantity / 2) / 1000, // Divide by 2 for duplicates, then convert to thousands
       orderCount: data.orders.length,
       lines: Array.from(data.lines),
       avgSpeed: data.speedCount > 0 ? Math.round(data.avgSpeed / data.speedCount) : 0,
       totalQuantityRaw: data.totalQuantity / 2 // Divide by 2 for duplicates
     }))

  if (topSKUs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">
        No SKU data available for chart.
      </div>
    )
  }

  // Find max value and round up to a nice number for single Y-axis label
  const actualMaxQuantity = Math.max(...topSKUs.map(item => item.quantity))
  
  // Round up to next nice number for single Y-axis label
  const getRoundedMax = (maxVal) => {
    if (maxVal <= 50) return 50
    if (maxVal <= 100) return 100
    if (maxVal <= 150) return 150
    if (maxVal <= 200) return 200
    if (maxVal <= 300) return 300
    if (maxVal <= 400) return 400
    if (maxVal <= 500) return 500
    if (maxVal <= 600) return 600
    if (maxVal <= 700) return 700
    return 800
  }
  
  const maxQuantity = getRoundedMax(actualMaxQuantity)
  const chartHeight = 300

  return (
    <div className="w-full px-4">
      <div className="relative bg-slate-800/30 rounded-lg p-6" style={{ height: `${chartHeight + 120}px` }}>
        {/* Y-axis title */}
        <div className="absolute left-6 top-2">
          <span className="text-white text-sm font-medium">Quantity (Thousands)</span>
        </div>

        {/* Y-axis labels - Labels for all grid lines */}
        <div className="absolute left-6 top-10 text-xs text-gray-300" style={{ height: `${chartHeight}px`, width: '60px' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
            const value = Math.round(maxQuantity - (index / 8) * maxQuantity)
            return (
              <div 
                key={index}
                className="flex items-center justify-end pr-2 absolute"
                style={{ top: `${(index / 8) * chartHeight}px` }}
              >
                <span>{value === 0 ? '0' : `${value}K`}</span>
              </div>
            )
          })}
        </div>

        {/* Chart area */}
        <div className="absolute left-20 top-10 right-6" style={{ height: `${chartHeight}px` }}>
          {/* Grid lines - Top line and lines below */}
          <div className="absolute inset-0">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div
                key={index}
                className="absolute w-full border-t border-gray-600/30"
                style={{ top: `${(index / 8) * chartHeight}px` }}
              />
            ))}
          </div>

          {/* Bars container */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-evenly px-4" style={{ height: `${chartHeight}px` }}>
            {topSKUs.map((item, index) => {
              const barHeight = (item.quantity / maxQuantity) * chartHeight
              return (
                <div key={`${item.sku}-${index}`} className="flex flex-col items-center group" style={{ width: '80px' }}>
                  {/* Bar */}
                  <div
                    className="w-12 rounded-t-md transition-all duration-300 hover:opacity-80 relative cursor-pointer"
                    style={{
                      height: `${Math.max(barHeight, 10)}px`,
                      background: '#ff6600',
                      boxShadow: '0 4px 12px rgba(255, 102, 0, 0.4)',
                      marginBottom: '0px'
                    }}
                    onMouseEnter={(e) => {
                      setHoveredItem(item)
                      setTooltipPosition({ x: e.clientX, y: e.clientY })
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                    onMouseMove={(e) => {
                      if (hoveredItem) {
                        setTooltipPosition({ x: e.clientX, y: e.clientY })
                      }
                    }}
                  >
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="absolute left-20 right-6 flex items-center justify-evenly px-4" style={{ bottom: '40px', height: '40px' }}>
          {topSKUs.map((item, index) => (
            <div key={`${item.sku}-${index}`} className="text-center" style={{ width: '80px' }}>
              <span className="text-white text-xs font-medium block leading-tight">
                {item.sku}
              </span>
            </div>
          ))}
        </div>

        {/* X-axis label */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <span className="text-white text-sm font-medium">SKU</span>
        </div>
      </div>

      {/* Custom Tooltip */}
      {hoveredItem && (
        <div
          className="fixed z-50 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-sm font-semibold mb-2 text-blue-200">SKU Details</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">SKU:</span>
              <span className="font-medium">{hoveredItem.sku}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Total Quantity:</span>
              <span className="font-medium">{hoveredItem.totalQuantityRaw?.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Quantity (Thousands):</span>
              <span className="font-medium">{hoveredItem.quantity.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Number of Orders:</span>
              <span className="font-medium">{hoveredItem.orderCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Production Lines:</span>
              <span className="font-medium">{hoveredItem.lines.join(', ')}</span>
            </div>
            {hoveredItem.avgSpeed > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-300">Avg Speed:</span>
                <span className="font-medium">{hoveredItem.avgSpeed} units/hr</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Gantt Chart Component
function GanttChart({ data }) {
  const [hoveredItem, setHoveredItem] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // First group by Order ID to consolidate duplicate orders (same order with multiple SKUs)
  const orderMap = data.reduce((acc, item) => {
    const orderId = item['Order ID']
    if (!acc[orderId]) {
      acc[orderId] = {
        ...item,
        skus: [item.SKU],
        totalQuantity: parseFloat(item.Quantity) || 0
      }
    } else {
      // Add SKU to list and sum quantities
      if (!acc[orderId].skus.includes(item.SKU)) {
        acc[orderId].skus.push(item.SKU)
      }
      acc[orderId].totalQuantity += parseFloat(item.Quantity) || 0
    }
    return acc
  }, {})

  // Convert back to array with consolidated orders
  const consolidatedData = Object.values(orderMap)

  // Group consolidated data by production line and sort lines numerically
  const groupedData = consolidatedData.reduce((acc, item) => {
    const line = item.Line
    if (!acc[line]) {
      acc[line] = []
    }
    acc[line].push(item)
    return acc
  }, {})

  // Function to assign lanes to orders to prevent overlaps
  const assignLanes = (orders) => {
    const lanes = []
    const ordersWithLanes = orders
      .filter(item => item['Production Start DateTime'] && item['Production End DateTime'])
      .map(order => {
        const startDate = new Date(order['Production Start DateTime'])
        const endDate = new Date(order['Production End DateTime'])
        return { ...order, startDate, endDate, lane: -1 }
      })
      .sort((a, b) => {
        // Sort by start date first, then by end date if start dates are the same
        if (a.startDate.getTime() === b.startDate.getTime()) {
          return a.endDate - b.endDate
        }
        return a.startDate - b.startDate
      })

    ordersWithLanes.forEach(order => {
      // Find the first available lane
      let assignedLane = 0
      let laneFound = false

      while (!laneFound) {
        if (!lanes[assignedLane]) {
          lanes[assignedLane] = []
        }

        // Enhanced overlap detection - check for any time intersection
        const hasOverlap = lanes[assignedLane].some(existingOrder => {
          // Two orders overlap if one starts before the other ends
          const orderStart = order.startDate.getTime()
          const orderEnd = order.endDate.getTime()
          const existingStart = existingOrder.startDate.getTime()
          const existingEnd = existingOrder.endDate.getTime()
          
          // Check for any overlap: orders overlap if they intersect at any point
          return !(orderEnd < existingStart || orderStart > existingEnd)
        })

        if (!hasOverlap) {
          lanes[assignedLane].push(order)
          order.lane = assignedLane
          laneFound = true
        } else {
          assignedLane++
        }
      }
    })

    return { ordersWithLanes, totalLanes: Math.max(lanes.length, 1) }
  }

  // Sort production lines in numeric order and filter out undefined/null lines
  const sortedLines = Object.keys(groupedData)
    .filter(line => line && line !== 'undefined' && line !== 'null')
    .sort((a, b) => {
      const numA = parseInt(a.replace('Line-', ''))
      const numB = parseInt(b.replace('Line-', ''))
      return numA - numB
    })

  // Get unique dates from the dataset (same as used in filter)
  const uniqueDates = [...new Set(data.map(item => {
    if (item['Production Start DateTime']) {
      return item['Production Start DateTime'].split(' ')[0] // Extract date part
    }
    return null
  }).filter(Boolean))].sort()

  // If no dates available, return empty message
  if (uniqueDates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No production data to display. Please select filters to view the schedule.
      </div>
    )
  }

  const getTaskPosition = (startDateTime, endDateTime) => {
    // Check for undefined or null values
    if (!startDateTime || !endDateTime) {
      return {
        left: '0%',
        width: '0%'
      }
    }
    
    // Extract date part from start and end datetime
    const startDate = startDateTime.split(' ')[0] // Start date (YYYY-MM-DD)
    const endDate = endDateTime.split(' ')[0]     // End date (YYYY-MM-DD)
    
    // Find the position of start and end dates in our timeline
    const startIndex = uniqueDates.indexOf(startDate)
    const endIndex = uniqueDates.indexOf(endDate)
    
    // If dates are not found in timeline, hide the task
    if (startIndex === -1 || endIndex === -1) {
      return {
        left: '0%',
        width: '0%'
      }
    }
    
    // Calculate position based on fixed column widths - ensure exact alignment
    const fixedColumnWidth = columnWidth // Use the same columnWidth as header
    const leftPosition = startIndex * fixedColumnWidth + 2 // 2px padding from column start
    const dateSpan = Math.max(1, endIndex - startIndex + 1) // Span from start to end date
    const widthSpan = dateSpan * fixedColumnWidth - 4 // Subtract 4px for padding between columns
    
    return {
      left: `${leftPosition}px`,
      width: `${widthSpan}px`
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-blue-500'
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No production data to display. Please select filters to view the schedule.
      </div>
    )
  }

  // Calculate minimum width based on number of dates for better scrolling
  const minChartWidth = Math.max(1200, uniqueDates.length * 100) // Minimum 100px per date column
  const columnWidth = Math.max(80, 100) // Fixed column width for consistency

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl shadow-2xl" style={{ 
        backgroundColor: '#001F47',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ minWidth: `${minChartWidth}px`, width: '100%' }}>
        {/* Timeline Header */}
        <div className="flex sticky top-0 z-10" style={{ 
          backgroundColor: '#002654',
          borderBottom: '2px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="text-sm font-semibold text-white py-4 px-4 flex-shrink-0 flex items-center" style={{ 
            backgroundColor: 'rgba(0, 31, 71, 0.9)', 
            width: '128px',
            borderRight: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            Production Line
          </div>
          <div className="flex">
            {uniqueDates.map((date, index) => (
              <div 
                key={index} 
                className="text-xs text-white px-3 py-4 text-center font-semibold flex-shrink-0 transition-colors duration-200 hover:bg-blue-600/20"
                style={{ 
                  width: `${columnWidth}px`, 
                  backgroundColor: '#002654',
                  borderRight: index < uniqueDates.length - 1 ? '1px solid rgba(59, 130, 246, 0.2)' : 'none'
                }}
              >
                {new Date(date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: '2-digit'
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Gantt Rows */}
        {sortedLines.map((line) => {
          const lineData = groupedData[line]
          const { ordersWithLanes, totalLanes } = assignLanes(lineData)
          const rowHeight = Math.max(50, totalLanes * 32) // Minimum 50px, 32px per lane
          
          return (
            <div key={line} className="flex group hover:bg-blue-900/20 transition-all duration-200" style={{ 
              backgroundColor: '#001F47',
              borderBottom: '1px solid rgba(59, 130, 246, 0.15)'
            }}>
              <div className="text-sm font-semibold text-white py-3 px-4 flex items-center flex-shrink-0" style={{ 
                backgroundColor: 'rgba(0, 31, 71, 0.8)', 
                width: '128px',
                borderRight: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <span className="relative">
                  {line}
                  <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-400 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </span>
              </div>
              <div className="relative py-3" style={{ 
                minHeight: `${rowHeight}px`, 
                backgroundColor: 'rgba(0, 31, 71, 0.6)', 
                width: `${uniqueDates.length * columnWidth}px`,
                borderImage: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%) 1'
              }}>
                {ordersWithLanes.map((item, index) => {
                  const position = getTaskPosition(
                    item['Production Start DateTime'], 
                    item['Production End DateTime']
                  )
                  const laneTop = item.lane * 28 + 4 // 28px spacing between lanes, 4px top margin
                  
                  return (
                                                                <div
                        key={index}
                        className={`absolute h-6 rounded-md ${getPriorityColor(item.Priority)} opacity-95 hover:opacity-100 cursor-pointer border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
                        style={{
                          ...position,
                          minWidth: '30px',
                          top: `${laneTop}px`,
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                        }}
                        onMouseEnter={(e) => {
                          setHoveredItem(item)
                          setTooltipPosition({ x: e.clientX, y: e.clientY })
                        }}
                        onMouseLeave={() => setHoveredItem(null)}
                        onMouseMove={(e) => {
                          if (hoveredItem) {
                            setTooltipPosition({ x: e.clientX, y: e.clientY })
                          }
                        }}
                      >
                        <div className="text-xs text-white px-2 truncate font-semibold leading-6 tracking-wide text-center">
                          {item['Order ID'].replace(/^ORD/i, '')}
                        </div>
                      </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        </div>
      </div>
      
      {/* Legend - Fixed outside scrollable area */}
      <div className="mt-6 flex gap-6 text-sm justify-center">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 31, 71, 0.4)' }}>
          <div className="w-4 h-4 bg-red-500 rounded-md shadow-sm"></div>
          <span className="text-white font-medium">High Priority</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 31, 71, 0.4)' }}>
          <div className="w-4 h-4 bg-yellow-500 rounded-md shadow-sm"></div>
          <span className="text-white font-medium">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 31, 71, 0.4)' }}>
          <div className="w-4 h-4 bg-green-500 rounded-md shadow-sm"></div>
          <span className="text-white font-medium">Low Priority</span>
        </div>
      </div>

      {/* Custom Tooltip */}
      {hoveredItem && (
        <div
          className="fixed z-50 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-sm font-semibold mb-2 text-blue-200">Order Details</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Order ID:</span>
              <span className="font-medium">{hoveredItem['Order ID']}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">SKUs:</span>
              <span className="font-medium">{hoveredItem.skus ? hoveredItem.skus.join(', ') : hoveredItem.SKU}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Priority:</span>
              <span className={`font-medium ${
                hoveredItem.Priority === 'High' ? 'text-red-400' :
                hoveredItem.Priority === 'Medium' ? 'text-yellow-400' :
                hoveredItem.Priority === 'Low' ? 'text-green-400' : 'text-blue-400'
              }`}>
                {hoveredItem.Priority}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Total Quantity:</span>
              <span className="font-medium">{(hoveredItem.totalQuantity || hoveredItem.Quantity)?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Planned Qty:</span>
              <span className="font-medium">{hoveredItem['Planned Quantity']?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Speed:</span>
              <span className="font-medium">{hoveredItem['Speed (Units/hr)']} Units/hr</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Start Date:</span>
              <span className="font-medium">{hoveredItem['Production Start DateTime']?.split(' ')[0]}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Start Time:</span>
              <span className="font-medium">{hoveredItem['Production Start DateTime']?.split(' ')[1]}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">End Date:</span>
              <span className="font-medium">{hoveredItem['Production End DateTime']?.split(' ')[0]}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">End Time:</span>
              <span className="font-medium">{hoveredItem['Production End DateTime']?.split(' ')[1]}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
//Added Gantt chart\