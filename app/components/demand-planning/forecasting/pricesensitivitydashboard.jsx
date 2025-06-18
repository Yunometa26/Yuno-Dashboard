'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { parse } from 'date-fns';
import { ChevronDown, Filter, Plus, Minus } from 'lucide-react';

export default function PriceSensitivityDashboard() {
  const [csvData, setCsvData] = useState([]);
  const [filters, setFilters] = useState({ region: 'All', sku: 'All', percentageChange: 'All' });
  const [expandedYears, setExpandedYears] = useState({});

  useEffect(() => {
    fetch('/PriceSensitivityDashboard.csv')
      .then(res => res.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: h => h.trim(),
          transform: val => val.trim(),
          complete: ({ data }) => {
            const parsed = data.map(row => {
              const date = parse(row.Month, 'dd-MMM-yy', new Date());
              return {
                ...row,
                Date: date,
                Year: date.getFullYear(),
                Quantity: row.Quantity === '' ? '' : Number(row.Quantity),
                ProjectedDemand: row['Projected Demand'] === '' ? '' : Number(row['Projected Demand']),
              };
            });
            setCsvData(parsed);
          }
        });
      });
  }, []);

  const filteredData = csvData.filter(row =>
    (filters.region === 'All' || row.Region === filters.region) &&
    (filters.sku === 'All' || row.SKU === filters.sku) &&
    (filters.percentageChange === 'All' || String(row['Percentage Change']) === String(filters.percentageChange))
  );

  const groupedData = {};
  filteredData.forEach(row => {
    if (!groupedData[row.Year]) groupedData[row.Year] = [];
    groupedData[row.Year].push(row);
  });

  const sortedYears = Object.keys(groupedData).sort();
  useEffect(() => {
    if (sortedYears.length > 0 && Object.keys(expandedYears).length === 0) {
      const initExpanded = {};
      sortedYears.forEach(year => initExpanded[year] = true);
      setExpandedYears(initExpanded);
    }
  }, [sortedYears]);

  const toggleYear = year => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const totalQuantity = filteredData.reduce(
    (sum, r) => typeof r.Quantity === 'number' ? sum + r.Quantity : sum, 0
  );
  const totalProjected = filteredData.reduce(
    (sum, r) => typeof r.ProjectedDemand === 'number' ? sum + r.ProjectedDemand : sum, 0
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-4">Price Sensitivity</h1>

      <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl shadow-sm border border-blue-200 text-white mb-6">
        <div className="flex items-center mb-3">
          <Filter className="w-4 h-4 mr-2" />
          <h3 className="text-sm font-medium text-white">Price Sensitivity Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {['Region', 'SKU', 'Percentage Change'].map((label) => (
            <div key={label} className="relative">
              <label className="block text-xs text-white mb-1">{label}</label>
              <select
                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg"
                value={filters[label.toLowerCase().replace(/ /g, '')]}
                onChange={e => {
                  const value = e.target.value;
                  const key = label.toLowerCase().replace(/ /g, '');
                  setFilters(prev => ({
                    ...prev,
                    [key]: value
                  }));
                }}
              >
                {label === 'Region' && ['All', 'North', 'West', 'South'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                {label === 'SKU' && ['All', 'A', 'B', 'C'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                {label === 'Percentage Change' && ['All', ...Array.from({ length: 11 }, (_, i) => i - 5)].map(num => (
                  <option key={num} value={num}>{num === 'All' ? 'All' : `${num}%`}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl shadow-md overflow-x-auto border border-blue-200 mt-8 max-h-[500px] overflow-y-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-[#024673] text-white sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xl font-semibold text-center border border-blue-400" colSpan="3">
                Price Sensitivity Data
              </th>
            </tr>
            <tr>
              <th className="p-3 border border-blue-400 text-center">Month</th>
              <th className="p-3 border border-blue-400 text-center">Quantity</th>
              <th className="p-3 border border-blue-400 text-center">Projected Demand</th>
            </tr>
          </thead>
          <tbody>
            {sortedYears.map((year, yearIdx) => {
              const yearData = groupedData[year];

              const totals = yearData.reduce((acc, row) => ({
                Quantity: typeof row.Quantity === 'number' ? acc.Quantity + row.Quantity : acc.Quantity,
                ProjectedDemand: typeof row.ProjectedDemand === 'number' ? acc.ProjectedDemand + row.ProjectedDemand : acc.ProjectedDemand,
              }), { Quantity: 0, ProjectedDemand: 0 });

              return (
                <React.Fragment key={year}>
                  <tr
                    className={`cursor-pointer font-semibold text-white ${yearIdx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]'}`}
                    onClick={() => toggleYear(year)}
                  >
                    <td className="p-3 border border-blue-400 text-center">
                      <div className="inline-flex items-center justify-center border border-white px-2 py-1 rounded">
                        {expandedYears[year] ? <Minus size={14} /> : <Plus size={14} />}
                      </div>
                      <span className="ml-2">{year}</span>
                    </td>
                    <td className="p-3 border border-blue-400 text-center">{totals.Quantity}</td>
                    <td className="p-3 border border-blue-400 text-center">{totals.ProjectedDemand}</td>
                  </tr>
                  {expandedYears[year] && yearData.map((row, idx) => (
                    <tr key={idx} className={`text-white ${idx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]'}`}>
                      <td className="p-3 border border-blue-400 text-center">{row.Month}</td>
                      <td className="p-3 border border-blue-400 text-center">{row.Quantity === '' ? '' : row.Quantity}</td>
                      <td className="p-3 border border-blue-400 text-center">{row.ProjectedDemand === '' ? '' : row.ProjectedDemand}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
            <tr className="bg-[#024673] text-white font-bold sticky bottom-0">
              <td className="p-3 border border-blue-400 text-center">Total</td>
              <td className="p-3 border border-blue-400 text-center">{totalQuantity}</td>
              <td className="p-3 border border-blue-400 text-center">{totalProjected}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
