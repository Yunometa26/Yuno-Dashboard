"use client"
import { useState } from 'react';
import { Search, ClipboardList, Calendar, FileCheck, Wrench, LineChart } from 'lucide-react';

export default function DashboardHomepage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const cards = [
    { 
      id: 1, 
      title: "Asset Register", 
      icon: <ClipboardList className="h-8 w-8 text-blue-500" />,
      path: "/maintenance/asset-register",
      borderColor: "bg-blue-500"
    },
    { 
      id: 2, 
      title: "Smart Maintenance", 
      icon: <Calendar className="h-8 w-8 text-green-500" />, 
      path: "/maintenance/smart-maintenance",
      borderColor: "bg-green-500"
    },
    { 
      id: 3, 
      title: "Smart Health", 
      icon: <FileCheck className="h-8 w-8 text-purple-500" />, 
      path: "/maintenance/smart-health",
      borderColor: "bg-purple-500"
    },
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
                    Welcome to Yunometa <span className="text-white">Maintenance Dashboard</span>
                  </h2>
                </div>
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
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}