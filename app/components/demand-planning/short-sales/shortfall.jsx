"use client"
import ShortfallCharts from "./ShortfallCharts"
import CardFilterComponent from "./orderratio"

import { useEffect, useState } from "react"
import Papa from "papaparse"

export default function ShortfallCalculator() {
  const [data, setData] = useState([])
  const [allData, setAllData] = useState([])
  const [totalShortfall, setTotalShortfall] = useState(0)
  const [revenueLoss, setRevenueLoss] = useState(0)
  const [totalRevenueLoss, setTotalRevenueLoss] = useState(0)

  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedFY, setSelectedFY] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  const monthNames = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  }

  useEffect(() => {
    fetch("/Anonymized_Shortfall_SKU (1).csv")
      .then((response) => response.text())
      .then((csvText) => {
        const parsed = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        })
        setData(parsed.data)
        setAllData(parsed.data)
      })
      .catch(error => {
        console.error("Error fetching CSV:", error)
      })
  }, [])

  // Extract unique dropdown values
  const uniqueFYs = [...new Set(allData.map((item) => item.FY))]
  const uniqueCategories = [...new Set(allData.map((item) => item.CATEGORY))]
  const uniqueMonths = [
    ...new Set(
      allData.map((item) => {
        const monthNum = item.Months?.split("-")[0]
        return monthNames[monthNum]
      })
    ),
  ]

  // Calculate total shortfall when filters change
  useEffect(() => {
    let tempData = [...allData]

    if (selectedMonth) {
      tempData = tempData.filter((item) => {
        const monthNum = item.Months?.split("-")[0]
        return monthNames[monthNum] === selectedMonth
      })
    }

    if (selectedFY) {
      tempData = tempData.filter((item) => item.FY === selectedFY)
    }

    if (selectedCategory) {
      tempData = tempData.filter((item) => item.CATEGORY === selectedCategory)
    }

    // Calculate total shortfall only for rows where Impactful Shortfall is 1
    const impactfulRows = tempData.filter(item => 
      item["Impactful Shortfall"] === 1 || item["Impactful Shortfall"] === "1"
    )
    
    // Parse a currency string by removing "Rs. " and commas
    const parseCurrency = (currencyStr) => {
      if (!currencyStr) return 0
      return parseFloat(String(currencyStr).replace("Rs. ", "").replace(/,/g, "")) || 0
    }
    
    // Calculate total shortfall
    const calculatedTotalShortfall = impactfulRows.reduce((total, item) => {
      const shortfallValue = parseFloat(item["Shortfall in Revenue"] || 0)
      return total + shortfallValue
    }, 0)

    // Calculate revenue loss
    let calculatedRevenueLoss = 0
    let calculatedTotalRevenueLoss = 0
    
    impactfulRows.forEach(item => {
      const pendingSO = Number(item["SHORTFALL (PEND. SO)"] || 0)
      const closingStock = Number(item["CLOSING STOCK"] || 0)
      const perUnit = parseCurrency(item["PER UNIT"])
      
      const unitLoss = Math.max(0, pendingSO - closingStock)
      calculatedRevenueLoss += unitLoss
      calculatedTotalRevenueLoss += unitLoss * perUnit
    })
    
    setTotalShortfall(calculatedTotalShortfall)
    setRevenueLoss(calculatedRevenueLoss)
    setTotalRevenueLoss(calculatedTotalRevenueLoss)
    setData(tempData)
  }, [selectedMonth, selectedFY, selectedCategory, allData])

  // Format number with commas for Indian numbering system
  const formatNumber = (value) => {
    return value.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  }

  return (
    <div className="min-h-screen">

      <CardFilterComponent />

      {/* Main Content */}
      <div className=" px-2 ">
        {/* Intro Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Shortfall Analyzer
          </h2>
          <p className="text-white">
            Track and analyze revenue shortfalls to identify potential improvement opportunities
          </p>
        </div>
        
        {/* Filter Section */}
        <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3]shadow rounded-lg mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-blue-200 rounded-md py-2 px-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Months</option>
                {uniqueMonths.map((month, i) => (
                  <option key={i} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Financial Year
              </label>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="w-full border border-blue-200 rounded-md py-2 px-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All FYs</option>
                {uniqueFYs.map((fy, i) => (
                  <option key={i} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-blue-200 rounded-md py-2 px-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-black">
                {selectedMonth || "All Months"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-black">
                {selectedFY || "All FYs"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-black">
                {selectedCategory || "All Categories"}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Adjusted to two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Revenue Loss (Units) Card */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Short Fall 
                    </h3>
                    <p className="text-sm text-slate-500">Total units affected</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-slate-800">
                    {revenueLoss.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-600 h-1"></div>
          </div>

          {/* Total Revenue Loss Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Revenue Loss
                    </h3>
                    <p className="text-sm text-slate-500">Total value</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-slate-800">
                    ₹{formatNumber(totalRevenueLoss)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-600 h-1"></div>
          </div>
        </div>
        <div className="mt-8">
        <ShortfallCharts 
            data={data} 
            selectedMonth={selectedMonth} 
            selectedFY={selectedFY} 
            selectedCategory={selectedCategory} 
        />
        </div>
      </div>
    </div>
  )
}