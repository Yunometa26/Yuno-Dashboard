'use client'
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import FilterComponent from "@/app/components/machine-maintenance/smart-health/FilterComponent";
import MetricCards from "@/app/components/machine-maintenance/smart-health/MetricCards";
import UsedCapacityBarChart from "@/app/components/machine-maintenance/smart-health/UsedCapacityBarChart";
import OEETrendChart from "@/app/components/machine-maintenance/smart-health/OEETrendChart";
import MachinesTable from "@/app/components/machine-maintenance/smart-health/MachinesTable";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [orderDates, setOrderDates] = useState([]);
  const [bucketings, setBucketings] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [selectedBucketing, setSelectedBucketing] = useState("");

  useEffect(() => {
    Papa.parse("/smart-health.csv", {
      download: true,
      header: true,
      complete: (result) => {
        setData(result.data);
        const uniqueDates = [...new Set(result.data.map(item => item["Order Date"]))].sort();
        const uniqueBuckets = [...new Set(result.data.map(item => item["Bucketing"]))].sort();
        setOrderDates(uniqueDates);
        setBucketings(uniqueBuckets);
      },
    });
  }, []);

  // Filter data based on selected date range and bucketing
  const filteredData = data.filter(row => {
    // Date range filter
    const dateInRange = (!selectedStartDate || row["Order Date"] >= selectedStartDate) && 
                        (!selectedEndDate || row["Order Date"] <= selectedEndDate);
    
    // Bucketing filter
    const bucketingMatch = !selectedBucketing || row["Bucketing"] === selectedBucketing;
    
    return dateInRange && bucketingMatch;
  });

  const filters = {
    startDate: selectedStartDate,
    endDate: selectedEndDate,
    bucketing: selectedBucketing
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen">
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              {/* Left side with text content */}
              <div className="flex-1 space-y-5 align-middle text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  <span className="text-white">Smart Health Dashboard</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
      
      <FilterComponent
        orderDates={orderDates}
        bucketings={bucketings}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        selectedBucketing={selectedBucketing}
        onStartDateChange={setSelectedStartDate}
        onEndDateChange={setSelectedEndDate}
        onBucketingChange={setSelectedBucketing}
      />
      <MetricCards data={filteredData} />
      <UsedCapacityBarChart data={filteredData} />
      <div className="flex flex-row w-full gap-6 h-96">
        <div className="w-1/2">
          <OEETrendChart data={filteredData} />
        </div>
        <div className="w-1/2">
          <MachinesTable data={filteredData} filters={filters} />
        </div>
      </div>
      <div className="mt-8 flex justify-center">
          <button 
            onClick={() => window.location.href = '/maintenance'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Maintenance
          </button>
        </div>
    </div>
  );
};

export default Dashboard;