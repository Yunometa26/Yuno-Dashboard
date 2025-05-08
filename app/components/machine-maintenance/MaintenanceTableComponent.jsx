// MaintenanceTableComponent.js
import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// Maintenance Comparison Table Component
const MaintenanceComparisonTable = ({ data }) => {
  if (!data) return null;

  return (
    <div className="w-full overflow-x-auto mt-6 ml-1">
      <div className="text-2xl font-bold mb-4 text-center text-white">{data.machineName}</div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-[#024673] to-[#5C99E3]">
            <th className="p-3 text-center" colSpan="3">Before Maintenance</th>
            <th className="p-3 text-center border-l border-white">Parameter</th>
            <th className="p-3 text-center border-l border-white" colSpan="3">After Maintenance</th>
          </tr>
          <tr className="bg-gradient-to-r from-[#024673] to-[#5C99E3]">
            <th className="p-2 text-center">Avg</th>
            <th className="p-2 text-center">Min</th>
            <th className="p-2 text-center">Max</th>
            <th className="p-2 text-center border-l border-white"></th>
            <th className="p-2 text-center border-l border-white">Avg</th>
            <th className="p-2 text-center">Min</th>
            <th className="p-2 text-center">Max</th>
          </tr>
        </thead>
        <tbody>
          {data.parameters.map((param, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-blue-50 text-black" : "bg-blue-100 text-black"}>
              <td className="p-2 text-center">{param.before.avg.toFixed(2)}</td>
              <td className="p-2 text-center">{param.before.min.toFixed(2)}</td>
              <td className="p-2 text-center">{param.before.max.toFixed(2)}</td>
              <td className="p-2 text-center bg-blue-200 text-black">{param.name}</td>
              <td className="p-2 text-center">{param.after.avg.toFixed(2)}</td>
              <td className="p-2 text-center">{param.after.min.toFixed(2)}</td>
              <td className="p-2 text-center">{param.after.max.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Calculate Before and After Maintenance Stats
const calculateMaintenanceStats = (data, breakdownMachine, breakdownDate) => {
  if (!data || !breakdownMachine || !breakdownDate) return null;
  
  // Parse the selected breakdown date
  const selectedDate = new Date(breakdownDate);
  
  // Calculate 7 days before and after
  const beforeDate = new Date(selectedDate);
  beforeDate.setDate(beforeDate.getDate() - 7);
  
  const afterDate = new Date(selectedDate);
  afterDate.setDate(afterDate.getDate() + 7);
  
  // Filter data for before and after maintenance
  const beforeMaintData = data.filter(row => {
    const rowDate = new Date(row.Date);
    return rowDate >= beforeDate && rowDate < selectedDate && row.Machine === breakdownMachine;
  });
  
  const afterMaintData = data.filter(row => {
    const rowDate = new Date(row.Date);
    return rowDate > selectedDate && rowDate <= afterDate && row.Machine === breakdownMachine;
  });

  // Parameters to calculate stats for
  const parameterKeys = [
    { key: 'Cycle_Time_sec', name: 'Cycle Time' },
    { key: 'Oil_Temperature_C', name: 'Oil Temperature' },
    { key: 'Water_Out_Temp_C', name: 'Feed Temperature' },
    { key: 'Nozzle_Temperature_C', name: 'Nozzle Temperature' },
    { key: 'Melt_Cushion_mm', name: 'Melt Cushion' },
    { key: 'Zone Temerature', name: 'Zone Temperature' },
    { key: 'Cooling_Time_sec', name: 'Cooling Time' }
  ];

  // Calculate stats for each parameter
  const parameters = parameterKeys.map(param => {
    // Before maintenance stats
    const beforeValues = beforeMaintData.map(row => row[param.key] || 0).filter(val => val !== null && !isNaN(val));
    const beforeAvg = beforeValues.length ? beforeValues.reduce((sum, val) => sum + val, 0) / beforeValues.length : 0;
    const beforeMin = beforeValues.length ? Math.min(...beforeValues) : 0;
    const beforeMax = beforeValues.length ? Math.max(...beforeValues) : 0;

    // After maintenance stats
    const afterValues = afterMaintData.map(row => row[param.key] || 0).filter(val => val !== null && !isNaN(val));
    const afterAvg = afterValues.length ? afterValues.reduce((sum, val) => sum + val, 0) / afterValues.length : 0;
    const afterMin = afterValues.length ? Math.min(...afterValues) : 0;
    const afterMax = afterValues.length ? Math.max(...afterValues) : 0;

    return {
      name: param.name,
      before: { avg: beforeAvg, min: beforeMin, max: beforeMax },
      after: { avg: afterAvg, min: afterMin, max: afterMax }
    };
  });

  return {
    machineName: breakdownMachine,
    parameters
  };
};

// Main Table Component
const MaintenanceTableComponent = ({ csvData, selectedMachine, selectedDate }) => {
  const [maintenanceData, setMaintenanceData] = useState(null);

  // Calculate maintenance data when selection changes
  useEffect(() => {
    if (selectedMachine && selectedDate) {
      const data = calculateMaintenanceStats(csvData, selectedMachine, selectedDate);
      setMaintenanceData(data);
    } else {
      setMaintenanceData(null);
    }
  }, [selectedMachine, selectedDate, csvData]);

  return (
    <>
      {maintenanceData ? (
        <MaintenanceComparisonTable data={maintenanceData} />
      ) : (
        <div className="text-center py-8 text-white">
          Select a machine and breakdown date to view maintenance comparison
        </div>
      )}
    </>
  );
};

export default MaintenanceTableComponent;