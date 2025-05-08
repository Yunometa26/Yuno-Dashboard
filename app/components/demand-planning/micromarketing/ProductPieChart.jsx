import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProductPieChart = ({ pieData, animateCharts, activeProduct, handlePieClick }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#4BC0C0', '#9966FF', '#FF9F40'];

  // Custom pie label renderer to improve visibility
  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show labels for segments that are significant enough (>3%)
    if (percent < 0.03) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#FFF"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight={activeIndex === index ? "bold" : "normal"}
      >
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  // Handle pie chart segment click
  const onPieClick = (data, index) => {
    if (activeProduct === data.product) {
      handlePieClick(null);
      setActiveIndex(null);
    } else {
      handlePieClick(data.product);
      setActiveIndex(index);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-[#024673] to-[#5C99E3] p-4 rounded-lg border border-blue-200 shadow-sm lg:col-span-2 transition-all duration-500 ease-in-out transform ${animateCharts ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
      <h2 className="font-semibold text-white mb-4">Sales by Product</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              dataKey="sales"
              nameKey="product"
              label={renderCustomizedPieLabel}
              onClick={onPieClick}
              cursor="pointer"
              animationDuration={1500}
              animationEasing="ease-in-out"
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke={activeProduct === entry.product ? "#000" : undefined}
                  strokeWidth={activeProduct === entry.product ? 2 : undefined}
                  className="transition-all duration-300"
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `₹${value.toLocaleString()}`}
              contentStyle={{ 
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
              animationDuration={300}
            />
            <Legend 
              wrapperStyle={{ transition: 'all 0.3s ease' }}
              onClick={(data) => handlePieClick(data.value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductPieChart;