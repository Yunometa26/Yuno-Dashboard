const MachinesTable = ({ data, filters }) => {
  // Extract unique machine names based on the filtered data
  const getUniqueMachines = () => {
    if (!data || data.length === 0) return [];

    // Get unique machine names from the already filtered data
    const uniqueMachines = [...new Set(data.map(item => item["Machine"]))];
    return uniqueMachines.sort(); // Sort alphabetically
  };

  const uniqueMachines = getUniqueMachines();

  return (
    <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Machines</h3>
        <span className="text-sm text-black bg-slate-100 px-2 py-1 rounded-md">{uniqueMachines.length} unique machines found</span>
      </div>
      
      <div className="flex-grow overflow-auto">
        {uniqueMachines.length > 0 ? (
          <table className="min-w-full">
            <thead className="sticky top-0">
              <tr>
                <th className="px-4 py-2 bg-[#5A97E0] text-left text-white border-b border-slate-200 font-medium">Machine Name</th>
              </tr>
            </thead>
            <tbody>
              {uniqueMachines.map((machine, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-[#084A78]" : "bg-[#5A97E0]"}>
                  <td className="px-4 py-2 border-b  text-white">{machine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6 text-slate-500 bg-white rounded-md border border-slate-200 h-full flex items-center justify-center">No machines found with the selected filters</div>
        )}
      </div>
    </div>
  );
};

export default MachinesTable;