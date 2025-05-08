// MonthMachineFilterComponent.jsx
import { useState, useEffect } from 'react';

const MonthMachineFilterComponent = ({ csvData, onFilterChange }) => {
  const [machines, setMachines] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Month names mapping
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Format month/year as a readable string
  const formatMonthYear = (monthIndex, year) => {
    return `${monthNames[monthIndex - 1]} ${year}`;
  };

  // Extract unique machines and months from CSV data
  useEffect(() => {
    if (!csvData || csvData.length === 0) return;

    // Get unique machines
    const uniqueMachines = [...new Set(csvData
      .map(row => row.Machine)
      .filter(Boolean))];
    
    // Get unique months in MM/YYYY format with a display value
    const monthsMap = new Map();
    
    csvData.forEach(row => {
      if (!row.Date) return;
      
      const date = new Date(row.Date);
      const monthIndex = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthYearKey = `${monthIndex}/${year}`;
      const displayValue = formatMonthYear(monthIndex, year);
      
      monthsMap.set(monthYearKey, { key: monthYearKey, display: displayValue, sortValue: year * 100 + monthIndex });
    });
    
    // Convert map to array and sort chronologically
    const uniqueMonths = Array.from(monthsMap.values())
      .sort((a, b) => a.sortValue - b.sortValue);
    
    // Sort machines alphabetically
    uniqueMachines.sort();
    
    setMachines(uniqueMachines);
    setMonths(uniqueMonths);
  }, [csvData]);

  // Handle machine selection
  const handleMachineChange = (machine) => {
    setSelectedMachine(machine);
    onFilterChange(machine, selectedMonth);
  };

  // Handle month selection
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    onFilterChange(selectedMachine, month);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 mt-5 mr-1 ml-1">
      <div className="flex flex-col w-full md:w-1/2">
        <label className="text-sm font-medium mb-1 text-white">Machine</label>
        <div className="relative">
          <select
            value={selectedMachine}
            onChange={(e) => handleMachineChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-black"
          >
            <option value="">Select Machine</option>
            {machines.map((machine, idx) => (
              <option key={idx} value={machine}>{machine}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex flex-col w-full md:w-1/2">
        <label className="text-sm font-medium mb-1 text-white">Month</label>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-black"
          >
            <option value="">Select Month</option>
            {months.map((month, idx) => (
              <option key={idx} value={month.key}>{month.display}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default MonthMachineFilterComponent;