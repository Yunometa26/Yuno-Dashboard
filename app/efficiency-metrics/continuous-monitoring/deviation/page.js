'use client';

import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid,
  LabelList
} from "recharts";
import Papa from "papaparse";
import dayjs from "dayjs";

const ON_TIME_COLOR = "#3399FF";
const DELAY_COLOR   = "#FF0000";
const MULTI_COLORS = [
  '#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26A69A',
  '#FFCA28', '#8D6E63', '#7E57C2', '#29B6F6', '#D4E157', '#EC407A'
];

const tooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "10px",
  color: "#fff"
};
const FILTER_BG    = "bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6";
const SELECT_STYLE = "w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white";

const PROCESS_SEQUENCE = ["Invoice","Procurement","Production","Dispatch","Payment"];
const MONTH_ORDER = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const FILTER_ORDER = [
  { key: "startDate", label: "Start Date", type: "select-date" },
  { key: "endDate", label: "End Date", type: "select-date" },
  { key: "Month", label: "Month", type: "select" },
  { key: "Order ID", label: "Order Id", type: "select" },
  { key: "Inventory Location", label: "Location", type: "select" },
  { key: "Process", label: "Process", type: "select" },
  { key: "Responsible Person", label: "Responsible Person", type: "select" },
];

const formatThousands = v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
const formatDateDisplay = ds => {
  const d = dayjs(ds);
  return d.isValid() ? d.format("D MMM YYYY") : ds || "";
};
const cleanName = name => name?.replace(/^UCI\s*[-]?\s*/i, "").trim();

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const p = payload[0];
    return (
      <div style={tooltipStyle}>
        <p style={{margin:0}}>{p.name}: {p.value}</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p className="font-bold">{label}</p>
      {payload.map((e,i) =>
        e.value ? (
          <p key={i} style={{color:e.color,margin:0}}>
            {e.name}: {formatThousands(e.value)}
          </p>
        ) : null
      )}
    </div>
  );
};

