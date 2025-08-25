import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import POStatusDetailTable from './POStatusDetailTable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // Blue, Green, Yellow, Orange

const POStatusChart = ({ filtered }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Compute unique PO status counts using the same logic as POStatusCards
  const statusData = useMemo(() => {
    if (!filtered || filtered.length === 0) return [];
    const uniquePOs = new Map();
    filtered.forEach(item => {
      const poIdentifier = item["PO Number"] || `po-${filtered.indexOf(item)}`;
      if (!uniquePOs.has(poIdentifier)) {
        // Determine delivery performance if possible
        let computedStatus = item["PO Status"] || 'Unknown';
        if (item["Expected Delivery Date"] && item["Actual Delivery Date"]) {
          const expectedDate = new Date(item["Expected Delivery Date"]);
          const actualDate = new Date(item["Actual Delivery Date"]);
          if (actualDate > expectedDate) {
            computedStatus = 'Delayed';
          } else {
            computedStatus = 'On-Time/Early';
          }
        }
        uniquePOs.set(poIdentifier, computedStatus);
      }
    });
    // Count each computed status
    const statusCounts = {
      'On-Time/Early': 0,
      'Delayed': 0,
      'Open': 0,
      'Closed': 0,
      'Unknown': 0
    };
    for (const status of uniquePOs.values()) {
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      } else {
        statusCounts['Unknown']++;
      }
    }
    // Only include statuses with values
    return Object.keys(statusCounts)
      .map(status => ({ name: status, value: statusCounts[status] }))
      .filter(item => item.value > 0);
  }, [filtered]);

  const handlePieClick = (entry) => {
    setSelectedStatus(entry.name);
    setIsModalOpen(true);
  };

  // Custom click handler for pie sectors
  const handleSectorClick = (data, index) => {
    if (data && data.name) {
      setSelectedStatus(data.name);
      setIsModalOpen(true);
    }
  };

  // Custom label component
  const renderCustomizedLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
        style={{ fontWeight: 'bold', cursor: 'pointer' }}
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // For modal: filter data by computed status
  const getModalData = () => {
    if (!filtered || !selectedStatus) return [];
    // Use the same computed status logic as above
    return filtered.filter(item => {
      let computedStatus = item["PO Status"] || 'Unknown';
      if (item["Expected Delivery Date"] && item["Actual Delivery Date"]) {
        const expectedDate = new Date(item["Expected Delivery Date"]);
        const actualDate = new Date(item["Actual Delivery Date"]);
        if (actualDate > expectedDate) {
          computedStatus = 'Delayed';
        } else {
          computedStatus = 'On-Time/Early';
        }
      }
      return computedStatus === selectedStatus;
    });
  };

  if (statusData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">PO Status Distribution</h3>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No PO status data available for the selected filters</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-xl shadow p-5 mb-4 mr-1 ml-1">
        <h3 className="text-lg font-medium text-white mb-4">PO Status Distribution</h3>
        <p className="text-sm text-white mb-2">Click on a segment or legend item to view detailed information</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={renderCustomizedLabel}
                onClick={handleSectorClick}
                isAnimationActive={true}
                activeIndex={[]}
              >
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} POs`, 'Count']}
                cursor={false}
              />
              <Legend 
                onClick={(entry) => handlePieClick(entry)}
                formatter={(value) => <span style={{ color: '#fff', cursor: 'pointer' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail table modal */}
      <POStatusDetailTable
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={getModalData()}
        selectedStatus={selectedStatus}
      />
    </>
  );
};

export default POStatusChart;