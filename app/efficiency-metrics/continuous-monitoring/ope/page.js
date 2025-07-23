'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LabelList
} from 'recharts';
import { format } from 'date-fns';
import dayjs from 'dayjs';

const COLORS = ['#339CFF'];
const FILTER_WRAPPER = 'bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6';
const FILTER_SELECT = 'w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white';
const CARD_STYLE = 'bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center text-center h-full';

const FILTER_BG = FILTER_WRAPPER;
const SELECT_STYLE = FILTER_SELECT;

const MONTH_ORDER = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const PROCESS_SEQUENCE = ['Invoice', 'Procurement', 'Production', 'Dispatch', 'Payment'];

const FILTER_ORDER = [
  { key: "startDate", label: "Start Date", type: "select-date" },
  { key: "endDate", label: "End Date", type: "select-date" },
  { key: "Day", label: "Day", type: "select-day" },
  { key: "Order ID", label: "Order Id", type: "select" },
  { key: "Inventory Location", label: "Location", type: "select" },
  { key: "Process", label: "Process", type: "select" },
  { key: "Responsible Person", label: "Responsible Person", type: "select" },
];

const formatDateDisplay = (dateStr) => {
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("D MMM YYYY") : "";
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
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
  const [daysInMonth, setDaysInMonth] = useState([]);

  useEffect(() => {
    Papa.parse('/Process Data UCI _.csv', {
      header: true,
      download: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const cleaned = data.map((row) => {
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
    const keys = ["Order ID", "Inventory Location", "Process", "Responsible Person"];
    const out = {};

    keys.forEach(k => {
      const raw = dataset.map(r => r[k]).filter(Boolean);
      let cleaned = k === "Responsible Person"
        ? raw.map(name => name.replace(/UCI/gi, '').trim())
        : raw;

      if (k === "Process") {
        const seen = new Set();
        cleaned = cleaned.filter(p => {
          if (seen.has(p)) return false;
          seen.add(p);
          return true;
        });
        cleaned = PROCESS_SEQUENCE.filter(p => cleaned.includes(p));
      } else {
        cleaned = Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b));
      }

      out[k] = cleaned;
    });

    const dates = dataset.map(r => r["Sub Actual Start Date"]).filter(Boolean);
    const uniqueDates = Array.from(new Set(dates))
      .map(d => dayjs(d))
      .filter(d => d.isValid())
      .sort((a, b) => a - b)
      .map(d => d.format("D MMM YYYY"));

    out.startDate = uniqueDates;
    out.endDate = uniqueDates;
    setUniqueFilters(out);

    const fullDays = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
    setDaysInMonth(fullDays);
  };

  const applyFilters = () => {
    return allData.filter(row => {
      const subDate = row["Sub Actual Start Date"];
      const rowDateStr = formatDateDisplay(subDate);
      const rowDay = dayjs(subDate).date().toString();

      if (filters.startDate && filters.startDate !== "All" && rowDateStr !== filters.startDate) return false;
      if (filters.endDate && filters.endDate !== "All" && rowDateStr !== filters.endDate) return false;
      if (filters.Day && filters.Day !== "All" && rowDay !== filters.Day) return false;

      for (let key of ["Order ID", "Inventory Location", "Process", "Responsible Person"]) {
        const filterVal = filters[key];
        if (filterVal && filterVal !== "All") {
          const raw = key === "Responsible Person"
            ? (row[key] || "").replace(/UCI/gi, '').trim()
            : row[key];
          if (raw !== filterVal) return false;
        }
      }
      return true;
    });
  };

  useEffect(() => {
    const fd = applyFilters();
    setData(fd);
    updateUniqueFilters(fd);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const computeOPE = (rows) => {
    const availability = (() => {
      const totalTAT = rows.reduce((sum, r) => sum + parseFloat(r['Sub TAT (Days)'] || 0), 0);
      const totalActual = rows.reduce((sum, r) => sum + parseFloat(r['Actual Days'] || 0), 0);
      if (totalActual === 0) return null;
      return Math.min(100, (totalTAT / totalActual) * 100);
    })();

    const performance = (() => {
      const validRows = rows.filter(r => parseFloat(r['Actual Days']) !== 0);
      if (validRows.length === 0) return null;
      return validRows.reduce((sum, r) => {
        const tat = parseFloat(r['Sub TAT (Days)'] || 0);
        const act = parseFloat(r['Actual Days'] || 0);
        return sum + (tat === 0 ? 0 : Math.min(100, (tat / act) * 100));
      }, 0) / validRows.length;
    })();

    const quality = (() => {
      const delayDays = rows.reduce((sum, r) => {
        const delay = parseFloat(r['Actual Days'] || 0) - parseFloat(r['Sub TAT (Days)'] || 0);
        return sum + (delay > 0 ? delay : 0);
      }, 0);
      const totalTAT = rows.reduce((sum, r) => sum + parseFloat(r['Sub TAT (Days)'] || 0), 0);
      if (totalTAT === 0) return null;
      return Math.max(0, 100 - (delayDays / totalTAT) * 100);
    })();

    if (availability == null || performance == null || quality == null) return null;
    return +(availability * performance * quality / 10000).toFixed(2);
  };

  const chartDataByDay = useMemo(() => {
    const grouped = {};
    data.forEach((row) => {
      const d = dayjs(row['Sub Actual Start Date']);
      if (!d.isValid()) return;
      const dayNum = d.date().toString();
      if (!grouped[dayNum]) grouped[dayNum] = [];
      grouped[dayNum].push(row);
    });
    return Object.entries(grouped)
      .map(([day, rows]) => ({
        name: day,
        ope: computeOPE(rows) ?? 0
      }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [data]);

  const chartDataByPerson = useMemo(() => {
    const grouped = {};
    data.forEach(row => {
      const rawName = row['Responsible Person'];
      const name = rawName ? rawName.replace(/UCI/gi, '').trim() : '';
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(row);
    });
    return Object.entries(grouped).map(([key, rows]) => ({
      name: key,
      ope: computeOPE(rows) ?? 0
    }));
  }, [data]);

  const chartDataByMonth = useMemo(() => {
    const grouped = {};
    data.forEach(row => {
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
      .sort((a, b) => MONTH_ORDER.indexOf(a.name) - MONTH_ORDER.indexOf(b.name));
  }, [data]);

  const totalOpe = computeOPE(data) ?? 0;
  const orderCount = data.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6 space-y-10">
      <h1 className="text-3xl font-bold text-center">OPE Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FILTER_ORDER.map(({ key, label, type }) => (
          <div className={FILTER_BG} key={key}>
            <label className="block text-white mb-1">{label}</label>
            <select
              name={key}
              className={SELECT_STYLE}
              onChange={handleFilterChange}
              value={filters[key] || "All"}
            >
              <option value="All">All</option>
              {(type === "select-day" ? daysInMonth : uniqueFilters[key])?.map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className={FILTER_WRAPPER + ' col-span-2'}>
          <h2 className="text-xl font-semibold mb-2">OPE (%) by Responsible Person</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataByPerson}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: 'white' }} />
              <YAxis tick={{ fill: 'white' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ope" fill={COLORS[0]}>
                <LabelList dataKey="ope" position="top" formatter={(v) => `${v}%`} fill="#fff" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col space-y-6">
          <div className={CARD_STYLE}>
            <h3 className="text-4xl font-bold">{orderCount}</h3>
            <p className="mt-2">Count of Order ID</p>
          </div>
          <div className={CARD_STYLE}>
            <h3 className="text-4xl font-bold">{totalOpe}</h3>
            <p className="mt-2">OPE (%)</p>
          </div>
        </div>
      </div>

      <div className={FILTER_WRAPPER}>
        <h2 className="text-xl font-semibold mb-2">OPE (%) by Month</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartDataByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: 'white' }} />
            <YAxis tick={{ fill: 'white' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ope" fill={COLORS[0]}>
              <LabelList dataKey="ope" position="top" formatter={(v) => `${v}%`} fill="#fff" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={FILTER_WRAPPER}>
        <h2 className="text-xl font-semibold mb-2">OPE (%) by Day</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartDataByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: 'white' }} />
            <YAxis tick={{ fill: 'white' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ope" fill={COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

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
