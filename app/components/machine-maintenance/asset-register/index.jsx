'use client';
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Filter } from 'lucide-react';

// Filters Component
const Filters = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const selectBoxClass =
    'w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg';

  const arrowIcon = (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" />
    </svg>
  );

  return (
    <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl shadow-sm border border-blue-200 text-white mb-6">
      <div className="flex items-center mb-3">
        <Filter className="w-4 h-4 mr-2" />
        <h3 className="text-sm font-medium text-white">Assets Register</h3>
      </div>
      <div className="flex gap-6">
        <div className="w-40 relative">
          <label className="block text-xs text-white mb-1">Year</label>
          <div className="relative">
            <select
              name="year"
              value={filters.year}
              onChange={handleChange}
              className={selectBoxClass}
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
            {arrowIcon}
          </div>
        </div>

        <div className="w-40 relative">
          <label className="block text-xs text-white mb-1">Month</label>
          <div className="relative">
            <select
              name="month"
              value={filters.month}
              onChange={handleChange}
              className={selectBoxClass}
            >
              <option value="">All Months</option>
              {[
                'January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December',
              ].map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            {arrowIcon}
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Cards Component
const StatusCards = ({ data }) => {
  const counts = {
    Completed: 0,
    Unattended: 0,
    Delayed: 0,
  };

  data.forEach((item) => {
    if (item.Status?.includes("Completed")) counts.Completed++;
    else if (item.Status?.includes("Unattended")) counts.Unattended++;
    else if (item.Status?.includes("Delayed")) counts.Delayed++;
  });

  return (
    <div className="grid grid-cols-3 gap-4 my-4">
      <div className="p-4 shadow rounded bg-green-100">
        <div className="font-semibold text-green-800">Completed</div>
        <div className="text-2xl font-bold text-green-600">{counts.Completed}</div>
      </div>
      <div className="p-4 shadow rounded bg-yellow-100">
        <div className="font-semibold text-yellow-800">Unattended</div>
        <div className="text-2xl font-bold text-yellow-600">{counts.Unattended}</div>
      </div>
      <div className="p-4 shadow rounded bg-red-100">
        <div className="font-semibold text-red-800">Delayed</div>
        <div className="text-2xl font-bold text-red-600">{counts.Delayed}</div>
      </div>
    </div>
  );
};

// Snapshot Table Component
const SnapshotTable = ({ data }) => {
  const [expandedYears, setExpandedYears] = useState({});

  const toggleYear = (year) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const extractYear = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const yearPart = parts[2];
      return yearPart.length === 2 ? `20${yearPart}` : yearPart;
    }
    return null;
  };

  const snapshot = {};
  data.forEach((item) => {
    if (!item["Maintenance Date"] || !item["Maintenance Month"] || !item["Asset Category"]) return;

    const year = extractYear(item["Maintenance Date"]);
    const month = item["Maintenance Month"];
    const category = item["Asset Category"];

    if (!year) return;

    if (!snapshot[year]) snapshot[year] = {};
    if (!snapshot[year][month]) snapshot[year][month] = {};
    if (!snapshot[year][month][category]) snapshot[year][month][category] = 0;

    snapshot[year][month][category]++;
  });

  const allCategories = [...new Set(data.map(item => item["Asset Category"]).filter(Boolean))].sort();

  const calculateYearTotals = (months) => {
    const totals = {};
    allCategories.forEach(cat => {
      totals[cat] = Object.values(months).reduce((sum, categories) => {
        return sum + (categories[cat] || 0);
      }, 0);
    });
    return totals;
  };

  const calculateMonthTotal = (categories) => {
    return Object.values(categories).reduce((sum, count) => sum + count, 0);
  };

  const calculateGrandTotal = () => {
    return Object.values(snapshot).reduce((grandTotal, months) => {
      return grandTotal + Object.values(months).reduce((yearTotal, categories) => {
        return yearTotal + Object.values(categories).reduce((monthTotal, count) => monthTotal + count, 0);
      }, 0);
    }, 0);
  };

  if (Object.keys(snapshot).length === 0) {
    return <div className="text-center p-4 text-white">No data available for the selected filters</div>;
  }

  return (
    <div className="rounded-xl shadow-md overflow-x-auto border border-blue-200 mt-8 max-h-[500px] overflow-y-auto">
      <table className="w-full text-sm divide-y divide-blue-300">
        <thead className="bg-[#024673] text-white sticky top-0 z-10">
          <tr className="divide-x divide-blue-300">
            <th className="text-left p-3 font-semibold">Year</th>
            {allCategories.map((cat) => (
              <th key={cat} className="text-center p-3 font-semibold">{cat}</th>
            ))}
            <th className="text-center p-3 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-300">
          {Object.entries(snapshot).sort().map(([year, months], idx) => {
            const yearTotals = calculateYearTotals(months);
            const yearGrandTotal = Object.values(yearTotals).reduce((sum, count) => sum + count, 0);
            const isExpanded = expandedYears[year];

            return (
              <React.Fragment key={year}>
                <tr
                  className={`cursor-pointer text-white divide-x divide-blue-300 ${idx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]'}`}
                  onClick={() => toggleYear(year)}
                >
                  <td className="p-3 font-bold flex items-center">
                    <button className="mr-2 text-lg font-bold">{isExpanded ? "−" : "+"}</button>
                    📅 {year}
                  </td>
                  {allCategories.map((cat) => (
                    <td key={cat} className="text-center p-3 font-bold">{yearTotals[cat] || 0}</td>
                  ))}
                  <td className="text-center p-3 bg-black font-bold">{yearGrandTotal}</td>
                </tr>

                {isExpanded &&
                  Object.entries(months).sort().map(([month, categories], mIdx) => {
                    const monthTotal = calculateMonthTotal(categories);
                    return (
                      <tr
                        key={`${year}-${month}`}
                        className={`text-white divide-x divide-blue-300 ${mIdx % 2 === 0 ? 'bg-[#024673]' : 'bg-[#03579E]'}`}
                      >
                        <td className="p-3 pl-8">{month}</td>
                        {allCategories.map((cat) => (
                          <td key={cat} className="text-center p-3">{categories[cat] || 0}</td>
                        ))}
                        <td className="text-center p-3 bg-black font-medium">{monthTotal}</td>
                      </tr>
                    );
                  })}
              </React.Fragment>
            );
          })}

          <tr className="bg-black text-white font-bold border-t-2 divide-x divide-blue-300">
            <td className="p-3">Total</td>
            {allCategories.map((cat) => {
              const catTotal = Object.values(snapshot).reduce((sum, months) => {
                return sum + Object.values(months).reduce((monthSum, categories) => {
                  return monthSum + (categories[cat] || 0);
                }, 0);
              }, 0);
              return <td key={cat} className="text-center p-3">{catTotal}</td>;
            })}
            <td className="text-center p-3 bg-black">{calculateGrandTotal()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Main Home Component
export default function Home() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ year: "", month: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Papa.parse("/asset1.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleanedData = results.data.filter(row =>
          row["Asset Category"] && row["Asset Category"].trim() !== ""
        );
        setData(cleanedData);
        setLoading(false);
      },
      error: (error) => {
        setError(`Error loading CSV: ${error.message}`);
        setLoading(false);
      }
    });
  }, []);

  const extractYear = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const yearPart = parts[2];
      return yearPart.length === 2 ? `20${yearPart}` : yearPart;
    }
    return null;
  };

  const filteredData = data.filter((row) => {
    const year = extractYear(row["Maintenance Date"]);
    const yearMatch = filters.year ? year === filters.year : true;
    const monthMatch = filters.month ? row["Maintenance Month"] === filters.month : true;
    return yearMatch && monthMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-black">Loading asset data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen rounded-xl">
      <div className="max-w-7xl mx-auto">
        <Filters filters={filters} setFilters={setFilters} />
        <StatusCards data={filteredData} />
        <SnapshotTable data={filteredData} />
        <div className="mt-6 text-sm text-center text-white">
          Showing {filteredData.length} records {filters.year || filters.month ? 'with applied filters' : 'total'}
        </div>
      </div>
    </div>
  );
}