const Dashboard = () => {
  const [allData, setAllData] = useState([]);
  const [data, setData]     = useState([]);
  const [filters, setFilters] = useState({});
  const [uniqueFilters, setUniqueFilters] = useState({});

  useEffect(() => {
    fetch("/process data UCI Final.csv")
      .then(r => r.text())
      .then(txt => {
        const parsed = Papa.parse(txt, { header:true }).data
          .filter(r => r["Order ID"] && r["Sub Actual Start Date"])
          .map(r => {
            const cleanedResp = cleanName(r["Responsible Person"]);
            return {
              ...r,
              "Responsible Person": cleanedResp,
              __RawResponsible: cleanedResp, // for rendering
              __Month: dayjs(r["Sub Actual Start Date"]).format("MMMM"),
              __ProcSeq: Number(r["Process Sequence"])
            };
          });
        setAllData(parsed);
        setData(parsed);
        updateUniqueFilters(parsed);
      });
  }, []);

  const updateUniqueFilters = ds => {
    const keys = ["Order ID","Inventory Location","Process","Responsible Person"];
    const uf = {};

    keys.forEach(k => {
      if (k === "Process") {
        const procs = Array.from(new Set(ds.map(r=>r["Process"]).filter(Boolean)))
          .sort((a,b) => {
            const sa = ds.find(r=>r["Process"]===a)?.__ProcSeq || 0;
            const sb = ds.find(r=>r["Process"]===b)?.__ProcSeq || 0;
            return sa - sb;
          });
        uf[k] = procs;
      } else {
        uf[k] = Array.from(new Set(ds.map(r=>r[k]).filter(Boolean)))
          .sort((a,b) => a.localeCompare(b));
      }
    });

    uf.startDate = Array.from(new Set(ds.map(r=>formatDateDisplay(r["Sub Actual Start Date"])))).sort(
      (a,b)=>dayjs(a,"D MMM YYYY") - dayjs(b,"D MMM YYYY")
    );
    uf.endDate = uf.startDate;

    uf.Month = Array.from(new Set(ds.map(r=>r.__Month)))
      .sort((a,b)=> MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));

    setUniqueFilters(uf);
  };

  const applyFilters = () => {
    return allData.filter(r => {
      if (filters.startDate && filters.startDate!=="All") {
        if (formatDateDisplay(r["Sub Actual Start Date"]) !== filters.startDate) return false;
      }
      if (filters.endDate && filters.endDate!=="All") {
        if (formatDateDisplay(r["Sub Actual Start Date"]) !== filters.endDate) return false;
      }
      if (filters.Month && filters.Month!=="All") {
        if (r.__Month !== filters.Month) return false;
      }
      for (let k of ["Order ID","Inventory Location","Process","Responsible Person"]) {
        if (filters[k] && filters[k]!=="All" && r[k] !== filters[k]) return false;
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
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const statusPie = [
    { name:"On Time", value:data.filter(r=>r["Status Type"]==="On Time").length },
    { name:"Delay",   value:data.filter(r=>r["Status Type"]==="Delay").length }
  ];
  const uniqueOrderCount = new Set(data.map(r=>r["Order ID"])).size;

  const subprocessMap = {};
  data.forEach(r => {
    const s = r["Subprocess"]; const st = r["Status Type"];
    if (!subprocessMap[s]) subprocessMap[s] = { Subprocess:s, "On Time":0, "Delay":0 };
    st==="On Time" ? subprocessMap[s]["On Time"]++ : subprocessMap[s]["Delay"]++;
  });
  const statusBySubprocess = Object.values(subprocessMap);

  const processes = uniqueFilters["Process"] ?? [];
  const monthlyCounts = {};
  data.filter(r => r["Status Type"] === "Delay").forEach(r => {
    const m = r.__Month;
    if (!monthlyCounts[m]) {
      monthlyCounts[m] = { Month:m };
      processes.forEach(p=>monthlyCounts[m][p]=0);
    }
    monthlyCounts[m][r["Process"]]++;
  });
  const monthlyProcessData = Object.values(monthlyCounts)
    .sort((a,b)=> MONTH_ORDER.indexOf(a.Month) - MONTH_ORDER.indexOf(b.Month));

  const persons = Array.from(new Set(data.map(r=>r["Responsible Person"]))).sort();
  const subprocesses = Array.from(new Set(data.map(r=>r["Subprocess"])));
  const respSubMap = {};
  persons.forEach(p => {
    respSubMap[p] = { Responsible: cleanName(p) };
    subprocesses.forEach(s=> respSubMap[p][s] = 0);
  });
  data.filter(r=>r["Status Type"]==="Delay").forEach(r => {
    const p = cleanName(r["Responsible Person"]);
    respSubMap[p][r["Subprocess"]]++;
  });
  const subprocessBarData = Object.values(respSubMap);

  const renderLabel = ({x,y,width,height,value}) => {
    if (width<25||!value) return null;
    return (
      <text x={x+width/2} y={y+height/2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="14">
        {formatThousands(value)}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] to-[#024673] text-gray-100 p-6 space-y-10">
      <h1 className="text-3xl font-bold text-center text-white">Deviation Dashboard</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FILTER_ORDER.map(({key,label}) => (
          <div key={key} className={FILTER_BG}>
            <label className="block text-white mb-1">{label}</label>
            <select
              name={key}
              className={SELECT_STYLE}
              onChange={handleFilterChange}
              value={filters[key]||"All"}
            >
              <option value="All">All</option>
              {uniqueFilters[key]?.map(val => (
                <option key={val} value={val}>
                  {key === "Responsible Person" ? cleanName(val) : val}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Pie & Count */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={FILTER_BG}>
          <h2 className="text-lg font-bold text-white text-center mb-4">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {statusPie.map((_,i)=><Cell key={i} fill={i===0?ON_TIME_COLOR:DELAY_COLOR}/>)}
              </Pie>
              <Legend />
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={FILTER_BG+" flex flex-col items-center justify-center"}>
          <span className="text-6xl font-bold text-white">{uniqueOrderCount}</span>
          <span className="mt-2 text-gray-300">Count of Order ID</span>
        </div>
      </div>

      {/* Subprocess */}
      <div className={FILTER_BG}>
        <h2 className="text-lg font-bold text-white text-center mb-4">Count of On Time and Delay by Subprocess</h2>
        <ResponsiveContainer width="100%" height={Math.max(400, statusBySubprocess.length * 45)}>
          <BarChart data={statusBySubprocess} layout="vertical" margin={{top:20,right:100,left:250,bottom:20}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis type="number" stroke="#fff" tickFormatter={formatThousands}/>
            <YAxis dataKey="Subprocess" type="category" stroke="#fff" width={250}/>
            <Tooltip content={<CustomTooltipBar/>}/>
            <Legend/>
            <Bar dataKey="On Time" stackId="a" fill={ON_TIME_COLOR}>
              <LabelList dataKey="On Time" position="center" formatter={v=>v?formatThousands(v):''} fill="#fff"/>
            </Bar>
            <Bar dataKey="Delay" stackId="a" fill={DELAY_COLOR}>
              <LabelList dataKey="Delay" position="center" formatter={v=>v?formatThousands(v):''} fill="#fff"/>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Process */}
      <div className={FILTER_BG}>
        <h2 className="text-lg font-bold text-white text-center mb-4">Count of Delay by Month and Process</h2>
        <ResponsiveContainer width="100%" height={Math.max(400, monthlyProcessData.length * 60)}>
          <BarChart data={monthlyProcessData} layout="vertical" margin={{top:20,right:100,left:250,bottom:20}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis type="number" stroke="#fff" tickFormatter={formatThousands}/>
            <YAxis dataKey="Month" type="category" stroke="#fff" width={250}/>
            <Tooltip content={<CustomTooltipBar/>}/>
            <Legend/>
            {processes.map((p,i)=>(
              <Bar key={p} dataKey={p} stackId="a" fill={MULTI_COLORS[i%MULTI_COLORS.length]}>
                <LabelList dataKey={p} content={renderLabel}/>
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Responsible Person and Subprocess */}
      <div className={FILTER_BG}>
        <h2 className="text-lg font-bold text-white text-center mb-4">Count of Delay by Responsible Person and Subprocess</h2>
        <ResponsiveContainer width="100%" height={Math.max(400, subprocessBarData.length * 45)}>
          <BarChart data={subprocessBarData} layout="vertical" margin={{top:20,right:100,left:250,bottom:20}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis type="number" stroke="#fff" tickFormatter={formatThousands}/>
            <YAxis dataKey="Responsible" type="category" stroke="#fff" width={250}/>
            <Tooltip content={<CustomTooltipBar/>}/>
            <Legend/>
            {subprocesses.map((sub,i)=>(
              <Bar key={sub} dataKey={sub} stackId="a" fill={MULTI_COLORS[i%MULTI_COLORS.length]}>
                <LabelList dataKey={sub} position="center" formatter={v=>v?formatThousands(v):''} fill="#fff"/>
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={()=>window.location.href="../continuous-monitoring"}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2]
                     text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Continuous Monitoring
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
