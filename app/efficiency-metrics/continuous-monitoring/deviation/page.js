'use client';

import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid
} from "recharts";
import Papa from "papaparse";
import dayjs from "dayjs";

// Chart colors
const COLORS = ["#00FF00", "#FF0000"]; // Green, Red

// UI styles
const FILTER_BG = "bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6";
const SELECT_STYLE = "w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white";

// Custom tooltip
const tooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "10px",
  color: "#fff"
};

// Custom Pie Tooltip
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={tooltipStyle}>
        <p style={{ margin: 0 }}>{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [uniqueFilters, setUniqueFilters] = useState({});

  useEffect(() => {
    fetch("/process data UCI Final.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const parsed = Papa.parse(csvText, { header: true });
        const cleaned = parsed.data.filter((d) => d["Order ID"]);

        const withMonth = cleaned.map((item) => ({
          ...item,
          Month: item["Date"] ? dayjs(item["Date"]).format("MMMM") : "Invalid",
        }));

        setData(withMonth);
        extractUniqueFilters(withMonth);
      });
  }, []);

  const extractUniqueFilters = (dataset) => {
    const keys = [
      "Month",
      "Inventory Location",
      "Client Name",
      "Subprocess",
      "Process",
      "Order ID",
      "Order State",
      "Responsible Person"
    ];
    const result = {};
    keys.forEach((key) => {
      let values = [...new Set(dataset.map((item) => item[key]).filter(Boolean))];
      const isNumeric = values.every((val) => !isNaN(val));
      values.sort((a, b) => isNumeric ? Number(a) - Number(b) : a.localeCompare(b));
      result[key] = values;
    });
    setUniqueFilters(result);
  };

  const applyFilters = () => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        return !value || value === "All" || item[key] === value;
      });
    });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredData = applyFilters();

  // Pie Chart Data
  const statusPieData = [
    {
      name: "On Time",
      value: filteredData.filter((d) => d["Status Type"] === "On Time").length,
    },
    {
      name: "Delay",
      value: filteredData.filter((d) => d["Status Type"] === "Delay").length,
    },
  ];

  // Bar Chart Data (Grouped by Subprocess)
  const countGrouped = {};
  filteredData.forEach((row) => {
    const subprocess = row["Subprocess"];
    const type = row["Status Type"];
    if (!countGrouped[subprocess]) {
      countGrouped[subprocess] = { Subprocess: subprocess, Delay: 0, "On Time": 0 };
    }
    if (type === "Delay" || type === "On Time") {
      countGrouped[subprocess][type] += 1;
    }
  });

  const countBarData = Object.values(countGrouped).sort((a, b) =>
    a.Subprocess.localeCompare(b.Subprocess)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6 space-y-10">
      {/* Title */}
      <h1 className="text-3xl font-bold text-center text-white">Deviation Dashboard</h1>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.keys(uniqueFilters).map((key) => (
          <div className={FILTER_BG} key={key}>
            <label className="block text-white mb-1">{key}</label>
            <select
              name={key}
              className={SELECT_STYLE}
              onChange={handleFilterChange}
              value={filters[key] || "All"}
            >
              <option value="All">All</option>
              {uniqueFilters[key].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Pie Chart */}
      <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
        <h2 className="text-white mb-4 font-bold text-lg text-center">Count of Order ID by Status Type</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusPieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {statusPieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
        <h2 className="text-white mb-4 font-bold text-lg text-center">
          Count of On Time and Delay by Subprocess
        </h2>
        <ResponsiveContainer width="100%" height={Math.max(countBarData.length * 45, 400)}>
          <BarChart
            data={countBarData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 250, bottom: 20 }}
            barCategoryGap={10}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" stroke="#fff" />
            <YAxis dataKey="Subprocess" type="category" stroke="#fff" width={220} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
            <Legend />
            <Bar dataKey="On Time" stackId="a" fill="#00FF00" />
            <Bar dataKey="Delay" stackId="a" fill="#FF0000" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Back Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.location.href = "../continuous-monitoring"}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Continuous Monitoring
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
