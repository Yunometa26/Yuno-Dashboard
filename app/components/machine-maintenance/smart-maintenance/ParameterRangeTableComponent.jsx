import { useMemo } from 'react';

const ParameterRangeTableComponent = ({ csvData, selectedMachine, selectedMonth }) => {
  const parameterTargets = {
    'Cycle_Time_sec': 29,
    'Oil_Temperature_C': 60,
    'Nozzle_Temperature_C': 210,
    'Melt_Cushion_mm': 4.5,
    'Cooling_Time_sec': 9.5,
    'Zone Temerature': 125
  };

  const displayNames = {
    'Cycle_Time_sec': 'Cycle Time',
    'Oil_Temperature_C': 'Oil Temperature',
    'Nozzle_Temperature_C': 'Nozzle Temperature',
    'Melt_Cushion_mm': 'Melt Cushion',
    'Zone Temerature': 'Zone 1 Temperature',
    'Cooling_Time_sec': 'Cooling Time'
  };

  const parametersToAnalyze = Object.keys(parameterTargets);

  const tableData = useMemo(() => {
    if (!csvData || !selectedMachine || !selectedMonth) return null;

    // Pre-filter the data based on machine and selected month
    const filteredData = csvData.filter(row => {
      const rawDate = row.Date;
      if (!rawDate || !row.Machine || row.Machine !== selectedMachine) return false;
      const dateObj = new Date(rawDate);
      if (isNaN(dateObj)) return false;

      const monthYear = `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
      return monthYear === selectedMonth;
    });

    const result = {};

    for (const param of parametersToAnalyze) {
      const values = filteredData.map(row => parseFloat(row[param])).filter(val => !isNaN(val));

      if (values.length === 0) {
        result[param] = {
          min: 'N/A',
          max: 'N/A',
          outsideRangePercent: 'N/A'
        };
        continue;
      }

      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

      const target = parameterTargets[param];
      const lowerBound = target * 0.95;
      const upperBound = target * 1.05;

      const outsideCount = values.filter(val => val < lowerBound || val > upperBound).length;
      const outsideRangePercent = (outsideCount / values.length) * 100;

      result[param] = {
        min,
        max,
        outsideRangePercent
      };
    }

    return result;
  }, [csvData, selectedMachine, selectedMonth]);

  if (!tableData) {
    return (
      <div className="text-center py-8 text-white">
        Select a machine and month to view parameter ranges
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-md overflow-x-auto border border-blue-200 mt-8 max-h-[500px] overflow-y-auto">
      <table className="w-full border-collapse border border-blue-300">
        <thead>
          <tr className="bg-gradient-to-r from-[#024673] to-[#5C99E3] text-white">
            <th className="p-3 text-center border border-blue-300">Parameter</th>
            <th className="p-3 text-center border border-blue-300">Target</th>
            <th className="p-3 text-center border border-blue-300">Actual Min</th>
            <th className="p-3 text-center border border-blue-300">Actual Max</th>
            <th className="p-3 text-center border border-blue-300">% Outside Range</th>
          </tr>
        </thead>
        <tbody>
          {parametersToAnalyze.map((param, idx) => (
            <tr key={param} className={`text-white ${idx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]'}`}>
              <td className="p-3 text-center border border-blue-300">{displayNames[param]}</td>
              <td className="p-3 text-center border border-blue-300">{parameterTargets[param]}</td>
              <td className="p-3 text-center border border-blue-300">
                {typeof tableData[param].min === 'number'
                  ? tableData[param].min.toFixed(2)
                  : tableData[param].min}
              </td>
              <td className="p-3 text-center border border-blue-300">
                {typeof tableData[param].max === 'number'
                  ? tableData[param].max.toFixed(2)
                  : tableData[param].max}
              </td>
              <td className="p-3 text-center border border-blue-300">
                {typeof tableData[param].outsideRangePercent === 'number'
                  ? `${tableData[param].outsideRangePercent.toFixed(2)}%`
                  : tableData[param].outsideRangePercent}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ParameterRangeTableComponent;