import React, { useMemo, useState } from 'react';
import { ClipboardCheck, Clock, AlertTriangle, X, Calendar, Package, Building, FileText, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const POStatusCards = ({ filtered }) => {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const statsData = useMemo(() => {
    if (!filtered || filtered.length === 0) {
      return {
        totalPOs: 0,
        avgLeadTime: 0,
        urgentPurchases: 0,
        delayedDeliveries: 0,
        urgentTrend: 0
      };
    }

    // Count unique POs
    const uniquePOs = new Set();
    filtered.forEach(item => {
      if (item["PO Status"]) {
        const poIdentifier = item["PO Number"] || `po-${filtered.indexOf(item)}`;
        uniquePOs.add(poIdentifier);
      }
    });
    
    // Calculate average lead time using Delivery Delay
    let totalLeadTime = 0;
    let leadTimeCount = 0;
    let urgentPurchases = 0;
    let delayedDeliveries = 0;
    
    filtered.forEach(item => {
      // Lead time calculation
      if (item["Delivery Delay (Days)"] !== undefined && !isNaN(item["Delivery Delay (Days)"])) {
        totalLeadTime += Math.abs(item["Delivery Delay (Days)"]);
        leadTimeCount++;
      }
      
      // Count urgent purchases and delayed deliveries based on actual vs expected delivery dates
      if (item["Expected Delivery Date"] && item["Actual Delivery Date"]) {
        const expectedDate = new Date(item["Expected Delivery Date"]);
        const actualDate = new Date(item["Actual Delivery Date"]);
        
        if (actualDate > expectedDate) {
          // Actual delivery is after expected - this is delayed
          delayedDeliveries++;
        } else {
          // Actual delivery is on time or early - this is urgent (good performance)
          urgentPurchases++;
        }
      }
    });
    
    const avgLeadTime = leadTimeCount > 0 ? (totalLeadTime / leadTimeCount).toFixed(1) : 0;
    
    return {
      totalPOs: uniquePOs.size,
      avgLeadTime: avgLeadTime,
      urgentPurchases: urgentPurchases,
      delayedDeliveries: delayedDeliveries,
      urgentTrend: 0
    };
  }, [filtered]);

  const getDetailedPOData = (metricType) => {
    if (!filtered || filtered.length === 0) return {};

    let relevantPOs = [];
    
    // Filter POs based on metric type
    filtered.forEach(item => {
      let includeItem = false;
      
      switch (metricType) {
        case 'totalPOs':
          includeItem = item["PO Status"] !== undefined;
          break;
        case 'urgentPurchases':
          // Urgent: Actual delivery date is on time or early
          if (item["Expected Delivery Date"] && item["Actual Delivery Date"]) {
            const expectedDate = new Date(item["Expected Delivery Date"]);
            const actualDate = new Date(item["Actual Delivery Date"]);
            includeItem = actualDate <= expectedDate;
          }
          break;
        case 'delayedDeliveries':
          // Delayed: Actual delivery date exceeds expected delivery date
          if (item["Expected Delivery Date"] && item["Actual Delivery Date"]) {
            const expectedDate = new Date(item["Expected Delivery Date"]);
            const actualDate = new Date(item["Actual Delivery Date"]);
            includeItem = actualDate > expectedDate;
          }
          break;
        default:
          includeItem = false;
      }
      
      if (includeItem && item["PO Date"]) {
        relevantPOs.push(item);
      }
    });

    // Group by month
    const monthlyGroups = {};
    
    relevantPOs.forEach(item => {
      const date = new Date(item["PO Date"]);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthLabel,
          monthKey,
          items: []
        };
      }
      
      monthlyGroups[monthKey].items.push(item);
    });
    
    // Sort by month and sort items within each month
    Object.keys(monthlyGroups).forEach(monthKey => {
      monthlyGroups[monthKey].items.sort((a, b) => new Date(a["PO Date"]) - new Date(b["PO Date"]));
    });
    
    return monthlyGroups;
  };

  // Generate chart data from monthly PO data
  const getChartData = (monthlyData) => {
    const chartData = Object.keys(monthlyData)
      .sort((a, b) => a.localeCompare(b)) // Sort chronologically
      .map(monthKey => {
        const monthData = monthlyData[monthKey];
        
        // Count unique POs in this month
        const uniquePOs = new Set();
        monthData.items.forEach(item => {
          const poIdentifier = item["PO Number"] || `po-${item.id || Math.random()}`;
          uniquePOs.add(poIdentifier);
        });

        return {
          month: monthData.monthLabel,
          monthShort: new Date(`${monthKey}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          count: uniquePOs.size,
          records: monthData.items.length
        };
      });

    return chartData;
  };

  const handleCardClick = (metricType, title) => {
    setSelectedMetric({ 
      type: metricType, 
      title, 
      data: getDetailedPOData(metricType) 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMetric(null);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Completed': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Delayed': 'bg-orange-100 text-orange-800'
    };
    
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const getTotalPOsInMonth = (monthData) => {
    const uniquePOs = new Set();
    monthData.items.forEach(item => {
      const poIdentifier = item["PO Number"] || `po-${item.id || Math.random()}`;
      uniquePOs.add(poIdentifier);
    });
    return uniquePOs.size;
  };

  const calculateDeliveryPerformance = (item) => {
    if (!item["Expected Delivery Date"] || !item["Actual Delivery Date"]) return null;
    
    const expectedDate = new Date(item["Expected Delivery Date"]);
    const actualDate = new Date(item["Actual Delivery Date"]);
    const diffTime = actualDate - expectedDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 mr-1 ml-1">
        {/* Total PO Count Card */}
        <div 
          className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 transform"
          onClick={() => handleCardClick('totalPOs', 'Total Purchase Orders')}
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <ClipboardCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total POs</h3>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{statsData.totalPOs}</div>
              <p className="text-xs text-blue-600 mt-1 font-medium">Click to View Details</p>
            </div>
          </div>
        </div>

        {/* Urgent Purchases Card - Now shows on-time/early deliveries */}
        <div 
          className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 transform"
          onClick={() => handleCardClick('urgentPurchases', 'On-Time/Early Deliveries')}
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">On-Time/Early</h3>
              <div className="mt-1 flex items-center">
                <span className="text-3xl font-semibold text-gray-900">{statsData.urgentPurchases}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Delivered as expected or early</p>
              <p className="text-xs text-green-600 mt-1 font-medium">Click to View Details</p>
            </div>
          </div>
        </div>

        {/* Delayed Deliveries Card */}
        <div 
          className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 transform"
          onClick={() => handleCardClick('delayedDeliveries', 'Delayed Deliveries')}
        >
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Delayed Deliveries</h3>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{statsData.delayedDeliveries}</div>
              <p className="text-xs text-gray-400 mt-1">Delivered after expected date</p>
              <p className="text-xs text-orange-600 mt-1 font-medium">Click to View Details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Detailed PO Data */}
      {showModal && selectedMetric && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 mr-3" />
                  <div>
                    <h2 className="text-xl font-bold">{selectedMetric.title}</h2>
                    <p className="text-blue-100 text-sm">Detailed Purchase Order Records by Month</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {Object.keys(selectedMetric.data).length > 0 ? (
                <div className="space-y-8">
                  {/* Chart Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Month-wise PO Distribution</h3>
                    </div>
                    
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData(selectedMetric.data)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                          <XAxis 
                            dataKey="monthShort" 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                          />
                          <Tooltip 
                            formatter={(value, name) => [value, name === 'count' ? 'Unique POs' : 'Total Records']}
                            labelFormatter={(label) => {
                              const data = getChartData(selectedMetric.data).find(d => d.monthShort === label);
                              return data ? data.month : label;
                            }}
                            contentStyle={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]}
                            name="Unique POs"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Summary Stats */}
                    {/* <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-500">Total Months</div>
                        <div className="text-2xl font-semibold text-gray-900">
                          {Object.keys(selectedMetric.data).length}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-500">Peak Month</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {(() => {
                            const chartData = getChartData(selectedMetric.data);
                            const maxMonth = chartData.reduce((max, current) => 
                              current.count > max.count ? current : max, chartData[0] || { monthShort: 'N/A', count: 0 });
                            return `${maxMonth.monthShort} (${maxMonth.count})`;
                          })()}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-500">Average per Month</div>
                        <div className="text-2xl font-semibold text-gray-900">
                          {(() => {
                            const chartData = getChartData(selectedMetric.data);
                            const avg = chartData.length > 0 
                              ? (chartData.reduce((sum, d) => sum + d.count, 0) / chartData.length).toFixed(1)
                              : '0';
                            return avg;
                          })()}
                        </div>
                      </div>
                    </div> */}
                  </div>

                  {/* Table Section */}
                  {Object.keys(selectedMetric.data)
                    .sort((a, b) => b.localeCompare(a)) // Sort months in descending order (recent first)
                    .map(monthKey => {
                      const monthData = selectedMetric.data[monthKey];
                      return (
                        <div key={monthKey} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Month Header */}
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-900">{monthData.monthLabel}</h3>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                  {selectedMetric.type === 'totalPOs' 
                                    ? `${getTotalPOsInMonth(monthData)} Unique POs`
                                    : `${monthData.items.length} Records`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* PO Details Table */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    PO Number
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendor
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item Description
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expected Delivery
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actual Delivery
                                  </th>
                                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                  </th> */}
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Performance
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {monthData.items.map((item, index) => {
                                  const performanceDays = calculateDeliveryPerformance(item);
                                  return (
                                    <tr key={`${monthKey}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="flex items-center">
                                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                                          {item["PO Number"] || `PO-${index + 1}`}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                                          {item["Vendor"] || 'N/A'}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                        <div className="truncate" title={item["Item Description"]}>
                                          {item["Item Description"] || 'N/A'}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(item["Expected Delivery Date"])}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(item["Actual Delivery Date"])}
                                      </td>
                                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {getStatusBadge(item["PO Status"])}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {formatCurrency(item["PO Amount"] || item["Amount"])}
                                      </td> */}
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {performanceDays !== null ? (
                                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            performanceDays <= 0 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {performanceDays === 0 
                                              ? 'On Time' 
                                              : performanceDays < 0 
                                                ? `${Math.abs(performanceDays)} days early`
                                                : `${performanceDays} days late`
                                            }
                                          </span>
                                        ) : 'N/A'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No purchase orders found for the selected criteria.</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters to see more data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default POStatusCards;