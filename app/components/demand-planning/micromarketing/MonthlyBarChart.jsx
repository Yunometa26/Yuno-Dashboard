import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyBarChart = ({ monthlyData, animateCharts, selectedYear, onBackClick }) => {
  // Format large numbers to use L (Lakh) or M (Million) notation
  const formatYAxis = (value) => {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value;
  };

  // Custom tooltip to ensure visibility in both light and dark modes
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-black p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-black mb-1">{label}</p>
          <p className="text-green-600 font-semibold">
            Monthly Sales (₹): {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-gradient-to-br from-[#024673] to-[#5C99E3] p-4 rounded-lg border border-blue-200 shadow-sm transition-all duration-500 ease-in-out transform ${animateCharts ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-white">Monthly Sales for {selectedYear}</h2>
        <button 
          onClick={onBackClick} 
          className="bg-white text-black py-1 px-3 rounded text-sm flex items-center transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Years
        </button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="white"/>
            <YAxis tickFormatter={formatYAxis} stroke="white"/>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ transition: 'all 0.3s ease' }} />
            <Bar 
              dataKey="sales" 
              name="Monthly Sales (₹)" 
              fill="#00C49F"
              stroke="white" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyBarChart;