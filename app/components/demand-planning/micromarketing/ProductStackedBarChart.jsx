import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProductStackedBarChart = ({ pieData, animateCharts, activeProduct, handlePieClick, data, selectedCustomers, selectedFinancialYear }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Enhanced dark appealing colors for different products
  const COLORS = [
    '#E74C3C', // Deep Red
    '#9B59B6', // Rich Purple
    '#3498DB', // Bright Blue
    '#E67E22', // Burnt Orange
    '#1ABC9C', // Teal
    '#F39C12', // Golden Yellow
    '#2ECC71', // Emerald Green
    '#34495E', // Dark Slate
    '#8E44AD', // Dark Purple
    '#E91E63', // Pink
    '#FF5722', // Deep Orange
    '#607D8B', // Blue Grey
    '#795548', // Brown
    '#FF9800', // Amber
    '#4CAF50', // Green
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#009688', // Teal
    '#FF6F00'  // Dark Orange
  ];
  
  // Process data to create stacked bar chart data
  const processStackedData = () => {
    if (!data || data.length === 0) return [];
    let filteredData = [...data];
    
    // Filter by customer if not "All Customers"
    if (!selectedCustomers.includes("All Customers")) {
      filteredData = filteredData.filter(row => selectedCustomers.includes(row.Customer));
    }
    // Create a map to store sales by financial year and product
    const yearProductMap = {};
    
    filteredData.forEach(row => {
      const year = row['Financial Year'];
      const product = row.Product;
      const sales = parseFloat(row.Sales || 0);
      
      if (!isNaN(sales) && year && product && year !== "All Years") {
        if (!yearProductMap[year]) {
          yearProductMap[year] = {};
        }
        yearProductMap[year][product] = (yearProductMap[year][product] || 0) + sales;
      }
    });
    // Convert to array format for recharts
    const stackedData = Object.keys(yearProductMap)
      .sort()
      .map(year => {
        const yearData = { year };
        Object.keys(yearProductMap[year]).forEach(product => {
          yearData[product] = yearProductMap[year][product];
        });
        return yearData;
      });
    return stackedData;
  };
  
  const stackedData = processStackedData();
  
  // Get all unique products for the bars
  const allProducts = [...new Set(data?.map(row => row.Product) || [])];
  
  // Handle bar click
  const onBarClick = (data, index) => {
    if (activeProduct === data.activeLabel) {
      handlePieClick(null);
      setActiveIndex(null);
    } else {
      handlePieClick(data.activeLabel);
      setActiveIndex(index);
    }
  };
  
  // Custom tooltip formatter
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 border border-gray-600 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-white mb-2">{`Financial Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {`${entry.dataKey}: ₹${entry.value?.toLocaleString() || 0}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-gradient-to-br from-[#024673] to-[#5C99E3] p-4 rounded-lg border border-blue-200 shadow-sm lg:col-span-2 transition-all duration-500 ease-in-out transform ${animateCharts ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
      <h2 className="font-semibold text-white mb-4">Sales by Product (Financial Year-wise)</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stackedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: 'white', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
            />
            <YAxis 
              tick={{ fill: 'white', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={customTooltip} />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '10px',
                color: 'white'
              }}
              iconType="rect"
            />
            
            {allProducts.map((product, index) => (
              <Bar
                key={product}
                dataKey={product}
                stackId="products"
                fill={COLORS[index % COLORS.length]}
                stroke={activeProduct === product ? "#FFF" : "rgba(255,255,255,0.1)"}
                strokeWidth={activeProduct === product ? 3 : 1}
                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                onClick={() => handlePieClick(product)}
                radius={index === allProducts.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                style={{
                  filter: activeProduct === product ? 'brightness(1.1) drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none'
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend with click functionality */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {allProducts.map((product, index) => (
          <div
            key={product}
            className={`flex items-center cursor-pointer transition-all duration-300 px-3 py-2 rounded-lg border ${
              activeProduct === product 
                ? 'bg-blue-200 bg-opacity-20 border-white border-opacity-50 shadow-lg transform scale-105' 
                : 'hover:bg-blue-200 hover:bg-opacity-10 border-transparent hover:border-white hover:border-opacity-30'
            }`}
            onClick={() => handlePieClick(product)}
          >
            <div
              className="w-4 h-4 rounded-sm mr-2 shadow-sm"
              style={{ 
                backgroundColor: COLORS[index % COLORS.length],
                boxShadow: activeProduct === product ? `0 0 8px ${COLORS[index % COLORS.length]}50` : 'none'
              }}
            />
            <span className={`text-sm font-medium transition-all duration-300 ${
              activeProduct === product ? 'text-white font-semibold' : 'text-gray-100'
            }`}>
              {product}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductStackedBarChart;



// import { useState } from 'react';
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const ProductPieChart = ({ pieData, animateCharts, activeProduct, handlePieClick }) => {
//   const [activeIndex, setActiveIndex] = useState(null);
  
//   // Colors for the pie chart
//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#4BC0C0', '#9966FF', '#FF9F40'];

//   // Custom pie label renderer to improve visibility
//   const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
//     const RADIAN = Math.PI / 180;
//     const radius = outerRadius * 1.2;
//     const x = cx + radius * Math.cos(-midAngle * RADIAN);
//     const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
//     // Only show labels for segments that are significant enough (>3%)
//     if (percent < 0.03) return null;
    
//     return (
//       <text 
//         x={x} 
//         y={y} 
//         fill="#FFF"
//         textAnchor={x > cx ? 'start' : 'end'} 
//         dominantBaseline="central"
//         fontSize={12}
//         fontWeight={activeIndex === index ? "bold" : "normal"}
//       >
//         {(percent * 100).toFixed(0)}%
//       </text>
//     );
//   };

//   // Handle pie chart segment click
//   const onPieClick = (data, index) => {
//     if (activeProduct === data.product) {
//       handlePieClick(null);
//       setActiveIndex(null);
//     } else {
//       handlePieClick(data.product);
//       setActiveIndex(index);
//     }
//   };

//   return (
//     <div className={`bg-gradient-to-br from-[#024673] to-[#5C99E3] p-4 rounded-lg border border-blue-200 shadow-sm lg:col-span-2 transition-all duration-500 ease-in-out transform ${animateCharts ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
//       <h2 className="font-semibold text-white mb-4">Sales by Product</h2>
//       <div className="h-64">
//         <ResponsiveContainer width="100%" height="100%">
//           <PieChart>
//             <Pie
//               data={pieData}
//               cx="50%"
//               cy="50%"
//               labelLine={false}
//               outerRadius={80}
//               dataKey="sales"
//               nameKey="product"
//               label={renderCustomizedPieLabel}
//               onClick={onPieClick}
//               cursor="pointer"
//               animationDuration={1500}
//               animationEasing="ease-in-out"
//             >
//               {pieData.map((entry, index) => (
//                 <Cell 
//                   key={`cell-${index}`} 
//                   fill={COLORS[index % COLORS.length]} 
//                   stroke={activeProduct === entry.product ? "#000" : undefined}
//                   strokeWidth={activeProduct === entry.product ? 2 : undefined}
//                   className="transition-all duration-300"
//                 />
//               ))}
//             </Pie>
//             <Tooltip 
//               formatter={(value) => `₹${value.toLocaleString()}`}
//               contentStyle={{ 
//                 borderRadius: '8px',
//                 border: 'none',
//                 boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//                 transition: 'all 0.3s ease'
//               }}
//               animationDuration={300}
//             />
//             <Legend 
//               wrapperStyle={{ transition: 'all 0.3s ease' }}
//               onClick={(data) => handlePieClick(data.value)}
//             />
//           </PieChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default ProductPieChart;