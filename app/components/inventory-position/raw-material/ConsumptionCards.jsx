import React, { useMemo, useEffect, useState } from "react";
import { BarChartBig, LineChart } from "lucide-react";
import _ from "lodash";

const ConsumptionCards = ({ filtered }) => {
  // State to track consumption statistics
  const [stats, setStats] = useState({
    totalConsumption: 0,
    averageConsumption: 0,
    dataCount: 0
  });

  // Calculate statistics whenever filtered data changes
  useEffect(() => {
    calculateConsumptionStats();
  }, [filtered]);

  // Calculate statistics from filtered data
  const calculateConsumptionStats = () => {
    if (!filtered || filtered.length === 0) {
      setStats({
        totalConsumption: 0,
        averageConsumption: 0,
        dataCount: 0
      });
      return;
    }

    // Get valid consumption entries
    const validItems = filtered.filter(item => 
      item["Daily Consumption"] !== undefined && 
      !isNaN(parseFloat(item["Daily Consumption"]))
    );

    // Calculate total consumption
    const totalConsumption = _.sumBy(validItems, item => 
      parseFloat(item["Daily Consumption"])
    );
    
    // Calculate average consumption
    const averageConsumption = validItems.length > 0 
      ? totalConsumption / validItems.length 
      : 0;

    setStats({
      totalConsumption: parseFloat(totalConsumption.toFixed(2)),
      averageConsumption: parseFloat(averageConsumption.toFixed(2)),
      dataCount: validItems.length
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mr-1 ml-1">
      {/* Total Consumption Card */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Total Consumption</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {stats.totalConsumption.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Based on {stats.dataCount} records
          </p>
        </div>
        <div className="bg-blue-100 p-4 rounded-full">
          <BarChartBig className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Average Consumption Card */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Average Consumption</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.averageConsumption.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Daily average from "Daily Consumption" column
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded-full">
          <LineChart className="h-8 w-8 text-green-600" />
        </div>
      </div>
    </div>
  );
};

export default ConsumptionCards;