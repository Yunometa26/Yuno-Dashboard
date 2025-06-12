'use client';
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

export default function ForecastingPage() {
  const [data, setData] = useState([]);
  const [latestForecast, setLatestForecast] = useState(0);
  const [averageAccuracy, setAverageAccuracy] = useState(0);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    Papa.parse('/Synthetic Forecast Output-June.csv', {
      download: true,
      header: true,
      complete: (result) => {
        const parsed = result.data.filter(row => {
          const forecast = Number(row.Forecast);
          const accuracy = Number(row.Accuracy);
          return !isNaN(forecast) && !isNaN(accuracy);
        });

        setData(parsed);

        const totalForecast = parsed.reduce((sum, row) => sum + Number(row.Forecast), 0);
        setLatestForecast(totalForecast);

        const avgAccuracy = parsed.reduce((sum, row) => sum + Number(row.Accuracy), 0) / parsed.length;
        setAverageAccuracy(avgAccuracy);
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] text-white p-6 space-y-6">
      <h1 className="text-3xl font-bold">Demand Forecasting</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl p-6 shadow-md backdrop-blur-md">
          <h3 className="text-white text-sm mb-1">Latest Forecast</h3>
          <p className="text-3xl font-bold text-white">{latestForecast.toLocaleString()}</p>
          <p className="text-green-300 text-xs mt-1">↑ Most Recent Value</p>
          <button
            onClick={() => setShowTable(prev => !prev)}
            className="mt-4 text-sm text-blue-200 underline hover:text-blue-400 transition"
          >
            {showTable ? 'Hide Table' : 'Show Table'}
          </button>
        </div>

        <div className="bg-white/10 rounded-xl p-6 shadow-md backdrop-blur-md">
          <h3 className="text-white text-sm mb-1">Average Accuracy</h3>
          <p className="text-3xl font-bold text-white">{averageAccuracy.toFixed(2)}%</p>
          <p className="text-blue-300 text-xs mt-1">Forecast Accuracy</p>
        </div>
      </div>

      {showTable && (
        <div className="mt-6">
          <h3 className="text-white font-semibold mb-2">Forecast Details</h3>
          <div className="overflow-auto max-h-[500px] rounded-lg">
            <table className="min-w-full bg-white/10 text-white rounded-xl shadow-md backdrop-blur-md">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-left">Depot</th>
                  <th className="px-4 py-2 text-left">SKU</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Forecast</th>
                  <th className="px-4 py-2 text-left">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-t border-white/10">
                    <td className="px-4 py-2">{row.Month}</td>
                    <td className="px-4 py-2">{row.Depot}</td>
                    <td className="px-4 py-2">{row.SKU}</td>
                    <td className="px-4 py-2">{row.Product}</td>
                    <td className="px-4 py-2">{row.Forecast}</td>
                    <td className="px-4 py-2">{row.Accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

//Forecast Metrics with table added with button toggle 