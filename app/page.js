"use client"
import { useState } from 'react';
import { Search, BarChart2, Package, Factory, Settings, TrendingUp } from 'lucide-react';

export default function DashboardHomepage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const cards = [
    { 
      id: 1, 
      title: "Demand Planning", 
      icon: <BarChart2 className="h-8 w-8 text-blue-500" />, 
      path: "/demand-planning",
      borderColor: "bg-blue-500"
    },
    { 
      id: 2, 
      title: "Inventory Position", 
      icon: <Package className="h-8 w-8 text-green-500" />, 
      path: "/inventory-position",
      borderColor: "bg-green-500"
    },
    { 
      id: 3, 
      title: "Production", 
      icon: <Factory className="h-8 w-8 text-purple-500" />, 
      path: "/production",
      borderColor: "bg-purple-500"
    },
    { 
      id: 4, 
      title: "Machine Health", 
      icon: <Settings className="h-8 w-8 text-orange-500" />, 
      path: "/maintenance",
      borderColor: "bg-orange-500"
    },
    { 
      id: 5, 
      title: "Efficiency Metrics", 
      icon: <TrendingUp className="h-8 w-8 text-red-500" />, 
      path: "/efficiency-metrics",
      borderColor: "bg-red-500"
    }
  ];

  const handleCardClick = (path) => {
    // In a real app, this would use router.push(path) or similar
    console.log(`Navigating to ${path}`);
    window.location.href = path;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(`Searching for: ${searchQuery}`);
    // Implement actual search functionality here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] flex items-center justify-center">
      <div className="max-w-6xl w-full p-8">
      <div className="mb-12 w-full overflow-hidden">
        <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                {/* Left side with text content */}
                <div className="flex-1 space-y-5 align-middle text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    Welcome to Yunometa <span className="text-white">Enterprises Efficiency Dashboard</span>
                  </h2>
                </div>
              </div>
            </div>
          </div>
          </div>
        {/* Search Section */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative">
              <div className="flex items-center border-b border-gray-200">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-black" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-16 py-4 border-0 focus:ring-0 focus:outline-none text-lg text-black placeholder-gray-300"
                  placeholder="Search metrics, reports, or analytics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-8 py-4 text-sm font-medium transition-all duration-300 shadow-md rounded-lg absolute right-1"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.path)}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">{card.title}</h3>
                  {card.icon}
                </div>
              </div>
              <div className={`${card.borderColor} h-1 w-full`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}