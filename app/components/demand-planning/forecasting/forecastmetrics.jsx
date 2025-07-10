'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DemandForecasting() {
  const [rawData, setRawData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 items per page

  useEffect(() => {
    fetch('/Dashboard-Forecasting_output.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: (results) => {
            const data = results.data
              .filter(row => row.Forecast && !isNaN(parseInt(row.Forecast)))
              .sort((a, b) => new Date(b.Month) - new Date(a.Month));
            setRawData(data);
          }
        });
      });
  }, []);

  // Reset to first page when table is toggled
  useEffect(() => {
    if (showTable) {
      setCurrentPage(1);
    }
  }, [showTable]);

  const latestForecast = useMemo(() => {
    return rawData.length ? parseInt(rawData[0].Forecast) : 0;
  }, [rawData]);

  const averageAccuracy = 80.07;

  // Pagination calculations
  const totalPages = Math.ceil(rawData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = rawData.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="p-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/20 shadow-md text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="relative bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl shadow-sm border border-blue-200 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-white/80">Latest Forecast</h3>
            <div
              className="w-9 h-9 bg-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100"
              onClick={() => setShowTable(prev => !prev)}
            >
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{latestForecast.toLocaleString()}</p>
        </div>

        <div className="relative bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl shadow-sm border border-blue-200 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-white/80">Average Accuracy</h3>
            <div className="bg-white rounded-md w-9 h-9 flex items-center justify-center">
              <img
                src="/accuracy.png"
                alt="Accuracy Icon"
                className="w-9 h-9 object-contain"
              />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{averageAccuracy}%</p>
        </div>
      </div>

      {showTable && (
        <div className="rounded-lg backdrop-blur-md bg-white/5 border border-white/10">
          {/* Data summary */}
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <div className="text-white text-sm">
              Showing {currentPageData.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, rawData.length)} of {rawData.length} records
            </div>
            <div className="text-white text-sm">
              Page {totalPages > 0 ? currentPage : 0} of {totalPages}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[400px]">
            <table className="min-w-full text-sm text-white">
              <thead className="text-left border-b border-white/20 bg-[#012C4A] sticky top-0 z-10">
                <tr>
                  <th className="p-2">Month</th>
                  <th className="p-2">Depot</th>
                  <th className="p-2">SKU</th>
                  <th className="p-2">Product</th>
                  <th className="p-2">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.length > 0 ? (
                  currentPageData.map((row, idx) => (
                    <tr
                      key={startIndex + idx}
                      className={`text-white ${idx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]'} border-b border-white/10`}
                    >
                      <td className="p-2">{row.Month}</td>
                      <td className="p-2">{row.Depot}</td>
                      <td className="p-2">{row.SKU}</td>
                      <td className="p-2">{row["Product Category"]}</td>
                      <td className="p-2">{parseInt(row.Forecast).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-white">
                    <td colSpan="5" className="p-8 text-center text-gray-300">
                      No forecast data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                {/* Previous button - Lower Left */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 bg-[#024673] text-white rounded-lg border border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#035a8a] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Items per page info - Center */}
                <div className="text-white text-sm">
                  {itemsPerPage} per page
                </div>

                {/* Next button - Lower Right */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 bg-[#024673] text-white rounded-lg border border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#035a8a] transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
