"use client";

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FinishedGoodsPage() {
  const [parsedData, setParsedData] = useState([]);
  const [filters, setFilters] = useState({
    months: "",
    products: "",
    availability: "",
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredSKU, setFilteredSKU] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetch("/finished_goods.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processed = results.data.map((item) => ({
              ...item,
              Product: item.Product?.trim() || "",
              formattedMonth: item.Month,
              Availability: Number(item.Availability) || 0,
              Bucket: item.Bucket?.trim() || "",
              InventoryDays: Number(item["Inventory Days"]) || 0,
            }));
            setParsedData(processed);
          },
        });
      });
  }, []);

  const handleSelectChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
      ...(filterName !== "products" && { products: "" }),
    }));
    setSelectedCategory(null);
    setFilteredSKU([]);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    setFilteredSKU((prev) =>
      [...prev].sort((a, b) =>
        newOrder === "asc"
          ? a.InventoryDays - b.InventoryDays
          : b.InventoryDays - a.InventoryDays
      )
    );
  };

  const uniqueMonths = useMemo(() => {
    const monthOrder = ["Jan-25", "Feb-25", "Mar-25", "Apr-25", "May-25", "Jun-25"];
    const presentMonths = new Set(parsedData.map((item) => item.formattedMonth));
    return ["All", ...monthOrder.filter((month) => presentMonths.has(month))];
  }, [parsedData]);

  const dynamicProductOptions = useMemo(() => {
    const filtered = parsedData.filter((item) => {
      if (filters.months && filters.months !== "All") {
        return item.formattedMonth === filters.months;
      }
      return true;
    });
    const productSet = new Set(filtered.map((item) => item.Product));
    const sortedProducts = Array.from(productSet)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    return ["All", ...sortedProducts];
  }, [parsedData, filters.months]);

  const availabilities = useMemo(() => {
    const values = Array.from(new Set(parsedData.map((item) => item.Availability)))
      .filter((val) => !isNaN(val))
      .sort((a, b) => a - b);
    return ["All", ...values.map((val) => String(val))];
  }, [parsedData]);

  const filteredData = useMemo(() => {
    return parsedData.filter((item) => {
      if (filters.products && filters.products !== "All") {
        if (item.Product !== filters.products) return false;
      }
      if (filters.availability && filters.availability !== "All") {
        if (String(item.Availability) !== filters.availability) return false;
      }
      if (filters.months && filters.months !== "All") {
        if (item.formattedMonth !== filters.months) return false;
      }
      return true;
    });
  }, [parsedData, filters]);

  const barData = useMemo(() => {
    const bucketMap = {
      "No Stock": [],
      "Low": [],
      "Adequate": [],
      "Excess": [],
    };

    for (const item of filteredData) {
      if (bucketMap.hasOwnProperty(item.Bucket)) {
        bucketMap[item.Bucket].push(item);
      }
    }

    return Object.entries(bucketMap).map(([name, items]) => ({
      name,
      count: items.length,
      items,
    }));
  }, [filteredData]);

  const handleClick = (e) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const data = e.activePayload[0].payload;
      setSelectedCategory(data.name);
      const sortedItems = [...data.items].sort((a, b) =>
        sortOrder === "asc"
          ? a.InventoryDays - b.InventoryDays
          : b.InventoryDays - a.InventoryDays
      );
      setFilteredSKU(sortedItems);
    }
  };

  const totalSKUCount = selectedCategory
    ? barData.find((item) => item.name === selectedCategory)?.count || 0
    : filteredData.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673] text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Finished Goods Inventory Position
      </h1>

      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Month</label>
            <select
              value={filters.months}
              onChange={(e) => handleSelectChange("months", e.target.value)}
              className="w-44 rounded-md border-gray-300 text-black bg-gray-100 px-3 py-2 text-sm"
            >
              {uniqueMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Product</label>
            <select
              value={filters.products}
              onChange={(e) => handleSelectChange("products", e.target.value)}
              className="w-44 rounded-md border-gray-300 text-black bg-gray-100 px-3 py-2 text-sm"
            >
              {dynamicProductOptions.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Availability</label>
            <select
              value={filters.availability}
              onChange={(e) => handleSelectChange("availability", e.target.value)}
              className="w-44 rounded-md border-gray-300 text-black bg-gray-100 px-3 py-2 text-sm"
            >
              {availabilities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-200 text-blue-900 font-semibold rounded-lg p-4 w-full sm:w-64 shadow-md">
          <div className="text-lg">Count of SKU</div>
          <div className="text-3xl">{totalSKUCount}</div>
        </div>
      </div>

      <div className="bg-white/10 rounded-2xl shadow-lg p-6 border border-blue-200 w-full min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-4 text-center text-white">
          Count of SKU by Bucket
        </h2>

        <div style={{ width: "100%", height: "400px" }}>
          {barData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                barGap={4}
                barCategoryGap="70%"
                maxBarSize={100}
                margin={{ bottom: 30, left: 50 }}
                onClick={handleClick}
              >
                <XAxis type="number" stroke="#ffffff" />
                <YAxis dataKey="name" type="category" stroke="#ffffff" width={100} />
                <Tooltip wrapperClassName="text-black" />
                <Bar
                  dataKey="count"
                  fill="#39FF14"
                  radius={[0, 10, 10, 0]}
                  name="Count of SKU"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-6 text-center font-semibold text-white text-xl">
          Distribution of SKU across Categories
        </div>
      </div>

      {selectedCategory && (
        <div className="overflow-y-auto mt-8 max-h-96 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">{selectedCategory} SKUs</h2>
            <button
              onClick={toggleSortOrder}
              className="bg-blue-200 text-blue-900 text-sm font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-300 transition"
            >
              Sort by Inventory Days ({sortOrder === "asc" ? "Low → High" : "High → Low"})
            </button>
          </div>
          <table className="min-w-full text-gray-100">
            <thead className="bg-[#024673]">
              <tr>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-left">Demand</th>
                <th className="px-4 py-2 text-left">Opening Stock</th>
                <th className="px-4 py-2 text-left">Turnover Ratio</th>
                <th className="px-4 py-2 text-left">Inventory Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredSKU?.map((item, idx) => (
                <tr key={idx} className={`${idx % 2 === 0 ? "bg-[#024673]" : "bg-[#03579E]"}`}>
                  <td className="px-4 py-2 border-b border-gray-500">{item.SKU}</td>
                  <td className="px-4 py-2 border-b border-gray-500">{item.Demand}</td>
                  <td className="px-4 py-2 border-b border-gray-500">{item["Opening Stock"]}</td>
                  <td className="px-4 py-2 border-b border-gray-500">{item["Turnover Ratio"]}</td>
                  <td className="px-4 py-2 border-b border-gray-500">{item["Inventory Days"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <button
          onClick={() => (window.location.href = "/inventory-position")}
          className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
        >
          Back to Inventory position
        </button>
      </div>
    </div>
  );
}
