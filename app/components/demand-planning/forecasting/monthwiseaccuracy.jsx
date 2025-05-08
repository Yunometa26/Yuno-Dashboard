'use client';

import { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, ArrowRight, BarChart } from 'lucide-react';

export default function MonthWiseAccuracy({
  data = [],
  selectedProduct = 'All',
  selectedSKU = 'All',
  selectedDepot = 'All',
  selectedMonth = 'All',
  selectedYear = 'All',
  loading = false
}) {
  const [accuracyData, setAccuracyData] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [hasData, setHasData] = useState(false);
  const [years, setYears] = useState([]);
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(0);
  const [visibleMonthCount, setVisibleMonthCount] = useState(4); // Number of months to display at once

  // Helper function to get month name from date string
  const getMonthName = (dateString) => {
    if (!dateString) return '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const monthIndex = parseInt(parts[0]) - 1; // Adjust for 0-based index
    return months[monthIndex];
  };

  // Helper function to extract year from date string
  const getYear = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    return parts[2];
  };

  // Helper function to extract month number from date string
  const getMonthNumber = (dateString) => {
    if (!dateString) return 0;
    const parts = dateString.split('-');
    if (parts.length !== 3) return 0;
    return parseInt(parts[0]);
  };

  // Adjust visible months count based on window size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleMonthCount(1);
      } else if (width < 768) {
        setVisibleMonthCount(2); 
      } else if (width < 1024) {
        setVisibleMonthCount(3);
      } else {
        setVisibleMonthCount(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Process data when selection or year changes
  useEffect(() => {
    if (!data.length) return;
    
    // Filter data based on selections
    let filteredData = [...data];
    
    if (selectedProduct && selectedProduct !== 'All') {
      filteredData = filteredData.filter(item => item.product === selectedProduct);
    }
    
    if (selectedSKU && selectedSKU !== 'All') {
      filteredData = filteredData.filter(item => item.SKU === selectedSKU);
    }
    
    if (selectedDepot && selectedDepot !== 'All') {
      filteredData = filteredData.filter(item => item.Depot === selectedDepot);
    }
    
    if (selectedMonth && selectedMonth !== 'All') {
      // Convert month name to month number (1-based)
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = months.indexOf(selectedMonth) + 1;
      if (monthIndex > 0) {
        filteredData = filteredData.filter(item => {
          const itemMonthNum = getMonthNumber(item.Month);
          return itemMonthNum === monthIndex;
        });
      }
    }
    
    // Get all available years from the data
    const dataYears = [...new Set(filteredData
      .map(item => getYear(item.Month))
      .filter(year => year))]
      .sort();
    
    setYears(dataYears);
    
    // Only filter by year if a specific year is selected
    if (selectedYear !== 'All') {
      filteredData = filteredData.filter(item => {
        const itemYear = getYear(item.Month);
        return itemYear === selectedYear.toString();
      });
      
      // Set current year to selected year for the year navigation
      if (dataYears.includes(selectedYear.toString())) {
        setCurrentYear(parseInt(selectedYear));
      }
    } else if (dataYears.length > 0 && !dataYears.includes(currentYear.toString())) {
      // If showing all years but current year isn't in data, set to most recent year for navigation
      setCurrentYear(parseInt(dataYears[dataYears.length - 1]));
    }
    
    // For "All" years, we need to combine months across years
    const monthlyAccuracy = {};
    
    // Group data by month-year combination
    filteredData.forEach(item => {
      if (!item.Month || !item.Accuracy) return;
      
      const monthNumber = getMonthNumber(item.Month);
      const monthName = getMonthName(item.Month);
      const year = getYear(item.Month);
      
      // Create a unique key for month-year combination
      const key = selectedYear === 'All' 
        ? `${monthNumber}-${year}` 
        : monthNumber;
      
      if (!monthlyAccuracy[key]) {
        monthlyAccuracy[key] = {
          month: selectedYear === 'All' ? `${monthName} ${year}` : monthName,
          monthNumber,
          year,
          totalAccuracy: 0,
          count: 0,
          averageAccuracy: 0,
          sortKey: selectedYear === 'All' ? (year * 100 + monthNumber) : monthNumber
        };
      }
      
      // Parse accuracy - remove any % symbol if present
      const accuracy = parseFloat(item.Accuracy.toString().replace('%', '')) || 0;
      
      monthlyAccuracy[key].totalAccuracy += accuracy;
      monthlyAccuracy[key].count += 1;
      monthlyAccuracy[key].averageAccuracy = 
        (monthlyAccuracy[key].totalAccuracy / monthlyAccuracy[key].count).toFixed(1);
    });
    
    // Convert to array and sort by the sortKey
    const monthlyAccuracyArray = Object.values(monthlyAccuracy)
      .sort((a, b) => a.sortKey - b.sortKey);
    
    setAccuracyData(monthlyAccuracyArray);
    setHasData(monthlyAccuracyArray.length > 0);
    setVisibleMonthIndex(0); // Reset to first month when data changes
    
  }, [data, selectedProduct, selectedSKU, selectedDepot, selectedMonth, selectedYear, currentYear]);

  // Handle year navigation
  const handlePreviousYear = () => {
    const currentIndex = years.indexOf(currentYear.toString());
    if (currentIndex > 0) {
      setCurrentYear(parseInt(years[currentIndex - 1]));
    }
  };

  const handleNextYear = () => {
    const currentIndex = years.indexOf(currentYear.toString());
    if (currentIndex < years.length - 1) {
      setCurrentYear(parseInt(years[currentIndex + 1]));
    }
  };

  // Month navigation handlers
  const handlePreviousMonth = () => {
    if (visibleMonthIndex > 0) {
      setVisibleMonthIndex(visibleMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (visibleMonthIndex + visibleMonthCount < accuracyData.length) {
      setVisibleMonthIndex(visibleMonthIndex + 1);
    }
  };

  // Get color based on accuracy value
  const getAccuracyColor = (accuracy) => {
    const value = parseFloat(accuracy);
    if (value >= 90) return 'text-green-600 bg-green-100';
    if (value >= 80) return 'text-blue-600 bg-blue-100';
    if (value >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get visible months based on current index and count
  const visibleMonths = accuracyData.slice(visibleMonthIndex, visibleMonthIndex + visibleMonthCount);

  return (
    <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-xl shadow-md border border-blue-300/20 text-white mb-6 w-full overflow-hidden">
      <div className="p-4 border-b border-blue-300/20 flex justify-between items-center">
        <h3 className="text-sm font-medium text-white flex items-center">
          <BarChart className="w-4 h-4 mr-2 text-white" />
          Month-Wise Accuracy {selectedYear !== 'All' ? `(${selectedYear})` : '(All Years)'}
        </h3>
        
        {/* Year navigation controls - only show when a specific year is selected */}
        {selectedYear !== 'All' && years.length > 0 && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePreviousYear}
              disabled={years.indexOf(currentYear.toString()) === 0 || loading}
              className={`p-1 rounded-md ${years.indexOf(currentYear.toString()) === 0 ? 'text-blue-200/50' : 'text-white hover:bg-blue-600/30'}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center px-2 py-1 bg-white/20 rounded-md">
              <Calendar className="w-3 h-3 mr-1 text-white" />
              <span className="text-sm font-medium text-white">{currentYear}</span>
            </div>
            
            <button 
              onClick={handleNextYear}
              disabled={years.indexOf(currentYear.toString()) === years.length - 1 || loading}
              className={`p-1 rounded-md ${years.indexOf(currentYear.toString()) === years.length - 1 ? 'text-blue-200/50' : 'text-white hover:bg-blue-600/30'}`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-6 bg-white/20 rounded w-1/4 mx-auto"></div>
            <div className="h-32 bg-white/20 rounded"></div>
          </div>
        </div>
      ) : (
        <>
          {hasData ? (
            <div className="w-full">
              {/* Month navigation controls */}
              <div className="flex justify-between items-center px-4 py-2 bg-gradient-to-br from-[#024673] to-[#5C99E3] text-white">
                <button 
                  onClick={handlePreviousMonth}
                  disabled={visibleMonthIndex === 0 || loading}
                  className={`p-1 rounded-md ${visibleMonthIndex === 0 ? 'text-blue-200/50' : 'text-white hover:bg-blue-600/30'}`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs text-white/80">
                  Showing {visibleMonthIndex + 1}-{Math.min(visibleMonthIndex + visibleMonthCount, accuracyData.length)} of {accuracyData.length} months
                </span>
                
                <button 
                  onClick={handleNextMonth}
                  disabled={visibleMonthIndex + visibleMonthCount >= accuracyData.length || loading}
                  className={`p-1 rounded-md ${visibleMonthIndex + visibleMonthCount >= accuracyData.length ? 'text-blue-200/50' : 'text-white hover:bg-blue-600/30'}`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Table with only visible months */}
              <div className="inline-block min-w-full align-middle">
                <table className="table-fixed w-full">
                  <thead>
                    <tr className="bg-gradient-to-br from-[#024673] to-[#5C99E3]">
                      {visibleMonths.map((item, index) => (
                        <th key={index} className="py-3 px-4 text-left font-medium text-white border-r border-blue-300/20 last:border-r-0 whitespace-nowrap">
                          {item.month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {visibleMonths.map((item, index) => (
                        <td key={index} className="py-3 px-4 border-r border-blue-300/20 last:border-r-0 whitespace-nowrap">
                          <div className={`text-center p-2 rounded-lg font-medium ${getAccuracyColor(item.averageAccuracy)}`}>
                            {item.averageAccuracy}%
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-white/80">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-white/50" />
              <p>No accuracy data available {selectedYear !== 'All' ? `for ${selectedYear}` : ''}</p>
              <p className="text-sm mt-1 text-white/60">Try adjusting your filters or selecting a different time period</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}