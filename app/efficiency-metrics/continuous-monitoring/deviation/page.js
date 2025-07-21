'use client';

import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid,
  LabelList
} from "recharts";
import Papa from "papaparse";
import dayjs from "dayjs";

const ON_TIME_COLOR = "#3399FF";  // blue
const DELAY_COLOR   = "#FF0000";  // red
const MULTI_COLORS = [
  '#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26A69A',
  '#FFCA28', '#8D6E63', '#7E57C2', '#29B6F6', '#D4E157', '#EC407A'
];

const tooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "10px",
  color: "#fff"
};
const FILTER_BG   = "bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6";
const SELECT_STYLE = "w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white";

const FILTER_ORDER = [
  { key: "startDate", label: "Start Date", type: "select-date" },
  { key: "endDate",   label: "End Date",   type: "select-date" },
  { key: "Order ID",  label: "Order Id",   type: "select" },
  { key: "Inventory Location", label: "Location",          type: "select" },
  { key: "Process",   label: "Process",     type: "select" },
  { key: "Responsible Person", label: "Responsible Person", type: "select" },
];

const formatThousands = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  if (!d.isValid()) return dateStr;
  return d.format("D MMM YYYY");
};

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

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={tooltipStyle}>
      <p className="font-bold">{label}</p>
      {payload.map((entry, i) => {
        if (!entry.value || entry.value === 0) return null;
        return (
          <p key={i} style={{ color: entry.color, margin: 0 }}>
            {entry.name}: {formatThousands(entry.value)}
          </p>
        );
      })}
    </div>
  );
};

