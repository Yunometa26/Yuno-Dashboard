'use client';

import React, { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { Warehouse } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function YardAllocationPage() {
  const [data, setData] = useState([])
  const [monthlyTEU, setMonthlyTEU] = useState([])
  const [monthlyDwell, setMonthlyDwell] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [dailyDwell, setDailyDwell] = useState([])
  const [avgDwell, setAvgDwell] = useState(0)
  const [yardOccupancy, setYardOccupancy] = useState(0)
  const [onTimePercentage, setOnTimePercentage] = useState(0)

  useEffect(() => {
    Papa.parse('/Container_Yard_Data.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const rawData = results.data.map(row => {
          const entryDate = new Date(row.Entry_Date)
          const isValid = !isNaN(entryDate)
          return {
            ...row,
            Entry_Date: isValid ? entryDate : null,
            Occupied_TEU: +row.Occupied_TEU || 0,
            Dwell_Time_Days: +row.Dwell_Time_Days || 0,
            On_Time: row.On_Time === 'TRUE',
          }
        }).filter(row => row.Entry_Date !== null)

        setData(rawData)
        computeMonthlyData(rawData)
        computeOverallMetrics(rawData)
        computeYardOccupancy(rawData)
        computeDwellAndDailyChart(rawData)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      const filtered = data.filter(row => {
        const month = row.Entry_Date.toLocaleString('default', { month: 'long' })
        return month === selectedMonth
      })
      computeYardOccupancy(filtered)
      computeDwellAndDailyChart(filtered)
    } else {
      computeYardOccupancy(data)
      computeDwellAndDailyChart(data)
    }
  }, [selectedMonth])

  const computeMonthlyData = (rawData) => {
    const monthlyTEUMap = {}
    const monthlyDwellMap = {}

    rawData.forEach(row => {
      const month = row.Entry_Date.toLocaleString('default', { month: 'long' })
      if (!monthlyTEUMap[month]) monthlyTEUMap[month] = 0
      monthlyTEUMap[month] += row.Occupied_TEU

      if (!monthlyDwellMap[month]) monthlyDwellMap[month] = { total: 0, count: 0 }
      monthlyDwellMap[month].total += row.Dwell_Time_Days
      monthlyDwellMap[month].count += 1
    })

    const monthlyTEUList = Object.entries(monthlyTEUMap).map(([month, value]) => ({ month, TEU: value }))
    const monthlyDwellList = Object.entries(monthlyDwellMap).map(([month, val]) => ({
      month,
      avgDwell: val.total / val.count
    }))

    const sortByMonth = (a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
    setMonthlyTEU(monthlyTEUList.sort(sortByMonth))
    setMonthlyDwell(monthlyDwellList.sort(sortByMonth))
  }

  const computeYardOccupancy = (dataset) => {
    const totalOccupiedTEU = dataset.reduce((sum, d) => sum + d.Occupied_TEU, 0)
    const maxTEU = Math.max(...dataset.map(d => d.Occupied_TEU))
    const totalCapacityTEU = maxTEU * dataset.length
    setYardOccupancy((totalOccupiedTEU / totalCapacityTEU) * 100)
  }

  const computeDwellAndDailyChart = (dataset) => {
    let dwellSum = 0
    let dwellCount = 0
    const dailyMap = {}

    dataset.forEach(row => {
      const day = row.Entry_Date.getDate()
      if (!dailyMap[day]) dailyMap[day] = { total: 0, count: 0 }
      dailyMap[day].total += row.Dwell_Time_Days
      dailyMap[day].count += 1

      dwellSum += row.Dwell_Time_Days
      dwellCount += 1
    })

    setAvgDwell(dwellSum / dwellCount)

    const sampleDate = dataset[0]?.Entry_Date
    const year = sampleDate?.getFullYear()
    const monthIndex = sampleDate?.getMonth()
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

    const dailyList = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const val = dailyMap[day] || { total: 0, count: 0 }
      return {
        day,
        avgDwell: val.count > 0 ? val.total / val.count : 0
      }
    })

    setDailyDwell(dailyList)
  }

  const computeOverallMetrics = (dataset) => {
    const totalOnTime = dataset.filter(d => d.On_Time === true).length
    setOnTimePercentage((totalOnTime / dataset.length) * 100)
  }

  const handleMonthClick = (month) => {
    setSelectedMonth(month)
  }

  const customTooltipStyle = {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#fff'
  }

  const DwellTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="custom-tooltip" style={customTooltipStyle}>
          <p className="label text-white">
            {selectedMonth ? `Day ${label}` : label}: {payload[0].value.toFixed(2)} Days
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-white">
      <div className="w-full p-6">
        <div className="mb-12">
          <div className="backdrop-blur-sm rounded-xl bg-blue-950/80 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Warehouse className="h-12 w-12 text-white" />
            <h2 className="text-4xl font-bold">Yard Allocation</h2>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1 bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Sum of Occupied TEU by Month</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyTEU}
                onClick={(e) => {
                  if (e?.activeLabel) handleMonthClick(e.activeLabel)
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="month" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={customTooltipStyle} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="TEU" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-72 bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-semibold text-green-300">Yard Occupancy %</h3>
            <p className="text-3xl font-bold">{yardOccupancy.toFixed(2)}%</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="flex-1 bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Average Dwell Time Days {selectedMonth ? `in ${selectedMonth}` : 'by Month'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={selectedMonth ? dailyDwell : monthlyDwell}
                onClick={(e) => {
                  if (!selectedMonth && e?.activeLabel) handleMonthClick(e.activeLabel)
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey={selectedMonth ? 'day' : 'month'} stroke="#fff" interval={0} />
                <YAxis stroke="#fff" />
                <Tooltip content={<DwellTooltip />} />
                <Bar dataKey="avgDwell" fill="#facc15" />
              </BarChart>
            </ResponsiveContainer>
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="mt-4 text-sm underline text-blue-300"
              >
                Reset to Monthly View
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6 w-full lg:w-72 justify-between">
            <div className="flex-1 text-center bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-yellow-300">Avg Dwell Time Days</h3>
              <p className="text-3xl font-bold">{avgDwell.toFixed(2)} Days</p>
            </div>
            <div className="flex-1 text-center bg-blue-950/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 p-6 flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-lime-300">On Time %</h3>
              <p className="text-3xl font-bold">{onTimePercentage.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
