import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinancialYearBarChart = ({ yearlyData, animateCharts, handleYearClick }) => {
  // Format large numbers to use Cr (Crore), L (Lakh) or K (Thousand) notation
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
            Yearly Sales (₹): {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-gradient-to-br from-[#024673] to-[#5C99E3] p-4 rounded-lg border border-blue-200 shadow-sm transition-all duration-500 ease-in-out transform ${animateCharts ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
      <h2 className="font-semibold text-white mb-4">Financial Year Sales</h2>
      <p className="text-white text-sm mb-2">Click on a year to view monthly breakdown</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={yearlyData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="white"/>
            <YAxis tickFormatter={formatYAxis} stroke="white"/>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ transition: 'all 0.3s ease' }} />
            <Bar 
              dataKey="sales" 
              name="Yearly Sales (₹)" 
              fill="#0088FE"
              stroke="white" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
              animationEasing="ease-in-out"
              onClick={(data) => handleYearClick(data.year)}
              style={{ cursor: 'pointer' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialYearBarChart;