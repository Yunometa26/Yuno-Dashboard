'use client';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const OEEStats = () => {
  const [rawData, setRawData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    Papa.parse('/OEE.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setError("Failed to load data. Please try again later.");
        setIsLoading(false);
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn("CSV parsing had warnings:", results.errors);
        }
        
        // Process data and standardize date format
        const processedData = results.data
          .filter(d => d.Dates && typeof d.Dates === 'string' && d.Dates.includes('-'))
          .map(item => {
            // Parse date (assuming DD-MM-YYYY format)
            const dateParts = item.Dates.split('-');
            if (dateParts.length === 3) {
              const day = parseInt(dateParts[0], 10);
              const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
              const year = parseInt(dateParts[2], 10);
              
              // Create formatted date string for display and a date object for sorting
              const dateObj = new Date(year, month, day);
              const formattedDate = `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
              
              return {
                ...item,
                Dates: formattedDate, // Update display format
                originalDate: item.Dates, // Keep original for reference
                dateObj: dateObj, // For sorting
                dateSortKey: `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, // YYYY-MM-DD for sorting
                dayKey: `${day.toString().padStart(2, '0')}-${(month + 1).toString().padStart(2, '0')}-${year}` // Day-Month-Year key for aggregation
              };
            }
            return item;
          });
        
        setRawData(processedData);
        
        // Immediately perform initial aggregation
        const aggregated = aggregateDataByDay(processedData);
        setAggregatedData(aggregated);
        setFilteredData(aggregated);
        
        setIsLoading(false);
      },
    });
  }, []);

  // Function to aggregate data by day
  const aggregateDataByDay = (data) => {
    // Group data by date
    const groupedByDay = {};
    
    data.forEach(item => {
      if (!item.dayKey) return;
      
      if (!groupedByDay[item.dayKey]) {
        groupedByDay[item.dayKey] = {
          items: [],
          dateSortKey: item.dateSortKey,
          dateObj: item.dateObj,
          Dates: item.Dates,
          Device: 'All', // Will be overwritten if filtering by device
        };
      }
      
      groupedByDay[item.dayKey].items.push(item);
    });
    
    // Calculate averages for each day
    const aggregatedData = Object.keys(groupedByDay).map(dayKey => {
      const dayData = groupedByDay[dayKey];
      const items = dayData.items;
      
      // Calculate averages for OEE metrics
      const calculateAvg = (key) => {
        const validItems = items.filter(item => !isNaN(parseFloat(item[key])));
        if (validItems.length === 0) return 0;
        const sum = validItems.reduce((acc, curr) => acc + parseFloat(curr[key]), 0);
        return parseFloat((sum / validItems.length).toFixed(2));
      };
      
      return {
        dayKey,
        Dates: dayData.Dates,
        dateSortKey: dayData.dateSortKey,
        dateObj: dayData.dateObj,
        Device: dayData.Device,
        OEE: calculateAvg('OEE'),
        Availability: calculateAvg('Availability'),
        Performance: calculateAvg('Performance'),
        Quality: calculateAvg('Quality'),
        Count: items.length // Number of records for this day
      };
    });
    
    // Sort aggregated data by date
    aggregatedData.sort((a, b) => a.dateSortKey.localeCompare(b.dateSortKey));
    
    return aggregatedData;
  };

  useEffect(() => {
    // Filter data based on selected machine and month
    let dataToProcess = [...rawData];
    
    // Apply machine filter at raw data level if needed
    if (selectedMachine !== 'All') {
      dataToProcess = dataToProcess.filter(row => row.Device === selectedMachine);
    }
    
    // Aggregate the filtered data by day
    let aggregated = aggregateDataByDay(dataToProcess);
    
    // Handle device name for filtered data
    if (selectedMachine !== 'All') {
      aggregated = aggregated.map(item => ({
        ...item,
        Device: selectedMachine
      }));
    }
    
    // Apply month filter after aggregation
    if (selectedMonth !== 'All') {
      aggregated = aggregated.filter(row => {
        if (!row.dateObj) return false;
        const month = row.dateObj.getMonth() + 1; // getMonth() is 0-indexed
        return month === parseInt(selectedMonth, 10);
      });
    }
    
    setFilteredData(aggregated);
  }, [rawData, selectedMachine, selectedMonth]);

  const average = (key) => {
    const valid = filteredData.filter(d => !isNaN(parseFloat(d[key])));
    const sum = valid.reduce((acc, curr) => acc + parseFloat(curr[key]), 0);
    return valid.length > 0 ? (sum / valid.length).toFixed(2) : '0.00';
  };

  const machines = [...new Set(rawData.map(d => d.Device))];
  
  // Get unique months from the data
  const months = [
    ...new Set(
      rawData
        .filter(d => d.dateObj)
        .map(d => d.dateObj.getMonth() + 1)
    ),
  ];

  // Map month numbers to names
  const monthNames = {
    1: 'January', 2: 'February', 3: 'March', 4: 'April',
    5: 'May', 6: 'June', 7: 'July', 8: 'August',
    9: 'September', 10: 'October', 11: 'November', 12: 'December'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gradient-to-br from-[#024673] to-[#5C99E3]">
        <div className="text-white text-xl font-medium">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 bg-gradient-to-br from-[#024673] to-[#5C99E3]">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg shadow-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen text-white">
      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-medium mb-4">Data Filters</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Machine</label>
            <select 
              className="w-full p-3 bg-white border border-blue-400/30 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedMachine(e.target.value)}
              value={selectedMachine}
            >
              <option value="All">All Machines</option>
              {machines.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Month</label>
            <select 
              className="w-full p-3 bg-white border border-blue-400/30 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedMonth(e.target.value)}
              value={selectedMonth}
            >
              <option value="All">All Months</option>
              {months.sort((a, b) => a - b).map((m) => (
                <option key={m} value={m}>
                  {monthNames[m] || m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg transition-all duration-300 hover:bg-white/20">
          <div className="text-3xl font-bold">{average('OEE')}%</div>
          <div className="text-sm text-white mt-2">Average OEE</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg transition-all duration-300 hover:bg-white/20">
          <div className="text-3xl font-bold">{average('Availability')}%</div>
          <div className="text-sm text-white mt-2">Availability</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg transition-all duration-300 hover:bg-white/20">
          <div className="text-3xl font-bold">{average('Performance')}%</div>
          <div className="text-sm text-white mt-2">Performance</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg transition-all duration-300 hover:bg-white/20">
          <div className="text-3xl font-bold">{average('Quality')}%</div>
          <div className="text-sm text-white mt-2">Quality</div>
        </div>
      </div>

      {/* Chart with Horizontal Scrollbar */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-medium mb-6">Daily OEE Components Average</h3>
        <div className="overflow-x-auto pb-4" style={{ maxWidth: '100%' }}>
          <div style={{ height: '400px', width: `${Math.max(1000, filteredData.length * 80)}px`, minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={filteredData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis 
                  dataKey="Dates" 
                  tick={{ fill: 'white' }} 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                />
                <YAxis 
                  tick={{ fill: 'white' }} 
                  domain={[0, 100]}
                  allowDataOverflow={true}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(2, 70, 115, 0.9)', 
                    border: '1px solid #5C99E3',
                    borderRadius: '8px',
                    color: 'white' 
                  }}
                  formatter={(value, name, props) => [`${value}%`, name]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend wrapperStyle={{ color: 'white' }} />
                <Bar dataKey="OEE" fill="#8884d8" name="OEE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Availability" fill="#82ca9d" name="Availability" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Performance" fill="#ffc658" name="Performance" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Quality" fill="#ff6f91" name="Quality" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OEEStats;