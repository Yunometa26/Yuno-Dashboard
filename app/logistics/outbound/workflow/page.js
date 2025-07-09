'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import { Workflow } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function WorkflowPage() {
  const [data, setData] = useState([])
  const [selectedDay, setSelectedDay] = useState('All')
  const [selectedStage, setSelectedStage] = useState(null)
  const [selectedContainerID, setSelectedContainerID] = useState(null)
  const [selectedDeviationTable1, setSelectedDeviationTable1] = useState('All')
  const [selectedDeviationTable2, setSelectedDeviationTable2] = useState('All')

  useEffect(() => {
    const loadData = async () => {
      const res = await fetch('/Logistics - Workflow Visualization.csv', { cache: 'force-cache' })
      const csv = await res.text()
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => setData(results.data)
      })
    }
    loadData()
  }, [])

  const dayOptions = useMemo(() => {
    const uniqueDays = new Set()
    data.forEach(row => {
      const day = row['Start Date']?.split('-')[0]
      if (day && parseInt(day) <= 30) uniqueDays.add(day)
    })
    return ['All', ...Array.from(uniqueDays).sort((a, b) => parseInt(a) - parseInt(b))]
  }, [data])

  const filteredByDay = useMemo(() => {
    if (selectedDay === 'All') return data
    return data.filter(row => row['Start Date']?.startsWith(selectedDay.padStart(2, '0')))
  }, [data, selectedDay])

  const stageDeviationData = useMemo(() => {
    const grouped = {}
    filteredByDay.forEach(row => {
      const stage = row['Stage']
      const sequence = row['Stage Sequence']
      const deviation = row['Deviation']?.trim() === 'Yes' ? 'Yes' : 'No'
      const key = `${sequence}-${stage}`
      if (!grouped[key]) {
        grouped[key] = { stage, sequence: parseInt(sequence), Yes: 0, No: 0 }
      }
      grouped[key][deviation]++
    })
    return Object.values(grouped).sort((a, b) => a.sequence - b.sequence)
  }, [filteredByDay])

  const filteredByStage = useMemo(() => {
    if (!selectedStage) return filteredByDay
    return filteredByDay.filter(row => row['Stage'] === selectedStage)
  }, [filteredByDay, selectedStage])

  const aggregatedTable1 = useMemo(() => {
    const containerMap = {}
    filteredByStage.forEach(row => {
      const id = row['Container ID']
      if (!containerMap[id]) {
        containerMap[id] = {
          id,
          startDate: row['Start Date'],
          expected: 0,
          actual: 0,
          deviation: 'No',
        }
      }
      containerMap[id].expected += parseFloat(row['Expected TAT (hrs)'] || 0)
      containerMap[id].actual += parseFloat(row['Actual TAT (hrs)'] || 0)
      if (row['Deviation']?.trim() === 'Yes') containerMap[id].deviation = 'Yes'
    })

    let results = Object.values(containerMap)
    if (selectedDeviationTable1 !== 'All') {
      results = results.filter(row => row.deviation === selectedDeviationTable1)
    }

    return results
  }, [filteredByStage, selectedDeviationTable1])

  const detailedContainerData = useMemo(() => {
    if (!selectedContainerID) return []
    let filtered = data.filter(row => row['Container ID'] === selectedContainerID)
    if (selectedDeviationTable2 !== 'All') {
      filtered = filtered.filter(row => row['Deviation']?.trim() === selectedDeviationTable2)
    }
    return filtered
  }, [data, selectedContainerID, selectedDeviationTable2])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6">
      <div className="mb-12 w-full overflow-hidden">
        <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
          <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Workflow className="h-12 w-12 text-white" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Workflow</h2>
            </div>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rounded-lg shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-12 text-center">
            <Workflow className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">No Data Available</h3>
            <p className="text-gray-400 text-lg">There is currently no data to display for this section.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mb-6 w-full flex flex-wrap gap-4">
            <label className="text-white font-semibold self-center">Day:</label>
            <select
              className="w-[200px] bg-[#1a365d] border border-gray-600 rounded-lg p-2 text-white"
              value={selectedDay}
              onChange={(e) => {
                setSelectedDay(e.target.value)
                setSelectedStage(null)
                setSelectedContainerID(null)
              }}
            >
              {dayOptions.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-950/80 p-6 mb-6 rounded-xl shadow-lg border border-white/10 w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Stage wise Deviation</h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={stageDeviationData}
                onClick={({ activeLabel }) => {
                  setSelectedStage(activeLabel)
                  setSelectedContainerID(null)
                }}
              >
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="stage" stroke="#fff" tick={{ fill: 'white', fontWeight: 'bold' }} />
                <YAxis stroke="#fff" tick={{ fill: 'white', fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #888' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend wrapperStyle={{ color: 'white', fontWeight: 'bold' }} />
                <Bar dataKey="No" stackId="a" fill="#00BFFF" />
                <Bar dataKey="Yes" stackId="a" fill="#FF6347" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              Deviation Breakdown{selectedStage ? ` — ${selectedStage}` : ''}
            </h3>
            <div className="max-h-[320px] overflow-y-auto">
              <table className="w-full text-white border-collapse text-center">
                <thead className="sticky top-0 bg-blue-950 z-10">
                  <tr className="border-b border-gray-400">
                    <th className="p-2">Start Date</th>
                    <th className="p-2">Container ID</th>
                    <th className="p-2">Total Expected TAT (days)</th>
                    <th className="p-2">Total Actual TAT (days)</th>
                    <th className="p-2">
                      <div className="flex flex-col items-center">
                        <span>Deviation</span>
                        <select
                          className="w-[120px] bg-[#1a365d] border border-gray-600 rounded-lg p-1 text-white mt-1"
                          value={selectedDeviationTable1}
                          onChange={(e) => setSelectedDeviationTable1(e.target.value)}
                        >
                          <option value="All">All</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedTable1.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-700 cursor-pointer hover:bg-blue-800"
                      onClick={() => setSelectedContainerID(row.id)}
                    >
                      <td className="p-2">{row.startDate}</td>
                      <td className="p-2 text-blue-300 underline">{row.id}</td>
                      <td className="p-2">{Math.round(row.expected / 24)}</td>
                      <td className="p-2">{Math.round(row.actual / 24)}</td>
                      <td className={`p-2 font-semibold ${row.deviation === 'Yes' ? 'text-red-400' : 'text-green-400'}`}>
                        {row.deviation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedContainerID && (
            <div className="bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 mt-6 w-full">
              <h3 className="text-xl font-semibold text-white mb-4">
                Deviation Details for Container: <span className="text-yellow-300">{selectedContainerID}</span>
              </h3>
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-white border-collapse text-center">
                  <thead className="sticky top-0 bg-blue-950 z-10">
                    <tr className="border-b border-gray-400">
                      <th className="p-2">Container ID</th>
                      <th className="p-2">Stage</th>
                      <th className="p-2">Substage</th>
                      <th className="p-2">Assigned Role</th>
                      <th className="p-2">Deviation Reason</th>
                      <th className="p-2">
                        <div className="flex flex-col items-center">
                          <span>Deviation</span>
                          <select
                            className="w-[120px] bg-[#1a365d] border border-gray-600 rounded-lg p-1 text-white mt-1"
                            value={selectedDeviationTable2}
                            onChange={(e) => setSelectedDeviationTable2(e.target.value)}
                          >
                            <option value="All">All</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedContainerData.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="p-2">{row['Container ID']}</td>
                        <td className="p-2">{row['Stage']}</td>
                        <td className="p-2">{row['Substage']}</td>
                        <td className="p-2">{row['Assigned Role']}</td>
                        <td className="p-2">{row['Deviation Reason']}</td>
                        <td className={`p-2 font-semibold ${row['Deviation'] === 'Yes' ? 'text-red-400' : 'text-green-400'}`}>
                          {row['Deviation']}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="text-center mt-10">
        <button
          onClick={() => window.location.href = '/logistics/outbound'}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-8 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Outbound Logistics
        </button>
      </div>
    </div>
  )
}
