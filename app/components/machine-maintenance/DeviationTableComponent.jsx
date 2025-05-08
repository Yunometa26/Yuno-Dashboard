// DeviationTableComponent.jsx
import { useState } from 'react';

const DeviationTableComponent = ({ monthlyData, parameterRanges }) => {
  // Map parameter keys to display names
  const parameterDisplayNames = {
    'Cycle_Time_sec': 'Cycle Time',
    'Oil_Temperature_C': 'Oil Temperature',
    'Nozzle_Temperature_C': 'Nozzle Temperature',
    'Feed_Temperature_C': 'Feed Temperature',  // Fixed parameter name
    'Melt_Cushion_mm': 'Melt Cushion',
    'Zone Temerature': 'Zone1 Temperature',
    'Water_In_Temp_C': 'Zone2 Temperature',
    'Water_Out_Temp_C': 'Zone3 Temperature',
    'Cooling_Time_sec': 'Cooling Time'
  };

  // No data message
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="text-center py-8 text-white">
        Select a machine to view deviation analysis
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto mt-6 -ml-2">
      <div className="text-2xl font-bold mb-4 text-center text-white">Percentage of Data Outside Range</div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-[#024673] to-[#5C99E3] text-white">
            <th className="p-3 text-center border border-blue-200">Months</th>
            <th className="p-3 text-center border border-blue-200">Cycle Time</th>
            <th className="p-3 text-center border border-blue-200">Oil Temperature</th>
            <th className="p-3 text-center border border-blue-200">Nozzle Temperature</th>
            <th className="p-3 text-center border border-blue-200">Feed Temperature</th>
            <th className="p-3 text-center border border-blue-200">Melt Cushion</th>
            <th className="p-3 text-center border border-blue-200">Zone1 Temperature</th>
            <th className="p-3 text-center border border-blue-200">Zone2 Temperature</th>
            <th className="p-3 text-center border border-blue-200">Zone3 Temperature</th>
            <th className="p-3 text-center border border-blue-200">Cooling Time</th>
          </tr>
        </thead>
        <tbody>
          {monthlyData.map((monthData, idx) => (
            <tr key={idx} className="bg-blue-100 text-black hover:bg-blue-200">
              <td className="p-3 text-center border border-blue-200">{monthData.month}</td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Cycle_Time_sec'] ? monthData.parameters['Cycle_Time_sec'].toFixed(2) : '0.00'}
              </td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Oil_Temperature_C'] ? monthData.parameters['Oil_Temperature_C'].toFixed(2) : '0.00'}
              </td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Nozzle_Temperature_C'] ? monthData.parameters['Nozzle_Temperature_C'].toFixed(2) : '0.00'}
              </td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Feed_Temperature_C'] ? monthData.parameters['Feed_Temperature_C'].toFixed(2) : '0.00'}
              </td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Melt_Cushion_mm'] ? monthData.parameters['Melt_Cushion_mm'].toFixed(2) : '0.00'}
              </td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Zone Temerature'] ? monthData.parameters['Zone Temerature'].toFixed(2) : '0.00'}
              </td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Water_In_Temp_C'] ? monthData.parameters['Water_In_Temp_C'].toFixed(2) : '0.00'}
              </td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Water_Out_Temp_C'] ? monthData.parameters['Water_Out_Temp_C'].toFixed(2) : '0.00'}
              </td>
              <td className="p-3 text-center border border-blue-200">
                {monthData.parameters['Cooling_Time_sec'] ? monthData.parameters['Cooling_Time_sec'].toFixed(2) : '0.00'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviationTableComponent;

