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
              return {
                orderId,
                startDate: isNaN(start) ? '' : start.toLocaleDateString('en-GB'),
                endDate: isNaN(end) ? '' : end.toLocaleDateString('en-GB'),
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

  const uniqueValues = (key) => [...new Set(data.map(d => d[key]).filter(Boolean))];

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
      return { Process: name, Sequence: +seq, 'Sum of Actual Days': value };
    }).sort((a, b) => a.Sequence - b.Sequence);
  }, [allRows]);

  const subprocessData = useMemo(() => {
    const map = new Map();
    allRows.forEach(row => {
      const subprocess = row['Subprocess'];
      const seq = row['Subprocess Sequence'];
      const key = `${seq}-${subprocess}`;
      if (subprocess && seq) {
        map.set(key, (map.get(key) || 0) + Number(row['Actual Cycle Time'] || 0));
      }
    });
    return [...map.entries()].map(([key, value]) => {
      const [seq, name] = key.split('-');
      return { Subprocess: name, Sequence: +seq, 'Sum of Actual Days': value };
    }).sort((a, b) => a.Sequence - b.Sequence);
  }, [allRows]);

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

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-blue-950/80 rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="overflow-y-auto max-h-[400px]">
            <table className="text-white w-full">
              <thead className="sticky top-0 bg-blue-950/90 z-10">
                <tr className="text-left">
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Start Date</th>
                  <th className="px-4 py-2">End Date</th>
                  <th className="px-4 py-2">Sub TAT Day</th>
                  <th className="px-4 py-2">Sum of Actual Days</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="px-4 py-2">{d.orderId}</td>
                    <td className="px-4 py-2">{d.startDate}</td>
                    <td className="px-4 py-2">{d.endDate}</td>
                    <td className="px-4 py-2">{d.targetCycle}</td>
                    <td className="px-4 py-2">{d.actualCycle}</td>
                    <td className="px-4 py-2">{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-6 w-full lg:w-1/4 justify-between">
          <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6 h-[190px] flex items-center justify-center">
            <GaugeChart
              id="gauge-chart1"
              nrOfLevels={20}
              arcsLength={[1]}
              colors={["#3399ff"]}
              percent={Math.min(+avgCycle / 100, 1)}
              textColor="#fff"
              needleColor="#ffffff"
              animate={false}
              formatTextValue={() => `${avgCycle}`}
            />
          </div>
          <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6 flex items-center justify-center h-[190px]">
            <div className="text-center">
              <h2 className="text-white mb-2">No of Order IDs</h2>
              <div className="text-4xl text-white">{filteredData.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Graphs below one by one */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-white mb-4">Sum of Actual Days by Process</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={processData} margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" stroke="#fff" />
              <YAxis dataKey="Process" type="category" stroke="#fff" width={150} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Sum of Actual Days" fill="#3399ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-white mb-4">Sum of Actual Days by Subprocess</h2>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart layout="vertical" data={subprocessData} margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" stroke="#fff" />
              <YAxis dataKey="Subprocess" type="category" stroke="#fff" width={250} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Sum of Actual Days" fill="#3399ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
