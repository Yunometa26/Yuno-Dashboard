import React from 'react';
import { X } from 'lucide-react';

const POStatusDetailTable = ({ isOpen, onClose, data, selectedStatus }) => {
  if (!isOpen) return null;

  // Filter data by selected status
  const filteredData = data.filter(item => item["PO Status"] === selectedStatus);

  return (
    <div className="fixed inset-0 bg-slate-700/40 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-lg shadow-2xl border border-blue-200 p-6 w-full max-w-6xl max-h-screen overflow-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {selectedStatus} Purchase Orders
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-[#5C99E3] rounded-full p-2 text-white hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto flex-grow">
          {filteredData.length > 0 ? (
            <table className="w-full table-auto border-collapse text-sm shadow-sm">
              <thead>
                <tr className="bg-slate-100 text-black">
                  <th className="border border-black p-3 text-left font-semibold">
                    PO Number
                  </th>
                  <th className="border border-black p-3 text-left font-semibold">
                    Expected Delivery Date
                  </th>
                  <th className="border border-black p-3 text-left font-semibold">
                    Vendor Name
                  </th>
                  <th className="border border-black p-3 text-left font-semibold">
                    Raw Material
                  </th>
                  <th className="border border-black p-3 text-left font-semibold">
                    Daily Consumption
                  </th>
                  <th className="border border-black p-3 text-left font-semibold">
                    PO Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200">
                    <td className="p-3 text-white">
                      {item["PO Number"] || "-"}
                    </td>
                    <td className="p-3 text-white">
                      {item["Expected Delivery Date"] ? new Date(item["Expected Delivery Date"]).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3 text-white">
                      {item["Vendor Name"] || "-"}
                    </td>
                    <td className="p-3 text-white">
                      {item["Raw Material"] || "-"}
                    </td>
                    <td className="p-3 text-white">
                      {item["Daily Consumption"] || "-"}
                    </td>
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

        {/* Footer with count */}
        <div className="p-4 mt-4 text-sm text-white border-t border-blue-300">
          Showing {filteredData.length} {selectedStatus} purchase {filteredData.length === 1 ? "order" : "orders"}
        </div>
      </div>
    </div>
  );
};

export default POStatusDetailTable;