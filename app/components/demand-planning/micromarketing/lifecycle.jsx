'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function LifecyclePage() {
  const [filteredFrequencyData, setFilteredFrequencyData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [tableColumns, setTableColumns] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [selectedMonthTable, setSelectedMonthTable] = useState('All');
  const [months, setMonths] = useState([]);

  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [products, setProducts] = useState([]);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState(null);
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

  const [salesActivityMonthsChartData, setSalesActivityMonthsChartData] = useState([]);
  const [activityMonths, setActivityMonths] = useState([]);

  // Toggle state for chart visibility
  const [activeChart, setActiveChart] = useState('sales-activity'); // 'sales-activity', 'financial-year', 'product-stacked'

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

  // Restore original Customer Buying Frequency filter logic
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [buyingFrequencyData, setBuyingFrequencyData] = useState([]);

  const categories = useMemo(() => [
    'All',
    ...Array.from(new Set(buyingFrequencyData.map(row => row.Category))).sort()
  ], [buyingFrequencyData]);

  // Ensure selectedCustomers state is defined
  const [selectedCustomers, setSelectedCustomers] = useState(["All Customers"]);
  const [selectedMonth, setSelectedMonth] = useState('All');

  // Ensure handleCustomerToggle is defined
  const handleCustomerToggle = (customer) => {
    if (customer === "All Customers") {
      setSelectedCustomers(["All Customers"]);
    } else {
      setSelectedCustomers([customer]);
    }
  };

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

        const cleanedColumns = parsedData.length > 0
          ? Object.keys(parsedData[0]).filter(col =>
              col !== 'Invoice' && col !== 'Customer'
            )
          : [];

        setTableColumns(cleanedColumns);

        const monthSet = Array.from(new Set(parsedData.map(row => row.Month))).filter(Boolean);
        const monthOrder = {
            "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
        };
        const sortedMonths = monthSet.sort((a, b) => (monthOrder[a] || 99) - (monthOrder[b] || 99));
        setMonths(['All', ...sortedMonths]);

        setBuyingFrequencyData(parsedData);
        setFilteredFrequencyData(parsedData);
        setCurrentPage(1);
      }
    });
  }, []);

  useEffect(() => {
    let tempFilteredData = buyingFrequencyData;

    if (selectedCategory !== 'All') {
      tempFilteredData = tempFilteredData.filter(row => row.Category === selectedCategory);
    }

    if (selectedMonthTable !== 'All') {
      tempFilteredData = tempFilteredData.filter(row => row.Month === selectedMonthTable);
    }

    setFilteredFrequencyData(tempFilteredData);

    if (tempFilteredData.length > 0) {
      const cleanedColumns = Object.keys(tempFilteredData[0]).filter(col =>
        col !== 'Invoice' && col !== 'Customer'
      );
      setTableColumns(cleanedColumns);
    } else {
      setTableColumns([]);
    }

    setCurrentPage(1);
  }, [selectedCategory, selectedMonthTable, buyingFrequencyData]);

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
              const monthList = ["All", ...Array.from(new Set(result.data.map(row => row.Month && row.Month.trim()).filter(Boolean)))];

              setCustomers(customerNames);
              setFinancialYears(years);
              setSelectedFinancialYear("All Years"); // Ensure a default selection
              setProducts(productList);
              setMonths(monthList);
              setSelectedCustomers(['All Customers']);
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

  // --- Prepare yearly data for drill-down chart ---
  const prepareYearlyData = useCallback(() => {
    if (!csvLoaded || data.length === 0) return;

    // Always filter by selectedCustomers
    let filteredData = [...data];
    if (
      selectedCustomers.length > 0 &&
      !(selectedCustomers.length === 1 && selectedCustomers[0] === "All Customers")
    ) {
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
  const loadForecastData = () => {
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
  };

  // Process data for charts when selections change
  useEffect(() => {
    if (!csvLoaded || selectedFinancialYear === '') return;

    setLoading(true);
    setAnimateCharts(false);

    const timer = setTimeout(() => {
      updateCharts(selectedCustomers, selectedFinancialYear, activeProduct, selectedProduct, selectedMonth);
      setLoading(false);

      setTimeout(() => {
        setAnimateCharts(true);
      }, 100);
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedCustomers, selectedFinancialYear, activeProduct, csvLoaded, isDrillingDown, drillDownYear, selectedProduct, selectedMonth]);

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

    if (
      selectedCustomers.length > 0 &&
      !(selectedCustomers.length === 1 && selectedCustomers[0] === "All Customers")
    ) {
      filteredData = filteredData.filter(row => customers.includes(row.Customer));
    }

    if (activeProduct) {
      filteredData = filteredData.filter(row => row.Product === activeProduct);
    }

    return filteredData.reduce((sum, row) => {
      const sales = parseFloat(row.Sales || 0);
      return sum + (isNaN(sales) ? 0 : sales);
    }, 0);
  }, [csvLoaded, data, selectedCustomers, customers, activeProduct]);

  const updateCharts = useCallback((customers, financialYear, activeProduct, selectedProduct, selectedMonth) => {
    if (!csvLoaded || data.length === 0) return;

    // Always filter by selectedCustomers
    let filteredData = [...data];
    if (
      selectedCustomers.length > 0 &&
      !(selectedCustomers.length === 1 && selectedCustomers[0] === "All Customers")
    ) {
      filteredData = filteredData.filter(row => selectedCustomers.includes(row.Customer));
    }

    if (financialYear !== "All Years") {
      filteredData = filteredData.filter(row => row['Financial Year'] === financialYear);
    }
    if (activeProduct) {
      filteredData = filteredData.filter(row => row.Product === activeProduct);
    }
    if (selectedProduct !== 'All') {
      filteredData = filteredData.filter(row => row.Product === selectedProduct);
    }
    if (selectedMonth !== 'All') {
      filteredData = filteredData.filter(row => row.Month === selectedMonth);
    }

    // --- SalesActivityMonthsChart data calculation (Total sales by year for selected customer) ---
    const yearlySalesMap = {};
    filteredData.forEach(row => {
      const fy = row['Financial Year'] || row.FinancialYear;
      const sales = parseFloat(row.Sales || 0);
      if (fy && !isNaN(sales)) {
        yearlySalesMap[fy] = (yearlySalesMap[fy] || 0) + sales;
      }
    });
    const processedSalesActivityData = Object.entries(yearlySalesMap)
      .map(([fy, totalSales]) => ({ 
        FinancialYear: fy, 
        AvgMonthsBought: parseFloat(totalSales.toFixed(2)),
        SalesValue: parseFloat(totalSales.toFixed(2))
      }))
      .sort((a, b) => a.FinancialYear.localeCompare(b.FinancialYear));
    
    // Normalize the values to 0-12 range for Y-axis display
    const maxSales = Math.max(...processedSalesActivityData.map(d => d.SalesValue || 0));
    processedSalesActivityData.forEach(item => {
      item.AvgMonthsBought = maxSales > 0 ? (item.SalesValue / maxSales) * 12 : 0;
    });
    
    setSalesActivityMonthsChartData(processedSalesActivityData);
    setProducts([]); // Not needed for this chart type
    setActivityMonths(activityMonths);
    // --- END SalesActivityMonthsChart data calculation ---

    // --- Total Sales ---
    const calculatedTotalSales = filteredData.reduce((sum, row) => {
      const sales = parseFloat(row.Sales || 0);
      return sum + (isNaN(sales) ? 0 : sales);
    }, 0);
    setTotalSales(calculatedTotalSales);

    // --- Previous Year Sales and Growth ---
    if (financialYear !== "All Years") {
      const currentYearIndex = financialYears.indexOf(financialYear);
      if (currentYearIndex > 1) {
        const prevYear = financialYears[currentYearIndex - 1];
        if (prevYear !== "All Years") {
          const prevYearSalesValue = filteredData
            .filter(row => row['Financial Year'] === prevYear)
            .reduce((sum, row) => {
              const sales = parseFloat(row.Sales || 0);
              return sum + (isNaN(sales) ? 0 : sales);
            }, 0);
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

    // --- Bar Chart Data (Customer Sales) ---
    const customerSalesMap = {};
    filteredData.forEach(row => {
      const customer = row.Customer;
      const sales = parseFloat(row.Sales || 0);
      if (!isNaN(sales)) {
        customerSalesMap[customer] = (customerSalesMap[customer] || 0) + sales;
      }
    });
    const barChartData = Object.entries(customerSalesMap).map(([name, sales]) => ({ name, sales }));
    setBarData(barChartData);

    // --- Monthly Bar Data ---
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
    const monthlySalesChartOrder = {
      "April": 1, "May": 2, "June": 3, "July": 4, "August": 5, "September": 6,
      "October": 7, "November": 8, "December": 9, "January": 10, "February": 11, "March": 12
    };
    const monthlyBarData = Object.entries(monthlySalesMap)
      .map(([month, sales]) => ({ month, sales }))
      .sort((a, b) => (monthlySalesChartOrder[a.month] || 13) - (monthlySalesChartOrder[b.month] || 13));
    setMonthlyData(monthlyBarData);

    // --- Pie Chart Data (Product Sales) ---
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
    setPieData(pieChartData);
  }, [csvLoaded, data, selectedCustomers, selectedProduct, selectedMonth, activeProduct, financialYears, isDrillingDown, drillDownYear]);

  const handlePieClick = useCallback((product) => {
    if (activeProduct === product) {
      setActiveProduct(null);
    } else {
      setActiveProduct(product);
    }
  }, [activeProduct]);

  // Add handleFinancialYearSelect function
  const handleFinancialYearSelect = (year) => {
    setSelectedFinancialYear(year);
    if (isDrillingDown) {
      setIsDrillingDown(false);
      setDrillDownYear(null);
    }
  };

  // --- DYNAMIC FILTERS: Utility Functions ---
  const getDynamicOptions = useCallback((dataArr, key, filters = {}, includeAll = false, allLabel = 'All') => {
    let filtered = [...dataArr];
    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== allLabel && filterValue !== 'All Customers' && filterValue !== 'All Years') {
        filtered = filtered.filter(row => row[filterKey] === filterValue);
      }
    });
    const options = Array.from(new Set(filtered.map(row => row[key]).filter(Boolean)));
    return includeAll ? [allLabel, ...options] : options;
  }, []);

  // Move sortWithAllFirst and monthOrder above any useMemo that uses them
  const monthOrder = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
  };

  const sortWithAllFirst = (arr, allLabel, isMonth = false) => {
    if (!arr || arr.length === 0) return arr;
    const allIdx = arr.indexOf(allLabel);
    let sorted = arr.filter(x => x !== allLabel);
    if (isMonth) {
      sorted = sorted.sort((a, b) => (monthOrder[a] || 99) - (monthOrder[b] || 99));
    } else {
      sorted = sorted.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }
    return allIdx !== -1 ? [allLabel, ...sorted] : sorted;
  };

  // --- DYNAMIC: Customers, Products, Financial Years, Months ---
  const dynamicCustomers = useMemo(() => {
    if (!csvLoaded) return [];
    const customers = getDynamicOptions(data, 'Customer', {
      Product: activeProduct || (selectedProduct ? selectedProduct : undefined),
      'Financial Year': selectedFinancialYear !== 'All Years' ? selectedFinancialYear : undefined,
      Month: selectedMonth ? selectedMonth : undefined,
    });
    // Sort customers ascending, then add 'All Customers' at the end
    const sorted = [...customers].sort((a, b) => {
      if (a === 'All Customers') return 1;
      if (b === 'All Customers') return -1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    return sorted.includes('All Customers') ? sorted : [...sorted, 'All Customers'];
  }, [csvLoaded, data, activeProduct, selectedProduct, selectedFinancialYear, selectedMonth, getDynamicOptions]);

  const dynamicProducts = useMemo(() => {
    if (!csvLoaded) return [];
    return getDynamicOptions(data, 'Product', {
      Customer: selectedCustomers && selectedCustomers[0] ? selectedCustomers[0] : undefined,
      'Financial Year': selectedFinancialYear !== 'All Years' ? selectedFinancialYear : undefined,
      Month: selectedMonth ? selectedMonth : undefined,
    });
  }, [csvLoaded, data, selectedCustomers, selectedFinancialYear, selectedMonth, getDynamicOptions]);

  const dynamicFinancialYears = useMemo(() => {
    if (!csvLoaded) return ['All Years'];
    const years = getDynamicOptions(data, 'Financial Year', {
      Customer: selectedCustomers && selectedCustomers[0] ? selectedCustomers[0] : undefined,
      Product: activeProduct || (selectedProduct ? selectedProduct : undefined),
      Month: selectedMonth ? selectedMonth : undefined,
    });
    // Always show 'All Years' as the first option, then sorted years
    const sortedYears = [...years].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return ['All Years', ...sortedYears.filter(y => y !== 'All Years')];
  }, [csvLoaded, data, selectedCustomers, activeProduct, selectedProduct, selectedMonth, getDynamicOptions]);

  // Remove any remaining duplicate declaration of dynamicMonths
  // Only keep the version for Customer Buying Frequency
  const dynamicMonths = useMemo(() => {
    let filtered = buyingFrequencyData;
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(row => row.Category === selectedCategory);
    }
    const months = Array.from(new Set(filtered.map(row => row.Month).filter(Boolean)));
    return sortWithAllFirst(['All', ...months], 'All', true);
  }, [buyingFrequencyData, selectedCategory]);

  // --- DYNAMIC: Customer Buying Frequency Filters (Bidirectional, Month Sorted Jan-Dec) ---
  const dynamicCategories = useMemo(() => {
    let filtered = buyingFrequencyData;
    if (selectedMonthTable && selectedMonthTable !== 'All') {
      filtered = filtered.filter(row => row.Month === selectedMonthTable);
    }
    const categories = Array.from(new Set(filtered.map(row => row.Category).filter(Boolean)));
    return sortWithAllFirst(['All', ...categories], 'All');
  }, [buyingFrequencyData, selectedMonthTable]);

  useEffect(() => {
    let tempFilteredData = buyingFrequencyData;
    if (selectedCategory && selectedCategory !== 'All') {
      tempFilteredData = tempFilteredData.filter(row => row.Category === selectedCategory);
    }
    if (selectedMonthTable && selectedMonthTable !== 'All') {
      tempFilteredData = tempFilteredData.filter(row => row.Month === selectedMonthTable);
    }
    setFilteredFrequencyData(tempFilteredData);
    if (tempFilteredData.length > 0) {
      const cleanedColumns = Object.keys(tempFilteredData[0]).filter(col =>
        col !== 'Invoice' && col !== 'Customer'
      );
      setTableColumns(cleanedColumns);
    } else if (buyingFrequencyData.length > 0) {
      const cleanedColumns = Object.keys(buyingFrequencyData[0]).filter(col =>
        col !== 'Invoice' && col !== 'Customer'
      );
      setTableColumns(cleanedColumns);
    } else {
      setTableColumns([]);
    }
    setCurrentPage(1);
  }, [selectedCategory, selectedMonthTable, buyingFrequencyData]);

  // --- DYNAMIC: Forecast Filters ---
  const dynamicForecastProducts = useMemo(() => {
    let filtered = forecastData;
    // Filter by other selections except product
    if (selectedForecastFilters.sku && selectedForecastFilters.sku !== 'All') {
      filtered = filtered.filter(row => row.SKU === selectedForecastFilters.sku);
    }
    if (selectedForecastFilters.depot && selectedForecastFilters.depot !== 'All') {
      filtered = filtered.filter(row => row.Depot === selectedForecastFilters.depot);
    }
    if (selectedForecastFilters.month && selectedForecastFilters.month !== 'All') {
      filtered = filtered.filter(row => row.month === selectedForecastFilters.month);
    }
    if (selectedForecastFilters.year && selectedForecastFilters.year !== 'All') {
      filtered = filtered.filter(row => row.year === selectedForecastFilters.year);
    }
    const products = Array.from(new Set(filtered.map(row => row.product).filter(Boolean)));
    return sortWithAllFirst(['All', ...products], 'All');
  }, [forecastData, selectedForecastFilters.sku, selectedForecastFilters.depot, selectedForecastFilters.month, selectedForecastFilters.year]);

  const dynamicForecastSKUs = useMemo(() => {
    let filtered = forecastData;
    if (selectedForecastFilters.product && selectedForecastFilters.product !== 'All') {
      filtered = filtered.filter(row => row.product === selectedForecastFilters.product);
    }
    if (selectedForecastFilters.depot && selectedForecastFilters.depot !== 'All') {
      filtered = filtered.filter(row => row.Depot === selectedForecastFilters.depot);
    }
    if (selectedForecastFilters.month && selectedForecastFilters.month !== 'All') {
      filtered = filtered.filter(row => row.month === selectedForecastFilters.month);
    }
    if (selectedForecastFilters.year && selectedForecastFilters.year !== 'All') {
      filtered = filtered.filter(row => row.year === selectedForecastFilters.year);
    }
    return sortWithAllFirst(['All', ...new Set(filtered.map(row => row.SKU).filter(Boolean))]);
  }, [forecastData, selectedForecastFilters.product, selectedForecastFilters.depot, selectedForecastFilters.month, selectedForecastFilters.year]);

  const dynamicForecastDepots = useMemo(() => {
    let filtered = forecastData;
    if (selectedForecastFilters.product && selectedForecastFilters.product !== 'All') {
      filtered = filtered.filter(row => row.product === selectedForecastFilters.product);
    }
    if (selectedForecastFilters.sku && selectedForecastFilters.sku !== 'All') {
      filtered = filtered.filter(row => row.SKU === selectedForecastFilters.sku);
    }
    if (selectedForecastFilters.month && selectedForecastFilters.month !== 'All') {
      filtered = filtered.filter(row => row.month === selectedForecastFilters.month);
    }
    if (selectedForecastFilters.year && selectedForecastFilters.year !== 'All') {
      filtered = filtered.filter(row => row.year === selectedForecastFilters.year);
    }
    return sortWithAllFirst(['All', ...new Set(filtered.map(row => row.Depot).filter(Boolean))]);
  }, [forecastData, selectedForecastFilters.product, selectedForecastFilters.sku, selectedForecastFilters.month, selectedForecastFilters.year]);

  const dynamicForecastMonths = useMemo(() => {
    let filtered = forecastData;
    if (selectedForecastFilters.product && selectedForecastFilters.product !== 'All') {
      filtered = filtered.filter(row => row.product === selectedForecastFilters.product);
    }
    if (selectedForecastFilters.sku && selectedForecastFilters.sku !== 'All') {
      filtered = filtered.filter(row => row.SKU === selectedForecastFilters.sku);
    }
    if (selectedForecastFilters.depot && selectedForecastFilters.depot !== 'All') {
      filtered = filtered.filter(row => row.Depot === selectedForecastFilters.depot);
    }
    if (selectedForecastFilters.year && selectedForecastFilters.year !== 'All') {
      filtered = filtered.filter(row => row.year === selectedForecastFilters.year);
    }
    return sortWithAllFirst(['All', ...new Set(filtered.map(row => row.month).filter(Boolean))]);
  }, [forecastData, selectedForecastFilters.product, selectedForecastFilters.sku, selectedForecastFilters.depot, selectedForecastFilters.year]);

  const dynamicForecastYears = useMemo(() => {
    let filtered = forecastData;
    if (selectedForecastFilters.product && selectedForecastFilters.product !== 'All') {
      filtered = filtered.filter(row => row.product === selectedForecastFilters.product);
    }
    if (selectedForecastFilters.sku && selectedForecastFilters.sku !== 'All') {
      filtered = filtered.filter(row => row.SKU === selectedForecastFilters.sku);
    }
    if (selectedForecastFilters.depot && selectedForecastFilters.depot !== 'All') {
      filtered = filtered.filter(row => row.Depot === selectedForecastFilters.depot);
    }
    if (selectedForecastFilters.month && selectedForecastFilters.month !== 'All') {
      filtered = filtered.filter(row => row.month === selectedForecastFilters.month);
    }
    return sortWithAllFirst(['All', ...new Set(filtered.map(row => row.year).filter(Boolean))]);
  }, [forecastData, selectedForecastFilters.product, selectedForecastFilters.sku, selectedForecastFilters.depot, selectedForecastFilters.month]);

  return (
    <>
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
                  customers={dynamicCustomers}
                  financialYears={dynamicFinancialYears}
                  selectedCustomers={selectedCustomers}
                  selectedFinancialYear={selectedFinancialYear}
                  handleCustomerToggle={handleCustomerToggle}
                  handleFinancialYearSelect={handleFinancialYearSelect}
                  className="bg-[#013554] rounded-lg p-4 mb-6"
                  textColor="text-white"
                  selectTextColor="text-white"
                  products={dynamicProducts}
                  months={dynamicMonths}
                  selectedProduct={selectedProduct}
                  setSelectedProduct={setSelectedProduct}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
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

                {/* Chart Toggle Buttons */}
                <div className="mb-6">
                  <div className="flex justify-center">
                    <div className="bg-white/10 rounded-lg p-1 flex space-x-1">
                      <button
                        onClick={() => setActiveChart('sales-activity')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          activeChart === 'sales-activity'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        Sales Activity
                      </button>
                      <button
                        onClick={() => setActiveChart('financial-year')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          activeChart === 'financial-year'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        Sales Value
                      </button>
                      <button
                        onClick={() => setActiveChart('product-stacked')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          activeChart === 'product-stacked'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        Product Analysis
                      </button>
                    </div>
                  </div>
                </div>

                {/* SalesActivityMonthsChart with solid blue background - NOW WITH salesActivityData PROP */}
                {activeChart === 'sales-activity' && (
                  <SalesActivityMonthsChart
                    salesActivityData={salesActivityMonthsChartData}
                    products={products}
                    activityMonths={activityMonths}
                    className="bg-[#013554] rounded-lg p-4 mb-6"
                  />
                )}

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
                    {activeChart === 'financial-year' && (
                      <>
                        {!isDrillingDown ? (
                          <FinancialYearBarChart
                            yearlyData={
                              selectedFinancialYear && selectedFinancialYear !== 'All Years'
                                ? yearlyData.filter(y => y.year === selectedFinancialYear)
                                : yearlyData
                            }
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
                      </>
                    )}

                    {/* Pie Chart - Sales by Product with solid blue background */}
                    {activeChart === 'product-stacked' && (
                      <ProductStackedBarChart
                        pieData={pieData}
                        animateCharts={animateCharts}
                        activeProduct={activeProduct}
                        handlePieClick={handlePieClick}
                        data={
                          selectedFinancialYear && selectedFinancialYear !== 'All Years'
                            ? data.filter(row => row['Financial Year'] === selectedFinancialYear)
                            : data
                        }
                        selectedCustomers={selectedCustomers}
                        selectedFinancialYear={selectedFinancialYear}
                        className="bg-[#013554] rounded-lg p-4"
                        labelColor="#FFFFFF"
                      />
                    )}
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
                    products={dynamicForecastProducts}
                    skus={dynamicForecastSKUs}
                    depots={dynamicForecastDepots}
                    months={dynamicForecastMonths}
                    years={dynamicForecastYears}
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

          {/* Customer Buying Frequency Section */}
          <div className="mb-8 p-6 space-y-6 bg-[#013554] rounded-lg shadow-xl">
            <h1 className="text-2xl font-bold text-white">Customer Buying Frequency</h1>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Category Filter */}
              <div className="w-full md:w-1/4 mb-4">
                <label className="block text-sm font-medium text-white mb-2">Select Category:</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-white border-opacity-20 rounded-md text-white bg-[#013554]"
                >
                  {dynamicCategories.map((category, idx) => (
                    <option key={idx} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              {/* Month Filter */}
              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-white mb-2">Select Month:</label>
                <select
                  value={selectedMonthTable}
                  onChange={(e) => setSelectedMonthTable(e.target.value)}
                  className="w-full p-2 border border-white border-opacity-20 rounded-md text-white bg-[#013554]"
                >
                  {dynamicMonths.map((month, idx) => (
                    <option key={idx} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto mt-6 rounded-lg">
              <table className="min-w-full divide-y divide-blue-700">
                <thead className="bg-[#013554] border-b border-blue-700 sticky top-0 z-10">
                  <tr>
                    {tableColumns.map((column, idx) => (
                      <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-blue-100 uppercase tracking-wider">
                        {column.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[#013554] divide-y divide-blue-700">
                  {filteredFrequencyData.length > 0 ? (
                    currentRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-700">
                        {tableColumns.map((column, cellIdx) => (
                          <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                            {row[column]}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableColumns.length} className="px-6 py-4 text-center text-blue-100">
                        {selectedCategory !== 'All' || selectedMonthTable !== 'All'
                          ? 'No records found for the selected filters.'
                          : 'No data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
          </div>
        </div>
      </main>
    </>
  );
}