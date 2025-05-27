import { IndianRupee, Calendar, Clock } from "lucide-react";

// Part 1: Primary Stats Card showing total sales
const SalesStatsCard = ({
  totalSales,
  activeProduct,
  selectedFinancialYear,
  selectedCustomers,
  animateCharts
}) => {
  return (
    <div className={`bg-gradient-to-br from-[#024673] to-[#5C99E3] border border-blue-200 rounded-lg shadow-sm p-6 mb-6 transition-all duration-500 ease-in-out transform ${animateCharts ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="flex items-center">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <IndianRupee className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Total Sales {activeProduct ? `(${activeProduct})` : ''} - {selectedFinancialYear}
          </h3>
          <p className="text-3xl font-bold text-white mt-1">
            ₹{totalSales.toLocaleString()}
          </p>
          <p className="text-sm text-white mt-1">
            {selectedCustomers.includes("All Customers") 
              ? "All Customers" 
              : selectedCustomers.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
};

// Part 2: Months with Sales Activity Card
/* const MonthsActivityCard = ({
  monthsWithSales,
  totalMonths,
  selectedFinancialYear,
  activeProduct,
  animateCharts
}) => {
  return (
    <div className={`bg-gradient-to-br from-[#024673] to-[#5C99E3] border border-blue-200 rounded-lg shadow-sm p-6 mb-6 transition-all duration-500 ease-in-out transform ${animateCharts ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="flex items-center">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Months with Sales Activity {activeProduct ? `(${activeProduct})` : ''} - {selectedFinancialYear}
          </h3>
          <p className="text-3xl font-bold text-white mt-1">
            {monthsWithSales} / {totalMonths}
          </p>
          <p className="text-sm text-white mt-1">
            {Math.round((monthsWithSales/totalMonths) * 100)}% of months with recorded sales
          </p>
        </div>
      </div>
    </div>
  );
}; */

// Combined Stats Card component that includes both cards
const StatsCard = ({
  totalSales,
  activeProduct,
  selectedFinancialYear,
  selectedCustomers,
  monthlyData,
  animateCharts
}) => {
  // Calculate months with sales activity - only count months with sales > 0
  /* const monthsWithSales = monthlyData 
    ? monthlyData.filter(month => month.sales > 0).length 
    : 0;
    
  // Total possible months is 12 for a financial year
  const totalMonths = selectedFinancialYear === "All Years" ? 
    12 * (new Set(monthlyData?.map(item => item.fiscalYear)).size || 1) : 12; */

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <SalesStatsCard 
        totalSales={totalSales}
        activeProduct={activeProduct}
        selectedFinancialYear={selectedFinancialYear}
        selectedCustomers={selectedCustomers}
        animateCharts={animateCharts}
      />
      {/* <MonthsActivityCard 
        monthsWithSales={monthsWithSales}
        totalMonths={totalMonths}
        selectedFinancialYear={selectedFinancialYear}
        activeProduct={activeProduct}
        animateCharts={animateCharts}
      /> */}
    </div>
  );
};

export default StatsCard;
export { SalesStatsCard }; // Removed MonthsActivityCard from exports
// export { SalesStatsCard, MonthsActivityCard };