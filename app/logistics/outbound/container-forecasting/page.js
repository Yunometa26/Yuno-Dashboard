'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Package2 } from 'lucide-react';

export default function ContainerForecastingPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [arrivalDates, setArrivalDates] = useState([]);
  const [cargoTypes, setCargoTypes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('All');
  const [selectedCargoType, setSelectedCargoType] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetch('/Yard Visuals_Revised.csv')
      .then(response => response.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            const parsed = results.data.map(row => {
              const parsedDate = new Date(row['Date of Arrival']);
              const formattedDate = parsedDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });

              return {
                ...row,
                'Days in Yard': parseFloat(row['Days in Yard']),
                Day: parsedDate.getDate(),
                Size: row.Size?.trim().toUpperCase(),
                formattedDate,
              };
            });

            setData(parsed);
            setFilteredData(parsed);

            const uniqueDates = [...new Set(parsed.map(d => d.formattedDate))]
              .sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateA - dateB;
              });

            setArrivalDates(['All', ...uniqueDates]);
            setCargoTypes(['All', ...[...new Set(parsed.map(d => d['Cargo Type']))].sort()]);
            setSizes(['All', ...[...new Set(parsed.map(d => d.Size))].sort()]);
          },
        });
      });
  }, []);

  useEffect(() => {
    let tempData = [...data];

    if (selectedDate !== 'All') {
      tempData = tempData.filter(d => d.formattedDate === selectedDate);
    }

    if (selectedCargoType !== 'All') {
      tempData = tempData.filter(d => d['Cargo Type'] === selectedCargoType);
    }

    if (selectedSize !== 'All') {
      tempData = tempData.filter(d => d.Size === selectedSize);
    }

    if (selectedDay !== null) {
      tempData = tempData.filter(d => d.Day === selectedDay);
    }

    setFilteredData(tempData);
  }, [selectedDate, selectedCargoType, selectedSize, selectedDay, data]);

  const groupedByDay = {};
  for (let i = 1; i <= 30; i++) {
    groupedByDay[i] = { day: i, TEU: 0, FEU: 0 };
  }

  filteredData.forEach(item => {
    const { Day, Size } = item;
    if (Day >= 1 && Day <= 30 && groupedByDay[Day]) {
      if (Size === 'TEU') groupedByDay[Day].TEU++;
      else if (Size === 'FEU') groupedByDay[Day].FEU++;
    }
  });

  const countChartData = Object.values(groupedByDay);

  const handleBarClick = (data) => setSelectedDay(data.day);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] w-full">
      <div className="p-6">
        <div className="mb-12 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Package2 className="h-12 w-12 text-white" />
                    <h2 className="text-3xl sm:text-4xl font-bold text-white">Container Forecasting</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6 w-full flex flex-col md:flex-row gap-4">
          <div className="flex flex-col text-white w-full">
            <label className="mb-1">Date of Arrival</label>
            <select
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setSelectedDay(null);
              }}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              {arrivalDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col text-white w-full">
            <label className="mb-1">Cargo Type</label>
            <select
              value={selectedCargoType}
              onChange={e => {
                setSelectedCargoType(e.target.value);
                setSelectedDay(null);
              }}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              {cargoTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col text-white w-full">
            <label className="mb-1">Size</label>
            <select
              value={selectedSize}
              onChange={e => {
                setSelectedSize(e.target.value);
                setSelectedDay(null);
              }}
              className="w-full bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
            >
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-950/80 p-6 mb-6 rounded-xl shadow-lg border border-white/10 w-full">
          <h3 className="text-xl font-semibold text-white mb-4">
            Count of Container ID by Day and Size {selectedDay !== null && `(Day ${selectedDay})`}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={countChartData}
              onClick={({ activePayload }) => {
                if (activePayload?.[0]) handleBarClick(activePayload[0].payload);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="day" stroke="#fff" />
              <YAxis stroke="#fff" label={{ value: 'Count of Container ID', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="FEU" fill="#1d4ed8" stackId="a" />
              <Bar dataKey="TEU" fill="#22c55e" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mt-6 overflow-x-auto">
          <h3 className="text-xl font-semibold text-white mb-4">Container Details</h3>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full text-base text-left text-white border-collapse">
              <thead className="sticky top-0 bg-blue-900 text-white z-10">
                <tr className="border-b border-white/20">
                  <th className="px-4 py-2">Container ID</th>
                  <th className="px-4 py-2">Cargo Type</th>
                  <th className="px-4 py-2">Importer Name</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2 text-center">Days in Yard</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/10">
                    <td className="px-4 py-2">{item['Container ID']}</td>
                    <td className="px-4 py-2">{item['Cargo Type']}</td>
                    <td className="px-4 py-2">{item['Importer Name']}</td>
                    <td className="px-4 py-2">{item.Size}</td>
                    <td className="px-4 py-2 text-center">{item['Days in Yard']}</td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center px-4 py-6 text-white/60">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => window.location.href = "/"}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
