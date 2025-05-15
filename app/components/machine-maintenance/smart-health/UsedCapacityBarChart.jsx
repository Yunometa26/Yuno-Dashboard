import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const UsedCapacityBarChart = ({ data }) => {
  const chartData = Object.values(
    data.reduce((acc, item) => {
      const date = item["Order Date"];
      if (!acc[date]) acc[date] = { date, Used: 0, Left: 0 };
      acc[date].Used += parseFloat(item["Used Capacity (hrs)"] || 0);
      acc[date].Left += parseFloat(item["Capacity Left (hrs)"] || 0);
      return acc;
    }, {})
  );

  return (
    <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl border border-slate-200">
      <h3 className="text-lg font-medium mb-4 text-white">Utilized vs Left Capacity (hrs)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
          <Legend 
            wrapperStyle={{ 
              paddingTop: '10px',
              fontSize: '14px', 
              color: '#ffffff' 
            }}
            formatter={(value) => <span style={{ color: '#ffffff' }}>{value}</span>}
          />
          <Bar dataKey="Used" name="Utilized" fill="#8be9fd" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Left" name="Left" fill="#50fa7b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UsedCapacityBarChart;