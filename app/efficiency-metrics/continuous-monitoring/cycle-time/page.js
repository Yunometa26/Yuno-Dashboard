'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import GaugeChart from 'react-gauge-chart';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-black p-2 rounded shadow-md">
        <p className="font-semibold">{label}</p>
        <p>{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function UCIDashboard() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: 'All',
    location: 'All',
    client: 'All',
    status: 'All',
    month: 'All'
  });
  const [selectedProcess, setSelectedProcess] = useState(null);

  useEffect(() => {
    fetch('/process data UCI Final.csv')
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const grouped = new Map();
            results.data.forEach(row => {
              const orderId = row['Order ID'];
              const start = new Date(row['Sub Actual Start Date']);
              const end = new Date(row['Sub Actual End Date']);
              if (!grouped.has(orderId)) grouped.set(orderId, []);
              grouped.get(orderId).push({
                ...row,
                startDate: start,
                endDate: end
              });
            });

            const cleaned = Array.from(grouped.entries()).map(([orderId, rows]) => {
              const start = new Date(Math.min(...rows.map(r => r.startDate)));
              const end = new Date(Math.max(...rows.map(r => r.endDate)));
              const month = isNaN(start) ? '' : start.toLocaleString('default', { month: 'long' });
              const targetCycle = rows.reduce((sum, r) => sum + Number(r['Target Cycle Time'] || 0), 0);
              const actualCycle = rows.reduce((sum, r) => sum + Number(r['Actual Cycle Time'] || 0), 0);
              const first = rows[0];
              // Format dates as '22 Jul 2025'
              const dateFormat = { day: '2-digit', month: 'short', year: 'numeric' };
              return {
                orderId,
                startDate: isNaN(start) ? '' : start.toLocaleDateString('en-GB', dateFormat),
                endDate: isNaN(end) ? '' : end.toLocaleDateString('en-GB', dateFormat),
                targetCycle,
                actualCycle,
                status: first['Status Type'],
                location: first['Inventory Location'],
                client: first['Client Name'],
                month,
                rows
              };
            });
            setData(cleaned);
          }
        });
      });
  }, []);

  const monthOrder = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  const sortValues = (values, key) => {
    if (key === 'month') {
      return values.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    }
    const allNumbers = values.every(val => !isNaN(val));
    return values.sort((a, b) => allNumbers ? Number(a) - Number(b) : a.localeCompare(b));
  };

  const uniqueValues = (key) => {
    const values = [...new Set(filteredData.map(d => d[key]).filter(Boolean))];
    return sortValues(values, key);
  };

  const filteredData = useMemo(() => {
    return data.filter(d =>
      (filters.startDate === 'All' || d.startDate === filters.startDate) &&
      (filters.location === 'All' || d.location === filters.location) &&
      (filters.client === 'All' || d.client === filters.client) &&
      (filters.status === 'All' || d.status === filters.status) &&
      (filters.month === 'All' || d.month === filters.month)
    );
  }, [data, filters]);

  const avgCycle = useMemo(() => {
    const vals = filteredData.map(d => d.actualCycle);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '0';
  }, [filteredData]);

  const allRows = useMemo(() => filteredData.flatMap(d => d.rows), [filteredData]);

  const processData = useMemo(() => {
    const map = new Map();
    allRows.forEach(row => {
      const process = row['Process'];
      const seq = row['Process Sequence'];
      const key = `${seq}-${process}`;
      if (process && seq) {
        map.set(key, (map.get(key) || 0) + Number(row['Actual Cycle Time'] || 0));
      }
    });
    return [...map.entries()].map(([key, value]) => {
      const [seq, name] = key.split('-');
      return { Process: name, Sequence: +seq, 'Sum of Actual Cycle Time': value };
    }).sort((a, b) => a.Sequence - b.Sequence);
  }, [allRows]);

  const subprocessData = useMemo(() => {
    const map = new Map();
    allRows.forEach(row => {
      const subprocess = row['Subprocess'];
      const seq = row['Subprocess Sequence'];
      const process = row['Process'];
      const key = `${seq}-${subprocess}`;
      if (
        subprocess && seq &&
        (!selectedProcess || selectedProcess === process)
      ) {
        map.set(key, (map.get(key) || 0) + Number(row['Actual Cycle Time'] || 0));
      }
    });
    return [...map.entries()].map(([key, value]) => {
      const [seq, name] = key.split('-');
      return { Subprocess: name, Sequence: +seq, 'Sum of Actual Cycle Time': value };
    }).sort((a, b) => a.Sequence - b.Sequence);
  }, [allRows, selectedProcess]);

  const minCycle = useMemo(() => Math.min(...filteredData.map(d => d.actualCycle)), [filteredData]);
  const maxCycle = useMemo(() => Math.max(...filteredData.map(d => d.actualCycle)), [filteredData]);

  const filterLabels = {
    startDate: 'Start Date',
    location: 'Location',
    client: 'Client',
    status: 'Status',
    month: 'Month'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6 space-y-6">
      <h1 className="text-4xl font-bold text-center mb-6">Cycle Time Dashboard</h1>

      {/* Filter Cards */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(filters).map(([key, value]) => (
          <div key={key} className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-4">
            <label className="block mb-2 text-sm font-medium">{filterLabels[key]}</label>
            <select
              value={value}
              onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              <option value="All">All</option>
              {uniqueValues(key).map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Table and Stats */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-blue-950/80 rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="overflow-y-auto max-h-[400px]">
            <table className="text-white w-full">
              <thead className="sticky top-0 bg-blue-950/90 z-10">
                <tr className="text-center">
                  <th className="px-4 py-2 text-center">Order ID</th>
                  <th className="px-4 py-2 text-center">Start Date</th>
                  <th className="px-4 py-2 text-center">End Date</th>
                  <th className="px-4 py-2 text-center">Sub TAT Day</th>
                  <th className="px-6 py-2 text-center">Sum of Actual Cycle Time</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d, i) => (
                  <tr key={i} className="border-t border-white/10 text-center">
                    <td className="px-4 py-2 text-center">{d.orderId}</td>
                    <td className="px-4 py-2 text-center">{d.startDate}</td>
                    <td className="px-4 py-2 text-center">{d.endDate}</td>
                    <td className="px-4 py-2 text-center">{d.targetCycle}</td>
                    <td className="px-6 py-2 text-center">{d.actualCycle}</td>
                    <td className="px-4 py-2 text-center">{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="flex flex-col gap-4 mt-6 w-full lg:w-1/4 justify-between">
          <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6 h-[190px] flex flex-col items-center justify-center">
            <GaugeChart
              id="gauge-chart1"
              nrOfLevels={20}
              arcsLength={[1]}
              colors={["#3399ff"]}
              percent={Math.min(+avgCycle / maxCycle || 0, 1)}
              textColor="#fff"
              needleColor="#ffffff"
              animate={false}
              formatTextValue={() => `${avgCycle}`}
            />
            <div className="flex justify-between text-xs w-full text-white mt-2 px-2">
              <span className="text-left">Min: {minCycle}</span>
              <span className="text-center">Avg: {avgCycle}</span>
              <span className="text-right">Max: {maxCycle}</span>
            </div>
          </div>

          <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6 flex items-center justify-center h-[190px]">
            <div className="text-center">
              <h2 className="text-white mb-2">No of Order IDs</h2>
              <div className="text-4xl text-white">{filteredData.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-white mb-4">Sum of Actual Cycle Time by Process</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={processData}
              margin={{ left: 100 }}
              onClick={({ activeLabel }) => {
                const clicked = processData.find(p => p.Process === activeLabel);
                if (clicked) setSelectedProcess(clicked.Process);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" stroke="#fff" />
              <YAxis dataKey="Process" type="category" stroke="#fff" width={150} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Sum of Actual Cycle Time" fill="#3399ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-white mb-4">
            Sum of Actual Cycle Time by Subprocess{' '}
            {selectedProcess && (
              <span className="ml-2 text-sm text-blue-300 cursor-pointer underline" onClick={() => setSelectedProcess(null)}>
                (Clear Filter)
              </span>
            )}
          </h2>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart layout="vertical" data={subprocessData} margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" stroke="#fff" />
              <YAxis dataKey="Subprocess" type="category" stroke="#fff" width={250} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Sum of Actual Cycle Time" fill="#3399ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.location.href = '../continuous-monitoring'}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Continuous Monitoring
        </button>
      </div>
    </div>
  );
}
