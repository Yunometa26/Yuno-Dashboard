'use client';
import { useState, useEffect, useTransition, useMemo } from 'react';
import { Filter } from 'lucide-react';
import MachineFilterComponent from './MachineFilterComponent';

const DeviationAnalysisComponent = ({ csvData }) => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [monthlyData, setMonthlyData] = useState([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const parameterMap = useMemo(() => ({
    'Cycle_Time_sec': 'Cycle Time',
    'Oil_Temperature_C': 'Oil Temperature',
    'Nozzle_Temperature_C': 'Nozzle Temperature',
    'Melt_Cushion_mm': 'Melt Cushion',
    'Zone Temerature': 'Zone Temperature',
    'Cooling_Time_sec': 'Cooling Time',
  }), []);

  useEffect(() => {
    if (!csvData || csvData.length === 0) return;

    const machineColumn = csvData[0].hasOwnProperty('Machine') ? 'Machine' : 'Breakdown Machine';
    const uniqueMachines = [...new Set(csvData.map(row => row[machineColumn]).filter(Boolean))];
    setMachines(uniqueMachines);
  }, [csvData]);

  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    if (!csvData || csvData.length === 0 || !machine) {
      setMonthlyData([]);
      return;
    }

    startTransition(() => {
      try {
        const machineColumn = csvData[0].hasOwnProperty('Machine') ? 'Machine' : 'Breakdown Machine';
        const dateColumn = csvData[0].hasOwnProperty('Date') ? 'Date' : 'Breakdown Date';

        const filtered = csvData.filter(row => row[machineColumn] === machine && row[dateColumn]);

        const monthlyMap = {};

        for (const row of filtered) {
          const date = new Date(row[dateColumn]);
          if (isNaN(date)) continue;

          const month = date.toLocaleString('default', { month: 'long' });
          if (!monthlyMap[month]) {
            monthlyMap[month] = {};
            for (const key of Object.keys(parameterMap)) {
              monthlyMap[month][key] = [];
            }
          }

          for (const paramKey of Object.keys(parameterMap)) {
            const val = parseFloat(row[paramKey]);
            if (!isNaN(val)) {
              monthlyMap[month][paramKey].push(val);
            }
          }
        }

        const results = Object.entries(monthlyMap).map(([month, paramObj]) => {
          const avgParams = {};
          for (const key of Object.keys(paramObj)) {
            const values = paramObj[key];
            avgParams[key] = values.length > 0
              ? values.reduce((a, b) => a + b, 0) / values.length
              : 0;
          }

          return { month, parameters: avgParams };
        });

        setMonthlyData(results);
      } catch (err) {
        setError(`Error processing data: ${err.message}`);
      }
    });
  };

  return (
    <div className="p-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl shadow-sm border border-blue-200 text-white mb-6">
        <div className="flex items-center mb-3">
          <Filter className="w-4 h-4 mr-2" />
          <h3 className="text-lg font-semibold">Select Machine</h3>
        </div>
        <MachineFilterComponent
          machines={machines}
          selectedMachine={selectedMachine}
          onMachineSelect={handleMachineSelect}
        />
      </div>

      {isPending ? (
        <div className="text-center py-8 text-white">Processing data...</div>
      ) : monthlyData.length > 0 ? (
        <div className="rounded-xl shadow-md overflow-x-auto border border-blue-200 mt-8 max-h-[500px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#024673] to-[#5C99E3] text-white">
                <th className="p-3 text-left border border-blue-200">Month</th>
                {Object.entries(parameterMap).map(([key, label], idx) => (
                  <th key={idx} className="p-3 text-center border border-blue-200">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row, idx) => (
                <tr key={idx} className={`text-white ${idx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]'}`}>
                  <td className="p-2 border border-blue-200 font-medium">{row.month}</td>
                  {Object.keys(parameterMap).map((paramKey, i) => (
                    <td key={i} className="p-2 text-center border border-blue-200">
                      {row.parameters[paramKey]?.toFixed(2) ?? '0.00'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-white">
          Select a machine to view monthly deviation analysis
        </div>
      )}
    </div>
  );
};

export default DeviationAnalysisComponent;