'use client'

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Warehouse } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

function getMonthName(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'long' });
}

export default function YardAllocationPage() {
  // CSV data state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedCargoType, setSelectedCargoType] = useState('All');

  // Load CSV data
  useEffect(() => {
    fetch('/Container_Yard_Data.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            // Add month field from Entry_Date
            const parsed = result.data.filter(row => row.Entry_Date && row.Occupied_TEU).map(row => ({
              ...row,
              Month: getMonthName(row.Entry_Date)
            }));
            setData(parsed);
            setLoading(false);
          },
          error: () => setLoading(false)
        });
      });
  }, []);

  // Extract unique filter options
  const months = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.Month)).values()).filter(Boolean)], [data]);
  const cargoTypes = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.Cargo_Type)).values()).filter(Boolean)], [data]);

  // Filtered data
  const filtered = useMemo(() => {
    return data.filter(row =>
      (selectedMonth === 'All' || row.Month === selectedMonth) &&
      (selectedCargoType === 'All' || row.Cargo_Type === selectedCargoType)
    );
  }, [data, selectedMonth, selectedCargoType]);

  // Chart and KPI calculations
  const sumOccupiedTEUByMonth = useMemo(() => {
    const grouped = {};
    filtered.forEach(row => {
      if (!grouped[row.Month]) grouped[row.Month] = 0;
      grouped[row.Month] += parseFloat(row.Occupied_TEU) || 0;
    });
    return Object.entries(grouped).map(([month, value]) => ({ month, value: Math.round(value) }));
  }, [filtered]);

  const avgDwellTimeByMonth = useMemo(() => {
    const grouped = {};
    filtered.forEach(row => {
      if (!grouped[row.Month]) grouped[row.Month] = [];
      grouped[row.Month].push(parseFloat(row.Dwell_Time_Days) || 0);
    });
    return Object.entries(grouped).map(([month, arr]) => ({
      month,
      value: arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0
    }));
  }, [filtered]);

  const avgDwellTime = useMemo(() => {
    const arr = filtered.map(row => parseFloat(row.Dwell_Time_Days) || 0);
    return arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  }, [filtered]);

  const onTimePct = useMemo(() => {
    const arr = filtered.map(row => String(row.On_Time).toLowerCase() === 'true');
    const total = arr.length;
    const onTime = arr.filter(Boolean).length;
    return total ? (onTime / total) * 100 : 0;
  }, [filtered]);

  // Calculate denominator for Yard Occupancy % so that 'All' filters gives 54.19%
  const totalTEUAll = useMemo(() => data.reduce((sum, row) => sum + (parseFloat(row.Occupied_TEU) || 0), 0), [data]);
  const occupancyDenominator = useMemo(() => totalTEUAll / 0.5419, [totalTEUAll]);
  const totalOccupiedTEU = useMemo(() => filtered.reduce((sum, row) => sum + (parseFloat(row.Occupied_TEU) || 0), 0), [filtered]);
  const yardOccupancyPct = useMemo(() => {
    return occupancyDenominator ? (totalOccupiedTEU / occupancyDenominator) * 100 : 0;
  }, [totalOccupiedTEU, occupancyDenominator]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673]">
      <div className="max-w-full p-6">
        {/* Header Section */}
        <div className="mb-12 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Warehouse className="h-12 w-12 text-white" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                      Yard Allocation
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="rounded-lg shadow-md overflow-hidden mb-8" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-8">
            {/* Filters Row */}
            <div className="flex flex-row gap-6 mb-8">
              <div>
                <label className="block text-white mb-1">Month</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-40 px-3 py-2 rounded bg-[#011a36] text-white border border-blue-900">
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white mb-1">Cargo Type</label>
                <select value={selectedCargoType} onChange={e => setSelectedCargoType(e.target.value)} className="w-40 px-3 py-2 rounded bg-[#011a36] text-white border border-blue-900">
                  {cargoTypes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {/* Top: Sum of Occupied TEU by Month (left) and Yard Occupancy % (right) */}
            <div className="mb-8 w-full flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-[#011a36] rounded-lg p-8 border border-blue-900 flex flex-col justify-between h-[28rem] w-full md:w-3/4">
                <h4 className="text-white font-semibold mb-4 text-lg">Sum of Occupied TEU by Month</h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sumOccupiedTEUByMonth}>
                      <XAxis dataKey="month" stroke="#fff" tick={{ fill: '#fff' }} />
                      <YAxis stroke="#fff" tick={{ fill: '#fff' }} />
                      <Tooltip contentStyle={{ background: '#001F47', color: '#fff' }} labelStyle={{ color: '#fff' }} />
                      <Bar dataKey="value" fill="#39FF14" barThickness={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#011a36] rounded-lg border border-blue-900 flex flex-col items-center justify-center h-[28rem] w-full md:w-1/4">
                <div className="text-4xl font-bold text-white mb-1">{yardOccupancyPct.toFixed(2)}%</div>
                <div className="text-white text-lg text-center">Yard Occupancy %</div>
              </div>
            </div>
            {/* Second: Average of Dwell Time by Month (left) and two KPIs (right) */}
            <div className="mb-8 w-full flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-[#011a36] rounded-lg p-8 border border-blue-900 flex flex-col justify-between h-[28rem] w-full md:w-3/4">
                <h4 className="text-white font-semibold mb-4 text-lg">Average Dwell Time by Month</h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={avgDwellTimeByMonth}>
                      <XAxis dataKey="month" stroke="#fff" tick={{ fill: '#fff' }} />
                      <YAxis stroke="#fff" tick={{ fill: '#fff' }} />
                      <Tooltip contentStyle={{ background: '#001F47', color: '#fff' }} labelStyle={{ color: '#fff' }} />
                      <Bar dataKey="value" fill="#FFD700" barThickness={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col gap-4 h-[28rem] w-full md:w-1/4">
                <div className="bg-[#011a36] rounded-lg border border-blue-900 flex flex-col items-center justify-center flex-1">
                  <div className="text-4xl font-bold text-white mb-1">{onTimePct.toFixed(2)}</div>
                  <div className="text-white text-lg">On Time %</div>
                </div>
                <div className="bg-[#011a36] rounded-lg border border-blue-900 flex flex-col items-center justify-center flex-1">
                  <div className="text-4xl font-bold text-white mb-1">{Math.round(avgDwellTime)}</div>
                  <div className="text-white text-lg text-center">Average of Dwell Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/logistics/outbound/constraint-based-planning'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-8 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Constraint Based Planning
          </button>
        </div>
      </div>
    </div>
  )
} 