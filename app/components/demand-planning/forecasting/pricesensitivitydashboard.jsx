'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { parse } from 'date-fns';
import { ChevronDown, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PriceSensitivityDashboard() {
  const [csvData, setCsvData] = useState([]);
  const [filters, setFilters] = useState({
    region: 'All',
    sku: 'All',
    percentageRevenueChange: 'All',
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15); // Show 15 items per page

  useEffect(() => {
    fetch('/Percent Demand Projection_Revised.csv')
      .then(res => res.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: h => h.trim(),
          transform: val => val.trim(),
          complete: ({ data }) => {
            const parsed = data.map(row => ({
              ...row,
              Date: parse(row.Month, 'dd-MM-yyyy', new Date()),
              Quantity: Number(row.Quantity),
              ProjectedDemand: Number(row['Projected Demand']),
              PercentageRevenueChange: Number(row['Percentage Revenue Change']),
              PercentChangeInDemand: parseFloat(row['Percent Demand Change (%)'].replace('%', '')),
            }));
            setCsvData(parsed);
          },
        });
      });
  }, []);

  const filteredData = csvData.filter(row =>
    (filters.region === 'All' || row.Region === filters.region) &&
    (filters.sku === 'All' || row.SKU === filters.sku) &&
    (filters.percentageRevenueChange === 'All' || row.PercentageRevenueChange === Number(filters.percentageRevenueChange))
  );

  const sortedSKUs = ['All', ...Array.from(new Set(csvData.map(d => d.SKU)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredData.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

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

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-4">Price Sensitivity</h1>

      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl shadow-sm border border-blue-200 text-white mb-6">
        <div className="flex items-center mb-3">
          <Filter className="w-4 h-4 mr-2" />
          <h3 className="text-sm font-medium text-white">Price Sensitivity Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="relative flex flex-col justify-center">
            <label className="block text-xs text-white mb-1">Region</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg"
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
              >
                {['All', ...Array.from(new Set(csvData.map(d => d.Region)))].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div className="relative flex flex-col justify-center">
            <label className="block text-xs text-white mb-1">SKU</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg"
                value={filters.sku}
                onChange={(e) => setFilters(prev => ({ ...prev, sku: e.target.value }))}
              >
                {sortedSKUs.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div className="relative flex flex-col justify-center">
            <label className="block text-xs text-white mb-1">Percentage Revenue Change</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg"
                value={filters.percentageRevenueChange}
                onChange={(e) => setFilters(prev => ({ ...prev, percentageRevenueChange: e.target.value }))}
              >
                {['All', ...Array.from(new Set(csvData.map(d => d.PercentageRevenueChange)))
                  .filter(val => !isNaN(val))
                  .sort((a, b) => a - b)
                ].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Data summary and pagination info */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-white text-sm">
          Showing {currentPageData.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
        </div>
        <div className="text-white text-sm">
          Page {totalPages > 0 ? currentPage : 0} of {totalPages}
        </div>
      </div>

      <div className="rounded-xl shadow-md overflow-x-auto border border-blue-200">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-[#024673] text-white sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xl font-semibold text-center border border-blue-400" colSpan="3">
                Price Sensitivity Data
              </th>
            </tr>
            <tr>
              <th className="p-3 border border-blue-400 text-center">Quantity</th>
              <th className="p-3 border border-blue-400 text-center">Projected Demand</th>
              <th className="p-3 border border-blue-400 text-center">% Change in Demand</th>
            </tr>
          </thead>
          <tbody>
            {currentPageData.length > 0 ? (
              currentPageData.map((row, idx) => (
                <tr key={startIndex + idx} className={`text-white ${idx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]'}`}>
                  <td className="p-3 border border-blue-400 text-center">{row.Quantity.toLocaleString()}</td>
                  <td className="p-3 border border-blue-400 text-center">{row.ProjectedDemand.toLocaleString()}</td>
                  <td className="p-3 border border-blue-400 text-center">
                    {row.PercentChangeInDemand.toFixed(2)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr className="text-white">
                <td colSpan="3" className="p-8 text-center text-gray-300">
                  No data available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6">
          {/* Previous and Next buttons positioned at opposite ends */}
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
  );
}
