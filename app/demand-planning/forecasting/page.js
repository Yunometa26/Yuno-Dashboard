'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import DropdownFilters from '@/app/components/demand-planning/forecasting/dropdownfiter';
import ForecastMetrics from '@/app/components/demand-planning/forecasting/forecastmetrics';
import ForecastChart from '@/app/components/demand-planning/forecasting/ForecastChart';
import MonthWiseAccuracy from '@/app/components/demand-planning/forecasting/monthwiseaccuracy';

export default function Home() {
  // Data states from trial.jsx
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [skus, setSkus] = useState([]);
  const [depots, setDepots] = useState([]);
  
  // Filter states
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedSKU, setSelectedSKU] = useState('All');
  const [selectedDepot, setSelectedDepot] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  
  // Analytics states
  const [totalFitted, setTotalFitted] = useState(0);
  const [lastFittedValue, setLastFittedValue] = useState(0);
  const [firstForecastValue, setFirstForecastValue] = useState(0); // New state for first forecast value
  const [hasFittedData, setHasFittedData] = useState(true); // New state to track if we have fitted data
  const [averageAccuracy, setAverageAccuracy] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [chartDataQuarterly, setChartDataQuarterly] = useState([]);
  const [chartDataMonthly, setChartDataMonthly] = useState([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  // Fetch CSV data on component mount
  useEffect(() => {
    fetch('/Anonymized_LightingWireFiana1.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            setData(result.data);
            const uniqueProducts = [...new Set(result.data.map(item => item.product))];
            setProducts(['All', ...uniqueProducts]);
            setLoading(false);
          }
        });
      })
      .catch(error => {
        console.error('Error fetching CSV:', error);
        setLoading(false);
      });
  }, []);

  // Update SKUs when product selection changes
  useEffect(() => {
    if (selectedProduct && selectedProduct !== 'All') {
      const filteredSKUs = [...new Set(data.filter(item => item.product === selectedProduct).map(item => item.SKU))];
      setSkus(['All', ...filteredSKUs]);
      setSelectedSKU('All');
    } else if (selectedProduct === 'All') {
      const allSkus = [...new Set(data.map(item => item.SKU))];
      setSkus(['All', ...allSkus]);
      setSelectedSKU('All');
    }
  }, [selectedProduct, data]);

  // Update depots when SKU selection changes
  useEffect(() => {
    if (selectedSKU && selectedSKU !== 'All') {
      const filteredDepots = [...new Set(data.filter(item => item.SKU === selectedSKU).map(item => item.Depot))];
      setDepots(['All', ...filteredDepots]);
      setSelectedDepot('All');
    } else if (selectedSKU === 'All') {
      const allDepots = [...new Set(data.map(item => item.Depot))];
      setDepots(['All', ...allDepots]);
      setSelectedDepot('All');
    }
  }, [selectedSKU, data]);

  // Helper function to get month name from date string
  const getMonthName = (dateString) => {
    if (!dateString) return '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const monthIndex = parseInt(parts[0]) - 1; // Adjust for 0-based index
    return months[monthIndex];
  };

  // Helper function to get short month name
  const getShortMonthName = (dateString) => {
    if (!dateString) return '';
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const monthIndex = parseInt(parts[0]) - 1; // Adjust for 0-based index
    return shortMonths[monthIndex];
  };

  // Helper function to extract year from date string
  const getYear = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    return parts[2];
  };

  // Process data when selection changes
  useEffect(() => {
    if (!data.length) return;
    
    setLoading(true);
    
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
    
    // Apply month filter
    if (selectedMonth && selectedMonth !== 'All') {
      filteredData = filteredData.filter(item => getMonthName(item.Month) === selectedMonth);
    }
    
    // Apply year filter
    if (selectedYear && selectedYear !== 'All') {
      filteredData = filteredData.filter(item => getYear(item.Month) === selectedYear.toString());
    }

    // Calculate total forecast and average accuracy
    const totalFittedValue = filteredData.reduce((sum, item) => sum + Number(item.Fitted || 0), 0);
    const totalAccuracyValue = filteredData.reduce((sum, item) => {
      const accuracy = parseFloat(item.Accuracy?.replace('%', '')) || 0;
      return sum + accuracy;
    }, 0);
    const avgAccuracyValue = filteredData.length > 0 ? (totalAccuracyValue / filteredData.length).toFixed(2) : 0;

    setTotalFitted(totalFittedValue);
    setAverageAccuracy(avgAccuracyValue);

    // Group data by year for yearly chart
    const yearlyData = filteredData.reduce((acc, item) => {
      if (!item.Month) return acc;
      
      const year = item.Month.split('-')[2]; // Extract year from date format "04-01-2021"
      if (!year) return acc;
      
      if (!acc[year]) {
        acc[year] = { Year: year, Fitted: 0, Actual: 0, Forecast: 0 }; // Added Forecast
      }
      acc[year].Fitted += Number(item.Fitted || 0);
      acc[year].Actual += Number(item.Actual || 0);
      acc[year].Forecast += Number(item.Forecast || 0); // Add Forecast data
      return acc;
    }, {});

    // Group data by quarter for quarterly chart
    const quarterlyData = filteredData.reduce((acc, item) => {
      if (!item.Month) return acc;
      
      const parts = item.Month.split('-');
      if (parts.length !== 3) return acc;
      
      const month = parseInt(parts[0]);
      const year = parts[2];
      
      // Determine quarter
      let quarter;
      if (month >= 1 && month <= 3) quarter = 'Q1';
      else if (month >= 4 && month <= 6) quarter = 'Q2';
      else if (month >= 7 && month <= 9) quarter = 'Q3';
      else quarter = 'Q4';
      
      const yearQuarter = `${year}-${quarter}`;
      
      if (!acc[yearQuarter]) {
        acc[yearQuarter] = { YearQuarter: yearQuarter, Fitted: 0, Actual: 0, Forecast: 0 }; // Added Forecast
      }
      
      acc[yearQuarter].Fitted += Number(item.Fitted || 0);
      acc[yearQuarter].Actual += Number(item.Actual || 0);
      acc[yearQuarter].Forecast += Number(item.Forecast || 0); // Add Forecast data
      
      return acc;
    }, {});
    
    // Group data by month for monthly chart
    const monthlyData = filteredData.reduce((acc, item) => {
      if (!item.Month) return acc;
      
      const parts = item.Month.split('-');
      if (parts.length !== 3) return acc;
      
      const monthNumber = parseInt(parts[0]);
      const year = parts[2];
      const shortMonth = getShortMonthName(item.Month);
      
      const yearMonth = `${shortMonth} ${year}`;
      
      if (!acc[yearMonth]) {
        acc[yearMonth] = { 
          YearMonth: yearMonth, 
          Year: year, 
          Month: shortMonth, 
          MonthIndex: monthNumber - 1, 
          Fitted: 0, 
          Actual: 0, 
          Forecast: 0, // Added Forecast field
          Variance: 0, 
          VariancePercent: 0 
        };
      }
      
      acc[yearMonth].Fitted += Number(item.Fitted || 0);
      acc[yearMonth].Actual += Number(item.Actual || 0);
      acc[yearMonth].Forecast += Number(item.Forecast || 0); // Add Forecast data
      
      return acc;
    }, {});
    
    // Calculate variance and variance percent for monthly data
    Object.values(monthlyData).forEach(item => {
      item.Variance = item.Actual - item.Fitted;
      item.VariancePercent = item.Fitted !== 0 ? 
        Math.round((item.Variance / item.Fitted) * 100) : 0;
    });

    // Convert objects to arrays and sort
    const formattedYearlyData = Object.values(yearlyData).sort((a, b) => a.Year.localeCompare(b.Year));
    const formattedQuarterlyData = Object.values(quarterlyData).sort((a, b) => a.YearQuarter.localeCompare(b.YearQuarter));
    const formattedMonthlyData = Object.values(monthlyData).sort((a, b) => {
      if (a.Year !== b.Year) return a.Year.localeCompare(b.Year);
      return a.MonthIndex - b.MonthIndex;
    });
    
    // Determine if we have any fitted data in our filtered set
    const hasFittedData = formattedMonthlyData.some(item => 
      item.Fitted > 0 && item.Fitted !== null && item.Fitted !== undefined
    );
    setHasFittedData(hasFittedData);

    let lastFitted = 0;
    let firstForecast = 0;

    if (hasFittedData) {
      // Get the last item where Fitted is not zero
      const nonZeroFittedItems = formattedMonthlyData.filter(item => 
        item.Fitted > 0 && item.Fitted !== null && item.Fitted !== undefined
      );
      
      if (nonZeroFittedItems.length > 0) {
        lastFitted = nonZeroFittedItems[nonZeroFittedItems.length - 1].Fitted;
      }
    } else {
      // If no fitted data, find the first forecast value
      const nonZeroForecastItems = formattedMonthlyData.filter(item => 
        item.Forecast > 0 && item.Forecast !== null && item.Forecast !== undefined
      );
      
      if (nonZeroForecastItems.length > 0) {
        // Sort by year and month to get the first chronological forecast
        nonZeroForecastItems.sort((a, b) => {
          if (a.Year !== b.Year) return a.Year.localeCompare(b.Year);
          return a.MonthIndex - b.MonthIndex;
        });
        firstForecast = nonZeroForecastItems[0].Forecast;
      }
    }
    
    setLastFittedValue(lastFitted);
    setFirstForecastValue(firstForecast);
    setChartData(formattedYearlyData);
    setChartDataQuarterly(formattedQuarterlyData);
    setChartDataMonthly(formattedMonthlyData);
    
    setTimeout(() => {
      setLoading(false);
    }, 600); // Add slight delay to show loading animations
  }, [selectedProduct, selectedSKU, selectedDepot, selectedMonth, selectedYear, data]);

  // Handle filter changes from the dropdown component
  const handleFilterChange = useCallback((newFilters) => {
    setSelectedProduct(newFilters.product);
    setSelectedSKU(newFilters.sku);
    setSelectedDepot(newFilters.depot);
    setSelectedMonth(newFilters.month);
    setSelectedYear(newFilters.year);
  }, []);

  return (
        <main className="p-4 overflow-y-auto" style={{ background: 'linear-gradient(135deg, #024673 0%, #5C99E3 50%, #756CE5 100%)' }}> 
          {/* Header */}
          <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  {/* Left side with text content */}
                  <div className="flex-1 space-y-5 align-middle text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                      <span className="text-white">Demand Forecasting</span>
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          {/* Filter Section */}
          <div className="mt-6">
            <DropdownFilters 
              onFilterChange={handleFilterChange}
              products={products}
              skus={skus}
              depots={depots}
              loading={loading}
              selectedProduct={selectedProduct}
              selectedSKU={selectedSKU}
              selectedDepot={selectedDepot}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              months={['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']}
              years={['All', 2023, 2024, 2025]}
            />
          </div>
          
          {/* Metrics Section */}
          <div className="mt-4">
            <ForecastMetrics 
              isLoading={loading}
              totalFitted={totalFitted}
              lastFittedValue={lastFittedValue}
              firstForecastValue={firstForecastValue}
              accuracyRate={averageAccuracy}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              hasFittedData={hasFittedData}
            />
          </div>

          <div className="mt-4">
            <MonthWiseAccuracy 
              data={data}
              selectedProduct={selectedProduct}
              selectedSKU={selectedSKU}
              selectedDepot={selectedDepot}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              loading={loading}
            />
          </div>
          
          {/* Chart Section */}
          <div className="mt-4">
            <ForecastChart 
              isLoading={loading}
              yearlyData={chartData}
              quarterlyData={chartDataQuarterly}
              monthlyData={chartDataMonthly}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </div>
          <div className="mt-8 flex justify-center">
          <button 
            onClick={() => window.location.href = '/demand-planning'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Demand planning
          </button>
        </div>
        </main>
  );
}