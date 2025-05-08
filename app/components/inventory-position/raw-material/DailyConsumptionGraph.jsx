import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from "recharts";
import _ from "lodash";

const DailyConsumptionGraph = ({ data, filtered }) => {
  // Constants for month names
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  
  // Process data to get average daily consumption by month and raw material
  const chartData = useMemo(() => {
    if (!filtered || filtered.length === 0) {
      return [];
    }

    // Group the filtered data by month
    const groupedByMonth = _.groupBy(filtered, item => 
      item.Date instanceof Date ? item.Date.getMonth() : 'Unknown'
    );

    // Get unique raw materials
    const rawMaterials = _.uniq(filtered.map(item => item["Raw Material"]))
      .filter(Boolean)
      .sort();

    // Calculate average daily consumption for each month and raw material
    const result = Object.entries(groupedByMonth).map(([monthIndex, items]) => {
      const monthName = monthNames[parseInt(monthIndex)];
      const monthData = { month: monthName };
      
      // For each raw material, calculate the average daily consumption
      rawMaterials.forEach(rm => {
        const rmItems = items.filter(item => item["Raw Material"] === rm);
        const validItems = rmItems.filter(item => 
          item["Daily Consumption"] !== undefined && 
          item["Daily Consumption"] !== null
        );
        
        const average = validItems.length > 0 
          ? _.meanBy(validItems, item => item["Daily Consumption"]) 
          : 0;
        
        // Store average for this raw material
        monthData[rm] = parseFloat(average.toFixed(2));
        
        // Also store the count for tooltips
        monthData[`${rm}_count`] = validItems.length;
      });
      
      return monthData;
    });

    // Sort by month order
    return _.sortBy(result, item => monthNames.indexOf(item.month));
  }, [filtered]);

  // Get unique raw materials for rendering bars
  const rawMaterials = useMemo(() => {
    if (!filtered || filtered.length === 0) return [];
    return _.uniq(filtered.map(item => item["Raw Material"]))
      .filter(Boolean)
      .sort();
  }, [filtered]);

  // Define colors for raw materials - same as the BarGraphComponent for consistency
  const colorMap = {
    "RM 1": "#2196F3", // Blue
    "RM 2": "#1A237E", // Dark Blue
    "RM 3": "#F57C00", // Orange
    "RM 4": "#4A148C", // Purple
    "RM 5": "#E91E63"  // Pink
  };

  // Custom tooltip to show details
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-bold mb-1 text-black">Month: {label}</p>
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

  if (!filtered || filtered.length === 0) {
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
      <h3 className="text-lg font-bold text-center text-white mb-4">Daily Consumption Trend</h3>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'white' }}
              label={{ 
                // value: 'Month', 
                position: 'bottom', 
                offset: 0, 
                dy: 20,
                fill: 'white'
              }}
            />
            <YAxis 
              tick={{ fill: 'white' }}
            >
              <Label 
                value="Average of Daily Consumption" 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle', fill: 'white' }}
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
                stackId="consumption"
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

export default DailyConsumptionGraph;