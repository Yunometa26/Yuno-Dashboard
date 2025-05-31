import React, { useMemo } from 'react';
import { ClipboardCheck, Clock } from 'lucide-react';

const POStatusCards = ({ filtered }) => {
  const statsData = useMemo(() => {
    if (!filtered || filtered.length === 0) {
      return {
        totalPOs: 0,
        avgLeadTime: 0
      };
    }

    // Count total POs with any status (Open, Closed, Delayed)
    const uniquePOs = new Set();
    filtered.forEach(item => {
      // Count PO if it has a PO Status field (Open, Closed, or Delayed)
      if (item["PO Status"]) {
        // Assuming there's a PO number field - if not, use a combination of fields or row index
        const poIdentifier = item.PO || `po-${item.id || filtered.indexOf(item)}`;
        uniquePOs.add(poIdentifier);
      }
    });
    
    // Calculate average lead time
    let totalLeadTime = 0;
    let leadTimeCount = 0;
    
    filtered.forEach(item => {
      if (item["Lead Time (Days)"] && !isNaN(item["Lead Time (Days)"])) {
        totalLeadTime += item["Lead Time (Days)"];
        leadTimeCount++;
      }
    });
    
    const avgLeadTime = leadTimeCount > 0 ? (totalLeadTime / leadTimeCount).toFixed(1) : 0;
    
    return {
      totalPOs: uniquePOs.size,
      avgLeadTime: avgLeadTime
    };
  }, [filtered]);

  return (
    <div className="grid grid-cols-1 gap-4 mb-4 mr-1 ml-1">
      {/* Total PO Count Card */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <ClipboardCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Total POs (Open, Closed, Delayed)</h3>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{statsData.totalPOs}</div>
          </div>
        </div>
      </div>
      
      {/* Average Lead Time Card */}
      {/* <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center">
          <div className="bg-yellow-100 p-3 rounded-full">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Average Lead Time</h3>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {statsData.avgLeadTime} <span className="text-lg font-normal text-gray-500">days</span>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default POStatusCards;