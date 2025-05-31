'use client'
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Filter } from "lucide-react";
import POStatusCards from "../raw-material/POStatusCards";
import POStatusChart from "../raw-material/POStatusChart";

const FilterPage = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rawMaterials, setRawMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [years, setYears] = useState([]);
  const [days, setDays] = useState([
    { value: "", label: "All Days" },
    ...Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }))
  ]);
  const [months, setMonths] = useState([
    { value: "", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ]);

  const [filters, setFilters] = useState({
    rawMaterial: "All",
    vendor: "All",
    day: "",
    month: "",
    year: ""
  });

  useEffect(() => {
    Papa.parse("/RM Inventory Pos.csv", {
      header: true,
      download: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data
          .filter((row) => row.Date)
          .map((row) => ({
            ...row,
            Date: new Date(row.Date),
          }));
        setData(parsed);
        setFiltered(parsed);
        setLoading(false);

        setRawMaterials([
          "All",
          ...Array.from(new Set(parsed.map((d) => d["Raw Material"]))).filter(Boolean).sort(),
        ]);
        setVendors([
          "All",
          ...Array.from(new Set(parsed.map((d) => d["Vendor Name"]))).filter(Boolean).sort(),
        ]);

        // Extract available years from the data
        const availableYears = Array.from(
          new Set(parsed.map((d) => d.Date.getFullYear()))
        ).sort();
        setYears([{ value: "", label: "All Years" }, 
          ...availableYears.map(year => ({ value: year.toString(), label: year.toString() }))
        ]);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setLoading(false);
      }
    });
  }, []);

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [filters, data]);

  const applyFilters = () => {
    let filteredData = [...data];

    // Raw material filter - for "All", we don't filter
    if (filters.rawMaterial !== "All") {
      filteredData = filteredData.filter(
        (d) => d["Raw Material"] === filters.rawMaterial
      );
    }

    // Vendor filter
    if (filters.vendor !== "All") {
      filteredData = filteredData.filter(
        (d) => d["Vendor Name"] === filters.vendor
      );
    }

    // Day filter
    if (filters.day) {
      filteredData = filteredData.filter(
        (d) => d.Date.getDate() === parseInt(filters.day)
      );
    }

    // Month filter
    if (filters.month) {
      filteredData = filteredData.filter(
        (d) => d.Date.getMonth() + 1 === parseInt(filters.month)
      );
    }

    // Year filter
    if (filters.year) {
      filteredData = filteredData.filter(
        (d) => d.Date.getFullYear() === parseInt(filters.year)
      );
    }

    setFiltered(filteredData);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Get message for filter summary
  const getFilterSummary = () => {
    const parts = [];
    
    if (filters.rawMaterial !== "All") {
      parts.push(`Raw Material: ${filters.rawMaterial}`);
    }
    
    if (filters.vendor !== "All") {
      parts.push(`Vendor: ${filters.vendor}`);
    }
    
    if (filters.year) {
      parts.push(`Year: ${filters.year}`);
    }
    
    if (filters.month) {
      const monthName = months.find(m => m.value === filters.month)?.label;
      parts.push(`Month: ${monthName}`);
    }
    
    if (filters.day) {
      parts.push(`Day: ${filters.day}`);
    }
    
    if (parts.length === 0) {
      return "Showing all inventory data";
    }
    
    return `Filtered by: ${parts.join(", ")}`;
  };

  return (
    <div className="p-4 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen">
      <div className="max-w mx-auto">
        {/* Filter Component */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-xl shadow p-4 mb-4 mt-4 mr-1 ml-1">
          <div className="flex items-center mb-3">
            <Filter className="h-5 w-5 text-white mr-2" />
            <h3 className="font-medium text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Raw Material dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Raw Material</label>
              <select
                value={filters.rawMaterial}
                onChange={(e) => handleFilterChange('rawMaterial', e.target.value)}
                className="w-full rounded-md border-gray-300 text-black shadow-sm px-3 py-2 text-sm border bg-white"
              >
                {rawMaterials.map((rm) => (
                  <option key={rm}>{rm}</option>
                ))}
              </select>
            </div>

            {/* Vendor dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Vendor</label>
              <select
                value={filters.vendor}
                onChange={(e) => handleFilterChange('vendor', e.target.value)}
                className="w-full rounded-md border-gray-300 text-black bg-white shadow-sm px-3 py-2 text-sm border"
              >
                {vendors.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            
            {/* Year dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full rounded-md border-gray-300 text-black bg-white shadow-sm px-3 py-2 text-sm border"
              >
                {years.map((year) => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </div>
            
            {/* Month dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Month</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full rounded-md border-gray-300 text-black bg-white shadow-sm px-3 py-2 text-sm border"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            
            {/* Day dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Day</label>
              <select
                value={filters.day}
                onChange={(e) => handleFilterChange('day', e.target.value)}
                className="w-full rounded-md border-gray-300 text-black bg-white shadow-sm px-3 py-2 text-sm border"
              >
                {days.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PO Status Section - New Addition */}
        <div className="mt-8 mb-2">
          <h2 className="text-xl font-bold text-white mb-4 mr-1 ml-1">Purchase Order Status</h2>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-200">Loading PO data...</p>
            </div>
          ) : (
            <>
              {/* PO Status Cards */}
              <POStatusCards filtered={filtered} />
              
              {/* PO Status Chart */}
              <div className="grid grid-cols-1 gap-4">
                <POStatusChart filtered={filtered} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterPage;