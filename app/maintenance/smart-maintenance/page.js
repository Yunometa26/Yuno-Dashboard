'use client';
import { useState, useEffect, useTransition, useMemo } from 'react';
import Papa from 'papaparse';
import FilterComponent from '@/app/components/machine-maintenance/smart-maintenance/FilterComponent';
import MaintenanceTableComponent from '@/app/components/machine-maintenance/smart-maintenance/MaintenanceTableComponent';
import DeviationAnalysisComponent from '@/app/components/machine-maintenance/smart-maintenance/DeviationAnalysisComponent';
import MonthMachineFilterComponent from '@/app/components/machine-maintenance/smart-maintenance/MonthMachineFilterComponent';
import ParameterRangeTableComponent from '@/app/components/machine-maintenance/smart-maintenance/ParameterRangeTableComponent';

export default function MaintenanceDashboard() {
  const [rawCsvData, setRawCsvData] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonthMachine, setSelectedMonthMachine] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('maintenance');
  const [isPending, startTransition] = useTransition();

  // Parse CSV in worker mode for non-blocking
  useEffect(() => {
    fetch('/Smart Maintenance.csv')
      .then(res => res.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          worker: true, // <--- key for performance: parse in web worker
          complete: ({ data, errors }) => {
            if (errors.length > 0) {
              setError(`CSV errors: ${errors.map(e => e.message).join(', ')}`);
              return;
            }
            // Batch state updates inside startTransition for better UI responsiveness
            startTransition(() => setRawCsvData(data));
          },
          error: (err) => {
            setError(`Parsing error: ${err.message}`);
          },
        });
      })
      .catch(() => {
        setError("Failed to fetch CSV file. Make sure it's in the public folder.");
      });
  }, []);

  // Memoize machines & breakdownDates for quick lookup
  const { machines, breakdownDates } = useMemo(() => {
    if (!rawCsvData) return { machines: [], breakdownDates: {} };

    const machineSet = new Set();
    const dateMap = {};

    for (const row of rawCsvData) {
      const machine = row['Breakdown Machine'];
      const date = row['Breakdown Date'];

      if (machine) {
        machineSet.add(machine);
        if (date) {
          if (!dateMap[machine]) dateMap[machine] = new Set();
          dateMap[machine].add(date);
        }
      }
    }

    // Convert sets to sorted arrays
    const machineList = Array.from(machineSet).sort();
    const mappedDates = {};
    for (const [key, value] of Object.entries(dateMap)) {
      mappedDates[key] = Array.from(value).sort();
    }

    return { machines: machineList, breakdownDates: mappedDates };
  }, [rawCsvData]);

  const handleFilterChange = (machine, date) => {
    setSelectedMachine(machine);
    setSelectedDate(date);
  };

  const handleMonthMachineFilterChange = (machine, month) => {
    setSelectedMonthMachine(machine);
    setSelectedMonth(month);
  };

  return (
    <div className="p-4 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen">
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
        <div className="p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex-1 text-center">
              <h2 className="text-4xl font-bold text-white leading-tight">
                Smart Maintenance Analysis Dashboard
              </h2>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">{error}</div>
      )}

      {!rawCsvData ? (
        <div className="text-center py-8 text-white">Loading data...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mt-6 mb-4">
            {['maintenance', 'deviation', 'range'].map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`group relative flex items-center justify-center overflow-hidden rounded-lg ${
                  activeView === view
                    ? 'bg-gradient-to-br from-green-500 to-green-700'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                } p-0.5 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-lg`}
              >
                <span className="relative flex items-center gap-2 rounded-md bg-gradient-to-r from-[#024673] to-[#5C99E3] px-5 py-2.5 transition-all duration-300 ease-in group-hover:bg-opacity-0">
                  {view === 'maintenance'
                    ? 'Data Back validation of Maintenance Analysis'
                    : view === 'deviation'
                    ? 'Deviation Analysis'
                    : 'Customized Maintenance Report'}
                </span>
              </button>
            ))}
          </div>

          <div className="animate-fade-in">
            {activeView === 'maintenance' && (
              <>
                <FilterComponent
                  machines={machines}
                  breakdownDates={breakdownDates}
                  onFilterChange={handleFilterChange}
                />
                <MaintenanceTableComponent
                  csvData={rawCsvData}
                  selectedMachine={selectedMachine}
                  selectedDate={selectedDate}
                />
              </>
            )}

            {activeView === 'deviation' && (
              <DeviationAnalysisComponent csvData={rawCsvData} />
            )}

            {activeView === 'range' && (
              <>
                <MonthMachineFilterComponent
                  csvData={rawCsvData}
                  onFilterChange={handleMonthMachineFilterChange}
                />
                <ParameterRangeTableComponent
                  csvData={rawCsvData}
                  selectedMachine={selectedMonthMachine}
                  selectedMonth={selectedMonth}
                />
              </>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => (window.location.href = '/maintenance')}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Maintenance
        </button>
      </div>
    </div>
  );
}