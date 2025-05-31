import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SalesActivityMonthsChart = ({ data, selectedCustomers, activeProduct, animateCharts }) => {
  
  // Process data to count active months per financial year
  const processMonthsData = () => {
    if (!data || data.length === 0) return [];

    let filteredData = [...data];
    
    // Filter by customer if not "All Customers"
    if (!selectedCustomers.includes("All Customers")) {
      filteredData = filteredData.filter(row => selectedCustomers.includes(row.Customer));
    }

    // Filter by product if selected
    if (activeProduct) {
      filteredData = filteredData.filter(row => row.Product === activeProduct);
    }

    // Create a map to track unique months with sales per financial year
    const yearMonthsMap = {};
    
    filteredData.forEach(row => {
      const year = row['Financial Year'];
      const month = row.Month;
      const sales = parseFloat(row.Sales || 0);
      
      if (!isNaN(sales) && sales > 0 && year && month && year !== "All Years") {
        if (!yearMonthsMap[year]) {
          yearMonthsMap[year] = new Set();
        }
        yearMonthsMap[year].add(month);
      }
    });

    // Convert to array format for recharts
    const monthsData = Object.keys(yearMonthsMap)
      .sort()
      .map(year => ({
        year,
        activeMonths: yearMonthsMap[year].size,
        percentage: ((yearMonthsMap[year].size / 12) * 100).toFixed(1)
      }));

    return monthsData;
  };

  const monthsData = processMonthsData();

  // Custom tooltip
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`Financial Year: ${label}`}</p>
          <p className="text-blue-600">
            {`Active Months: ${data.activeMonths} out of 12`}
          </p>
          <p className="text-green-600">
            {`Activity Rate: ${data.percentage}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Color based on activity level
  const getBarColor = (activeMonths) => {
    if (activeMonths >= 11) return '#10B981'; // Green - Excellent
    if (activeMonths >= 9) return '#3B82F6';  // Blue - Good
    if (activeMonths >= 6) return '#F59E0B';  // Orange - Average
    return '#EF4444'; // Red - Poor
  };

  return (
    <div className={`mb-6 bg-gradient-to-br from-[#024673] to-[#5C99E3] p-4 rounded-lg border border-blue-200 shadow-sm transition-all duration-500 ease-in-out transform ${animateCharts ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
      <h2 className="font-semibold text-white mb-4">Buying Frequency</h2>
      <p className="text-blue-100 text-sm mb-4">Number of months with sales activity per financial year</p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthsData}
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
              domain={[0, 12]}
              tick={{ fill: 'white', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.5)' }}
              label={{ 
                value: 'Active Months', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'white' }
              }}
            />
            <Tooltip content={customTooltip} />
            
            <Bar
              dataKey="activeMonths"
              radius={[4, 4, 0, 0]}
              className="transition-all duration-300"
            >
              {monthsData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.activeMonths)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-white">Excellent (11-12 months)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="text-white">Good (9-10 months)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
          <span className="text-white">Average (6-8 months)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-white">Poor (1-5 months)</span>
        </div>
      </div>
    </div>
  );
};

export default SalesActivityMonthsChart;