const Dashboard = () => {
  const [allData, setAllData]         = useState([]);
  const [data, setData]               = useState([]);
  const [filters, setFilters]         = useState({});
  const [uniqueFilters, setUniqueFilters] = useState({});

  useEffect(() => {
    fetch("/process data UCI Final.csv")
      .then(res => res.text())
      .then(csvText => {
        const parsed = Papa.parse(csvText, { header: true }).data
          .filter(d => d["Order ID"] && d["Sub Actual Start Date"]);
        setAllData(parsed);
        setData(parsed);
        updateUniqueFilters(parsed);
      });
  }, []);

  const updateUniqueFilters = (dataset) => {
    const keys = ["Order ID","Inventory Location","Process","Responsible Person"];
    const out = {};
    keys.forEach(k => {
      if (k === "Process") {
        // Pair process with its sequence, deduplicate by process, then sort by sequence
        const processSeqPairs = dataset
          .map(r => ({
            process: r["Process"],
            seq: Number(r["Process Sequence"])
          }))
          .filter(r => r.process && !isNaN(r.seq));
        // Deduplicate by process, keeping the lowest sequence
        const processMap = {};
        processSeqPairs.forEach(({ process, seq }) => {
          if (!(process in processMap) || seq < processMap[process]) {
            processMap[process] = seq;
          }
        });
        out[k] = Object.entries(processMap)
          .sort((a, b) => a[1] - b[1])
          .map(([process]) => process);
      } else {
        out[k] = Array.from(new Set(dataset.map(r => r[k]).filter(Boolean)))
                     .sort((a,b) => typeof a === "number"
                                    ? a - b
                                    : a.localeCompare(b));
      }
    });
    // For startDate and endDate, collect all unique dates, format as 'D MMM YYYY', and sort
    const allDates = dataset.map(r => r["Sub Actual Start Date"]).filter(Boolean);
    const uniqueDates = Array.from(new Set(allDates))
      .map(d => dayjs(d))
      .filter(d => d.isValid())
      .sort((a, b) => a - b)
      .map(d => d.format("D MMM YYYY"));
    out.startDate = uniqueDates;
    out.endDate = uniqueDates;
    setUniqueFilters(out);
  };

  const applyFilters = () => {
    return allData.filter(row => {
      // For startDate and endDate, compare formatted date string
      if (filters.startDate && filters.startDate !== "All") {
        const rowDate = formatDateDisplay(row["Sub Actual Start Date"]);
        if (rowDate !== filters.startDate) return false;
      }
      if (filters.endDate && filters.endDate !== "All") {
        const rowDate = formatDateDisplay(row["Sub Actual Start Date"]);
        if (rowDate !== filters.endDate) return false;
      }
      for (let key of ["Order ID","Inventory Location","Process","Responsible Person"]) {
        const val = filters[key];
        if (val && val !== "All" && row[key] !== val) return false;
      }
      return true;
    });
  };

  useEffect(() => {
    const fd = applyFilters();
    setData(fd);
    updateUniqueFilters(fd);
  }, [filters]);

  const handleFilterChange = e => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const statusPieData = [
    { name: "On Time", value: data.filter(d => d["Status Type"]==="On Time").length },
    { name: "Delay",   value: data.filter(d => d["Status Type"]==="Delay").length },
  ];
  const uniqueOrderCount = new Set(data.map(d => d["Order ID"])).size;

  const subprocessStatusMap = {};
  data.forEach(r => {
    const sub = r["Subprocess"];
    const st  = r["Status Type"];
    if (!subprocessStatusMap[sub]) subprocessStatusMap[sub] = { Subprocess: sub, "On Time":0, "Delay":0 };
    if (st==="On Time") subprocessStatusMap[sub]["On Time"]++;
    if (st==="Delay")   subprocessStatusMap[sub]["Delay"]++;
  });
  const statusBySubprocessData = Object.values(subprocessStatusMap);

  const MONTH_ORDER = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  
  const uniqueProcessesForChart = [...new Set(data.map(r => r["Process"]).filter(Boolean))].sort();
  const monthlyProcessCounts = {};
  data.forEach(r => {
    const month = dayjs(r["Sub Actual Start Date"]).format("MMMM");
    const process = r["Process"];
    if (!month || !process) return;

    if (!monthlyProcessCounts[month]) {
      monthlyProcessCounts[month] = { Month: month };
      uniqueProcessesForChart.forEach(p => {
        monthlyProcessCounts[month][p] = 0;
      });
    }
    if (monthlyProcessCounts[month][process] !== undefined) {
      monthlyProcessCounts[month][process]++;
    }
  });

  const monthlyProcessData = Object.values(monthlyProcessCounts)
    .sort((a,b)=> MONTH_ORDER.indexOf(a.Month)-MONTH_ORDER.indexOf(b.Month));

  const responsiblePersons = [...new Set(data.map(r=>r["Responsible Person"]))];
  const subprocesses       = [...new Set(data.map(r=>r["Subprocess"]))];
  const respSubDelay = {};
  responsiblePersons.forEach(person => {
    respSubDelay[person] = { Responsible: person };
    subprocesses.forEach(sub => respSubDelay[person][sub] = 0);
  });
  data.filter(r=>r["Status Type"]==="Delay").forEach(r => {
    respSubDelay[r["Responsible Person"]][r["Subprocess"]]++;
  });
  const subprocessBarData = Object.values(respSubDelay);

  const renderCustomizedLabel = ({ x, y, width, height, value }) => {
    // Hide label if the bar segment is too narrow to display text or has no value
    if (width < 25 || !value) {
      return null;
    }

    return (
      <g>
        <text
          x={x + width / 2}
          y={y + height / 2}
          fill="#fff"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
        >
          {formatThousands(value)}
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6 space-y-10">
      <h1 className="text-3xl font-bold text-center text-white">Deviation Dashboard</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FILTER_ORDER.map(({ key, label, type }) => (
          <div className={FILTER_BG} key={key}>
            <label className="block text-white mb-1">{label}</label>
            {type === "select-date" ? (
              <select
                name={key}
                className={SELECT_STYLE}
                onChange={handleFilterChange}
                value={filters[key]||"All"}
              >
                <option value="All">All</option>
                {uniqueFilters[key]?.map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            ) : (
              <select
                name={key}
                className={SELECT_STYLE}
                onChange={handleFilterChange}
                value={filters[key]||"All"}
              >
                <option value="All">All</option>
                {uniqueFilters[key]?.map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Pie + Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-lg font-bold text-white text-center mb-4">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusPieData}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={100}
                label
              >
                {statusPieData.map((_,i) => (
                  <Cell
                    key={i}
                    fill={i===0 ? ON_TIME_COLOR : DELAY_COLOR}
                  />
                ))}
              </Pie>
              <Legend />
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold text-white">{uniqueOrderCount}</span>
          <span className="mt-2 text-gray-300">Count of Order ID</span>
        </div>
      </div>

      {/* Delay by Subprocess */}
      <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
        <h2 className="text-lg font-bold text-white text-center mb-4">Count of On Time and Delay by Subprocess</h2>
        <ResponsiveContainer width="100%" height={Math.max(400, statusBySubprocessData.length*45)}>
          <BarChart
            data={statusBySubprocessData}
            layout="vertical"
            margin={{ top:20, right:100, left:250, bottom:20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" stroke="#fff" tickFormatter={formatThousands} />
            <YAxis dataKey="Subprocess" type="category" stroke="#fff" width={250} />
            <Tooltip content={<CustomTooltipBar />} />
            <Legend />
            <Bar dataKey="On Time" stackId="a" fill={ON_TIME_COLOR}>
              <LabelList dataKey="On Time" position="center" formatter={(value) => value > 0 ? formatThousands(value) : ''} fill="#fff" />
            </Bar>
            <Bar dataKey="Delay" stackId="a" fill={DELAY_COLOR}>
              <LabelList dataKey="Delay" position="center" formatter={(value) => value > 0 ? formatThousands(value) : ''} fill="#fff" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Process Count */}
      <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
        <h2 className="text-lg font-bold text-white text-center mb-4">
          Count of Status Type by Month and Process
        </h2>
        <ResponsiveContainer width="100%" height={Math.max(400, monthlyProcessData.length * 60)}>
          <BarChart
            data={monthlyProcessData}
            layout="vertical"
            margin={{ top: 20, right: 100, left: 250, bottom: 20 }}
            barCategoryGap={10}
          >
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis type="number" stroke="#fff" tickFormatter={formatThousands} domain={[0, 'dataMax + 1']} />
            <YAxis dataKey="Month" type="category" stroke="#fff" width={250} />
            <Tooltip content={<CustomTooltipBar />} />
            <Legend/>
            {uniqueProcessesForChart.map((process, index) => (
              <Bar key={process} dataKey={process} stackId="a" fill={MULTI_COLORS[index % MULTI_COLORS.length]}>
                <LabelList dataKey={process} content={renderCustomizedLabel} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delay by Responsible + Subprocess */}
      <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
        <h2 className="text-lg font-bold text-white text-center mb-4">
          Count of Delay by Responsible Person and Subprocess
        </h2>
        <ResponsiveContainer width="100%" height={Math.max(400, subprocessBarData.length*45)}>
          <BarChart
            data={subprocessBarData}
            layout="vertical"
            margin={{ top:20, right:100, left:250, bottom:20 }}
            barCategoryGap={10}
          >
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis type="number" stroke="#fff" tickFormatter={formatThousands} />
            <YAxis dataKey="Responsible" type="category" stroke="#fff" width={250}/>
            <Tooltip content={<CustomTooltipBar />} />
            <Legend/>
            {subprocesses.map((sub,i) => (
              <Bar key={sub} dataKey={sub} stackId="a" fill={MULTI_COLORS[i % MULTI_COLORS.length]}>
                <LabelList dataKey={sub} position="center" formatter={(value) => value > 0 ? formatThousands(value) : ''} fill="#fff" />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.location.href = '../continuous-monitoring'}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2]
                     text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Continuous Monitoring
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
