'use client'
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import AlarmDashboard from "@/app/components/machine-maintenance/smart-health/AlarmDashboard";
import OEEStats from "@/app/components/machine-maintenance/smart-health/OEE";
import EnergyDashboard from "@/app/components/machine-maintenance/smart-health/Energy";
import WaterDashboard from "@/app/components/machine-maintenance/smart-health/WaterDashboard";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [orderDates, setOrderDates] = useState([]);
  const [bucketings, setBucketings] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [selectedBucketing, setSelectedBucketing] = useState("");

  const [showEnergy, setShowEnergy] = useState(false);
  const [showOEE, setShowOEE] = useState(false);
  const [showDeviation, setShowDeviation] = useState(false);
  const [showWater, setShowWater] = useState(false);

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

  const filteredData = data.filter(row => {
    const dateInRange = (!selectedStartDate || row["Order Date"] >= selectedStartDate) && 
                        (!selectedEndDate || row["Order Date"] <= selectedEndDate);
    const bucketingMatch = !selectedBucketing || row["Bucketing"] === selectedBucketing;
    return dateInRange && bucketingMatch;
  });

  const filters = {
    startDate: selectedStartDate,
    endDate: selectedEndDate,
    bucketing: selectedBucketing
  };

  const ToggleButton = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
        isActive 
          ? "bg-white text-blue-900 shadow-lg" 
          : "text-white bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen">
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <div className="flex-1 space-y-5 align-middle text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  <span className="text-white">Smart Health Dashboard</span>
                </h2>
              </div>
            </div>
          </div>
        </div>

      <div className="flex flex-wrap gap-4 justify-center mb-6 mt-3">
        <ToggleButton 
          label="OEE" 
          isActive={showOEE} 
          onClick={() => setShowOEE(!showOEE)} 
        />
        <ToggleButton 
          label="Deviation Analysis" 
          isActive={showDeviation} 
          onClick={() => setShowDeviation(!showDeviation)} 
        />
        <ToggleButton 
          label="Energy" 
          isActive={showEnergy} 
          onClick={() => setShowEnergy(!showEnergy)} 
        />
        <ToggleButton 
          label="Water" 
          isActive={showWater} 
          onClick={() => setShowWater(!showWater)} 
        />
      </div>
      
      {showEnergy && (
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-lg shadow-lg p-4 mb-6">
          <EnergyDashboard />
        </div>
      )}

      {showDeviation && (
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-lg shadow-lg p-4 mb-6">
          <AlarmDashboard />
        </div>
      )}

      {showOEE && (
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-lg shadow-lg p-4 mb-6">
          <OEEStats />
        </div>
      )}

      {showWater && (
        <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-lg shadow-lg p-4 mb-6">
          <WaterDashboard />
        </div>
      )}

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