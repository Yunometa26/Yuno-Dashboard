const MetricCards = ({ data }) => {
  const avgOEE = (data.reduce((acc, d) => acc + parseFloat(d["Average OEE (%)"] || 0), 0) / (data.length || 1)).toFixed(2);
  const totalPlannedCapacity = data.reduce((acc, d) => acc + parseFloat(d["Planned Capacity (hrs)"] || 0), 0).toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
        <h2 className="text-sm font-medium text-black mb-1">Average OEE</h2>
        <p className="text-2xl font-semibold text-indigo-600">{avgOEE}</p>
      </div>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
        <h2 className="text-sm font-medium text-black mb-1">Total Capacity in hrs</h2>
        <p className="text-2xl font-semibold text-indigo-600">{totalPlannedCapacity}</p>
      </div>
    </div>
  );
};

export default MetricCards;