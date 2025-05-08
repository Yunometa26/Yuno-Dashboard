// MachineFilterComponent.jsx
import { useState } from 'react';
import { Filter } from 'lucide-react';

const MachineFilterComponent = ({ machines, selectedMachine, onMachineSelect }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 mt-5 -ml-3">
      <div className="flex flex-col w-full md:w-1/2">
        <label className="text-sm font-medium mb-1 text-white">Select Machine</label>
        <div className="relative">
          <select
            value={selectedMachine}
            onChange={(e) => onMachineSelect(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-black"
          >
            <option value="">Select Machine</option>
            {machines.map((machine, idx) => (
              <option key={idx} value={machine}>{machine}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default MachineFilterComponent;

