// DeviationAnalysisComponent.jsx
import { useState, useEffect } from 'react';
import MachineFilterComponent from './MachineFilterComponent';
import DeviationTableComponent from './DeviationTableComponent';

const DeviationAnalysisComponent = ({ csvData }) => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extract unique machines from data
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      // Make sure we're looking at the right column name
      const machineColumn = csvData[0].hasOwnProperty('Machine') ? 'Machine' : 'Breakdown Machine';
      const uniqueMachines = [...new Set(csvData.map(row => row[machineColumn]).filter(Boolean))];
      setMachines(uniqueMachines);
    }
  }, [csvData]);

  // Parameter ranges
  const parameterRanges = {
    'Cycle_Time_sec': { min: 29, max: 30 },
    'Oil_Temperature_C': { min: 58, max: 60 },
    'Nozzle_Temperature_C': { min: 218, max: 225 },
    'Melt_Cushion_mm': { min: 4.5, max: 5 },
    'Cooling_Time_sec': { min: 9, max: 10 },
    'Zone Temerature': { min: 123, max: 125 },
    'Water_In_Temp_C': { min: 20, max: 21 },
    'Water_Out_Temp_C': { min: 24, max: 26 },
    'Feed_Temperature_C': { min: 24, max: 26 } // Added separate Feed Temperature parameter
  };

  // Handle machine selection
  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    setIsLoading(true);
    
    try {
      if (machine && csvData && csvData.length > 0) {
        // Make sure we're looking at the right column name
        const machineColumn = csvData[0].hasOwnProperty('Machine') ? 'Machine' : 'Breakdown Machine';
        const filteredData = csvData.filter(row => row[machineColumn] === machine);
        
        // Process monthly data
        const monthlyResults = processMonthlyData(filteredData, parameterRanges);
        setMonthlyData(monthlyResults);
      } else {
        setMonthlyData([]);
      }
    } catch (err) {
      setError(`Error processing data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Process data by month
  const processMonthlyData = (data, ranges) => {
    // Group data by month
    const monthlyGroups = {};
    
    data.forEach(row => {
      // Check if we have a Date or Breakdown Date column
      const dateColumn = row.hasOwnProperty('Date') ? 'Date' : 'Breakdown Date';
      const date = new Date(row[dateColumn]);
      
      if (!isNaN(date.getTime())) {
        const month = date.toLocaleString('default', { month: 'long' });
        
        if (!monthlyGroups[month]) {
          monthlyGroups[month] = [];
        }
        
        monthlyGroups[month].push(row);
      }
    });
    
    // Calculate percentage out of range for each month
    const monthlyResults = [];
    
    Object.entries(monthlyGroups).forEach(([month, monthData]) => {
      const totalCount = monthData.length;
      const result = {
        month: month,
        parameters: {}
      };
      
      // Calculate for each parameter
      Object.entries(ranges).forEach(([param, range]) => {
        const outOfRangeCount = monthData.filter(row => {
          const value = parseFloat(row[param]);
          return !isNaN(value) && (value < range.min || value > range.max);
        }).length;
        
        const percentageOutOfRange = totalCount > 0 
          ? ((outOfRangeCount / totalCount) * 100).toFixed(2) 
          : 0;
        
        result.parameters[param] = parseFloat(percentageOutOfRange);
      });
      
      monthlyResults.push(result);
    });
    
    return monthlyResults;
  };

  return (
    <div className="p-4">
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}
      
      <MachineFilterComponent 
        machines={machines}
        selectedMachine={selectedMachine}
        onMachineSelect={handleMachineSelect}
      />
      
      {isLoading ? (
        <div className="text-center py-8 text-white">
          Loading data...
        </div>
      ) : (
        <DeviationTableComponent 
          monthlyData={monthlyData}
          parameterRanges={parameterRanges}
        />
      )}
    </div>
  );
};

export default DeviationAnalysisComponent;

