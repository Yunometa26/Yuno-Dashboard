'use client';

import { TrendingUp, Award } from 'lucide-react';

export default function ForecastMetrics({ 
  isLoading, 
  totalFitted = 0, 
  lastFittedValue = 0,
  firstForecastValue = 0, // New prop to receive the first forecast value
  accuracyRate = 0,
  selectedMonth = 'All',
  selectedYear = 'All',
  hasFittedData = true // New prop to indicate if filtered data has fitted values
}) {
  // Helper function to determine if we're showing filtered data
  const isFiltered = selectedMonth !== 'All' || selectedYear !== 'All';
  
  // Determine which value to display and what label to use
  const displayValue = hasFittedData ? lastFittedValue : firstForecastValue;
  const valueLabel = hasFittedData ? "Latest Forecast" : "Forecast";
  const valueDescription = hasFittedData ? "Most Recent Value" : "Forecasted Value";
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Latest Fitted/Forecast Value Card */}
      <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-xl shadow-sm p-6 border border-blue-400 border-opacity-20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              {valueLabel} {isFiltered && <span className="text-white ml-1">(Filtered)</span>}
            </p>
            {isLoading ? (
              <div className="h-8 w-28 bg-blue-300 animate-pulse rounded-md mt-1"></div>
            ) : (
              <h3 className="text-3xl font-bold mt-1 text-white">{displayValue.toLocaleString()}</h3>
            )}
            
            <div className="mt-4 flex items-center">
              {isLoading ? (
                <div className="h-5 w-16 bg-blue-300 animate-pulse rounded-md"></div>
              ) : (
                <>
                  <div className="flex items-center text-white">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">{valueDescription}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className={`${hasFittedData ? 'bg-blue-50' : 'bg-amber-50'} p-3 rounded-lg`}>
            <TrendingUp className={`w-8 h-8 ${hasFittedData ? 'text-blue-500' : 'text-amber-500'}`} />
          </div>
        </div>
      </div>
      
      {/* Accuracy Card */}
      <div className="bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-xl shadow-md p-6 border border-blue-400 border-opacity-20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              Average Accuracy {isFiltered && <span className="text-white ml-1">(Filtered)</span>}
            </p>
            {isLoading ? (
              <div className="h-8 w-24 bg-blue-100 animate-pulse rounded-md mt-1"></div>
            ) : (
              <h3 className="text-3xl font-bold mt-1 text-white">{accuracyRate}%</h3>
            )}
            
            <div className="mt-4 flex items-center">
              {isLoading ? (
                <div className="h-5 w-16 bg-blue-300 bg-opacity-20 animate-pulse rounded-md"></div>
              ) : (
                <>
                  <div className="flex items-center text-white">
                    <Award className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Forecast Accuracy</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg">
            <Award className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
}