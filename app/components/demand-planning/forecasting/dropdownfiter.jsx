// shruti
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Filter, RefreshCw, Calendar } from 'lucide-react';

export default function DropdownFilters({ 
  onFilterChange, 
  products = [], 
  skus = [], 
  depots = [],
  months = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  years = ['All', 2023, 2024, 2025],
  loading = false,
  selectedProduct = 'All',
  selectedSKU = 'All',
  selectedDepot = 'All',
  selectedMonth = 'All',
  selectedYear = 'All'
}) {
  const [isDependentLoading, setIsDependentLoading] = useState(false);

  // When parent component updates the selected values, update local state
  useEffect(() => {
    if (!loading) {
      // Notify parent component of the current filter state
      if (selectedProduct && selectedSKU && selectedDepot) {
        onFilterChange({
          product: selectedProduct,
          sku: selectedSKU,
          depot: selectedDepot,
          month: selectedMonth || 'All',
          year: selectedYear || 'All'
        });
      }
    }
  }, [selectedProduct, selectedSKU, selectedDepot, selectedMonth, selectedYear, loading, onFilterChange]);

  // Reset filters handler
  const handleReset = () => {
    setIsDependentLoading(true);
    
    // Let parent component know to reset filters
    onFilterChange({
      product: 'All',
      sku: 'All',
      depot: 'All',
      month: 'All',
      year: 'All'
    });
    
    setTimeout(() => {
      setIsDependentLoading(false);
    }, 800);
  };

  return (
    <div className="bg-gradient-to-r from-[#024673] to-[#5C99E3] p-4 rounded-xl shadow-sm border border-blue-200 text-white mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Filter Forecasts
        </h3>
        
        <button 
          onClick={handleReset}
          className="text-sm text-white flex items-center hover:text-blue-100"
          disabled={loading}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Reset Filters
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Product Dropdown */}
        <div className="relative">
          <label className="block text-xs text-white mb-1">Product</label>
          <div className="relative">
            <select 
              value={selectedProduct}
              onChange={(e) => onFilterChange({
                product: e.target.value,
                sku: selectedSKU,
                depot: selectedDepot,
                month: selectedMonth,
                year: selectedYear
              })}
              className={`w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${loading || isDependentLoading ? 'opacity-70' : ''}`}
              disabled={loading || isDependentLoading}
            >
              {products.length === 0 ? (
                <option>Loading...</option>
              ) : (
                products.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              {loading || isDependentLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
        
        {/* SKU Dropdown */}
        <div className="relative">
          <label className="block text-xs text-white mb-1">SKU</label>
          <div className="relative">
            <select 
              value={selectedSKU}
              onChange={(e) => onFilterChange({
                product: selectedProduct,
                sku: e.target.value,
                depot: selectedDepot,
                month: selectedMonth,
                year: selectedYear
              })}
              className={`w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${loading || isDependentLoading ? 'opacity-70' : ''}`}
              disabled={loading || isDependentLoading || products.length === 0}
            >
              {skus.length === 0 ? (
                <option>Select a product first</option>
              ) : (
                skus.map(sku => (
                  <option key={sku} value={sku}>{sku}</option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              {loading || isDependentLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
        
        {/* Depot Dropdown */}
        <div className="relative">
          <label className="block text-xs text-white mb-1">Depot</label>
          <div className="relative">
            <select 
              value={selectedDepot}
              onChange={(e) => onFilterChange({
                product: selectedProduct,
                sku: selectedSKU,
                depot: e.target.value,
                month: selectedMonth,
                year: selectedYear
              })}
              className={`w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${loading || isDependentLoading ? 'opacity-70' : ''}`}
              disabled={loading || isDependentLoading || skus.length === 0}
            >
              {depots.length === 0 ? (
                <option>Select a SKU first</option>
              ) : (
                depots.map(depot => (
                  <option key={depot} value={depot}>{depot}</option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              {loading || isDependentLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
        
        {/* Month Dropdown */}
        <div className="relative">
          <label className="block text-xs text-white mb-1">Month</label>
          <div className="relative">
            <select 
              value={selectedMonth}
              onChange={(e) => onFilterChange({
                product: selectedProduct,
                sku: selectedSKU,
                depot: selectedDepot,
                month: e.target.value,
                year: selectedYear
              })}
              className={`w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${loading || isDependentLoading ? 'opacity-70' : ''}`}
              disabled={loading || isDependentLoading}
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              {loading || isDependentLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
        
        {/* Year Dropdown */}
        <div className="relative">
          <label className="block text-xs text-white mb-1">Year</label>
          <div className="relative">
            <select 
              value={selectedYear}
              onChange={(e) => onFilterChange({
                product: selectedProduct,
                sku: selectedSKU,
                depot: selectedDepot,
                month: selectedMonth,
                year: e.target.value
              })}
              className={`w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${loading || isDependentLoading ? 'opacity-70' : ''}`}
              disabled={loading || isDependentLoading}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              {loading || isDependentLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {(loading || isDependentLoading) && (
        <div className="mt-2 text-xs text-gray-400 flex items-center">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Updating available options...
        </div>
      )}
    </div>
  );
}