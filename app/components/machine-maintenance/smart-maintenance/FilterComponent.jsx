import { useState, useEffect, useMemo } from 'react';
import { Filter } from 'lucide-react';
import React from 'react';

const FilterComponent = React.memo(({ machines, breakdownDates, onFilterChange }) => {
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);

  // Update available breakdown dates when selected machine changes
  useEffect(() => {
    if (selectedMachine && breakdownDates[selectedMachine]) {
      const sortedDates = [...breakdownDates[selectedMachine]].sort((a, b) => new Date(b) - new Date(a));
      setAvailableDates(sortedDates);
    } else {
      setAvailableDates([]);
    }
  }, [selectedMachine, breakdownDates]);

  const handleMachineChange = (machine) => {
    setSelectedMachine(machine);
    setSelectedDate('');
    onFilterChange(machine, '');
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    onFilterChange(selectedMachine, date);
  };

  // Memoize options to prevent re-creation on every render
  const machineOptions = useMemo(() => machines.map((machine, idx) => (
    <option key={idx} value={machine}>{machine}</option>
  )), [machines]);

  const dateOptions = useMemo(() => availableDates.map((date, idx) => (
    <option key={idx} value={date}>{date}</option>
  )), [availableDates]);

  return (
    <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl shadow-sm border border-blue-200 text-white mb-6">
      <div className="flex items-center mb-3">
        <Filter className="w-4 h-4 mr-2" />
        <h3 className="text-lg font-semibold">Select Filters</h3>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Machine Dropdown */}
        <div className="flex flex-col w-full md:w-1/2">
          <label className="text-sm font-medium mb-1">Machine</label>
          <select
            value={selectedMachine}
            onChange={(e) => handleMachineChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-black"
          >
            <option value="">Select Machine</option>
            {machineOptions}
          </select>
        </div>

        {/* Breakdown Date Dropdown */}
        <div className="flex flex-col w-full md:w-1/2">
          <label className="text-sm font-medium mb-1">Breakdown Date</label>
          <select
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-black"
          >
            <option value="">Select Date</option>
            {dateOptions}
          </select>
        </div>
      </div>
    </div>
  );
});

export default FilterComponent;