import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, Download, RefreshCcw, Filter } from 'lucide-react';

const ForecastChart = ({ 
  isLoading,
  yearlyData = [],
  quarterlyData = [],
  monthlyData = [],
  selectedMonth = 'All',
  selectedYear = 'All'
}) => {
  const [chartView, setChartView] = useState('yearly');

  useEffect(() => {
    if (selectedMonth !== 'All') {
      setChartView('yearly');
    }
  }, [selectedMonth]);

  const getChartData = () => {
    let filteredData;
    switch(chartView) {
      case 'yearly':
        filteredData = monthlyData && monthlyData.length > 0 ? monthlyData : yearlyData;
        if (selectedYear !== 'All') {
          filteredData = filteredData.filter(item => item.Year === selectedYear.toString());
        }
        if (selectedMonth !== 'All') {
          const shortMonthName = Object.entries({
            'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 
            'April': 'Apr', 'May': 'May', 'June': 'Jun',
            'July': 'Jul', 'August': 'Aug', 'September': 'Sep', 
            'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
          }).find(([long]) => long === selectedMonth)?.[1];
          if (shortMonthName) {
            filteredData = filteredData.filter(item => item.Month === shortMonthName);
          }
        }
        break;
      case 'quarterly':
        filteredData = quarterlyData;
        if (selectedYear !== 'All') {
          filteredData = filteredData.filter(item => {
            if (!item.YearQuarter) return false;
            return item.YearQuarter.startsWith(selectedYear);
          });
        }
        break;
      default:
        filteredData = yearlyData;
        if (selectedYear !== 'All') {
          filteredData = filteredData.filter(item => item.Year === selectedYear.toString());
        }
        break;
    }
    return filteredData;
  };

  const chartData = getChartData();
  const showForecastLine = chartData.some(item => item.Forecast && item.Forecast > 0);

  const processedChartData = () => {
    if (!showForecastLine) return chartData;
    const transitionIndex = chartData.findIndex((item, index, array) => {
      const nextItem = index < array.length - 1 ? array[index + 1] : null;
      return (
        item.Fitted > 0 && 
        nextItem &&
        nextItem.Forecast > 0 &&
        nextItem.Fitted === 0 &&
        nextItem.Actual === 0
      );
    });
    if (transitionIndex < 0) return chartData;
    const newData = [...chartData];
    if (transitionIndex >= 0 && transitionIndex < newData.length - 1) {
      if (newData[transitionIndex + 1].Forecast > 0) {
        newData[transitionIndex].isConnectionPoint = true;
        newData[transitionIndex].Forecast = newData[transitionIndex].Fitted;
      }
    }
    return newData;
  };

  const finalChartData = processedChartData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let displayLabel = label;
      if (payload[0]?.payload?.YearMonth) {
        displayLabel = payload[0].payload.YearMonth;
      }
      const isConnectionPoint = payload[0]?.payload?.isConnectionPoint;
      let displayPayload = payload;
      if (isConnectionPoint) {
        displayPayload = payload.filter(entry => 
          entry.dataKey !== 'Forecast' && entry.name !== 'Forecast'
        );
      }
      return (
        <div className="bg-white p-3 border border-blue-100 shadow-md rounded-md text-gray-800">
          <p className="font-medium text-gray-800">{displayLabel}</p>
          {displayPayload.map((entry, index) => (
            entry.value !== null && entry.value !== undefined && 
            <p key={index} className="flex justify-between text-sm py-1">
              <span style={{ color: entry.color }} className="font-medium">{entry.name}: </span>
              <span className="ml-4">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getChartTitle = () => {
    let title = "Fitted vs Actual";
    if (showForecastLine) {
      title = "Fitted vs Actual with Forecast";
    }
    if (selectedYear !== 'All' && selectedMonth !== 'All') {
      title += ` • ${selectedMonth} ${selectedYear}`;
    } else if (selectedMonth !== 'All') {
      title += ` • ${selectedMonth}`;
    } else if (selectedYear !== 'All') {
      title += ` • ${selectedYear}`;
    }
    return title;
  };

  const isFilterActive = selectedMonth !== 'All' || selectedYear !== 'All';

  return (
    <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-xl shadow-md p-6 border border-blue-200 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="font-medium text-lg text-white">{getChartTitle()}</h3>
          {isFilterActive && (
            <p className="text-sm text-blue-100 mt-1 flex items-center">
              <Filter className="w-3 h-3 mr-1" />
              Filtered view
            </p>
          )}
        </div>
        <div className="flex flex-wrap mt-4 sm:mt-0 gap-2">
          <div className="bg-white/20 rounded-lg p-1 flex text-sm">
            <button 
              onClick={() => setChartView('yearly')}
              className={`px-3 py-1 rounded-md transition-all ${chartView === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/10'}`}
              disabled={selectedMonth !== 'All'}>
              Yearly
            </button>
            <button 
              onClick={() => setChartView('quarterly')}
              className={`px-3 py-1 rounded-md transition-all ${chartView === 'quarterly' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/10'}`}
              disabled={selectedMonth !== 'All'}>
              Quarterly
            </button>
          </div>
        </div>
      </div>

      <div className="h-96">
        {isLoading ? (
          <div className="w-full h-full bg-white/10 animate-pulse rounded-lg flex items-center justify-center">
            <p className="text-white/70">Loading chart data...</p>
          </div>
        ) : finalChartData.length === 0 ? (
          <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center">
            <p className="text-white/70">No data available for the selected filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalChartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis dataKey={chartView === 'yearly' ? 'YearMonth' : (chartView === 'quarterly' ? 'YearQuarter' : 'Year')} tick={{ fontSize: 12, fill: 'white' }} angle={chartView === 'quarterly' ? -45 : 0} textAnchor={chartView === 'quarterly' ? 'end' : 'middle'} height={60} />
              <YAxis tick={{ fontSize: 12, fill: 'white' }} stroke="white" tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
              iconType="square"
              iconSize={12}
              wrapperStyle={{ paddingTop: 10 }} wrapperStyle={{ paddingTop: 10 }} formatter={(value) => <span className="text-white">{value}</span>} />
              <Line type="monotone" dataKey={(d) => d.Fitted > 0 ? d.Fitted : null} stroke="#FB923C" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: "#FB923C" }} name="Fitted" />
              <Line type="monotone" dataKey={(d) => d.Actual > 0 ? d.Actual : null} stroke="#7C3AED" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: "#7C3AED" }} name="Actual" />
              {showForecastLine && <Line type="monotone" dataKey={(d) => d.Forecast > 0 ? d.Forecast : null} stroke="#22C55E" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls={true} activeDot={{ r: 6, fill: "#22C55E" }} name="Forecast" />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {isFilterActive && (
        <div className="mt-4 p-3 bg-white/20 rounded-lg text-sm text-white">
          <p className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Showing filtered data for: 
            <strong className="ml-2">
              {selectedMonth === 'All' ? 'All Months' : selectedMonth}
              {selectedMonth !== 'All' && selectedYear !== 'All' ? ', ' : ' '}
              {selectedYear === 'All' ? 'All Years' : selectedYear}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;

