'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

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
            const cleaned = results.data.map(row => ({
              orderId: row['Order ID'],
              startDate: row['Sub Actual Start Date'],
              endDate: row['Sub Actual End Date'],
              targetCycle: +row['Target Cycle Time'],
              actualCycle: +row['Actual Cycle Time'],
              status: row['Status Type'],
              location: row['Inventory Location'],
              client: row['Client Name'],
              process: row['Process'],
              processSeq: +row['Process Sequence'],
              subprocess: row['Subprocess'],
              subprocessSeq: +row['Subprocess Sequence'],
              month: new Date(row['Sub Actual Start Date']).toLocaleString('default', { month: 'long' })
            })).filter(d => d.orderId);
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
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 0;
  }, [filteredData]);

  const processData = useMemo(() => {
    const map = new Map();
    filteredData.forEach(d => {
      const key = `${d.processSeq}-${d.process}`;
      map.set(key, (map.get(key) || 0) + d.actualCycle);
    });
    return [...map.entries()].map(([k, v]) => {
      const [seq, name] = k.split('-');
      return { Process: name, Sequence: +seq, 'Sum of Actual Days': v };
    }).sort((a, b) => a.Sequence - b.Sequence);
  }, [filteredData]);

  const subprocessData = useMemo(() => {
    const map = new Map();
    filteredData.forEach(d => {
      const key = `${d.subprocessSeq}-${d.subprocess}`;
      map.set(key, (map.get(key) || 0) + d.actualCycle);
    });
    return [...map.entries()].map(([k, v]) => {
      const [seq, name] = k.split('-');
      return { Subprocess: name, Sequence: +seq, 'Sum of Actual Days': v };
    }).sort((a, b) => a.Sequence - b.Sequence);
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6 space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-5 gap-4">
        {['startDate', 'location', 'client', 'status', 'month'].map((key, idx) => (
          <div key={idx} className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
            <select
              value={filters[key]}
              onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              <option value="All">All</option>
              {uniqueValues(key).map(val => <option key={val} value={val}>{val}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Table and Cards */}
      <div className="flex gap-4">
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mt-6" style={{ height: '460px', width: '70%', overflowY: 'auto' }}>
          <table className="text-white w-full">
            <thead>
              <tr>
                <th>Order ID</th><th>Start Date</th><th>End Date</th><th>Sub TAT Day</th><th>Sum of Actual Days</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 12).map((d, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td>{d.orderId}</td><td>{d.startDate}</td><td>{d.endDate}</td>
                  <td>{d.targetCycle}</td><td>{d.actualCycle}</td><td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-4 mt-6" style={{ width: '30%' }}>
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
            <h2 className="text-white mb-2">Cycle Time</h2>
            <div className="text-4xl text-white">{avgCycle}</div>
          </div>
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
            <h2 className="text-white mb-2">No of Order ID</h2>
            <div className="text-4xl text-white">{[...new Set(filteredData.map(d => d.orderId))].length}</div>
          </div>
        </div>
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-white mb-4">Sum of Actual Days by Process Sequence and Process</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={processData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" stroke="#fff" />
              <YAxis dataKey="Process" type="category" stroke="#fff" />
              <Tooltip />
              <Bar dataKey="Sum of Actual Days" fill="#3399ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-white mb-4">Sum of Actual Days by Subprocess Sequence and Subprocess</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={subprocessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" stroke="#fff" />
              <YAxis dataKey="Subprocess" type="category" stroke="#fff" />
              <Tooltip />
              <Bar dataKey="Sum of Actual Days" fill="#3399ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
