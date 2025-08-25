import { useEffect, useMemo, useState } from 'react';

// Rendered table component
const MaintenanceComparisonTable = ({ data }) => {
  if (!data) return null;

  return (
    <div className="rounded-xl shadow-md overflow-x-auto border border-blue-200 mt-8 max-h-[500px] overflow-y-auto w-full">
      <div className="text-2xl font-bold mb-4 text-center text-white">{data.machineName}</div>
      <table className="w-full border-collapse border border-blue-200">
        <thead>
          <tr className="bg-gradient-to-r from-[#024673] to-[#5C99E3] text-white sticky top-0 z-10">
            <th className="p-3 text-center border border-blue-200" colSpan="3">Before Maintenance</th>
            <th className="p-3 text-center border-l border-blue-200 border-y">Parameter</th>
            <th className="p-3 text-center border border-blue-200" colSpan="3">After Maintenance</th>
          </tr>
          <tr className="bg-gradient-to-r from-[#024673] to-[#5C99E3] text-white sticky top-[42px] z-10">
            <th className="p-2 text-center border border-blue-200">Avg</th>
            <th className="p-2 text-center border border-blue-200">Min</th>
            <th className="p-2 text-center border border-blue-200">Max</th>
            <th className="p-2 text-center border border-blue-200 border-l border-r"></th>
            <th className="p-2 text-center border border-blue-200">Avg</th>
            <th className="p-2 text-center border border-blue-200">Min</th>
            <th className="p-2 text-center border border-blue-200">Max</th>
          </tr>
        </thead>
        <tbody>
          {data.parameters.map((param, idx) => {
            const rowBg = idx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]';
            return (
              <tr key={idx} className={`text-white ${rowBg}`}>
                <td className="p-2 text-center border border-blue-200">{param.before.avg.toFixed(2)}</td>
                <td className="p-2 text-center border border-blue-200">{param.before.min.toFixed(2)}</td>
                <td className="p-2 text-center border border-blue-200">{param.before.max.toFixed(2)}</td>
                <td className={`p-2 text-center border border-blue-200 font-medium ${rowBg}`}>{param.name}</td>
                <td className="p-2 text-center border border-blue-200">{param.after.avg.toFixed(2)}</td>
                <td className="p-2 text-center border border-blue-200">{param.after.min.toFixed(2)}</td>
                <td className="p-2 text-center border border-blue-200">{param.after.max.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Optimized stats calculation
const useMaintenanceStats = (data, machine, date) => {
  return useMemo(() => {
    if (!data || !machine || !date) return null;

    const breakdownDate = new Date(date);
    const beforeDate = new Date(breakdownDate);
    beforeDate.setDate(beforeDate.getDate() - 7);
    const afterDate = new Date(breakdownDate);
    afterDate.setDate(afterDate.getDate() + 7);

    const parameterKeys = [
      { key: 'Cycle_Time_sec', name: 'Cycle Time' },
      { key: 'Oil_Temperature_C', name: 'Oil Temperature' },
      { key: 'Nozzle_Temperature_C', name: 'Nozzle Temperature' },
      { key: 'Melt_Cushion_mm', name: 'Melt Cushion' },
      { key: 'Zone Temerature', name: 'Zone Temperature' },
      { key: 'Cooling_Time_sec', name: 'Cooling Time' }
    ];

    const beforeData = [], afterData = [];

    for (const row of data) {
      if (row.Machine !== machine) continue;
      const rowDate = new Date(row.Date);
      if (isNaN(rowDate)) continue;

      if (rowDate >= beforeDate && rowDate < breakdownDate) beforeData.push(row);
      else if (rowDate > breakdownDate && rowDate <= afterDate) afterData.push(row);
    }

    const parameters = parameterKeys.map(param => {
      const getStats = (list) => {
        const values = list.map(row => parseFloat(row[param.key])).filter(val => !isNaN(val));
        const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return {
          avg,
          min: values.length ? Math.min(...values) : 0,
          max: values.length ? Math.max(...values) : 0
        };
      };

      return {
        name: param.name,
        before: getStats(beforeData),
        after: getStats(afterData)
      };
    });

    return { machineName: machine, parameters };
  }, [data, machine, date]);
};

// Main wrapper component
const MaintenanceTableComponent = ({ csvData, selectedMachine, selectedDate }) => {
  const maintenanceData = useMaintenanceStats(csvData, selectedMachine, selectedDate);

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