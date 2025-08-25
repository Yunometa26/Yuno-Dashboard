import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from "recharts";
import _ from "lodash";

const BarGraphComponent = ({ data, filtered }) => {
  // --- Dynamic filter state ---
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedRawMaterial, setSelectedRawMaterial] = useState('All');

  // --- Dynamic options for filters ---
  const dynamicYears = useMemo(() => {
    let arr = filtered || [];
    if (selectedRawMaterial !== 'All') {
      arr = arr.filter(item => item["Raw Material"] === selectedRawMaterial);
    }
    const years = Array.from(new Set(arr.map(item => {
      const year = item.Date instanceof Date ? item.Date.getFullYear() : undefined;
      return (year && !isNaN(year)) ? year : undefined;
    }))).filter(y => y !== undefined && y !== null && y !== 'Unknown' && y !== 'Invalid Date');
    return ['All', ...years.sort()];
  }, [filtered, selectedRawMaterial]);

  const dynamicRawMaterials = useMemo(() => {
    let arr = filtered || [];
    if (selectedYear !== 'All') {
      arr = arr.filter(item => {
        const year = item.Date instanceof Date ? item.Date.getFullYear() : undefined;
        return year === selectedYear;
      });
    }
    const rms = Array.from(new Set(arr.map(item => item["Raw Material"])));
    return ['All', ...rms.filter(Boolean).sort()];
  }, [filtered, selectedYear]);

  // Month names for validation and sorting
  const validMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Dynamic month filter (if you have a month filter):
  const dynamicMonths = useMemo(() => {
    let arr = filtered || [];
    // Assume item.Month is a short month name (Jan, Feb, ...)
    const months = Array.from(new Set(arr.map(item => item.Month)))
      .filter(month => validMonths.includes(month));
    return ['All', ...months.sort((a, b) => validMonths.indexOf(a) - validMonths.indexOf(b))];
  }, [filtered]);

  // Dynamic days filter
  const dynamicDays = useMemo(() => {
    let arr = filtered || [];
    const days = Array.from(new Set(arr.map(item => Number(item.Day)).filter(day => !isNaN(day) && day >= 1 && day <= 31)));
    return ['All', ...days.sort((a, b) => a - b)];
  }, [filtered]);

  // --- Filter data for chart based on selected filters ---
  const filteredData = useMemo(() => {
    let arr = filtered || [];
    if (selectedYear !== 'All') {
      arr = arr.filter(item => (item.Date instanceof Date ? item.Date.getFullYear() : 'Unknown') === selectedYear);
    }
    if (selectedRawMaterial !== 'All') {
      arr = arr.filter(item => item["Raw Material"] === selectedRawMaterial);
    }
    return arr;
  }, [filtered, selectedYear, selectedRawMaterial]);

  // --- Chart data calculation (same as before, but use filteredData) ---
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }
    const groupedByYear = _.groupBy(filteredData, item => 
      item.Date instanceof Date ? item.Date.getFullYear() : 'Unknown'
    );
    const rawMaterials = _.uniq(filteredData.map(item => item["Raw Material"]))
      .filter(Boolean)
      .sort();
    const result = Object.entries(groupedByYear).map(([year, items]) => {
      const yearData = { year };
      rawMaterials.forEach(rm => {
        const rmItems = items.filter(item => item["Raw Material"] === rm);
        const validItems = rmItems.filter(item => 
          item["Inventory Position"] !== undefined && 
          item["Inventory Position"] !== null
        );
        const average = validItems.length > 0 
          ? _.meanBy(validItems, item => item["Inventory Position"]) 
          : 0;
        yearData[rm] = parseFloat(average.toFixed(2));
        yearData[`${rm}_count`] = validItems.length;
      });
      return yearData;
    });
    return _.sortBy(result, 'year');
  }, [filteredData]);

  // --- Raw materials for rendering bars and legend (from filteredData) ---
  const rawMaterials = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    return _.uniq(filteredData.map(item => item["Raw Material"]))
      .filter(Boolean)
      .sort();
  }, [filteredData]);

  // Define colors for raw materials
  const colorMap = {
    "RM 1": "#2196F3", // Blue
    "RM 2": "#1A237E", // Dark Blue
    "RM 3": "#F57C00", // Orange
    "RM 4": "#4A148C", // Purple
    "RM 5": "#E91E63"  // Pink
  };

  // Custom tooltip to show details - updated with black text color
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-bold mb-1 text-black">Year: {label}</p>
          {payload.map((entry, index) => {
            // Extract raw material name from the dataKey
            const rawMaterial = entry.dataKey;
            return (
              <div key={index} className="mb-1">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 mr-2 rounded-sm" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="font-medium text-black">{rawMaterial}:</span>
                  <span className="ml-2 text-black">{entry.value.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No data available to display</p>
      </div>
    );
  }

  if (rawMaterials.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No raw materials found in the filtered data</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-xl mr-1 ml-1 shadow p-4 mb-4">
      <h3 className="text-lg font-bold text-center text-white mb-4">Inventory Position Trend</h3>
      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        <div>
          <label className="block text-white text-sm mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="px-2 py-1 rounded-md"
          >
            {dynamicYears.map((year, idx) => (
              <option key={idx} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-white text-sm mb-1">Raw Material</label>
          <select
            value={selectedRawMaterial}
            onChange={e => setSelectedRawMaterial(e.target.value)}
            className="px-2 py-1 rounded-md"
          >
            {dynamicRawMaterials.map((rm, idx) => (
              <option key={idx} value={rm}>{rm}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: 'white' }} // Updated to white text color for x-axis
              label={{ 
                value: '', 
                position: 'bottom', 
                offset: 0, 
                dy: 20,
                fill: 'white' // Added white color for the label
              }}
            />
            <YAxis 
              tick={{ fill: 'white' }} // Updated to white text color for y-axis
            >
              <Label 
                value="Average of Inventory Position" 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle', fill: 'white' }} // Added white color for the label
                dx={-15}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: 10 }}
              payload={rawMaterials.map(rm => ({
                value: rm,
                type: 'square',
                color: colorMap[rm] || `#${Math.floor(Math.random()*16777215).toString(16)}`
              }))}
            />
            
            {/* Render a bar for each raw material */}
            {rawMaterials.map((rm, index) => (
              <Bar 
                key={rm}
                dataKey={rm}
                name={rm}
                stackId="inventory"
                fill={colorMap[rm] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                radius={index === rawMaterials.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap items-center justify-start mt-4 px-8">
        <div className="text-sm mr-4 mb-2 font-medium text-white">Raw Material:</div>
        {rawMaterials.map(rm => (
          <div key={rm} className="flex items-center mr-4 mb-2">
            <div 
              className="w-3 h-3 rounded-sm mr-1" 
              style={{ backgroundColor: colorMap[rm] || 'gray' }}
            ></div>
            <span className="text-sm text-white">{rm}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarGraphComponent;