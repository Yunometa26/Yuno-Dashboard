'use client'

import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import { MapPin, Filter, Calendar, Truck } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function RouteOptimizationPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState('All')
  const [selectedCFS, setSelectedCFS] = useState('All')
  const [selectedVehicleId, setSelectedVehicleId] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  
  // Filter options
  const [deliveryDates, setDeliveryDates] = useState(['All'])
  const [cfsOptions, setCfsOptions] = useState(['All'])
  const [vehicleIds, setVehicleIds] = useState(['All'])

  // Cascading filter options based on current selections
  const cascadingFilterOptions = useMemo(() => {
    // Start with all data
    let filteredForOptions = [...data]
    
    // Apply all active filters to get the constrained dataset
    if (selectedDeliveryDate !== 'All') {
      filteredForOptions = filteredForOptions.filter(item => item['Delivery Date'] === selectedDeliveryDate)
    }
    
    if (selectedCFS !== 'All') {
      filteredForOptions = filteredForOptions.filter(item => item['CFS'] === selectedCFS)
    }
    
    if (selectedVehicleId !== 'All') {
      filteredForOptions = filteredForOptions.filter(item => item['Vehicle ID'] === selectedVehicleId)
    }
    
    // Extract unique values for each filter based on what's currently selected
    const availableDeliveryDates = selectedCFS === 'All' && selectedVehicleId === 'All'
      ? [...new Set(data.map(item => item['Delivery Date']).filter(Boolean))]
      : [...new Set(filteredForOptions.map(item => item['Delivery Date']).filter(Boolean))]
    
    const availableCFS = selectedDeliveryDate === 'All' && selectedVehicleId === 'All'
      ? [...new Set(data.map(item => item['CFS']).filter(Boolean))]
      : [...new Set(filteredForOptions.map(item => item['CFS']).filter(Boolean))]
    
    const availableVehicleIds = selectedDeliveryDate === 'All' && selectedCFS === 'All'
      ? [...new Set(data.map(item => item['Vehicle ID']).filter(Boolean))]
      : [...new Set(filteredForOptions.map(item => item['Vehicle ID']).filter(Boolean))]
    
    return {
      deliveryDates: ['All', ...availableDeliveryDates.sort()],
      cfsOptions: ['All', ...availableCFS.sort()],
      vehicleIds: ['All', ...availableVehicleIds.sort()]
    }
  }, [data, selectedDeliveryDate, selectedCFS, selectedVehicleId])

  // Load CSV data
  useEffect(() => {
    fetch('/Route_Deviation_final_Data.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            console.log('Route deviation data loaded:', result.data.length, 'records')
            console.log('Available columns:', Object.keys(result.data[0] || {}))
            console.log('Sample data:', result.data.slice(0, 2))
            
            // Check for specific columns we need
            const firstRow = result.data[0] || {}
            console.log('Route Allocation column exists:', 'Route Allocation' in firstRow)
            console.log('Market column exists:', 'Market' in firstRow)
            console.log('Route Deviation column exists:', 'Route Deviation (%)' in firstRow)
            
            setData(result.data)
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

  // Reset dependent filters when any filter changes to prevent invalid combinations
  useEffect(() => {
    // When delivery date changes, reset other filters if they become invalid
    if (selectedDeliveryDate !== 'All') {
      const validCFS = [...new Set(data.filter(item => item['Delivery Date'] === selectedDeliveryDate).map(item => item['CFS']).filter(Boolean))]
      const validVehicles = [...new Set(data.filter(item => item['Delivery Date'] === selectedDeliveryDate).map(item => item['Vehicle ID']).filter(Boolean))]
      
      if (!validCFS.includes(selectedCFS) && selectedCFS !== 'All') {
        setSelectedCFS('All')
      }
      if (!validVehicles.includes(selectedVehicleId) && selectedVehicleId !== 'All') {
        setSelectedVehicleId('All')
      }
    }
  }, [selectedDeliveryDate, data, selectedCFS, selectedVehicleId])

  useEffect(() => {
    // When CFS changes, reset other filters if they become invalid
    if (selectedCFS !== 'All') {
      const validDates = [...new Set(data.filter(item => item['CFS'] === selectedCFS).map(item => item['Delivery Date']).filter(Boolean))]
      const validVehicles = [...new Set(data.filter(item => item['CFS'] === selectedCFS).map(item => item['Vehicle ID']).filter(Boolean))]
      
      if (!validDates.includes(selectedDeliveryDate) && selectedDeliveryDate !== 'All') {
        setSelectedDeliveryDate('All')
      }
      if (!validVehicles.includes(selectedVehicleId) && selectedVehicleId !== 'All') {
        setSelectedVehicleId('All')
      }
    }
  }, [selectedCFS, data, selectedDeliveryDate, selectedVehicleId])

  useEffect(() => {
    // When vehicle ID changes, reset other filters if they become invalid
    if (selectedVehicleId !== 'All') {
      const validDates = [...new Set(data.filter(item => item['Vehicle ID'] === selectedVehicleId).map(item => item['Delivery Date']).filter(Boolean))]
      const validCFS = [...new Set(data.filter(item => item['Vehicle ID'] === selectedVehicleId).map(item => item['CFS']).filter(Boolean))]
      
      if (!validDates.includes(selectedDeliveryDate) && selectedDeliveryDate !== 'All') {
        setSelectedDeliveryDate('All')
      }
      if (!validCFS.includes(selectedCFS) && selectedCFS !== 'All') {
        setSelectedCFS('All')
      }
    }
  }, [selectedVehicleId, data, selectedDeliveryDate, selectedCFS])

  // Filter data based on selected filters (excluding status filter for charts)
  const filteredData = useMemo(() => {
    let filtered = [...data]
    
    if (selectedDeliveryDate !== 'All') {
      filtered = filtered.filter(item => item['Delivery Date'] === selectedDeliveryDate)
    }
    
    if (selectedCFS !== 'All') {
      filtered = filtered.filter(item => item['CFS'] === selectedCFS)
    }
    
    if (selectedVehicleId !== 'All') {
      filtered = filtered.filter(item => item['Vehicle ID'] === selectedVehicleId)
    }
    
    return filtered
  }, [data, selectedDeliveryDate, selectedCFS, selectedVehicleId])

  // Filter data for table only (includes status filter)
  const tableFilteredData = useMemo(() => {
    let filtered = [...filteredData]
    
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(item => item['Deviation Status'] === selectedStatus)
    }
    
    return filtered
  }, [filteredData, selectedStatus])

  // Reset page when status filter changes
  useEffect(() => {
    setVehiclePage(1)
  }, [selectedStatus])

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalDeliveries = filteredData.length
    const onTimeDeliveries = filteredData.filter(item => item['Deviation Status'] === 'On time').length
    // Only consider nonzero deviations for average
    const nonZeroDeviations = filteredData
      .map(item => parseFloat(item['Route Deviation (%)']) || 0)
      .filter(deviation => deviation !== 0)
    const avgRouteDeviation = nonZeroDeviations.length > 0
      ? nonZeroDeviations.reduce((sum, val) => sum + val, 0) / nonZeroDeviations.length
      : 0
    // Calculate on time delivery percentage
    const onTimePercentage = totalDeliveries > 0 ? ((onTimeDeliveries / totalDeliveries) * 100).toFixed(1) + '%' : '0%';
    return {
      totalDeliveries: totalDeliveries.toLocaleString(),
      onTimeDeliveries: onTimePercentage,
      avgRouteDeviation: avgRouteDeviation.toFixed(2)
    }
  }, [filteredData])

  // Chart data
  const modeOfTransportData = useMemo(() => {
    const modes = filteredData.reduce((acc, item) => {
      let mode = item['Mode of Transport'] || 'Unknown'
      if (mode.toLowerCase() === 'road') mode = 'Road'
      acc[mode] = (acc[mode] || 0) + 1
      return acc
    }, {})
    // Remove 'Unknown' from the chart data
    return Object.entries(modes)
      .filter(([mode]) => mode !== 'Unknown')
      .map(([mode, count]) => ({
        mode,
        orders: count
      }))
  }, [filteredData])

  const routeDeviationData = useMemo(() => {
    console.log('Filtered data for route deviation:', filteredData.length, 'records')
    console.log('Sample data:', filteredData.slice(0, 3))
    
    const routes = filteredData.reduce((acc, item) => {
      // Check all possible column names for route allocation
      const route = item['Route Allocation'] || item['RouteAllocation'] || item['route_allocation'] || 'Unknown'
      const deviation = parseFloat(item['Route Deviation (%)']) || parseFloat(item['RouteDeviation']) || parseFloat(item['route_deviation']) || 0
      // Use market metric instead of orders - check for various possible column names
      const market = parseFloat(item['Market']) || parseFloat(item['market']) || parseFloat(item['Market Value']) || parseFloat(item['market_value']) || 0
      
      console.log('Processing item:', { route, deviation, market, item })
      
      if (!acc[route]) {
        acc[route] = { deviations: [], totalMarket: 0 }
      }
      if (deviation !== 0) {
        acc[route].deviations.push(deviation)
      }
      acc[route].totalMarket += market
      return acc
    }, {})
    
    console.log('Routes found:', routes)
    
    const result = Object.entries(routes)
      .filter(([route]) => route !== 'Unknown')
      .map(([route, data]) => ({
        route,
        deviation: data.deviations.length > 0 ? parseFloat((data.deviations.reduce((sum, d) => sum + d, 0) / data.deviations.length).toFixed(1)) : 0,
        market: data.deviations.length > 0 ? parseFloat((data.totalMarket / data.deviations.length).toFixed(1)) : 0
      }))
      .sort((a, b) => b.deviation - a.deviation)
    
    console.log('Final route deviation data:', result)
    return result
  }, [filteredData])

  const deviationStatusData = useMemo(() => {
    const status = filteredData.reduce((acc, item) => {
      const stat = item['Deviation Status'] || 'Unknown'
      acc[stat] = (acc[stat] || 0) + 1
      return acc
    }, {})
    // Remove 'Unknown' from the chart data
    return Object.entries(status)
      .filter(([status]) => status !== 'Unknown')
      .map(([status, count]) => ({
        status,
        count,
        percentage: ((count / filteredData.length) * 100).toFixed(1)
      }))
  }, [filteredData])

  // Brighter colors for deviation status
  const DEVIATION_COLORS = ['#FF4444', '#22D34F', '#FACC15', '#38BDF8']

  // Custom tooltip for donut chart with white text
  const DeviationTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-600 text-xs">
          <div className="font-semibold mb-1">{payload[0].payload.status}</div>
          <div>Orders: <span className="font-bold">{payload[0].value}</span></div>
          <div>Share: <span className="font-bold">{payload[0].payload.percentage}%</span></div>
        </div>
      )
    }
    return null
  }

  const containerTypeData = useMemo(() => {
    const containers = filteredData.reduce((acc, item) => {
      const container = item['Container Type'] || 'Unknown'
      acc[container] = (acc[container] || 0) + 1
      return acc
    }, {})
    // Remove 'Unknown' from the chart data
    return Object.entries(containers)
      .filter(([container]) => container !== 'Unknown')
      .map(([container, count]) => ({
        container,
        orders: count
      }))
  }, [filteredData])

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  // Pagination state for Vehicle Details
  const [vehiclePage, setVehiclePage] = useState(1)
  const VEHICLE_PAGE_SIZE = 20
  const vehiclePageCount = Math.ceil(tableFilteredData.length / VEHICLE_PAGE_SIZE)
  const paginatedVehicleData = useMemo(() => {
    const start = (vehiclePage - 1) * VEHICLE_PAGE_SIZE
    return tableFilteredData.slice(start, start + VEHICLE_PAGE_SIZE)
  }, [tableFilteredData, vehiclePage])

  const ModeOfTransportTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#001F47', color: '#fff', borderRadius: 8, padding: 12, border: '1px solid #333', fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#fff' }}>{label}</div>
          <div style={{ color: '#fff' }}>{payload[0].name} : <span style={{ fontWeight: 700, color: '#fff' }}>{payload[0].value}</span></div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] flex items-center justify-center">
        <div className="text-white text-xl">Loading Route Optimization Data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673]">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-8 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <MapPin className="h-10 w-10 text-white" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                      Route Optimization Dashboard
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section - Moved above KPI cards and center aligned */}
        <div className="rounded-lg shadow-md overflow-hidden mb-8" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Filters</h3>
              </div>
              <div className="flex items-center gap-4">
                {(selectedDeliveryDate !== 'All' || selectedCFS !== 'All' || selectedVehicleId !== 'All' || selectedStatus !== 'All') && (
                  <button
                    onClick={() => {
                      setSelectedDeliveryDate('All')
                      setSelectedCFS('All')
                      setSelectedVehicleId('All')
                      setSelectedStatus('All')
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                )}
                <div className="text-sm text-gray-300">
                  <span className="font-medium text-white">{filteredData.length.toLocaleString()}</span> records found
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white text-center">Delivery Date</label>
                  <select
                    value={selectedDeliveryDate}
                    onChange={(e) => setSelectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    {cascadingFilterOptions.deliveryDates.map(date => (
                      <option key={date} value={date} className="bg-gray-800 text-white">{date}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white text-center">CFS</label>
                  <select
                    value={selectedCFS}
                    onChange={(e) => setSelectedCFS(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    {cascadingFilterOptions.cfsOptions.map(cfs => (
                      <option key={cfs} value={cfs} className="bg-gray-800 text-white">{cfs}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white text-center">Vehicle ID</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    {cascadingFilterOptions.vehicleIds.map(id => (
                      <option key={id} value={id} className="bg-gray-800 text-white">{id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' }}></div>
        </div>

        {/* KPI Cards - Horizontal Row (moved below filters) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-6">
          <div className="rounded-lg shadow-md p-6 text-center" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Total Delivery</h3>
            <div className="text-3xl font-bold text-white">{kpis.totalDeliveries}</div>
          </div>
          <div className="rounded-lg shadow-md p-6 text-center" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-sm font-medium text-gray-300 mb-2">On time Delivery</h3>
            <div className="text-3xl font-bold text-white">{kpis.onTimeDeliveries}</div>
          </div>
          <div className="rounded-lg shadow-md p-6 text-center" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Avg route deviation</h3>
            <div className="text-3xl font-bold text-white">{kpis.avgRouteDeviation}</div>
          </div>
        </div>

        {/* First Row: Mode of Transport Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          {/* Orders by Mode of Transport */}
          <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4">Orders by Mode of Transport</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modeOfTransportData}>
                <XAxis dataKey="mode" stroke="#fff" tick={{ fill: '#fff' }} />
                <YAxis stroke="#fff" tick={{ fill: '#fff' }} />
                <Tooltip content={<ModeOfTransportTooltip />} />
                <Bar dataKey="orders">
                  {modeOfTransportData.map((entry, idx) => (
                    <Cell key={`cell-${entry.mode}`} fill={['Road', 'Rail'].includes(entry.mode) ? '#22D34F' : '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Legend - Only Road/Rail - Below chart and center aligned */}
            <div className="flex items-center justify-center mt-4">
              <div className="w-4 h-4 rounded mr-2" style={{ background: '#22D34F' }}></div>
              <span className="text-white text-sm">Road/Rail</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Orders by Container Type */}
          <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4">Orders by Container Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={containerTypeData}>
                <XAxis dataKey="container" stroke="#fff" tick={{ fill: '#fff' }} />
                <YAxis stroke="#fff" tick={{ fill: '#fff' }} />
                <Tooltip contentStyle={{ backgroundColor: '#001F47', color: '#fff', border: 'none' }} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="orders" fill="#FFA500" />
              </BarChart>
            </ResponsiveContainer>
            {/* Legend - Below chart and center aligned */}
            <div className="flex items-center justify-center mt-4">
              <div className="w-4 h-4 rounded mr-2" style={{ background: '#FFA500' }}></div>
              <span className="text-white text-sm">Container Orders</span>
            </div>
          </div>

          {/* Orders by Deviation Status */}
          <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4">Orders by Deviation Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviationStatusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  labelLine={false}
                  label={({ percent, status }) => `${status}: ${(percent * 100).toFixed(1)}%`}
                >
                  {deviationStatusData.map((entry, idx) => (
                    <Cell key={`cell-${entry.status}`} fill={DEVIATION_COLORS[idx % DEVIATION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DeviationTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend - Below chart and center aligned */}
            <div className="flex items-center justify-center gap-4 mt-4">
              {deviationStatusData.map((entry, idx) => (
                <div key={entry.status} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: DEVIATION_COLORS[idx % DEVIATION_COLORS.length] }}></div>
                  <span className="text-white text-sm">{entry.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row: Route Deviation Chart Full Width */}
        <div className="mb-8">
          <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4">Average Route Deviation (%) by Route Allocation</h3>
            {routeDeviationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={routeDeviationData.slice(0, 10)} layout="vertical">
                  <XAxis type="number" stroke="#fff" tick={{ fill: '#fff' }} />
                  <YAxis dataKey="route" type="category" stroke="#fff" tick={{ fill: '#fff', fontSize: 12 }} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#001F47', color: '#fff', border: 'none' }} 
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value, name) => [
                      <span style={{ color: '#fff' }}>{value}%</span>,
                      <span style={{ color: '#fff' }}>{name}</span>
                    ]}
                  />
                  <Bar dataKey="deviation" radius={[0, 4, 4, 0]}>
                    {(() => {
                      const deviations = routeDeviationData.slice(0, 10).map(entry => entry.deviation);
                      const minDev = Math.min(...deviations);
                      const maxDev = Math.max(...deviations);
                      const colorSteps = [
                        '#22D34F', // bright green
                        '#7FFF00', // chartreuse
                        '#C6FF00', // lime yellow
                        '#FFFF00', // yellow
                        '#FFD700', // gold
                        '#FFA500', // orange
                        '#FF6347', // tomato
                        '#FF4444'  // red
                      ];
                      return routeDeviationData.slice(0, 10).map((entry, idx) => {
                        const t = (entry.deviation - minDev) / (maxDev - minDev || 1);
                        // Map t to one of 8 color steps
                        const colorIdx = Math.min(
                          colorSteps.length - 1,
                          Math.floor(t * colorSteps.length)
                        );
                        return <Cell key={`cell-${entry.route}`} fill={colorSteps[colorIdx]} />;
                      });
                    })()}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <div>No route deviation data available</div>
                  <div className="text-xs mt-2">Check console for debugging info</div>
                </div>
              </div>
            )}
            {/* Legend - Below chart and center aligned */}
            <div className="flex flex-col items-center justify-center gap-2 mt-4">
              <span className="text-white text-sm">Deviation Level:</span>
              <div className="flex flex-col items-center gap-1">
                <div className="w-32 h-4 rounded" style={{ 
                  background: 'linear-gradient(to right, #22D34F, #7FFF00, #C6FF00, #FFFF00, #FFD700, #FFA500, #FF6347, #FF4444)' 
                }}></div>
                <div className="flex justify-between w-32 text-xs text-white">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-lg shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-semibold text-white">Vehicle Details</h3>
              
              {/* Status Filter Slider */}
              <div className="relative">
                <div className="flex bg-gray-700 rounded-lg p-0.5 w-64 items-center" style={{ position: 'relative', height: '36px' }}>
                  {/* Slider Background */}
                  <div 
                    className="absolute top-0.5 bottom-0.5 rounded-md transition-all duration-300 ease-in-out"
                    style={{
                      left: selectedStatus === 'All' ? '2px' : selectedStatus === 'On time' ? '33.33%' : '66.66%',
                      width: '33.33%',
                      background: selectedStatus === 'All' 
                        ? 'linear-gradient(90deg, #3B82F6, #2563EB)' 
                        : selectedStatus === 'On time'
                        ? 'linear-gradient(90deg, #22D34F, #16A34A)'
                        : 'linear-gradient(90deg, #EF4444, #DC2626)',
                      boxShadow: selectedStatus === 'All' 
                        ? '0 0 15px rgba(59, 130, 246, 0.5)' 
                        : selectedStatus === 'On time'
                        ? '0 0 15px rgba(34, 211, 79, 0.5)'
                        : '0 0 15px rgba(239, 68, 68, 0.5)'
                    }}
                  />
                  {/* All Option */}
                  <button
                    onClick={() => setSelectedStatus('All')}
                    className="relative z-10 flex-1 py-1 px-3 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center"
                    style={{
                      color: selectedStatus === 'All' ? '#FFFFFF' : '#9CA3AF',
                      height: '32px'
                    }}
                  >
                    All
                  </button>
                  {/* On Time Option */}
                  <button
                    onClick={() => setSelectedStatus('On time')}
                    className="relative z-10 flex-1 py-1 px-3 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center"
                    style={{
                      color: selectedStatus === 'On time' ? '#FFFFFF' : '#9CA3AF',
                      height: '32px'
                    }}
                  >
                    On Time
                  </button>
                  {/* Delay Option */}
                  <button
                    onClick={() => setSelectedStatus('Delay')}
                    className="relative z-10 flex-1 py-1 px-3 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center"
                    style={{
                      color: selectedStatus === 'Delay' ? '#FFFFFF' : '#9CA3AF',
                      height: '32px'
                    }}
                  >
                    Delay
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status Count Display */}
            <div className="flex justify-center mb-4 space-x-8">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {tableFilteredData.filter(item => item['Deviation Status'] === 'On time').length}
                </div>
                <div className="text-xs text-gray-300">On Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">
                  {tableFilteredData.filter(item => item['Deviation Status'] === 'Delay').length}
                </div>
                <div className="text-xs text-gray-300">Delay</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#002654]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-white">Vehicle ID</th>
                    <th className="px-4 py-3 text-left font-medium text-white">Planned Start Time</th>
                    <th className="px-4 py-3 text-left font-medium text-white">Actual Start Time</th>
                    <th className="px-4 py-3 text-left font-medium text-white">ETA Time</th>
                    <th className="px-4 py-3 text-left font-medium text-white">Actual Time</th>
                    <th className="px-4 py-3 text-left font-medium text-white">Delay (minutes)</th>
                    <th className="px-4 py-3 text-left font-medium text-white">Deviation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedVehicleData.map((row, index) => (
                    <tr key={index} className="hover:bg-blue-900/20 transition-colors duration-200">
                      <td className="px-4 py-3 text-white">{row['Vehicle ID']}</td>
                      <td className="px-4 py-3 text-white">{row['Planned Start Time']}</td>
                      <td className="px-4 py-3 text-white">{row['Actual Start Time']}</td>
                      <td className="px-4 py-3 text-white">{row['ETA Time']}</td>
                      <td className="px-4 py-3 text-white">{row['Actual Start Time']}</td>
                      <td className="px-4 py-3 text-white">{row['Delay (minutes)']}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors duration-200 ${
                          row['Deviation Status'] === 'On time' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-red-600 text-white'
                        }`}>
                          {row['Deviation Status']}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {vehiclePageCount > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setVehiclePage(p => Math.max(1, p - 1))}
                  disabled={vehiclePage === 1}
                  className={`px-4 py-2 rounded bg-blue-800 text-white font-medium transition-colors duration-200 ${vehiclePage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                >
                  Previous
                </button>
                <span className="text-white text-sm">Page {vehiclePage} of {vehiclePageCount}</span>
                <button
                  onClick={() => setVehiclePage(p => Math.min(vehiclePageCount, p + 1))}
                  disabled={vehiclePage === vehiclePageCount}
                  className={`px-4 py-2 rounded bg-blue-800 text-white font-medium transition-colors duration-200 ${vehiclePage === vehiclePageCount ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                >
                  Next
                </button>
              </div>
            )}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)' }}></div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/logistics/outbound/constraint-based-planning'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-8 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Constraint Based Planning
          </button>
        </div>
      </div>
    </div>
  )
}