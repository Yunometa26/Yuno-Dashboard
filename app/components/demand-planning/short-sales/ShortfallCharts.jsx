"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts"

export default function ShortfallCharts({ data, selectedMonth, selectedFY, selectedCategory }) {
  const [monthlyShortfallData, setMonthlyShortfallData] = useState([])
  const [categoryShortfallData, setCategoryShortfallData] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1']

  // Month names mapping
  const monthNames = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  }
  
  // Create reverse mapping (name to number)
  const monthNumbers = Object.entries(monthNames).reduce((acc, [num, name]) => {
    acc[name] = num;
    return acc;
  }, {});

  // Update charts when filters or data change
  useEffect(() => {
    if (!data || data.length === 0) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    
    // Apply filters
    let filteredData = [...data]
    
    if (selectedMonth) {
      // Convert month name to month number
      const monthNum = monthNumbers[selectedMonth]
      
      filteredData = filteredData.filter((item) => {
        const itemMonthNum = item.Months?.split("-")[0]
        return itemMonthNum === monthNum
      })
    }

    if (selectedFY) {
      filteredData = filteredData.filter((item) => item.FY === selectedFY)
    }

    if (selectedCategory) {
      filteredData = filteredData.filter((item) => item.CATEGORY === selectedCategory)
    }

    // Process month-wise data
    const monthlyData = {}

    filteredData.forEach(item => {
      if (item["Impactful Shortfall"] !== 1 && item["Impactful Shortfall"] !== "1") return
      
      const monthNum = item.Months?.split("-")[0]
      const monthName = monthNames[monthNum] || "Unknown"
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = {
          month: monthName,
          shortfall: 0,
          count: 0
        }
      }
      
      monthlyData[monthName].shortfall += parseFloat(item["Shortfall in Revenue"] || 0)
      monthlyData[monthName].count += 1
    })

    // Process category-wise data
    const categoryData = {}
    
    filteredData.forEach(item => {
      if (item["Impactful Shortfall"] !== 1 && item["Impactful Shortfall"] !== "1") return
      
      const category = item.CATEGORY || "Unknown"
      
      if (!categoryData[category]) {
        categoryData[category] = {
          name: category,
          value: 0,
          count: 0
        }
      }
      
      categoryData[category].value += parseFloat(item["Shortfall in Revenue"] || 0)
      categoryData[category].count += 1
    })

    // Convert to arrays and sort monthly data by month order
    const monthOrder = Object.values(monthNames)
    const monthlyChartData = Object.values(monthlyData).sort((a, b) => 
      monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
    )
    
    const categoryChartData = Object.values(categoryData)

    // Add percentage to category data
    const totalShortfall = categoryChartData.reduce((sum, item) => sum + item.value, 0)
    categoryChartData.forEach(item => {
      item.percent = totalShortfall > 0 ? ((item.value / totalShortfall) * 100).toFixed(1) : 0
    })
    
    // Sort category data by value (descending)
    categoryChartData.sort((a, b) => b.value - a.value)

    setMonthlyShortfallData(monthlyChartData)
    setCategoryShortfallData(categoryChartData)
    
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }, [data, selectedMonth, selectedFY, selectedCategory])

  // Format currency (Indian Rupees)
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  // Custom tooltip for the bar chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
          <p className="font-semibold text-gray-800">{payload[0].payload.month}</p>
          <p className="text-gray-600">
            Shortfall: <span className="font-medium text-[#00C49F]">{formatCurrency(payload[0].value)}</span>
          </p>
          <p className="text-gray-600">
            Number of Items: <span className="font-medium">{payload[0].payload.count}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Custom active shape for pie chart (for hover effect)
  const renderActiveShape = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, percent, name, value } = props
    const sin = Math.sin(-midAngle * Math.PI / 180)
    const cos = Math.cos(-midAngle * Math.PI / 180)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? 'start' : 'end'

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
          {name}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    )
  }

  const onPieEnter = (_, index) => {
    setActiveIndex(index)
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-lg shadow-md p-4 h-96">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-lg shadow-md p-4 h-96">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-full mx-auto w-64"></div>
        </div>
      </div>
    )
  }

  // Empty state
  if (monthlyShortfallData.length === 0 && categoryShortfallData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 h-96 flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Shortfall Data</h3>
          <p className="mt-1 text-sm text-gray-500">No monthly shortfall data available for the selected filters.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 h-96 flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Category Data</h3>
          <p className="mt-1 text-sm text-gray-500">No category shortfall data available for the selected filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Shortfall Bar Chart */}
      <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-lg shadow-md p-4 h-96">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Shortfall Distribution</h3>
        {monthlyShortfallData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={monthlyShortfallData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="white"/>
              <YAxis 
                tickFormatter={(value) => 
                  new Intl.NumberFormat('en-IN', {
                    notation: 'compact',
                    compactDisplay: 'short',
                    maximumFractionDigits: 1
                  }).format(value)
                }
                stroke="white"
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar dataKey="shortfall" name="Shortfall Value" fill="#00C49F" stroke="white"/>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p className="mt-4 text-gray-500">No monthly data available</p>
          </div>
        )}
      </div>

      {/* Category Shortfall Pie Chart */}
      <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-lg shadow-md p-4 h-96">
        <h3 className="text-lg font-semibold text-white mb-4">Category-wise Shortfall</h3>
        {categoryShortfallData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                // activeShape={renderActiveShape}
                data={categoryShortfallData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
              >
                {categoryShortfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(index) => categoryShortfallData[index].name}
              />
              <Legend 
                payload={
                  categoryShortfallData.map((item, index) => ({
                    id: item.name,
                    type: 'square',
                    value: `${item.name} (${item.percent}%)`,
                    color: COLORS[index % COLORS.length]
                  }))
                }
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
            </svg>
            <p className="mt-4 text-gray-500">No category data available</p>
          </div>
        )}
      </div>
    </div>
  )
}