'use client';

import { useState, useEffect, useCallback } from 'react';
import { IndianRupee } from "lucide-react";
import Papa from 'papaparse';
import FilterSection from './FilterSection';
import StatsCard from './StatsCard';
import MonthlyBarChart from './MonthlyBarChart';
import ProductStackedBarChart from './ProductStackedBarChart';
import FinancialYearBarChart from './FinancialYearBarChart';
import DropdownFilters from '../forecasting/dropdownfiter';
import TopPerformingSKUs from '../forecasting/topperforming';
import SKUTrendGraph from './SKUTrendGraph';
import SalesActivityMonthsChart from './SalesActivityMonthsChart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function LifecyclePage() {
  // --- Buying Frequency Chart State ---
  const [buyingFrequencyData, setBuyingFrequencyData] = useState([]);
  const [filteredFrequencyData, setFilteredFrequencyData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);

  // --- Pagination State for Buying Frequency Table ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10); // You can adjust this number

  // --- Month Filter for Buying Frequency ---
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [months, setMonths] = useState([]); // To store unique months for the dropdown

  // --- Core Lifecycle Analytics State ---
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [products, setProducts] = useState([]);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState(["All Customers"]);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('');
  const [activeProduct, setActiveProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [barData, setBarData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [prevYearSales, setPrevYearSales] = useState(0);
  const [salesGrowth, setSalesGrowth] = useState(0);
  const [animateCharts, setAnimateCharts] = useState(false);
  const [yearlyData, setYearlyData] = useState([]);
  const [drillDownYear, setDrillDownYear] = useState(null);
  const [isDrillingDown, setIsDrillingDown] = useState(false);

  // --- Sales Activity Months Chart Data State (Reinstated) ---
  const [salesActivityMonthsChartData, setSalesActivityMonthsChartData] = useState([]);

  // --- Forecast Data State ---
  const [forecastData, setForecastData] = useState([]);
  const [forecastProducts, setForecastProducts] = useState(['All']);
  const [forecastSKUs, setForecastSKUs] = useState(['All']);
  const [forecastDepots, setForecastDepots] = useState(['All']);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [selectedForecastFilters, setSelectedForecastFilters] = useState({
    product: 'All',
    sku: 'All',
    depot: 'All',
    month: 'All',
    year: 'All'
  });

  // Load buying frequency data
  useEffect(() => {
    Papa.parse('/ConsumerBehaviour.csv', {
      header: true,
      download: true,
      complete: (results) => {
        const parsedData = results.data.filter(row => row.Invoice && row.Category);

        parsedData.forEach(row => {
          const date = new Date(row.Invoice);
          if (!isNaN(date)) {
            row.Month = date.toLocaleString('en-US', { month: 'short' });
          }
        });

        if (parsedData.length > 0) {
          setTableColumns(Object.keys(parsedData[0]));
        }

        const categorySet = Array.from(new Set(parsedData.map(row => row.Category)));
        setCategories(['All', ...categorySet]);

        // --- Extract and Sort Months ---
        const monthSet = Array.from(new Set(parsedData.map(row => row.Month))).filter(Boolean); // Filter out any undefined/null months
        const monthOrder = {
            "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
        };
        const sortedMonths = monthSet.sort((a, b) => (monthOrder[a] || 99) - (monthOrder[b] || 99));
        setMonths(['All', ...sortedMonths]);
        // --- End Extract and Sort Months ---

        setBuyingFrequencyData(parsedData);
        setFilteredFrequencyData(parsedData);
        setCurrentPage(1); // Reset to first page on new data/filters
      }
    });
  }, []);

  // Filter buying frequency data by category and month
  useEffect(() => {
    let tempFilteredData = buyingFrequencyData;

    if (selectedCategory !== 'All') {
      tempFilteredData = tempFilteredData.filter(row => row.Category === selectedCategory);
    }

    if (selectedMonth !== 'All') { // Filter by selectedMonth
      tempFilteredData = tempFilteredData.filter(row => row.Month === selectedMonth);
    }

    setFilteredFrequencyData(tempFilteredData);
    if (tempFilteredData.length > 0) {
      setTableColumns(Object.keys(tempFilteredData[0]));
    } else {
      setTableColumns([]); // Clear columns if no data
    }
    setCurrentPage(1); // Reset to first page on filter change
  }, [selectedCategory, selectedMonth, buyingFrequencyData]); // Added selectedMonth to dependencies

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredFrequencyData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredFrequencyData.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Load lifecycle analytics data
  useEffect(() => {
    const loadLifecycleData = async () => {
      setCsvLoading(true);
      setCsvError(null);

      try {
        const response = await fetch('/Updated_Lifecycle_Micro_Market.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch CSV file');
        }

        const text = await response.text();
        Papa.parse(text, {
          complete: (result) => {
            if (result.data.length > 0) {
              setData(result.data);

              const customerNames = ["All Customers", ...new Set(result.data.map(row => row.Customer))];
              const years = ["All Years", ...new Set(result.data.map(row => row['Financial Year']))];
              const productList = [...new Set(result.data.map(row => row.Product))];

              setCustomers(customerNames);
              setFinancialYears(years);
              setSelectedFinancialYear("All Years"); // Ensure a default selection
              setProducts(productList);
              setCsvLoaded(true);
            }
            setCsvLoading(false);
          },
          header: true,
          skipEmptyLines: true,
        });
      } catch (error) {
        console.error('Error fetching CSV:', error);
        setCsvError(error.message);
        setCsvLoading(false);
      }
    };

    loadLifecycleData();
    loadForecastData();
  }, []);

  // Prepare yearly data for drill-down chart
  const prepareYearlyData = useCallback(() => {
    if (!csvLoaded || data.length === 0) return;

    let filteredData = [...data];

    if (!selectedCustomers.includes("All Customers")) {
      filteredData = filteredData.filter(row => selectedCustomers.includes(row.Customer));
    }

    if (activeProduct) {
      filteredData = filteredData.filter(row => row.Product === activeProduct);
    }

    const yearlySalesMap = {};

    filteredData.forEach(row => {
      const year = row['Financial Year'];
      const sales = parseFloat(row.Sales || 0);
      if (!isNaN(sales) && year && year !== "All Years") {
        yearlySalesMap[year] = (yearlySalesMap[year] || 0) + sales;
      }
    });

    const yearlySalesData = Object.entries(yearlySalesMap)
      .map(([year, sales]) => ({ year, sales }))
      .sort((a, b) => a.year.localeCompare(b.year));

    setYearlyData(yearlySalesData);
  }, [csvLoaded, data, selectedCustomers, activeProduct]);

  useEffect(() => {
    prepareYearlyData();
  }, [prepareYearlyData, selectedCustomers, activeProduct, csvLoaded]);

  const handleYearClick = useCallback((year) => {
    setDrillDownYear(year);
    setSelectedFinancialYear(year);
    setIsDrillingDown(true);
  }, []);

  const handleBackToYears = useCallback(() => {
    setDrillDownYear(null);
    setIsDrillingDown(false);
    setSelectedFinancialYear("All Years");
  }, []);

  // Load forecast data
  const loadForecastData = useCallback(() => {
    setForecastLoading(true);

    fetch('/Anonymized_LightingWireFiana1.csv')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch forecast data');
        }
        return response.text();
      })
      .then((text) => {
        Papa.parse(text, {
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              const forecastDataArray = result.data.filter(row =>
                row && row.product && row.SKU && row.Depot
              );

              setForecastData(forecastDataArray);
              const products = ['All', ...new Set(forecastDataArray.map(row => row.product))];
              setForecastProducts(products);

              const skus = ['All', ...new Set(forecastDataArray.map(row => row.SKU))];
              const depots = ['All', ...new Set(forecastDataArray.map(item => item.Depot))];

              setForecastDepots(depots);
            }
            setForecastLoading(false);
          },
          header: true,
          skipEmptyLines: true,
        });
      })
      .catch((error) => {
        console.error('Error loading forecast data:', error);
        setForecastLoading(false);
      });
  }, []);

  // Process data for charts when selections change
  useEffect(() => {
    if (!csvLoaded || selectedFinancialYear === '') return;

    setLoading(true);
    setAnimateCharts(false);

    const timer = setTimeout(() => {
      updateCharts(selectedCustomers, selectedFinancialYear, activeProduct);
      setLoading(false);

      setTimeout(() => {
        setAnimateCharts(true);
      }, 100);
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedCustomers, selectedFinancialYear, activeProduct, csvLoaded, isDrillingDown, drillDownYear]);

  const handleForecastFilterChange = useCallback((filters) => {
    if (JSON.stringify(filters) === JSON.stringify(selectedForecastFilters)) {
      return;
    }

    setForecastLoading(true);

    const updateFilteredLists = () => {
      if (filters.product !== selectedForecastFilters.product) {
        let filteredSKUs = ['All'];
        if (filters.product !== 'All') {
          filteredSKUs = ['All', ...new Set(forecastData
            .filter(item => item.product === filters.product)
            .map(item => item.SKU))];
        } else {
          filteredSKUs = ['All', ...new Set(forecastData.map(item => item.SKU))];
        }

        setForecastSKUs(filteredSKUs);

        if (!filteredSKUs.includes(filters.sku)) {
          filters.sku = 'All';
        }
      }

      let filteredDepots = ['All'];

      if (filters.product !== 'All' && filters.sku !== 'All') {
        filteredDepots = ['All', ...new Set(forecastData
          .filter(item => item.product === filters.product && item.SKU === filters.sku)
          .map(item => item.Depot))];
      } else if (filters.product !== 'All') {
        filteredDepots = ['All', ...new Set(forecastData
          .filter(item => item.product === filters.product)
          .map(item => item.Depot))];
      } else if (filters.sku !== 'All') {
        filteredDepots = ['All', ...new Set(forecastData
          .filter(item => item.SKU === filters.sku)
          .map(item => item.Depot))];
      } else {
        filteredDepots = ['All', ...new Set(forecastData.map(item => item.Depot))];
      }

      setForecastDepots(filteredDepots);
      setSelectedForecastFilters(filters);
      setForecastLoading(false);
    };

    setTimeout(updateFilteredLists, 100);
  }, [forecastData, selectedForecastFilters]);

  const calculateTotalSales = useCallback((customers, financialYear, activeProduct) => {
    if (!csvLoaded || data.length === 0) return 0;

    let filteredData = [...data];

    if (financialYear !== "All Years") {
      filteredData = filteredData.filter(row => row['Financial Year'] === financialYear);
    }

    if (!customers.includes("All Customers")) {
      filteredData = filteredData.filter(row => customers.includes(row.Customer));
    }

    if (activeProduct) {
      filteredData = filteredData.filter(row => row.Product === activeProduct);
    }

    return filteredData.reduce((sum, row) => {
      const sales = parseFloat(row.Sales || 0);
      return sum + (isNaN(sales) ? 0 : sales);
    }, 0);
  }, [csvLoaded, data]);

  const updateCharts = useCallback((customers, financialYear, activeProduct) => {
    if (!csvLoaded || data.length === 0) return;

    const calculatedTotalSales = calculateTotalSales(customers, financialYear, activeProduct);
    setTotalSales(calculatedTotalSales);

    if (financialYear !== "All Years") {
      const currentYearIndex = financialYears.indexOf(financialYear);
      if (currentYearIndex > 1) {
        const prevYear = financialYears[currentYearIndex - 1];
        if (prevYear !== "All Years") {
          const prevYearSalesValue = calculateTotalSales(customers, prevYear, activeProduct);
          setPrevYearSales(prevYearSalesValue);

          if (prevYearSalesValue > 0) {
            const growth = ((calculatedTotalSales - prevYearSalesValue) / prevYearSalesValue) * 100;
            setSalesGrowth(growth);
          } else {
            setSalesGrowth(0);
          }
        } else {
          setSalesGrowth(0);
        }
      } else {
        setSalesGrowth(0);
      }
    } else {
      setSalesGrowth(0);
    }

    let filteredData = [...data];

    if (financialYear !== "All Years") {
      filteredData = filteredData.filter(row => row['Financial Year'] === financialYear);
    }

    if (!customers.includes("All Customers")) {
      filteredData = filteredData.filter(row => customers.includes(row.Customer));
    }

    if (activeProduct) {
      filteredData = filteredData.filter(row => row.Product === activeProduct);
    }

    const customerSalesMap = {};
    filteredData.forEach(row => {
      const customer = row.Customer;
      const sales = parseFloat(row.Sales || 0);
      if (!isNaN(sales)) {
        customerSalesMap[customer] = (customerSalesMap[customer] || 0) + sales;
      }
    });

    const barChartData = Object.entries(customerSalesMap).map(([name, sales]) => ({
      name,
      sales
    }));

    const monthlySalesMap = {};
    filteredData.forEach(row => {
      if (!isDrillingDown || row['Financial Year'] === drillDownYear) {
        const month = row.Month;
        const sales = parseFloat(row.Sales || 0);
        if (!isNaN(sales) && month) {
          monthlySalesMap[month] = (monthlySalesMap[month] || 0) + sales;
        }
      }
    });

    // Financial year month order for Lifecycle Analytics section
    const monthlySalesChartOrder = {
      "April": 1, "May": 2, "June": 3, "July": 4, "August": 5, "September": 6,
      "October": 7, "November": 8, "December": 9, "January": 10, "February": 11, "March": 12
    };

    const monthlyBarData = Object.entries(monthlySalesMap)
      .map(([month, sales]) => ({ month, sales }))
      .sort((a, b) => (monthlySalesChartOrder[a.month] || 13) - (monthlySalesChartOrder[b.month] || 13));

    const productSalesMap = {};
    filteredData.forEach(row => {
      const product = row.Product;
      const sales = parseFloat(row.Sales || 0);
      if (!isNaN(sales) && product) {
        productSalesMap[product] = (productSalesMap[product] || 0) + sales;
      }
    });

    const pieChartData = Object.entries(productSalesMap)
      .map(([product, sales]) => ({
        product,
        sales,
        percentage: (sales / calculatedTotalSales * 100).toFixed(1)
      }))
      .sort((a, b) => b.sales - a.sales);

    // --- SalesActivityMonthsChart data calculation (Reinstated and adjusted) ---
    const customerFinancialYearMap = new Map();
    filteredData.forEach(row => {
      const customer = row.Customer;
      const fy = row['Financial Year'];
      const sales = parseFloat(row.Sales); // Assuming Sales column indicates activity
      if (customer && fy) {
        const key = `${customer}-${fy}`;
        if (!customerFinancialYearMap.has(key)) {
          customerFinancialYearMap.set(key, {
            Customer: customer,
            FinancialYear: fy,
            activeMonthsSet: new Set()
          });
        }
        // Count a month as active if there's any sales activity
        if (!isNaN(sales) && sales > 0) {
          customerFinancialYearMap.get(key).activeMonthsSet.add(row.Month);
        }
      }
    });
    const processedSalesActivityData = Array.from(customerFinancialYearMap.values()).map(entry => ({
      Customer: entry.Customer,
      FinancialYear: entry.FinancialYear,
      ActiveMonths: entry.activeMonthsSet.size
    }));
    setSalesActivityMonthsChartData(processedSalesActivityData);
    // --- END SalesActivityMonthsChart data calculation ---


    setBarData(barChartData);
    setMonthlyData(monthlyBarData);
    setPieData(pieChartData);
  }, [csvLoaded, data, calculateTotalSales, financialYears, isDrillingDown, drillDownYear]);

  const handleCustomerToggle = useCallback((customer) => {
    setSelectedCustomers(prev => {
      if (customer === "All Customers") {
        return ["All Customers"];
      } else {
        const newSelection = prev.filter(c => c !== "All Customers");

        if (newSelection.includes(customer)) {
          const result = newSelection.filter(c => c !== customer);
          return result.length === 0 ? ["All Customers"] : result;
        } else {
          return [...newSelection, customer];
        }
      }
    });
  }, []);

  const handleFinancialYearSelect = useCallback((year) => {
    setSelectedFinancialYear(year);

    if (isDrillingDown) {
      setIsDrillingDown(false);
      setDrillDownYear(null);
    }
  }, [isDrillingDown]);

  const handlePieClick = useCallback((product) => {
    if (activeProduct === product) {
      setActiveProduct(null);
    } else {
      setActiveProduct(product);
    }
  }, [activeProduct]);

  return (
    <main className="p-4 overflow-y-auto" style={{ background: 'linear-gradient(135deg, #024673 0%, #5C99E3 50%, #756CE5 100%)' }}>
      {/* Header */}
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
        <div className="p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex-1 space-y-5 align-middle text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                <span className="text-white">Micromarketing Strategy</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Lifecycle Analytics Section - Changed background to a darker blue */}
        <div className="bg-[#013554] rounded-lg p-6 mb-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-4">Lifecycle of Clients</h1>
          <p className="text-white mb-4">
            View and analyze sales data for all your customers. Use the filters below to customize your view.
          </p>

          {/* CSV Loading Status */}
          {csvLoading && (
            <div className="mb-6 flex items-center justify-center p-4 bg-blue-50 rounded-lg text-white">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-100 border-t-blue-600 mr-3"></div>
              <p>Loading CSV data...</p>
            </div>
          )}

          {csvError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              <p>Error loading CSV: {csvError}</p>
            </div>
          )}

          {csvLoaded && (
            <>
              {/* FilterSection with solid blue background */}
              <FilterSection
                customers={customers}
                financialYears={financialYears}
                selectedCustomers={selectedCustomers}
                selectedFinancialYear={selectedFinancialYear}
                handleCustomerToggle={handleCustomerToggle}
                handleFinancialYearSelect={handleFinancialYearSelect}
                className="bg-[#013554] rounded-lg p-4 mb-6"
                textColor="text-white"
                selectTextColor="text-white"
              />

              {/* Total Sales Card with solid blue background */}
              {selectedFinancialYear && (
                <StatsCard
                  totalSales={totalSales}
                  activeProduct={activeProduct}
                  selectedFinancialYear={selectedFinancialYear}
                  selectedCustomers={selectedCustomers}
                  monthlyData={monthlyData}
                  animateCharts={animateCharts}
                  className="bg-[#013554] rounded-lg p-4 mb-6"
                  mainTextColor="text-white"
                  labelTextColor="text-white"
                />
              )}

              {/* SalesActivityMonthsChart with solid blue background - NOW WITH salesActivityData PROP */}
              <SalesActivityMonthsChart
                className="bg-[#013554] rounded-lg p-4 mb-6"
                axisStroke="#FFFFFF"
                labelColor="#FFFFFF"
                salesActivityData={salesActivityMonthsChartData} // Pass the processed data
              />

              {/* Active Filters Display */}
              {activeProduct && (
                <div className="mb-6 animate-fadeIn">
                  <div className="flex items-center">
                    <span className="text-sm text-white mr-2">Active Filter:</span>
                    <span
                      className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded flex items-center cursor-pointer transition-all duration-300 hover:bg-blue-200"
                      onClick={() => setActiveProduct(null)}
                    >
                      {activeProduct} <span className="ml-1 transition-transform duration-300 hover:scale-125">×</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Drill-down Status Display */}
              {isDrillingDown && (
                <div className="mb-6 animate-fadeIn">
                  <div className="flex items-center">
                    <span className="text-sm text-white mr-2">Viewing monthly breakdown for:</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded flex items-center">
                      {drillDownYear}
                    </span>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-center items-center p-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mr-3"></div>
                </div>
              )}

              {/* Charts Container */}
              {!loading && selectedFinancialYear && (
                <div className="grid grid-cols-1 gap-6">
                  {/* FinancialYearBarChart with solid blue background */}
                  {!isDrillingDown ? (
                    <FinancialYearBarChart
                      yearlyData={yearlyData}
                      animateCharts={animateCharts}
                      handleYearClick={handleYearClick}
                      className="bg-[#013554] rounded-lg p-4"
                      axisStroke="#FFFFFF"
                      labelColor="#FFFFFF"
                    />
                  ) : (
                    /* Monthly Bar Chart - With Drill-down View with solid blue background */
                    <MonthlyBarChart
                      monthlyData={monthlyData}
                      animateCharts={animateCharts}
                      selectedYear={drillDownYear}
                      onBackClick={handleBackToYears}
                      className="bg-[#013554] rounded-lg p-4"
                      axisStroke="#FFFFFF"
                      labelColor="#FFFFFF"
                    />
                  )}

                  {/* Pie Chart - Sales by Product with solid blue background */}
                  <ProductStackedBarChart
                    pieData={pieData}
                    animateCharts={animateCharts}
                    activeProduct={activeProduct}
                    handlePieClick={handlePieClick}
                    data={data}
                    selectedCustomers={selectedCustomers}
                    selectedFinancialYear={selectedFinancialYear}
                    className="bg-[#013554] rounded-lg p-4"
                    labelColor="#FFFFFF"
                  />
                </div>
              )}

              {/* Forecast Section */}
              <div className="mt-8 pt-8 border-t border-blue-300">
                <h2 className="text-xl font-bold text-white mb-4">Forecast Analysis</h2>
                <p className="text-white mb-6">
                  View and analyze sales forecasts by product, SKU, and depot. Use the filters below to customize your view.
                </p>

                {/* DropdownFilters Component */}
                <DropdownFilters
                  onFilterChange={handleForecastFilterChange}
                  products={forecastProducts}
                  skus={forecastSKUs}
                  depots={forecastDepots}
                  loading={forecastLoading}
                  selectedProduct={selectedForecastFilters.product}
                  selectedSKU={selectedForecastFilters.sku}
                  selectedDepot={selectedForecastFilters.depot}
                  selectedMonth={selectedForecastFilters.month}
                  selectedYear={selectedForecastFilters.year}
                  className="bg-[#013554] rounded-lg p-4 mb-6"
                  textColor="text-white"
                  selectTextColor="text-white"
                />

                {/* TopPerformingSKUs Component */}
                {!forecastLoading && (
                  <>
                    <TopPerformingSKUs
                      data={forecastData}
                      selectedProduct={selectedForecastFilters.product}
                      selectedSKU={selectedForecastFilters.sku}
                      selectedDepot={selectedForecastFilters.depot}
                      selectedMonth={selectedForecastFilters.month}
                      selectedYear={selectedForecastFilters.year}
                      loading={forecastLoading}
                      className="bg-[#013554] rounded-lg p-4 mt-6"
                    />
                    <SKUTrendGraph />
                  </>
                )}
              </div>
            </>
          )}
        </div> {/* End of Lifecycle Analytics / Forecast Analysis parent div */}


        {/* Customer Buying Frequency Section - MOVED TO HERE */}
        <div className="mb-8 p-6 space-y-6 bg-[#013554] rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-white">Customer Buying Frequency</h1>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Category Filter */}
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium text-white mb-2">Select Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-white border-opacity-20 rounded-md text-white bg-[#013554]"
              >
                {categories.map((category, idx) => (
                  <option key={idx} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium text-white mb-2">Select Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 border border-white border-opacity-20 rounded-md text-white bg-[#013554]"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/3">
            </div>
          </div>

          {/* Table - Added max-h-96 and overflow-y-auto for scrolling */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto mt-6 rounded-lg">
            <table className="min-w-full divide-y divide-blue-700">
              <thead className="bg-[#013554] border-b border-blue-700 sticky top-0 z-10"><tr>
                {tableColumns.map((column, idx) => (<th key={idx} className="px-6 py-3 text-left text-xs font-medium text-blue-100 uppercase tracking-wider">
                  {column.replace(/([A-Z])/g, ' $1').trim()}
                </th>))}
              </tr></thead>
              <tbody className="bg-[#013554] divide-y divide-blue-700">{
                currentRows.map((row, idx) => (<tr key={idx} className="hover:bg-blue-700">
                  {tableColumns.map((column, cellIdx) => (<td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                    {row[column]}
                  </td>))}
                </tr>))
              }</tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 text-white">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div className="text-sm text-white mt-2">
            Displaying {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredFrequencyData.length)} of {filteredFrequencyData.length} records.
          </div>
        </div> {/* End of Customer Buying Frequency Section */}

      </div> {/* End of px-4 div */}

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

