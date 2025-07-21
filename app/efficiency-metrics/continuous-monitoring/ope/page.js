'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from 'recharts';
import { format } from 'date-fns';
import dayjs from 'dayjs';

const COLORS = ['#339CFF'];
const FILTER_WRAPPER =
  'bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6';
const FILTER_SELECT =
  'w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white';
const CARD_STYLE =
  'bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center text-center h-full';

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

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  if (!d.isValid()) return dateStr;
  return d.format("D MMM YYYY");
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white p-2 rounded shadow-lg">
        <p className="font-semibold">{label}</p>
        <p>OPE: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function OpeDashboard() {
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [uniqueFilters, setUniqueFilters] = useState({});

  useEffect(() => {
    Papa.parse('/Process Data UCI _.csv', {
      header: true,
      download: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.map((row) => {
          const cleanedRow = {};
          Object.entries(row).forEach(([k, v]) => {
            cleanedRow[k.trim()] = typeof v === 'string' ? v.trim() : v;
          });
          return cleanedRow;
        });
        setAllData(cleaned);
        setData(cleaned);
        updateUniqueFilters(cleaned);
      }
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

  const getDynamicOptions = (key) => {
    const set = new Set();
    applyFilters.forEach((row) => {
      if (key === 'month') {
        const date = new Date(row['Sub Actual Start Date']);
        if (!isNaN(date)) {
          set.add(format(date, 'MMMM'));
        }
      } else {
        const val = row[getKeyName(key)];
        if (val) set.add(val.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  };

  const getKeyName = (filterKey) => {
    const map = {
      inventoryLocation: 'Inventory Location',
      subprocess: 'Subprocess',
      responsiblePerson: 'Responsible Person',
      process: 'Process',
      orderId: 'Order ID',
      clientName: 'Client Name',
      orderState: 'Order State'
    };
    return map[filterKey] || filterKey;
  };

  const computeOPE = (rows) => {
    const availability = (() => {
      const totalTAT = rows.reduce((sum, r) => sum + parseFloat(r['Sub TAT (Days)'] || 0), 0);
      const totalActual = rows.reduce((sum, r) => sum + parseFloat(r['Actual Days'] || 0), 0);
      if (totalActual === 0) return null;
      const raw = (totalTAT / totalActual) * 100;
      return Math.min(100, raw);
    })();

    const performance = (() => {
      const validRows = rows.filter(r => parseFloat(r['Actual Days']) !== 0);
      if (validRows.length === 0) return null;
      const avg = validRows.reduce((sum, r) => {
        const tat = parseFloat(r['Sub TAT (Days)'] || 0);
        const act = parseFloat(r['Actual Days'] || 0);
        return sum + (tat === 0 ? 0 : Math.min(100, (tat / act) * 100));
      }, 0) / validRows.length;
      return avg;
    })();

    const quality = (() => {
      const delayDays = rows.reduce((sum, r) => {
        const delay = parseFloat(r['Actual Days'] || 0) - parseFloat(r['Sub TAT (Days)'] || 0);
        return sum + (delay > 0 ? delay : 0);
      }, 0);
      const totalTAT = rows.reduce((sum, r) => sum + parseFloat(r['Sub TAT (Days)'] || 0), 0);
      if (totalTAT === 0) return null;
      const rawQuality = 100 - (delayDays / totalTAT) * 100;
      return Math.max(0, Math.min(100, rawQuality));
    })();

    if (availability == null || performance == null || quality == null) return null;
    return +(availability * performance * quality / 10000).toFixed(2);
  };

  const chartDataByPerson = useMemo(() => {
    const grouped = {};
    data.forEach((row) => {
      const key = row['Responsible Person'];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });
    return Object.entries(grouped).map(([key, rows]) => ({
      name: key,
      ope: computeOPE(rows) ?? 0
    }));
  }, [data]);

  const chartDataByMonth = useMemo(() => {
    const grouped = {};
    data.forEach((row) => {
      const date = new Date(row['Sub Actual Start Date']);
      const key = !isNaN(date) ? format(date, 'MMMM') : 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });
    return Object.entries(grouped)
      .map(([month, rows]) => ({
        name: month,
        ope: computeOPE(rows) ?? 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const totalOpe = computeOPE(data) ?? 0;
  const orderCount = data.length;

  const renderFilter = (label, key) => {
    const options = getDynamicOptions(key);
    return (
      <div className={FILTER_WRAPPER} key={key}>
        <label className="text-white block mb-2">{label}</label>
        <select
          className={FILTER_SELECT}
          value={filters[key]}
          onChange={(e) => handleFilterChange(e)}
        >
          <option>All</option>
          {options.map((opt, i) => (
            <option key={i}>{opt}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6 space-y-10">
      <h1 className="text-3xl font-bold mb-4 text-center">OPE Dashboard</h1>

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

      <div className="grid grid-cols-3 gap-6 mt-8 items-stretch">
        <div className={FILTER_WRAPPER + ' col-span-2'}>
          <h2 className="text-xl font-semibold mb-2">OPE (%) by Responsible Person</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataByPerson}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: 'white' }} />
              <YAxis tick={{ fill: 'white' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ope" fill={COLORS[0]}>
                <LabelList dataKey="ope" position="top" formatter={(value) => `${value}%`} fill="#fff" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col space-y-6">
          <div className={CARD_STYLE + ' h-[144px]'}>
            <h3 className="text-4xl font-bold">{orderCount}</h3>
            <p className="mt-2">Count of Order ID</p>
          </div>
          <div className={CARD_STYLE + ' h-[144px]'}>
            <h3 className="text-4xl font-bold">{totalOpe}</h3>
            <p className="mt-2">OPE (%)</p>
          </div>
        </div>
      </div>

      <div className={FILTER_WRAPPER + ' mt-8'}>
        <h2 className="text-xl font-semibold mb-2">OPE (%) by Month</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartDataByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: 'white' }} />
            <YAxis tick={{ fill: 'white' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ope" fill={COLORS[0]}>
              <LabelList dataKey="ope" position="top" formatter={(value) => `${value}%`} fill="#fff" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* BACK BUTTON */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => (window.location.href = '../continuous-monitoring')}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Continuous Monitoring
        </button>
      </div>
    </div>
  );
}
