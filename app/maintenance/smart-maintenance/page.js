'use client'
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import FilterComponent from '@/app/components/machine-maintenance/FilterComponent';
import MaintenanceTableComponent from '@/app/components/machine-maintenance/MaintenanceTableComponent';
import DeviationAnalysisComponent from '@/app/components/machine-maintenance/DeviationAnalysisComponent';
import MonthMachineFilterComponent from '@/app/components/machine-maintenance/MonthMachineFilterComponent';
import ParameterRangeTableComponent from '@/app/components/machine-maintenance/ParameterRangeTableComponent';

// Main Dashboard Component
export default function MaintenanceDashboard() {
  // State for data management
  const [csvData, setCsvData] = useState([]);
  const [machines, setMachines] = useState([]);
  const [breakdownDates, setBreakdownDates] = useState({});
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonthMachine, setSelectedMonthMachine] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use a single state to control which view is active
  const [activeView, setActiveView] = useState('maintenance'); // 'maintenance', 'deviation', or 'range'

  // Load CSV data from public folder
  useEffect(() => {
    const fetchCSV = async () => {
      try {
        // Assuming the CSV file is in the public folder
        const response = await fetch('/Smart Maintenance.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setError(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
              setIsLoading(false);
              return;
            }
            
            processCSVData(results.data);
          },
          error: (error) => {
            setError(`Error parsing CSV: ${error.message}`);
            setIsLoading(false);
          }
        });
      } catch (error) {
        setError(`Failed to fetch CSV file: ${error.message}. Make sure to place your CSV file named 'Smart Maintenance.csv' in the public folder.`);
        setIsLoading(false);
      }
    };

    fetchCSV();
  }, []);

  // Process CSV data
  const processCSVData = (data) => {
    try {
      setCsvData(data);
      
      // Extract unique breakdown machines
      const uniqueMachines = [...new Set(data.map(row => row['Breakdown Machine']).filter(Boolean))];
      setMachines(uniqueMachines);
      
      // Create a mapping of machines to their breakdown dates
      const dateMapping = {};
      data.forEach(row => {
        const machine = row['Breakdown Machine'];
        const date = row['Breakdown Date'];
        
        if (machine && date) {
          if (!dateMapping[machine]) {
            dateMapping[machine] = new Set();
          }
          dateMapping[machine].add(date);
        }
      });
      
      // Convert Sets to Arrays for each machine
      Object.keys(dateMapping).forEach(machine => {
        dateMapping[machine] = Array.from(dateMapping[machine]);
      });
      
      setBreakdownDates(dateMapping);
      setIsLoading(false);
    } catch (error) {
      setError(`Error processing CSV data: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Handle filter changes from the filter component
  const handleFilterChange = (machine, date) => {
    setSelectedMachine(machine);
    setSelectedDate(date);
  };

  // Handle month-machine filter changes
  const handleMonthMachineFilterChange = (machine, month) => {
    setSelectedMonthMachine(machine);
    setSelectedMonth(month);
  };

  return (
    <div className="p-4 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen">
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              {/* Left side with text content */}
              <div className="flex-1 space-y-5 align-middle text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  <span className="text-white">Smart Maintenance Analysis Dashboard</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-blue-600">Loading data...</div>
        </div>
      ) : (
        <>
          {/* Toggle Buttons for Different Views */}
          <div className="flex flex-wrap gap-4 mt-6 mb-4">
            <button 
              onClick={() => setActiveView('maintenance')}
              className={`group relative flex items-center justify-center overflow-hidden rounded-lg ${activeView === 'maintenance' ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'} p-0.5 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-lg`}
            >
              <span className="relative flex items-center gap-2 rounded-md bg-gradient-to-r from-[#024673] to-[#5C99E3] px-5 py-2.5 transition-all duration-300 ease-in group-hover:bg-opacity-0">
                Maintenance Analysis
              </span>
            </button>
            
            <button 
              onClick={() => setActiveView('deviation')}
              className={`group relative flex items-center justify-center overflow-hidden rounded-lg ${activeView === 'deviation' ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'} p-0.5 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-lg`}
            >
              <span className="relative flex items-center gap-2 rounded-md bg-gradient-to-r from-[#024673] to-[#5C99E3] px-5 py-2.5 transition-all duration-300 ease-in group-hover:bg-opacity-0">
                Deviation Analysis
              </span>
            </button>
            
            <button 
              onClick={() => setActiveView('range')}
              className={`group relative flex items-center justify-center overflow-hidden rounded-lg ${activeView === 'range' ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'} p-0.5 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-lg`}
            >
              <span className="relative flex items-center gap-2 rounded-md bg-gradient-to-r from-[#024673] to-[#5C99E3] px-5 py-2.5 transition-all duration-300 ease-in group-hover:bg-opacity-0">
                Parameter Range Analysis
              </span>
            </button>
          </div>

          {/* Different views based on activeView state */}
          {activeView === 'maintenance' && (
            <div className="animate-fade-in">
              {/* Filters Component */}
              <FilterComponent 
                machines={machines}
                breakdownDates={breakdownDates}
                onFilterChange={handleFilterChange}
              />
              
              {/* Maintenance Table Component */}
              <MaintenanceTableComponent 
                csvData={csvData}
                selectedMachine={selectedMachine}
                selectedDate={selectedDate}
              />
            </div>
          )}

          {/* Deviation Analysis View */}
          {activeView === 'deviation' && (
            <div className="animate-fade-in">
              <DeviationAnalysisComponent csvData={csvData} />
            </div>
          )}

          {/* Parameter Range Analysis View */}
          {activeView === 'range' && (
            <div className="animate-fade-in">
              <MonthMachineFilterComponent 
                csvData={csvData}
                onFilterChange={handleMonthMachineFilterChange}
              />
              <ParameterRangeTableComponent 
                csvData={csvData}
                selectedMachine={selectedMonthMachine}
                selectedMonth={selectedMonth}
              />
            </div>
          )}
        </>
      )}

      {/* Add the custom animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}