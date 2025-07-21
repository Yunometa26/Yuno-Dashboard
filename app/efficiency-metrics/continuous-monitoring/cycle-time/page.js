'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import GaugeChart from 'react-gauge-chart';
import { parse } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-black p-2 rounded shadow-md">
        <p className="font-semibold">{label}</p>
        <p>{`${payload[0].name}: ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${(payload[0].value / 1000).toFixed(1)}K)`}</p>
      </div>
    );
  }
  return null;
};

export default function UCIDashboard() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: 'All',
    endDate: 'All',
    location: 'All',
    client: 'All',
    status: 'All'
  });
  const [selectedProcess, setSelectedProcess] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/process data UCI Final.csv').then(res => res.text()),
      fetch('/Process Data UCI _..csv').then(res => res.text())
    ]).then(([mainDataText, statusDataText]) => {
      const statusResults = Papa.parse(statusDataText, { header: true });
      const statusMap = new Map();
      statusResults.data.forEach(row => {
        if (row['Order ID']) {
          statusMap.set(row['Order ID'], row['status']);
        }
      });

      Papa.parse(mainDataText, {
        header: true,
        complete: (results) => {
          const grouped = new Map();
          results.data.forEach(row => {
            const orderId = row['Order ID'];
            if (!orderId) return;
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
            
            const latestRow = rows.reduce((latest, current) => {
              return latest.endDate > current.endDate ? latest : current;
            });

            const targetCycle = rows.reduce((sum, r) => sum + Number(r['Target Cycle Time'] || 0), 0);
            const actualCycle = rows.reduce((sum, r) => sum + Number(r['Actual Cycle Time'] || 0), 0);
            
            const dateFormat = { day: '2-digit', month: 'short', year: 'numeric' };
            return {
              orderId,
              startDate: isNaN(start) ? '' : start.toLocaleDateString('en-GB', dateFormat),
              endDate: isNaN(end) ? '' : end.toLocaleDateString('en-GB', dateFormat),
              targetCycle,
              actualCycle,
              status: statusMap.get(orderId) || latestRow['Status Type'],
              location: latestRow['Inventory Location'],
              client: latestRow['Client Name'],
              rows
            };
          });
          setData(cleaned);
        }
      });
    });
  }, []);

  const parseDateStr = (str) => {
    try {
      return parse(str, 'dd-MMM-yyyy', new Date());
    } catch {
      return new Date('Invalid Date');
    }
  };

  const sortValues = (values, key) => {
    if (key === 'startDate' || key === 'endDate') {
      return values
        .filter(val => val && val !== 'Invalid Date')
        .sort((a, b) => parseDateStr(a) - parseDateStr(b));
    }
    const allNumbers = values.every(val => !isNaN(val));
    return values.sort((a, b) => allNumbers ? Number(a) - Number(b) : a.localeCompare(b));
  };

  const uniqueValues = (key) => {
    const values = [...new Set(data.map(d => d[key]).filter(Boolean))];
    return sortValues(values, key);
  };

  const filteredData = useMemo(() => {
    return data.filter(d =>
      (filters.startDate === 'All' || d.startDate === filters.startDate) &&
      (filters.endDate === 'All' || d.endDate === filters.endDate) &&
      (filters.location === 'All' || d.location === filters.location) &&
      (filters.client === 'All' || d.client === filters.client) &&
      (filters.status === 'All' || d.status === filters.status)
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
      return { Process: name, Sequence: +seq, 'Actual Cycle Time': value };
    }).sort((a, b) => a.Sequence - b.Sequence);
  }, [allRows]);

  const subprocessData = useMemo(() => {
    if (!selectedProcess) return [];
    const map = new Map();
    allRows.forEach(row => {
      const subprocess = row['Subprocess'];
      const seq = row['Subprocess Sequence'];
      const process = row['Process'];
      const key = `${seq}-${subprocess}`;
      if (
        subprocess && seq &&
        selectedProcess === process
      ) {
        map.set(key, (map.get(key) || 0) + Number(row['Actual Cycle Time'] || 0));
      }
    });
    return [...map.entries()].map(([key, value]) => {
      const [seq, name] = key.split('-');
      return { Subprocess: name, Sequence: +seq, 'Actual Cycle Time': value };
    }).sort((a, b) => a.Sequence - b.Sequence);
  }, [allRows, selectedProcess]);

  const minCycle = useMemo(() => Math.min(...filteredData.map(d => d.actualCycle)), [filteredData]);
  const maxCycle = useMemo(() => Math.max(...filteredData.map(d => d.actualCycle)), [filteredData]);

  const filterLabels = {
    startDate: 'Start Date',
    endDate: 'End Date',
    location: 'Location',
    client: 'Client',
    status: 'Status'
  };

  const formatK = (value) => `${(value / 1000).toFixed(1)}K`;

  const handleProcessBarClick = (data) => {
    if (data && data.activeLabel) {
      // activeLabel is the process name when clicking the bar
      setSelectedProcess(data.activeLabel);
    } else if (data && data.Process) {
      setSelectedProcess(data.Process);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6 space-y-6">
      <h1 className="text-4xl font-bold text-center mb-6">Cycle Time Dashboard</h1>

      {/* Filters */}
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

      {/* Table and Cards */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-blue-950/80 rounded-xl shadow-lg border border-white/10 overflow-hidden">
          <div className="overflow-y-auto max-h-[400px]">
            <table className="text-white w-full">
              <thead className="sticky top-0 bg-blue-950/90 z-10">
                <tr className="text-center">
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Start Date</th>
                  <th className="px-4 py-2">End Date</th>
                  <th className="px-4 py-2">Actual Cycle Time</th>
                  <th className="px-4 py-2">Target Cycle Time</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d, i) => (
                  <tr key={i} className="border-t border-white/10 text-center">
                    <td className="px-4 py-2">{d.orderId}</td>
                    <td className="px-4 py-2">{d.startDate}</td>
                    <td className="px-4 py-2">{d.endDate}</td>
                    <td className="px-4 py-2">{d.actualCycle}</td>
                    <td className="px-4 py-2">{d.targetCycle}</td>
                    <td className="px-4 py-2">{d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards */}
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
              <span>Min: {minCycle}</span>
              <span>Avg: {avgCycle}</span>
              <span>Max: {maxCycle}</span>
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

      {/* Graphs */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
          <h2 className="text-white mb-4">Actual Cycle Time by Process</h2>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart layout="vertical" data={processData} margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" stroke="#fff" tickFormatter={formatK} />
              <YAxis dataKey="Process" type="category" stroke="#fff" width={150} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Actual Cycle Time" fill="#3399ff" onClick={handleProcessBarClick} cursor="pointer">
                <LabelList dataKey="Actual Cycle Time" position="right" formatter={formatK} fill="#fff" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {selectedProcess && (
          <div className="bg-blue-950/80 rounded-xl shadow-lg border border-white/10 p-6">
            <h2 className="text-white mb-4">
              Actual Cycle Time by Subprocess{' '}
              <span
                className="ml-2 text-sm text-blue-300 cursor-pointer underline"
                onClick={() => setSelectedProcess(null)}
              >
                (Clear Filter)
              </span>
            </h2>
            <ResponsiveContainer width="95%" height={500}>
              <BarChart layout="vertical" data={subprocessData} margin={{ left: 100, right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" stroke="#fff" tickFormatter={formatK} domain={[0, 'dataMax + 0.2*dataMax']} />
                <YAxis dataKey="Subprocess" type="category" stroke="#fff" width={150} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Actual Cycle Time" fill="#3399ff">
                  <LabelList dataKey="Actual Cycle Time" position="right" formatter={formatK} fill="#fff" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
