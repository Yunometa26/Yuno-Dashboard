// 'use client';

// import React, { useEffect, useState } from 'react';
// import Papa from 'papaparse';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
// } from 'recharts';

// export default function ProductionPage() {
//   const [data, setData] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(null);

//   useEffect(() => {
//     fetch('/Merged_FMCG_Production_Data.csv')
//       .then((res) => res.text())
//       .then((csv) => {
//         Papa.parse(csv, {
//           header: true,
//           skipEmptyLines: true,
//           complete: ({ data }) => {
//             const parsed = data.map((d) => ({
//               ...d,
//               Quantity: Number(d.Quantity),
//               'Planned Quantity': Number(d['Planned Quantity']),
//               'Order Date': new Date(d['Order Date']),
//               'Delivery Date': new Date(d['Delivery Date_y']),
//               'Production Start Date': new Date(
//                 d['Production Start DateTime']?.split(' ')[0]
//               ),
//               Priority: d.Priority,
//               SKU: d.SKU,
//               'Order ID': d['Order ID'],
//             }));
//             setData(parsed);
//           },
//         });
//       });
//   }, []);

//   const isSameDate = (d1, d2) =>
//     d1.getDate() === d2.getDate() &&
//     d1.getMonth() === d2.getMonth() &&
//     d1.getFullYear() === d2.getFullYear();

//   const filteredData = selectedDate
//     ? data.filter((d) => isSameDate(d['Order Date'], selectedDate))
//     : data;

//   const totalOrders = new Set(filteredData.map((d) => d['Order ID'])).size;
//   const totalSKUs = new Set(filteredData.map((d) => d['SKU'])).size;
//   const totalQty = filteredData.reduce((sum, d) => sum + d.Quantity, 0);

//   const qtyByPriority = filteredData.reduce((acc, row) => {
//     const p = row['Priority'];
//     const q = row.Quantity;
//     acc[p] = (acc[p] || 0) + q;
//     return acc;
//   }, {});
//   const priorityTotal = Object.values(qtyByPriority).reduce((a, b) => a + b, 0);

//   const groupByDate = (arr, field, key) => {
//     const map = {};
//     arr.forEach((row) => {
//       const dateObj = row[field];
//       if (!dateObj || isNaN(dateObj)) return;
//       const dateStr = dateObj.toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric',
//       });
//       map[dateStr] = map[dateStr] || { dateStr, dateObj, value: 0 };
//       map[dateStr].value += row[key];
//     });
//     return Object.values(map)
//       .sort((a, b) => a.dateObj - b.dateObj)
//       .map(({ dateStr, value }) => ({ date: dateStr, value }));
//   };

//   const orderReceivedData = groupByDate(data, 'Order Date', 'Quantity');
//   const productionStartData = groupByDate(
//     filteredData,
//     'Production Start Date',
//     'Planned Quantity'
//   );

//   const handleChartClick = (e) => {
//     if (!e || !e.activeLabel) return;
//     const parts = e.activeLabel.split(' ');
//     const day = parseInt(parts[0], 10);
//     const month = new Date(`${parts[1]} 1`).getMonth();
//     const year = parseInt(parts[2], 10);
//     setSelectedDate(new Date(year, month, day));
//   };

//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-blue-800 text-white p-2 rounded shadow text-sm">
//           <p className="font-semibold">{label}</p>
//           <p>Order Qty: {payload[0].value}</p>
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6">
//       <h1 className="text-3xl font-bold mb-6 text-center text-white">
//         Production Planning
//       </h1>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white text-black p-4 rounded-xl shadow flex flex-col justify-center items-center text-center">
//           <div className="text-3xl font-bold">{totalOrders}</div>
//           <div className="text-sm">Total Orders</div>
//         </div>
//         <div className="bg-white text-black p-4 rounded-xl shadow flex flex-col justify-center items-center text-center">
//           <div className="text-3xl font-bold">{totalSKUs}</div>
//           <div className="text-sm">Total Number of SKU</div>
//         </div>
//         <div className="bg-white text-black p-4 rounded-xl shadow flex flex-col justify-center items-center text-center">
//           <div className="text-3xl font-bold">{(totalQty / 1_000).toFixed(1)}K</div>
//           <div className="text-sm">Sum of Quantity</div>
//         </div>
//         <div className="bg-white text-black p-4 rounded-xl shadow">
//           <table className="text-sm w-full">
//             <thead>
//               <tr>
//                 <th className="text-left">Priority</th>
//                 <th className="text-right">Sum of Quantity</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Object.entries(qtyByPriority).map(([p, sum]) => (
//                 <tr key={p}>
//                   <td>{p}</td>
//                   <td className="text-right">{sum.toLocaleString()}</td>
//                 </tr>
//               ))}
//               <tr className="font-bold border-t">
//                 <td>Total</td>
//                 <td className="text-right">{priorityTotal.toLocaleString()}</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="w-full bg-white/10 rounded-xl shadow p-4 mb-6 border border-blue-200">
//         <h2 className="text-lg font-semibold mb-2 text-white">
//           Orders Received Per Day
//         </h2>
//         <ResponsiveContainer width="100%" height={350}>
//           <BarChart data={orderReceivedData} onClick={handleChartClick}>
//             <XAxis
//               dataKey="date"
//               stroke="#fff"
//               tick={{ fill: '#fff', fontSize: 12, angle: -45, textAnchor: 'end' }}
//               interval={0}
//               height={80}
//             />
//             <YAxis stroke="#fff" tick={{ fill: '#fff', fontSize: 12 }} />
//             <Tooltip content={<CustomTooltip />} />
//             <Bar dataKey="value" fill="#39FF14" cursor="pointer" />
//           </BarChart>
//         </ResponsiveContainer>
//         <p
//           className="text-sm text-center mt-2 cursor-pointer underline text-white"
//           onClick={() => setSelectedDate(null)}
//         >
//           {selectedDate ? 'Reset to Total' : ''}
//         </p>
//       </div>

//       <div className="w-full bg-white/10 rounded-xl shadow p-4 mb-6 border border-blue-200">
//         <h2 className="text-lg font-semibold mb-2 text-white">
//           Orders Planned Per Day
//         </h2>
//         <ResponsiveContainer width="100%" height={350}>
//           <BarChart data={productionStartData}>
//             <XAxis
//               dataKey="date"
//               stroke="#fff"
//               tick={{ fill: '#fff', fontSize: 12, angle: -45, textAnchor: 'end' }}
//               interval={0}
//               height={80}
//             />
//             <YAxis stroke="#fff" tick={{ fill: '#fff', fontSize: 12 }} />
//             <Tooltip content={<CustomTooltip />} />
//             <Bar dataKey="value" fill="#00FFFF" />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }
