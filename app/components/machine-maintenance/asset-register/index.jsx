import React, { useState, useEffect } from "react";
import Papa from "papaparse";

// Filters Component
const Filters = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex gap-4 mb-4">
      <select 
        name="year" 
        value={filters.year} 
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Years</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>
      <select 
        name="month" 
        value={filters.month} 
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Months</option>
        {[
          "January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"
        ].map((month) => (
          <option key={month} value={month}>{month}</option>
        ))}
      </select>
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
    if (item.Status && item.Status.includes("Completed")) counts.Completed++;
    else if (item.Status && item.Status.includes("Unattended")) counts.Unattended++;
    else if (item.Status && item.Status.includes("Delayed")) counts.Delayed++;
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
  // Helper function to extract year from date string like "20-Jan-25"
  const extractYear = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const yearPart = parts[2];
      // Convert 2-digit year to 4-digit year
      return yearPart.length === 2 ? `20${yearPart}` : yearPart;
    }
    return null;
  };

  // Create snapshot data structure
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

  // Get all unique categories for consistent table headers
  const allCategories = [...new Set(data.map(item => item["Asset Category"]).filter(Boolean))].sort();

  // Calculate totals
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
    return <div className="text-center p-4 text-gray-500">No data available for the selected filters</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="text-lg font-semibold text-black">Asset Maintenance Snapshot</h3>
      </div>
      
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-3 font-semibold text-black">Year</th>
              {allCategories.map((cat) => (
                <th key={cat} className="text-center p-3 font-semibold text-black">{cat}</th>
              ))}
              <th className="text-center p-3 font-semibold bg-blue-50 text-black">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(snapshot).sort().map(([year, months]) => {
              const yearTotals = calculateYearTotals(months);
              const yearGrandTotal = Object.values(yearTotals).reduce((sum, count) => sum + count, 0);
              
              return (
                <React.Fragment key={year}>
                  {/* Year header row */}
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="p-3 font-bold text-blue-800">📅 {year}</td>
                    {allCategories.map((cat) => (
                      <td key={cat} className="text-center p-3 font-bold text-blue-700">
                        {yearTotals[cat] || 0}
                      </td>
                    ))}
                    <td className="text-center p-3 font-bold text-blue-800 bg-blue-100">
                      {yearGrandTotal}
                    </td>
                  </tr>
                  
                  {/* Month rows */}
                  {Object.entries(months).sort().map(([month, categories]) => {
                    const monthTotal = calculateMonthTotal(categories);
                    return (
                      <tr key={`${year}-${month}`} className="border-b hover:bg-gray-50">
                        <td className="p-3 pl-8 text-black">└ {month}</td>
                        {allCategories.map((cat) => (
                          <td key={cat} className="text-center p-3 text-black">
                            {categories[cat] || 0}
                          </td>
                        ))}
                        <td className="text-center p-3 font-medium bg-gray-50 text-black">
                          {monthTotal}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
            
            {/* Grand total row */}
            <tr className="bg-gray-800 text-white font-bold border-t-2">
              <td className="p-3">Total</td>
              {allCategories.map((cat) => {
                const catTotal = Object.values(snapshot).reduce((sum, months) => {
                  return sum + Object.values(months).reduce((monthSum, categories) => {
                    return monthSum + (categories[cat] || 0);
                  }, 0);
                }, 0);
                return (
                  <td key={cat} className="text-center p-3">{catTotal}</td>
                );
              })}
              <td className="text-center p-3 bg-gray-700">{calculateGrandTotal()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Home Component
const Home = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ year: "", month: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (typeof window !== 'undefined' && window.fs && window.fs.readFile) {
          // Using file system API
          const csvData = await window.fs.readFile('asset1.csv', { encoding: 'utf8' });
          Papa.parse(csvData, {
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
              setError(`Error parsing CSV: ${error.message}`);
              setLoading(false);
            }
          });
        } else {
          // Fallback to fetch
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
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to extract year from date string
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
          <h2 className="text-xl font-semibold mb-4 text-white">Filters</h2>
          <Filters filters={filters} setFilters={setFilters} />
        
        
        <StatusCards data={filteredData} />
        <SnapshotTable data={filteredData} />
        
        <div className="mt-6 text-sm text-center text-white">
          Showing {filteredData.length} records {filters.year || filters.month ? 'with applied filters' : 'total'}
        </div>
      </div>
    </div>
  );
};

export default Home;