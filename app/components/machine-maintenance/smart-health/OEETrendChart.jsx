import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const OEETrendChart = ({ data }) => {
  const chartData = Object.values(
    data.reduce((acc, item) => {
      const date = item["Order Date"];
      if (!acc[date]) acc[date] = { date, total: 0, count: 0 };
      acc[date].total += parseFloat(item["Average OEE (%)"] || 0);
      acc[date].count += 1;
      return acc;
    }, {})
  ).map(entry => ({
    date: entry.date,
    avgOEE: (entry.total / entry.count).toFixed(2),
  }));

  return (
    <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Trend of Historical OEE</h3>
      </div>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <LineChart data={chartData}>
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#ffffff' }}
              axisLine={{ stroke: '#ffffff' }}
              tickLine={{ stroke: '#ffffff' }}
            />
            <YAxis 
              tick={{ fill: '#ffffff' }}
              axisLine={{ stroke: '#ffffff' }}
              tickLine={{ stroke: '#ffffff' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#024673', fontWeight: 500 }}
              itemStyle={{ color: '#024673' }}
            />
            <Line 
              type="monotone" 
              dataKey="avgOEE" 
              name="Average OEE (%)"
              stroke="#ff79c6" 
              strokeWidth={2}
              dot={{ fill: '#ff79c6', r: 4, strokeWidth: 0 }}
              activeDot={{ fill: '#f1fa8c', r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OEETrendChart;