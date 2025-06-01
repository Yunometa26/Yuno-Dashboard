import React from 'react';
import { X } from 'lucide-react';

const POStatusDetailTable = ({ isOpen, onClose, data, selectedStatus }) => {
  if (!isOpen) return null;

  // Filter data by selected status
  const filteredData = data.filter(item => item["PO Status"] === selectedStatus);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-slate-700/40 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-lg shadow-2xl border border-blue-200 p-6 w-full max-w-7xl max-h-screen overflow-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {selectedStatus} Purchase Orders ({filteredData.length})
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-[#5C99E3] rounded-full p-2 text-white hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto flex-grow">
          {filteredData.length > 0 ? (
            <table className="w-full table-auto border-collapse text-sm shadow-sm">
              <thead>
                <tr className="bg-slate-100 text-black">
                  <th className="border border-black p-3 text-left font-semibold">PO Number</th>
                  <th className="border border-black p-3 text-left font-semibold">PO Date</th>
                  <th className="border border-black p-3 text-left font-semibold">Vendor</th>
                  <th className="border border-black p-3 text-left font-semibold">Item Description</th>
                  <th className="border border-black p-3 text-left font-semibold">Quantity</th>
                  {/* <th className="border border-black p-3 text-left font-semibold">Total Cost</th>
                  <th className="border border-black p-3 text-left font-semibold">Expected Delivery</th>
                  <th className="border border-black p-3 text-left font-semibold">Actual Delivery</th>
                  <th className="border border-black p-3 text-left font-semibold">Delay (Days)</th> */}
                  <th className="border border-black p-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200 hover:bg-blue-50/10">
                    <td className="p-3 text-white font-medium">
                      {item["PO Number"] || "-"}
                    </td>
                    <td className="p-3 text-white">
                      {formatDate(item["PO Date"])}
                    </td>
                    <td className="p-3 text-white">
                      {item["Vendor"] || "-"}
                    </td>
                    <td className="p-3 text-white">
                      {item["Item Description"] || "-"}
                    </td>
                    <td className="p-3 text-white">
                      {item["Quantity Ordered"] ? `${item["Quantity Ordered"]} ${item["Unit"] || ''}` : "-"}
                    </td>
                    {/* <td className="p-3 text-white">
                      {formatCurrency(item["Total Cost"])}
                    </td>
                    <td className="p-3 text-white">
                      {formatDate(item["Expected Delivery Date"])}
                    </td>
                    <td className="p-3 text-white">
                      {formatDate(item["Actual Delivery Date"])}
                    </td>
                    <td className="p-3 text-white">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item["Delivery Delay (Days)"] > 0 
                          ? "bg-red-100 text-red-800" 
                          : item["Delivery Delay (Days)"] < 0
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {item["Delivery Delay (Days)"] || 0}
                      </span>
                    </td> */}
                    <td className="p-3 text-white">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item["PO Status"] === "Open"
                            ? "bg-blue-100 text-blue-800"
                            : item["PO Status"] === "Closed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item["PO Status"]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
              <p>No {selectedStatus} purchase orders found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POStatusDetailTable;