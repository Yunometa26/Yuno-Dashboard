import { useState } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";

const FilterSection = ({
  customers,
  financialYears,
  selectedCustomers,
  selectedFinancialYear,
  handleCustomerToggle,
  handleFinancialYearSelect
}) => {
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isFinancialYearOpen, setIsFinancialYearOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Customer Dropdown */}
      <div className="relative w-full max-w-md">
        <div className="w-full">
          <div
            className="border border-gray-300 rounded-lg p-3 flex justify-between items-center cursor-pointer bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-md"
            onClick={() => setIsCustomerOpen(!isCustomerOpen)}
          >
            <div className="flex flex-wrap gap-1">
              {selectedCustomers.length === 0 ? (
                <span className="text-gray-700">Select customers...</span>
              ) : (
                selectedCustomers.map((customer) => (
                  <span
                    key={customer}
                    className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded transition-all duration-300"
                  >
                    {customer}
                  </span>
                ))
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 text-gray-500 transition-transform duration-300" style={{ transform: isCustomerOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </div>
          
          {isCustomerOpen && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto animate-slideDown">
              <div className="p-2">
                {/* "All Customers" option */}
                <div
                  className="flex items-center space-x-2 p-2 hover:bg-blue-50 rounded cursor-pointer transition-colors duration-200"
                  onClick={() => {
                    handleCustomerToggle("All Customers");
                    setIsCustomerOpen(false);
                  }}
                >
                  <div className={`h-4 w-4 border rounded flex items-center justify-center transition-all duration-300 ${
                    selectedCustomers.includes("All Customers") ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  }`}>
                    {selectedCustomers.includes("All Customers") && (
                      <Check className="h-3 w-3 text-white animate-scaleIn" />
                    )}
                  </div>
                  <span className="text-black">All Customers</span>
                </div>
                
                {/* Individual customer options */}
                {customers.filter(c => c !== "All Customers").map((customer, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 hover:bg-blue-50 rounded cursor-pointer transition-colors duration-200"
                    onClick={() => { 
                      handleCustomerToggle(customer);
                      setIsCustomerOpen(false);
                    }}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`h-4 w-4 border rounded flex items-center justify-center transition-all duration-300 ${
                      selectedCustomers.includes(customer) ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}>
                      {selectedCustomers.includes(customer) && (
                        <Check className="h-3 w-3 text-white animate-scaleIn" />
                      )}
                    </div>
                    <span className="text-black">{customer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Financial Year Dropdown */}
      <div className="relative w-full max-w-md">
        <div className="w-full">
          <div
            className="border border-gray-300 rounded-lg p-3 flex justify-between items-center cursor-pointer bg-white transition-all duration-300 hover:border-blue-400 hover:shadow-md"
            onClick={() => setIsFinancialYearOpen(!isFinancialYearOpen)}
          >
            <div className="flex flex-wrap gap-1">
              {!selectedFinancialYear ? (
                <span className="text-black">Select financial year...</span>
              ) : (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded transition-all duration-300">
                  {selectedFinancialYear}
                </span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 text-gray-500 transition-transform duration-300" style={{ transform: isFinancialYearOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </div>
          
          {isFinancialYearOpen && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto animate-slideDown">
              <div className="p-2">
                {/* Financial Year options */}
                {financialYears.map((fy, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 hover:bg-blue-50 rounded cursor-pointer transition-colors duration-200"
                    onClick={() => {
                      handleFinancialYearSelect(fy);
                      setIsFinancialYearOpen(false);
                    }}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`h-4 w-4 border rounded flex items-center justify-center transition-all duration-300 ${
                      selectedFinancialYear === fy ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}>
                      {selectedFinancialYear === fy && (
                        <Check className="h-3 w-3 text-white animate-scaleIn" />
                      )}
                    </div>
                    <span className="text-black">{fy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;