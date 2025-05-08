import React from "react";

const FulfillmentCards = ({ aggregatedData, colors }) => {
  const totalOrders = aggregatedData.length;
  const totalRequired = aggregatedData.reduce((sum, item) => sum + item.required, 0);
  const totalFulfilled = aggregatedData.reduce((sum, item) => sum + item.fulfilled, 0);

  // Map color names to Tailwind classes
  const getColorClasses = () => {
    switch(colors.border) {
      case 'red-600':
        return {
          gradient: "bg-gradient-to-br from-red-50 to-red-100",
          accent: "bg-red-500",
          border: "bg-red-600"
        };
      case 'green-600':
        return {
          gradient: "bg-gradient-to-br from-green-50 to-green-100",
          accent: "bg-green-500",
          border: "bg-green-600"
        };
      case 'blue-600':
      default:
        return {
          gradient: "bg-gradient-to-br from-blue-50 to-blue-100",
          accent: "bg-blue-500",
          border: "bg-blue-600"
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Orders Card */}
      <div className={`${colorClasses.gradient} shadow-lg rounded-lg overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`h-12 w-12 rounded-full ${colorClasses.accent} flex items-center justify-center shadow-md`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Total Orders
                </h3>
                <p className="text-sm text-slate-500">In selected range</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-slate-800">
                {totalOrders}
              </p>
            </div>
          </div>
        </div>
        <div className={`${colorClasses.border} h-1`}></div>
      </div>

      {/* Required Quantity Card */}
      <div className={`${colorClasses.gradient} shadow-lg rounded-lg overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`h-12 w-12 rounded-full ${colorClasses.accent} flex items-center justify-center shadow-md`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Required Quantity
                </h3>
                <p className="text-sm text-slate-500">Total units</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-slate-800">
                {totalRequired.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className={`${colorClasses.border} h-1`}></div>
      </div>

      {/* Fulfilled Quantity Card */}
      <div className={`${colorClasses.gradient} shadow-lg rounded-lg overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`h-12 w-12 rounded-full ${colorClasses.accent} flex items-center justify-center shadow-md`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Fulfilled Quantity
                </h3>
                <p className="text-sm text-slate-500">Total units</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-slate-800">
                {totalFulfilled.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className={`${colorClasses.border} h-1`}></div>
      </div>
    </div>
  );
};

export default FulfillmentCards;