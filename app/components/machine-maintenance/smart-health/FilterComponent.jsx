const FilterComponent = ({
  orderDates,
  bucketings,
  selectedStartDate,
  selectedEndDate,
  selectedBucketing,
  onStartDateChange,
  onEndDateChange,
  onBucketingChange
}) => {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-6 bg-gradient-to-r from-[#024673] to-[#5C99E3]">
      <h2 className="text-lg font-medium mb-4 text-white">Filters</h2>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <label className="text-sm font-medium text-white">Date Range:</label>
          <div className="flex gap-2 items-center">
            <select
              className="border border-slate-300 rounded-md p-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            >
              <option value="">Start Date</option>
              {orderDates.map(date => (
                <option key={`start-${date}`} value={date}>{date}</option>
              ))}
            </select>
            
            <span className="text-white">to</span>
            
            <select
              className="border border-slate-300 rounded-md p-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            >
              <option value="">End Date</option>
              {orderDates.map(date => (
                <option key={`end-${date}`} value={date}>{date}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white">Bucketing:</label>
          <select
            className="border border-slate-300 rounded-md p-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedBucketing}
            onChange={(e) => onBucketingChange(e.target.value)}
          >
            <option value="">All Bucketings</option>
            {bucketings.map(bucket => (
              <option key={bucket} value={bucket}>{bucket}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterComponent;