'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3498db', '#9b59b6', '#f39c12', '#e74c3c'];
const DELAYED_COLOR = '#1f3c88';
const ONTIME_COLOR = '#30cfcf';
const MONTH_ORDER = ['April', 'May', 'June', 'July', 'August', 'September'];

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap gap-4 mt-4 justify-center text-sm">
    {payload.map((entry, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: entry.color }} />
        <span className={`text-white ${entry.value === 'Delayed' ? 'font-bold text-yellow-300' : ''}`}>
          {entry.value}
        </span>
      </div>
    ))}
  </div>
);

const TooltipNoHrs = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border-gray-300 rounded text-slate-800">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{`${entry.name}: ${entry.value}`}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PersonDelayTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border-gray-300 rounded text-slate-800">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{`${entry.name}: ${entry.value} hrs`}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DelayAnalysisPage() {
  const [rawData, setRawData] = useState([]);
  const [filters, setFilters] = useState({});
  const [selection, setSelection] = useState({ process: null, task: null, person: null, dateKey: null });
  const [processOrder, setProcessOrder] = useState([]);
  const [taskOrder, setTaskOrder] = useState([]);

  useEffect(() => {
    fetch('/Product Adoption.csv')
      .then(res => res.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: result => {
            const enriched = result.data.map(d => {
              const start = Number(d['Start Delay (hrs)']) || 0;
              const end = Number(d['End Delay (hrs)']) || 0;
              return {
                ...d,
                Month: d['Planned Start Month'],
                Day: d['Planned Start Day']?.toString(),
                Delay: d.Status === 'Delayed' ? start + end : 0,
                StartDelay: start,
                EndDelay: end,
                ProcessSequence: Number(d['Process Sequence']) || 0,
                TaskSequence: Number(d['Task Name Sequence']) || 0,
              };
            });

            const processes = Array.from(
              new Map(enriched.map(d => [d['Process Name'], d.ProcessSequence])).entries()
            ).sort((a, b) => a[1] - b[1]).map(([name]) => name);

            const tasks = Array.from(
              new Map(enriched.map(d => [d['Task Name'], d.TaskSequence])).entries()
            ).sort((a, b) => a[1] - b[1]).map(([name]) => name);

            setRawData(enriched);
            setProcessOrder(processes);
            setTaskOrder(tasks);
          }
        });
      });
  }, []);

  const filteredData = useMemo(() =>
    rawData.filter(d => Object.entries(filters).every(([k, v]) => !v || d[k] === v)),
    [rawData, filters]
  );

  const dynamicOptions = useMemo(() => {
    const fields = ['Process Name', 'Status', 'Task Name', 'Month', 'Day', 'Responsible Person'];
    const opts = {};
    fields.forEach(field => {
      opts[field] = Array.from(new Set(filteredData.map(d => d[field]).filter(Boolean)));
    });
    return opts;
  }, [filteredData]);

  const relatedData = useMemo(() =>
    filteredData.filter(d =>
      (!selection.process || d['Process Name'] === selection.process) &&
      (!selection.task || d['Task Name'] === selection.task) &&
      (!selection.person || d['Responsible Person'] === selection.person) &&
      (!selection.dateKey || `${d.Month}-${d.Day}-${d['Responsible Person']}` === selection.dateKey)
    ),
    [filteredData, selection]
  );

  const processData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(d => {
      grouped[d['Process Name']] ??= { 'Process Name': d['Process Name'], Delayed: 0, 'On Time': 0 };
      grouped[d['Process Name']][d.Status]++;
    });
    return processOrder.map(name => grouped[name]).filter(g => g && (g.Delayed > 0 || g['On Time'] > 0));
  }, [filteredData, processOrder]);

  const taskData = useMemo(() => {
    const grouped = {};
    filteredData
      .filter(d => !selection.process || d['Process Name'] === selection.process)
      .forEach(d => {
        grouped[d['Task Name']] ??= { 'Task Name': d['Task Name'], Delayed: 0, 'On Time': 0 };
        grouped[d['Task Name']][d.Status]++;
      });
    return taskOrder.map(name => grouped[name]).filter(g => g && (g.Delayed > 0 || g['On Time'] > 0));
  }, [filteredData, selection.process, taskOrder]);

  const personData = useMemo(() => {
    const grouped = {};
    filteredData
      .filter(d => (!selection.process || d['Process Name'] === selection.process) && (!selection.task || d['Task Name'] === selection.task))
      .forEach(d => {
        grouped[d['Responsible Person']] ??= { 'Responsible Person': d['Responsible Person'], Delayed: 0, 'On Time': 0 };
        grouped[d['Responsible Person']][d.Status]++;
      });
    return Object.values(grouped).filter(g => g.Delayed > 0 || g['On Time'] > 0);
  }, [filteredData, selection.process, selection.task]);

  const lineData = useMemo(() => {
    const mt = {};
    relatedData.forEach(d => {
      if (d.Status === 'Delayed') mt[d.Month] = (mt[d.Month] || 0) + d.Delay;
    });
    return MONTH_ORDER.map(month => ({ Month: month, 'Delay (hrs)': mt[month] || 0 }));
  }, [relatedData]);

  const pieData = useMemo(() => {
    const buckets = { 'On Time': 0, '0–2 hrs': 0, '2–4 hrs': 0, '4+ hrs': 0 };
    relatedData.forEach(d => {
      const dl = d.Delay;
      if (d.Status === 'On Time' || dl === 0) buckets['On Time']++;
      else if (dl <= 2) buckets['0–2 hrs']++;
      else if (dl <= 4) buckets['2–4 hrs']++;
      else buckets['4+ hrs']++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [relatedData]);

  const metrics = useMemo(() => {
    const delayedCount = relatedData.filter(d => d.Status === 'Delayed').length;
    const totalDelay = relatedData.reduce((acc, d) => acc + d.Delay, 0);
    return { total: relatedData.length, delayed: delayedCount, delayHours: totalDelay.toFixed(1) };
  }, [relatedData]);

  const handleProcessClick = e => {
    if (!e?.activeLabel) return;
    setSelection(prev => ({ process: prev.process === e.activeLabel ? null : e.activeLabel, task: null, person: null, dateKey: null }));
  };

  const handleTaskClick = e => {
    if (!e?.activeLabel) return;
    setSelection(prev => ({ ...prev, task: prev.task === e.activeLabel ? null : e.activeLabel, person: null, dateKey: null }));
  };

  const handlePersonClick = e => {
    if (!e?.activeLabel) return;
    setSelection(prev => ({ ...prev, person: prev.person === e.activeLabel ? null : e.activeLabel, dateKey: null }));
  };

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#ffffff', borderColor: '#ccc', color: '#1e293b' },
    labelStyle: { color: '#1e293b' },
    itemStyle: { color: '#1e293b' }
  };

  const metricsTiles = [
    { label: 'Number of Tasks', value: metrics.total },
    { label: 'Delayed Tasks', value: metrics.delayed },
    { label: 'Total Delay (hrs)', value: metrics.delayHours }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Efficiency Metrics</h1>
      <h2 className="text-xl font-semibold mb-4">Product Adoption</h2>

      <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Object.entries(dynamicOptions).map(([label, opts]) => (
            <select
              key={label}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
              value={filters[label] || ''}
              onChange={e => {
                setFilters(prev => ({ ...prev, [label]: e.target.value }));
                setSelection({ process: null, task: null, person: null, dateKey: null });
              }}
            >
              <option value="">{label}</option>
              {opts.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {metricsTiles.map((m, i) => (
          <div key={i} className="bg-blue-950/80 rounded-xl p-6 text-center shadow-lg border border-white/10">
            <div className="text-2xl font-bold">{m.value}</div>
            <div className="text-sm">{m.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-2">Total Tasks per Process</h2>
      <div className="bg-blue-950/80 p-6 mb-6 h-[600px] rounded-xl shadow-lg border border-white/10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processData} onClick={handleProcessClick}>
            <XAxis dataKey="Process Name" tick={{ fill: '#f0f0f0' }} />
            <YAxis tick={{ fill: '#f0f0f0' }} />
            <Tooltip content={<TooltipNoHrs />} />
            <Legend content={<CustomLegend />} />
            <Bar dataKey="Delayed" stackId="a" fill={DELAYED_COLOR} />
            <Bar dataKey="On Time" stackId="a" fill={ONTIME_COLOR} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-lg font-bold mb-2">Task per Stage</h2>
      <div className="bg-blue-950/80 p-6 mb-6 h-[500px] rounded-xl shadow-lg border border-white/10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={taskData} onClick={handleTaskClick}>
            <XAxis type="number" tick={{ fill: '#f0f0f0' }} />
            <YAxis dataKey="Task Name" type="category" width={320} tick={{ fill: '#f0f0f0', fontSize: 14 }} interval={0} />
            <Tooltip content={<TooltipNoHrs />} />
            <Legend content={<CustomLegend />} />
            <Bar dataKey="Delayed" stackId="a" fill={DELAYED_COLOR} />
            <Bar dataKey="On Time" stackId="a" fill={ONTIME_COLOR} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-lg font-bold mb-2">Delay Hours per Person</h2>
      <div className="bg-blue-950/80 p-6 mb-6 h-[600px] rounded-xl shadow-lg border border-white/10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={personData} onClick={handlePersonClick}>
            <XAxis type="number" tick={{ fill: '#f0f0f0' }} />
            <YAxis dataKey="Responsible Person" type="category" width={320} tick={{ fill: '#f0f0f0', fontSize: 14 }} interval={0} />
            <Tooltip content={<PersonDelayTooltip />} />
            <Legend content={<CustomLegend />} />
            <Bar dataKey="Delayed" stackId="a" fill={DELAYED_COLOR} />
            <Bar dataKey="On Time" stackId="a" fill={ONTIME_COLOR} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-950/80 p-6 h-[500px] rounded-xl shadow-lg border border-white/10">
          <h2 className="text-lg font-bold mb-2">Delayed Tasks per Month</h2>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={lineData}>
              <XAxis dataKey="Month" tick={{ fill: '#f0f0f0' }} />
              <YAxis tick={{ fill: '#f0f0f0' }} />
              <Tooltip formatter={val => `${val} hrs`} {...tooltipStyle} />
              <Legend content={<CustomLegend />} />
              <Line dataKey="Delay (hrs)" type="monotone" stroke="#f39c12" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-950/80 p-6 h-[500px] rounded-xl shadow-lg border border-white/10">
          <h2 className="text-lg font-bold mb-2">Tasks Split</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={120} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={val => `${val}`} {...tooltipStyle} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
