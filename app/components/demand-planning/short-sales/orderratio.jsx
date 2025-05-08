import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import FulfillmentCards from "./FulfillmentCards";
import OrdersTable from "./OrdersTable";

const OrderFulfillment = () => {
  const [data, setData] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrdersTable, setShowOrdersTable] = useState(false);

  const ranges = [
    { label: "85% - 90%", min: 85, max: 90, color: "red" },
    { label: "90% - 95%", min: 90, max: 95, color: "blue" },
    { label: "98% - 100%", min: 98, max: 100, color: "green" },
  ];

  useEffect(() => {
    fetch("/Dummy_Order_Fulfillment_Data.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const formatted = result.data.map((row) => ({
              order: row["Orders"],
              sku: row["SKU"],
              required: Number(row["Required Quantity"]),
              fulfilled: Number(row["Fullfilled Quantity"]),
              pending: Number(row["Pending Quantity"]),
              shortSales: Number(row["ShortSales"]),
              ratio: Number(
                row["Order fullfillment ratio"]
                  ?.replace("%", "")
                  .trim()
              ),
            }));
            setData(formatted);
          },
        });
      })
      .catch((error) => console.error("Error loading CSV:", error));
  }, []);

  // First filter by ratio, then aggregate
  const filteredData = data.filter((item) => {
    if (!selectedRange || isNaN(item.ratio)) return false;
    return item.ratio >= selectedRange.min && item.ratio <= selectedRange.max;
  });
  
  // Aggregate the filtered data by order
  const getAggregatedData = () => {
    const aggregated = {};
    
    filteredData.forEach(item => {
      if (!aggregated[item.order]) {
        aggregated[item.order] = {
          order: item.order,
          required: 0,
          fulfilled: 0,
          pending: 0
        };
      }
      
      // Add quantities for the same order
      aggregated[item.order].required += item.required;
      aggregated[item.order].fulfilled += item.fulfilled;
      aggregated[item.order].pending += item.pending;
    });
    
    return Object.values(aggregated);
  };
  
  const aggregatedData = getAggregatedData();

  // Get details for a specific order - only include items that match the range filter
  const getOrderDetails = (orderNumber) => {
    return data.filter(item => 
      item.order === orderNumber && 
      item.ratio >= selectedRange.min && 
      item.ratio <= selectedRange.max
    );
  };

  const orderDetails = selectedOrder ? getOrderDetails(selectedOrder) : [];

  const handleOrderClick = (orderNumber) => {
    setSelectedOrder(orderNumber);
  };

  const closeDetails = () => {
    setSelectedOrder(null);
  };

  const closeOrdersTable = () => {
    setShowOrdersTable(false);
  };

  // Get color gradient based on selected range
  const getGradientColors = () => {
    if (!selectedRange) return { from: "slate-50", to: "slate-100" };
    
    const rangeColor = ranges.find(r => r.label === selectedRange.label)?.color || "blue";
    
    const colorMap = {
      "red": { from: "red-50", to: "red-100", accent: "red-500", border: "red-600" },
      "blue": { from: "blue-50", to: "blue-100", accent: "blue-500", border: "blue-600" },
      "green": { from: "green-50", to: "green-100", accent: "green-500", border: "green-600" }
    };
    
    return colorMap[rangeColor];
  };
  
  const colors = getGradientColors();

  return (
    <div>
      <div className="p-2">
        {/* Intro Section - Reduced vertical margin */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-1">
            Order Fulfillment Dashboard
          </h2>
          <p className="text-white">
            Analyze order fulfillment ratios and identify performance trends
          </p>
        </div>

        {/* Filter Section - Reduced vertical margin */}
        <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] shadow rounded-lg mb-4 p-4">
          <h3 className="text-lg font-medium text-white mb-3">
            Select Fulfillment Ratio Range
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ranges.map((range, index) => {
              const isSelected = selectedRange?.label === range.label;
              // Use hardcoded tailwind classes instead of dynamic ones
              const bgColor = isSelected 
                ? range.color === "red" ? "bg-red-100" 
                : range.color === "blue" ? "bg-blue-100" 
                : "bg-green-100"
                : "bg-white";
                
              const borderColor = isSelected
                ? range.color === "red" ? "border-red-300" 
                : range.color === "blue" ? "border-blue-300" 
                : "border-green-300"
                : "border-slate-200";
                
              const hoverClass = !isSelected
                ? range.color === "red" ? "hover:bg-red-50 hover:border-red-200" 
                : range.color === "blue" ? "hover:bg-blue-50 hover:border-blue-200" 
                : "hover:bg-green-50 hover:border-green-200"
                : "";
                
              return (
                <div
                  key={index}
                  className={`cursor-pointer border rounded-lg shadow-sm p-3 transition-all ${bgColor} ${borderColor} ${hoverClass} ${isSelected ? "shadow-md" : ""}`}
                  onClick={() => {
                    setSelectedRange(range);
                    setShowOrdersTable(false); // Reset table view on range change
                  }}
                >
                  <h2 className="text-lg font-semibold text-slate-800">{range.label}</h2>
                  <p className="text-sm text-slate-500">Fulfillment Ratio</p>
                </div>
              );
            })}
          </div>
          
          {selectedRange && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                {selectedRange.color === "red" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-500">
                    Ratio: {selectedRange.label}
                  </span>
                )}
                {selectedRange.color === "blue" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-500">
                    Ratio: {selectedRange.label}
                  </span>
                )}
                {selectedRange.color === "green" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-500">
                    Ratio: {selectedRange.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cards Component */}
        {selectedRange && (
          <FulfillmentCards 
            aggregatedData={aggregatedData} 
            colors={colors} 
          />
        )}

        {/* View Orders Button */}
        {selectedRange && !showOrdersTable && (
          <div className="flex justify-center mb-4">
            {selectedRange.color === "red" && (
              <button 
                onClick={() => setShowOrdersTable(true)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"
              >
                View Orders Details
              </button>
            )}
            {selectedRange.color === "blue" && (
              <button 
                onClick={() => setShowOrdersTable(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                View Orders Details
              </button>
            )}
            {selectedRange.color === "green" && (
              <button 
                onClick={() => setShowOrdersTable(true)}
                className="px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors"
              >
                View Orders Details
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tables Component */}
      <OrdersTable 
        showOrdersTable={showOrdersTable}
        selectedRange={selectedRange}
        aggregatedData={aggregatedData}
        selectedOrder={selectedOrder}
        orderDetails={orderDetails}
        data={data}
        colors={colors}
        closeOrdersTable={closeOrdersTable}
        closeDetails={closeDetails}
        handleOrderClick={handleOrderClick}
      />
    </div>
  );
};

export default OrderFulfillment;