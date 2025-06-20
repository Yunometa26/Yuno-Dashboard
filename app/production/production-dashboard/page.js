"use client";

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function ProductionDashboardPage() {
  const [rawData, setRawData] = useState([]);
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const [filters, setFilters] = useState({
    day: "All",
    machine_id: "All",
    order_id: "All",
  });
  const [tableFilters, setTableFilters] = useState({
    status: "All",
    priority: "All",
  });

  const filterOptionsMap = {
    day: "days",
    machine_id: "machine_ids",
    order_id: "order_ids",
  };

  useEffect(() => {
    const loadProductionData = async () => {
      const res = await fetch("/Production Planning_V1.csv");
      const csvText = await res.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        fastMode: true,
        complete: (results) => {
          const cleaned = results.data.map((row) => {
            const day = row.Date?.trim()?.split("-")[0] ?? row.Date;
            return {
              Day: day,
              Machine_ID: row.Machine_ID?.trim(),
              Order_ID: row.Order_ID?.trim(),
              Target_Production: +row.Target_Production || 0,
              Actual_Production: +row.Actual_Production || 0,
              Machine_Utilization: parseFloat(row["Utilization (%)"]) || 0,
            };
          });
          setRawData(cleaned);
        },
      });
    };
    loadProductionData();
  }, []);

  useEffect(() => {
    const loadOrderDetails = async () => {
      const res = await fetch("/OrdersDataset.csv");
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const map = {};
          results.data.forEach((row) => {
            const orderId = row.Order_ID?.trim();
            if (orderId) {
              map[orderId] = {
                Quantity: row.Quantity,
                Status: row.status?.trim(),
                Priority: row.Priority?.trim(),
              };
            }
          });
          setOrderDetailsMap(map);
        },
      });
    };
    loadOrderDetails();
  }, []);

  const filteredData = useMemo(() => {
    return rawData.filter((row) => {
      return (
        (filters.day === "All" || row.Day === filters.day) &&
        (filters.machine_id === "All" || row.Machine_ID === filters.machine_id) &&
        (filters.order_id === "All" || row.Order_ID === filters.order_id)
      );
    });
  }, [rawData, filters]);

  const groupedFilteredData = useMemo(() => {
    const grouped = {};
    filteredData.forEach((row) => {
      const key = row.Order_ID;
      if (!grouped[key]) {
        grouped[key] = {
          Order_ID: key,
          Day: row.Day,
          Target_Production: 0,
          Actual_Production: 0,
          Machine_Utilization_Total: 0,
          Count: 0,
        };
      }
      grouped[key].Target_Production += row.Target_Production;
      grouped[key].Actual_Production += row.Actual_Production;
      grouped[key].Machine_Utilization_Total += row.Machine_Utilization;
      grouped[key].Count += 1;
    });

    return Object.values(grouped).map((item) => {
      const orderInfo = orderDetailsMap[item.Order_ID] || {};
      return {
        ...item,
        Quantity: orderInfo.Quantity ?? "-",
        Status: orderInfo.Status ?? "-",
        Priority: orderInfo.Priority ?? "-",
        Machine_Utilization: item.Count
          ? (item.Machine_Utilization_Total / item.Count).toFixed(2)
          : "0",
      };
    });
  }, [filteredData, orderDetailsMap]);

  const availableOptions = useMemo(() => {
    const filteredByDay = filters.day === "All" ? rawData : rawData.filter(d => d.Day === filters.day);
    const filteredByMachine = filters.machine_id === "All" ? filteredByDay : filteredByDay.filter(d => d.Machine_ID === filters.machine_id);
    const filteredByOrder = filters.order_id === "All" ? filteredByMachine : filteredByMachine.filter(d => d.Order_ID === filters.order_id);
    const uniqueDays = Array.from(new Set(filteredByOrder.map(d => d.Day))).filter(Boolean).map(Number).sort((a, b) => a - b).map(String);
    const machineIDs = Array.from(new Set(filteredByOrder.map(d => d.Machine_ID))).sort();
    const orderIDs = Array.from(new Set(filteredByOrder.map(d => d.Order_ID)));
    const statuses = Array.from(new Set(Object.values(orderDetailsMap).map(d => d.Status).filter(Boolean)));
    const priorities = Array.from(new Set(Object.values(orderDetailsMap).map(d => d.Priority).filter(Boolean)));
    return {
      days: ["All", ...uniqueDays],
      machine_ids: ["All", ...machineIDs],
      order_ids: ["All", ...orderIDs],
      statuses: ["All", ...statuses.sort()],
      priorities: ["All", ...priorities.sort()],
    };
  }, [rawData, filters.day, filters.machine_id, filters.order_id, orderDetailsMap]);

  useEffect(() => {
    setFilters((prev) => ({
      day: availableOptions.days.includes(prev.day) ? prev.day : "All",
      machine_id: availableOptions.machine_ids.includes(prev.machine_id) ? prev.machine_id : "All",
      order_id: availableOptions.order_ids.includes(prev.order_id) ? prev.order_id : "All",
    }));
  }, [availableOptions]);

  const totals = useMemo(() => {
    const totalTarget = groupedFilteredData.reduce((sum, d) => sum + d.Target_Production, 0);
    const totalActual = groupedFilteredData.reduce((sum, d) => sum + d.Actual_Production, 0);
    const avgUtil = groupedFilteredData.length
      ? groupedFilteredData.reduce((sum, d) => sum + parseFloat(d.Machine_Utilization), 0) / groupedFilteredData.length
      : 0;
    return {
      target: totalTarget,
      actual: totalActual,
      utilization: avgUtil.toFixed(2),
    };
  }, [groupedFilteredData]);

  const barData = useMemo(() => {
    const groupedByDay = {};
    filteredData.forEach((row) => {
      if (!groupedByDay[row.Day]) {
        groupedByDay[row.Day] = { Day: row.Day, Target_Production: 0, Actual_Production: 0 };
      }
      groupedByDay[row.Day].Target_Production += row.Target_Production;
      groupedByDay[row.Day].Actual_Production += row.Actual_Production;
    });
    return Object.values(groupedByDay).sort((a, b) => Number(a.Day) - Number(b.Day));
  }, [filteredData]);

  const tableFilteredData = useMemo(() => {
    return groupedFilteredData.filter((row) => {
      return (
        (tableFilters.status === "All" || row.Status === tableFilters.status) &&
        (tableFilters.priority === "All" || row.Priority === tableFilters.priority)
      );
    });
  }, [groupedFilteredData, tableFilters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Production Dashboard</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        {["day", "machine_id", "order_id"].map((filterKey) => (
          <div className="flex flex-col" key={filterKey}>
            <label className="text-sm font-semibold mb-1 capitalize">{filterKey.replace("_", " ")}</label>
            <select
              value={filters[filterKey]}
              onChange={(e) => setFilters((prev) => ({ ...prev, [filterKey]: e.target.value }))}
              className="w-44 rounded-md border-gray-300 text-black bg-gray-100 px-3 py-2 text-sm"
            >
              {(availableOptions[filterOptionsMap[filterKey]] || []).map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-8">
        {[{ label: "Target Production", value: (totals.target / 1000).toFixed(1) + "K" },
          { label: "Actual Production", value: (totals.actual / 1000).toFixed(1) + "K" },
          { label: "Machine Utilization", value: `${totals.utilization}%` },
        ].map((box, idx) => (
          <div key={idx} className="bg-white text-black rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2">{box.label}</h2>
            <p className="text-3xl font-bold">{box.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white/10 rounded-xl shadow p-4 mb-6 border border-blue-200">
        <h2 className="text-white text-lg font-semibold mb-4 text-center">Target vs Actual Production by Day</h2>
        <div style={{ width: "100%", height: "400px" }}>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <XAxis dataKey="Day" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip wrapperClassName="text-black" />
              <Legend />
              <Bar dataKey="Target_Production" fill="#00D9FF" />
              <Bar dataKey="Actual_Production" fill="#32CD32" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-blue-200 max-h-[576px] overflow-y-auto mb-10">
        <table className="min-w-full text-base text-white font-medium">
          <thead className="bg-[#024673] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left">Order_ID</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">
                <div className="flex flex-col">
                  <span>Status</span>
                  <select
                    value={tableFilters.status}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-32 rounded border border-gray-300 bg-white text-black mt-1 text-sm px-2 py-1 shadow"
                  >
                    {availableOptions.statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="px-4 py-2 text-left">
                <div className="flex flex-col">
                  <span>Priority</span>
                  <select
                    value={tableFilters.priority}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-48 rounded border border-gray-300 bg-white text-black mt-1 text-sm px-2 py-1 shadow"
                  >
                    {availableOptions.priorities.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {tableFilteredData.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[#024673]" : "bg-[#03579E]"}>
                <td className="px-4 py-2">{row.Order_ID}</td>
                <td className="px-4 py-2">{row.Quantity}</td>
                <td className="px-4 py-2">{row.Status}</td>
                <td className="px-4 py-2">{row.Priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-10 flex justify-center">
        <button
          onClick={() => (window.location.href = "/production")}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Production
        </button>
      </div>
    </div>
  );
}
