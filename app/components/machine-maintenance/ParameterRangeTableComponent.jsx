// ParameterRangeTableComponent.jsx
import { useState, useEffect } from 'react';

const ParameterRangeTableComponent = ({ csvData, selectedMachine, selectedMonth }) => {
  const [tableData, setTableData] = useState(null);
  
  // Only target values remain constant
  const parameterTargets = {
    'Cycle_Time_sec': 29,
    'Oil_Temperature_C': 60,
    'Nozzle_Temperature_C': 210,
    'Melt_Cushion_mm': 4.5,
    'Cooling_Time_sec': 9.5,
    'Zone Temerature': 125
  };

  // Display names for parameters
  const displayNames = {
    'Cycle_Time_sec': 'Cycle Time',
    'Oil_Temperature_C': 'Oil Temperature',
    'Nozzle_Temperature_C': 'Nozzle Temperature',
    'Melt_Cushion_mm': 'Melt Cushion',
    'Zone Temerature': 'Zone 1 Temperature',
    'Cooling_Time_sec': 'Cooling Time'
  };

  // Parameters to analyze
  const parametersToAnalyze = Object.keys(parameterTargets);

  // Process data when machine or month changes
  useEffect(() => {
    if (!csvData || !selectedMachine || !selectedMonth) {
      setTableData(null);
      return;
    }

    // Filter data for selected machine and month
    const filteredData = csvData.filter(row => {
      if (!row.Date || !row.Machine) return false;
      
      const rowDate = new Date(row.Date);
      const monthYear = `${rowDate.getMonth() + 1}/${rowDate.getFullYear()}`;
      
      return row.Machine === selectedMachine && monthYear === selectedMonth;
    });

    // Calculate statistics for each parameter
    const results = parametersToAnalyze.reduce((acc, paramName) => {
      // Extract valid parameter values
      const paramValues = filteredData
        .map(row => row[paramName])
        .filter(val => val !== null && val !== undefined && !isNaN(val));
      
      if (paramValues.length === 0) {
        acc[paramName] = {
          min: 'N/A',
          max: 'N/A',
          outsideRangePercent: 'N/A'
        };
        return acc;
      }
      
      // Calculate min and max from actual data
      const min = Math.min(...paramValues);
      const max = Math.max(...paramValues);
      
      // Calculate standard deviation for setting reasonable range bounds
      const mean = paramValues.reduce((sum, val) => sum + val, 0) / paramValues.length;
      const stdDev = Math.sqrt(
        paramValues.reduce((sum, val) => sum + Math.pow(val - mean, 0), 0) / paramValues.length
      );
      
      // Set acceptable range as target ± 5%
      const target = parameterTargets[paramName];
      const acceptableMin = target * 0.95;
      const acceptableMax = target * 1.05;
      
      // Calculate percentage outside acceptable range
      const outsideRangeCount = paramValues.filter(val => 
        val < acceptableMin || val > acceptableMax
      ).length;
      
      const outsideRangePercent = (outsideRangeCount / paramValues.length) * 100;
      
      acc[paramName] = {
        min,
        max,
        outsideRangePercent
      };
      
      return acc;
    }, {});

    setTableData(results);
  }, [csvData, selectedMachine, selectedMonth]);

  // No data message
  if (!tableData) {
    return (
      <div className="text-center py-8 text-white">
        Select a machine and month to view parameter ranges
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto mt-6 ml-1">
      <div className="text-2xl font-bold mb-4 text-center text-white">
        Parameter Analysis for {selectedMachine} - {selectedMonth}
      </div>
      <table className="w-full border-collapse border border-blue-300">
        <thead>
          <tr className="bg-gradient-to-r from-[#024673] to-[#5C99E3] text-white">
            <th className="p-3 text-center border border-blue-300">Parameters</th>
            <th className="p-3 text-center border border-blue-300">Target</th>
            <th className="p-3 text-center border border-blue-300">Actual Min</th>
            <th className="p-3 text-center border border-blue-300">Actual Max</th>
            <th className="p-3 text-center border border-blue-300">% Outside Range</th>
          </tr>
        </thead>
        <tbody>
          {parametersToAnalyze.map((paramName, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-white text-black" : "bg-blue-50 text-black"}>
              <td className="p-3 text-center border border-blue-300">{displayNames[paramName]}</td>
              <td className="p-3 text-center border border-blue-300">{parameterTargets[paramName]}</td>
              <td className="p-3 text-center border border-blue-300">
                {typeof tableData[paramName].min === 'number' 
                  ? tableData[paramName].min.toFixed(2) 
                  : tableData[paramName].min}
              </td>
              <td className="p-3 text-center border border-blue-300">
                {typeof tableData[paramName].max === 'number' 
                  ? tableData[paramName].max.toFixed(2) 
                  : tableData[paramName].max}
              </td>
              <td className="p-3 text-center border border-blue-300">
                {typeof tableData[paramName].outsideRangePercent === 'number' 
                  ? tableData[paramName].outsideRangePercent.toFixed(2) 
                  : tableData[paramName].outsideRangePercent}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ParameterRangeTableComponent;