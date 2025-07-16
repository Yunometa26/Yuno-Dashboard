'use client'
import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { Filter } from "lucide-react";
import POStatusCards from "../raw-material/POStatusCards";
import POStatusChart from "../raw-material/POStatusChart";

const validMonths = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];
const monthLabels = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const validDays = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const FilterPage = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
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
    item: "All",
    vendor: "All",
    day: "",
    month: "",
    year: ""
  });

  useEffect(() => {
    Papa.parse("/POstatus.csv", {
      header: true,
      download: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t'],
      complete: (results) => {
        const parsed = results.data
          .filter((row) => row["PO Date"])
          .map((row) => ({
            ...row,
            "PO Date": new Date(row["PO Date"]),
            "Expected Delivery Date": row["Expected Delivery Date"] ? new Date(row["Expected Delivery Date"]) : null,
            "Actual Delivery Date": row["Actual Delivery Date"] ? new Date(row["Actual Delivery Date"]) : null,
          }));
        
        setData(parsed);
        setFiltered(parsed);
        setLoading(false);

        // Set unique vendors
        setVendors([
          "All",
          ...Array.from(new Set(parsed.map((d) => d["Vendor"]))).filter(Boolean).sort(),
        ]);

        // Set unique items
        setItems([
          "All",
          ...Array.from(new Set(parsed.map((d) => d["Item Description"]))).filter(Boolean).sort(),
        ]);

        // Extract available years from the PO Date
        const availableYears = Array.from(
          new Set(parsed.map((d) => d["PO Date"].getFullYear()))
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

    // Item filter
    if (filters.item !== "All") {
      filteredData = filteredData.filter(
        (d) => d["Item Description"] === filters.item
      );
    }

    // Vendor filter
    if (filters.vendor !== "All") {
      filteredData = filteredData.filter(
        (d) => d["Vendor"] === filters.vendor
      );
    }

    // Day filter
    if (filters.day) {
      filteredData = filteredData.filter(
        (d) => d["PO Date"].getDate() === parseInt(filters.day)
      );
    }

    // Month filter
    if (filters.month) {
      filteredData = filteredData.filter(
        (d) => d["PO Date"].getMonth() + 1 === parseInt(filters.month)
      );
    }

    // Year filter
    if (filters.year) {
      filteredData = filteredData.filter(
        (d) => d["PO Date"].getFullYear() === parseInt(filters.year)
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
    
    if (filters.item !== "All") {
      parts.push(`Item: ${filters.item}`);
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
      return "Showing all purchase order data";
    }
    
    return `Filtered by: ${parts.join(", ")}`;
  };

  // --- Dynamic filter options ---
  const dynamicItems = useMemo(() => {
    let arr = data;
    if (filters.vendor && filters.vendor !== "All") arr = arr.filter(d => d["Vendor"] === filters.vendor);
    if (filters.year) arr = arr.filter(d => d["PO Date"].getFullYear().toString() === filters.year);
    if (filters.month && validMonths.includes(filters.month)) arr = arr.filter(d => (d["PO Date"].getMonth() + 1).toString() === filters.month);
    if (filters.day && validDays.includes(filters.day)) arr = arr.filter(d => d["PO Date"].getDate().toString() === filters.day);
    return ["All", ...Array.from(new Set(arr.map(d => d["Item Description"]))).filter(Boolean).sort()];
  }, [data, filters.vendor, filters.year, filters.month, filters.day]);

  const dynamicVendors = useMemo(() => {
    let arr = data;
    if (filters.item && filters.item !== "All") arr = arr.filter(d => d["Item Description"] === filters.item);
    if (filters.year) arr = arr.filter(d => d["PO Date"].getFullYear().toString() === filters.year);
    if (filters.month && validMonths.includes(filters.month)) arr = arr.filter(d => (d["PO Date"].getMonth() + 1).toString() === filters.month);
    if (filters.day && validDays.includes(filters.day)) arr = arr.filter(d => d["PO Date"].getDate().toString() === filters.day);
    return ["All", ...Array.from(new Set(arr.map(d => d["Vendor"]))).filter(Boolean).sort()];
  }, [data, filters.item, filters.year, filters.month, filters.day]);

  const dynamicYears = useMemo(() => {
    let arr = data;
    if (filters.item && filters.item !== "All") arr = arr.filter(d => d["Item Description"] === filters.item);
    if (filters.vendor && filters.vendor !== "All") arr = arr.filter(d => d["Vendor"] === filters.vendor);
    if (filters.month && validMonths.includes(filters.month)) arr = arr.filter(d => (d["PO Date"].getMonth() + 1).toString() === filters.month);
    if (filters.day && validDays.includes(filters.day)) arr = arr.filter(d => d["PO Date"].getDate().toString() === filters.day);
    const years = Array.from(new Set(arr.map(d => d["PO Date"].getFullYear().toString())));
    return [{ value: "", label: "All Years" }, ...years.sort().map(year => ({ value: year, label: year }))];
  }, [data, filters.item, filters.vendor, filters.month, filters.day]);

  const dynamicMonths = useMemo(() => {
    let arr = data;
    if (filters.item && filters.item !== "All") arr = arr.filter(d => d["Item Description"] === filters.item);
    if (filters.vendor && filters.vendor !== "All") arr = arr.filter(d => d["Vendor"] === filters.vendor);
    if (filters.year) arr = arr.filter(d => d["PO Date"].getFullYear().toString() === filters.year);
    if (filters.day && validDays.includes(filters.day)) arr = arr.filter(d => d["PO Date"].getDate().toString() === filters.day);
    const months = Array.from(new Set(arr.map(d => (d["PO Date"].getMonth() + 1).toString()))).filter(m => validMonths.includes(m));
    return [{ value: "", label: "All Months" }, ...months.sort((a, b) => parseInt(a) - parseInt(b)).map(m => ({ value: m, label: monthLabels[parseInt(m) - 1] }))];
  }, [data, filters.item, filters.vendor, filters.year, filters.day]);

  const dynamicDays = useMemo(() => {
    let arr = data;
    if (filters.item && filters.item !== "All") arr = arr.filter(d => d["Item Description"] === filters.item);
    if (filters.vendor && filters.vendor !== "All") arr = arr.filter(d => d["Vendor"] === filters.vendor);
    if (filters.year) arr = arr.filter(d => d["PO Date"].getFullYear().toString() === filters.year);
    if (filters.month && validMonths.includes(filters.month)) arr = arr.filter(d => (d["PO Date"].getMonth() + 1).toString() === filters.month);
    const days = Array.from(new Set(arr.map(d => d["PO Date"].getDate().toString()))).filter(d => validDays.includes(d));
    return [{ value: "", label: "All Days" }, ...days.sort((a, b) => parseInt(a) - parseInt(b)).map(d => ({ value: d, label: d }))];
  }, [data, filters.item, filters.vendor, filters.year, filters.month]);

  // --- Pie Chart Data ---
  const pieChartData = useMemo(() => {
    // Group by PO Status in filtered data
    const statusCounts = {};
    filtered.forEach(row => {
      const status = row["PO Status"] || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({ name: status, value: count }));
  }, [filtered]);

  // --- Delayed Deliveries Calculation ---
  const delayedDeliveriesCount = useMemo(() => {
    // Use PO Status 'Delayed' as the source of truth, as per the CSV
    return filtered.filter(row => row["PO Status"] === 'Delayed').length;
  }, [filtered]);

  return (
    <div className="p-4 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen rounded-xl border">
      <div className="max-w mx-auto">
        {/* Header */}
        <div className="mb-6 mr-1 ml-1">
          <h1 className="text-3xl font-bold text-white mb-2">Purchase Order Dashboard</h1>
          <p className="text-blue-100">{getFilterSummary()}</p>
        </div>

        {/* Filter Component */}
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-xl shadow p-4 mb-4 mt-4 mr-1 ml-1">
          <div className="flex items-center mb-3">
            <Filter className="h-5 w-5 text-white mr-2" />
            <h3 className="font-medium text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Item dropdown */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">Item</label>
              <select
                value={filters.item}
                onChange={(e) => handleFilterChange('item', e.target.value)}
                className="w-full rounded-md border-gray-300 text-black shadow-sm px-3 py-2 text-sm border bg-white"
              >
                {dynamicItems.map((item) => (
                  <option key={item} value={item}>{item}</option>
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
                {dynamicVendors.map((v) => (
                  <option key={v} value={v}>{v}</option>
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
                {dynamicYears.map((year) => (
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
                {dynamicMonths.map((month) => (
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
                {dynamicDays.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PO Status Section */}
        <div className="mt-8 mb-2">
          <h2 className="text-xl font-bold text-white mb-4 mr-1 ml-1">Purchase Order Analytics</h2>
          
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