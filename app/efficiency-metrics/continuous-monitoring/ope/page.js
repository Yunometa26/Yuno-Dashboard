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
  { key: "Month", label: "Month", type: "select-month" },
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
  const [data, setData] = useState([]); // filtered data
  const [filters, setFilters] = useState({});
  const [uniqueFilters, setUniqueFilters] = useState({});
  const [daysInMonth, setDaysInMonth] = useState([]);

  // Load CSV once
  useEffect(() => {
    Papa.parse('/OPE.csv', {
      header: true,
      download: true,
      skipEmptyLines: true,
      complete: ({ data: raw }) => {
        // Clean whitespace from keys and values
        const cleaned = raw.map((row) => {
          const cleanedRow = {};
          Object.entries(row).forEach(([k, v]) => {
            cleanedRow[k && typeof k === 'string' ? k.trim() : k] = typeof v === 'string' ? v.trim() : v;
          });
          return cleanedRow;
        });

        setAllData(cleaned);
        setData(cleaned);
        updateUniqueFilters(cleaned); // UPDATED: initialize filters/days based on full dataset
      }
    });
  }, []);

  // Build unique values for filters and days
  const updateUniqueFilters = (dataset) => {
    const keys = ["Order ID", "Inventory Location", "Process", "Responsible Person"];
    const out = {};

    keys.forEach(k => {
      const raw = dataset.map(r => r[k]).filter(Boolean);
      let cleaned = k === "Responsible Person"
        ? raw.map(name => (typeof name === 'string' ? name.replace(/UCI/gi, '').trim() : name))
        : raw;

      if (k === "Process") {
        // keep in PROCESS_SEQUENCE order if present
        const seen = new Set();
        cleaned = cleaned.filter(p => {
          if (seen.has(p)) return false;
          seen.add(p);
          return true;
        });
        cleaned = PROCESS_SEQUENCE.filter(p => cleaned.includes(p));
      } else {
        cleaned = Array.from(new Set(cleaned)).sort((a, b) => String(a).localeCompare(String(b)));
      }

      out[k] = cleaned;
    });

    // Unique start dates (only valid ones), formatted as "D MMM YYYY"
    const dates = dataset.map(r => r["Sub Actual Start Date"]).filter(Boolean);
    const uniqueDates = Array.from(new Set(dates))
      .map(d => dayjs(d))
      .filter(d => d.isValid())
      .sort((a, b) => a - b)
      .map(d => d.format("D MMM YYYY"));

    out.startDate = uniqueDates;
    out.endDate = uniqueDates;

    // Extract unique months from the dataset
    const monthsInData = dataset.map(r => {
      const date = new Date(r['Sub Actual Start Date']);
      return !isNaN(date) ? format(date, 'MMMM') : null;
    }).filter(Boolean);
    
    const uniqueMonths = Array.from(new Set(monthsInData));
    // Sort months according to MONTH_ORDER
    const sortedMonths = uniqueMonths.sort((a, b) => {
      const ia = MONTH_ORDER.indexOf(a);
      const ib = MONTH_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    out.Month = sortedMonths;

    // UPDATED: Compute days that actually exist in dataset (so Day 1 is included when present)
    const daysPresentSet = new Set();
    dataset.forEach(r => {
      const d = dayjs(r['Sub Actual Start Date']);
      if (d.isValid()) daysPresentSet.add(String(d.date())); // keep as string to match select value type
    });
    let daysArr = Array.from(daysPresentSet).sort((a, b) => Number(a) - Number(b));
    // fallback to 1..31 if none (keeps UI working)
    if (daysArr.length === 0) {
      daysArr = Array.from({ length: 31 }, (_, i) => i + 1);
    }

    setUniqueFilters(out);
    setDaysInMonth(daysArr);
  };

  // Apply filters to allData and return filtered rows
  const applyFilters = () => {
    return allData.filter(row => {
      const subDate = row["Sub Actual Start Date"];
      const rowDateStr = formatDateDisplay(subDate);
      const rowDay = dayjs(subDate).date(); // numeric day
      const rowMonth = !isNaN(new Date(subDate)) ? format(new Date(subDate), 'MMMM') : '';

      // startDate / endDate are in format "D MMM YYYY" (from uniqueFilters)
      if (filters.startDate && filters.startDate !== "All" && rowDateStr !== filters.startDate) return false;
      if (filters.endDate && filters.endDate !== "All" && rowDateStr !== filters.endDate) return false;

      // Month filter
      if (filters.Month && filters.Month !== "All" && rowMonth !== filters.Month) return false;

      // UPDATED: Day comparison numeric so "1" and 1 match
      if (filters.Day && filters.Day !== "All") {
        const filterDayNum = Number(filters.Day);
        if (Number.isNaN(filterDayNum) || rowDay !== filterDayNum) return false;
      }

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

  // When filters change, re-apply and update available unique filters/days based on the filtered dataset
  useEffect(() => {
    const fd = applyFilters();
    setData(fd);
    // Only update unique filters from full dataset to preserve all available options
    if (allData.length > 0) {
      updateUniqueFilters(allData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allData]); // include allData so initial load triggers

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // compute OPE using your formulas (Availability x Performance x Quality / 10000)
  const computeOPE = (rows) => {
    if (!rows || rows.length === 0) return null;

    // Availability
    const totalTAT = rows.reduce((sum, r) => sum + parseFloat(r['Target Cycle Time'] || 0), 0);
    const totalActual = rows.reduce((sum, r) => sum + parseFloat(r['Actual Cycle Time'] || 0), 0);
    const availability = totalActual === 0 ? null : Math.min(100, (totalTAT / totalActual) * 100);

    // Performance (AVERAGEX with min 99)
    const validPerfRows = rows.filter(r => parseFloat(r['Actual Cycle Time']) !== 0);
    const performance = validPerfRows.length === 0 ? null :
      validPerfRows.reduce((sum, r) => {
        const tat = parseFloat(r['Target Cycle Time'] || 0);
        const act = parseFloat(r['Actual Cycle Time'] || 0);
        return sum + (tat === 0 ? 0 : Math.min(99, (tat / act) * 100));
      }, 0) / validPerfRows.length;

    // Quality
    const delayDays = rows.reduce((sum, r) => {
      const delay = parseFloat(r['Actual Cycle Time'] || 0) - parseFloat(r['Target Cycle Time'] || 0);
      return sum + (delay > 0 ? delay : 0);
    }, 0);
    const rawQuality = totalTAT === 0 ? null : 100 - (delayDays / totalTAT) * 100;
    const quality = rawQuality == null ? null : Math.max(0, Math.min(98, rawQuality));

    if (availability == null || performance == null || quality == null) return null;
    return +(availability * performance * quality / 10000).toFixed(2);
  };

  // Build chart data by Day — ensure daysInMonth (which includes day "1" when present) are used and produce 0 if computeOPE returns null
  const chartDataByDay = useMemo(() => {
    const grouped = {};
    data.forEach((row) => {
      const d = dayjs(row['Sub Actual Start Date']);
      if (!d.isValid()) return;
      const dayNum = d.date(); // numeric day
      if (!grouped[dayNum]) grouped[dayNum] = [];
      grouped[dayNum].push(row);
    });

    // Get all days that have data in the current filtered dataset
    const daysWithData = Object.keys(grouped).map(d => Number(d)).sort((a, b) => a - b);

    const final = [];
    if (daysWithData.length > 0) {
      daysWithData.forEach(dn => {
        const rowsForDay = grouped[dn] || [];
        const ope = computeOPE(rowsForDay);
        final.push({
          name: String(dn),
          ope: ope == null ? 0 : ope
        });
      });
    } else {
      // If no data, return empty array
      return [];
    }

    return final.sort((a, b) => Number(a.name) - Number(b.name));
  }, [data]);

  // Chart data by Responsible Person — ensure we include all persons from uniqueFilters (show 0 when no rows)
  const chartDataByPerson = useMemo(() => {
    const persons = uniqueFilters['Responsible Person'] || [];
    const grouped = {};
    data.forEach(row => {
      const rawName = row['Responsible Person'];
      const name = rawName ? rawName.replace(/UCI/gi, '').trim() : '';
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(row);
    });

    // Use persons list to preserve order and include zeros
    if (persons.length > 0) {
      return persons.map(p => ({
        name: p,
        ope: (() => {
          const rows = grouped[p] || [];
          const v = computeOPE(rows);
          return v == null ? 0 : v;
        })()
      }));
    }

    // fallback to grouped keys
    return Object.entries(grouped).map(([key, rows]) => ({
      name: key,
      ope: computeOPE(rows) ?? 0
    }));
  }, [data, uniqueFilters]);

  // Chart data by Month — include months present in data (sorted by MONTH_ORDER)
  const chartDataByMonth = useMemo(() => {
    const grouped = {};
    data.forEach(row => {
      const date = new Date(row['Sub Actual Start Date']);
      const key = !isNaN(date) ? format(date, 'MMMM') : 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    const months = Object.keys(grouped).length > 0
      ? Object.keys(grouped)
      : []; // if empty, will be empty

    // sort months using MONTH_ORDER, keep unknowns at end
    const sorted = months.sort((a, b) => {
      const ia = MONTH_ORDER.indexOf(a);
      const ib = MONTH_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return sorted.map(m => ({
      name: m,
      ope: computeOPE(grouped[m]) ?? 0
    }));
  }, [data]);

  const totalOpe = computeOPE(data) ?? 0;
  const orderCount = data.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6 space-y-10">
      <h1 className="text-3xl font-bold text-center">OPE Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {(type === "select-day" ? daysInMonth : 
                type === "select-month" ? uniqueFilters.Month :
                uniqueFilters[key])?.map(val => (
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
                <LabelList dataKey="ope" position="top" formatter={(v) => v + "%"} fill="#fff" />
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
              <LabelList dataKey="ope" position="top" formatter={(v) => v + "%"} fill="#fff" />
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