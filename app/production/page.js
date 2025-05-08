"use client"
import React from 'react';
import { Factory, BarChart3 } from 'lucide-react';

export default function DemandPlanningPage() {
  const cards = [
    { 
      id: 1, 
      title: "Production Planning", 
      icon: <Factory className="h-8 w-8 text-blue-500" />,  
      path: "/production/production-planning",
      borderColor: "bg-blue-500"
    },
    { 
      id: 2, 
      title: "Production Target vs Actual", 
      icon: <BarChart3 className="h-8 w-8 text-green-500" />,
      path: "/production/production-target",
      borderColor: "bg-green-500"
    },
  ];

  const handleCardClick = (path) => {
    // In a real app, this would use router.push(path) or similar
    console.log(`Navigating to ${path}`);
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] flex items-center justify-center">
      <div className="max-w-6xl w-full p-8">
        {/* Hero Section */}
        <div className="mb-12 w-full overflow-hidden">
            <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  {/* Left side with text content */}
                  <div className="flex-1 space-y-5 align-middle text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                      Welcome to Yunometa <span className="text-white">Production Dashboard</span>
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Cards Section - Adjusted for two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
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
        
        {/* Back to Dashboard Button */}
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