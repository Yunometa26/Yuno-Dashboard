// FilterComponent.js
import { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';

// Filter Component
const FilterComponent = ({ machines, breakdownDates, onFilterChange }) => {
  const [selectedMachine, setSelectedMachine] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  // Handle machine selection
  const handleMachineChange = (machine) => {
    setSelectedMachine(machine);
    setSelectedDate('');
    
    // Update available dates for selected machine
    if (machine && breakdownDates[machine]) {
      setAvailableDates(breakdownDates[machine]);
    } else {
      setAvailableDates([]);
    }

    // Call parent callback with null for date since it's being reset
    onFilterChange(machine, '');
  };

  // Handle date selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
    onFilterChange(selectedMachine, date);
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
        <label className="text-sm font-medium mb-1 text-white">Breakdown Date</label>
        <div className="relative">
          <select
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-black"
          >
            <option value="">Select Date</option>
            {availableDates.map((date, idx) => (
              <option key={idx} value={date}>{date}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterComponent;

