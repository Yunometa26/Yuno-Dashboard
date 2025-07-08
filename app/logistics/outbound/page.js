'use client'

import { Truck, Workflow, Brain, Package2 } from 'lucide-react'

export default function OutboundLogisticsPage() {
  const cards = [
    { 
      id: 1, 
      title: "Workflow", 
      icon: <Workflow className="h-8 w-8 text-blue-500" />, 
      path: "/logistics/outbound/workflow",
      borderColor: "bg-blue-500"
    },
    { 
      id: 2, 
      title: "Constraint Based Planning", 
      icon: <Brain className="h-8 w-8 text-green-500" />, 
      path: "/logistics/outbound/constraint-based-planning",
      borderColor: "bg-green-500"
    },
    { 
      id: 3, 
      title: "Container Forecasting", 
      icon: <Package2 className="h-8 w-8 text-purple-500" />, 
      path: "/logistics/outbound/container-forecasting",
      borderColor: "bg-purple-500"
    }
  ];

  const handleCardClick = (path) => {
    console.log(`Navigating to ${path}`);
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673]">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-12 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 align-middle text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Truck className="h-12 w-12 text-white" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                      Outbound Logistics
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 max-w-4xl">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.path)}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer transform hover:-translate-y-1 hover:scale-105 h-32 flex flex-col"
              >
                <div className="p-3 flex-1 flex items-center justify-center">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-base font-semibold text-gray-800 leading-tight text-center flex-1 whitespace-nowrap pr-2">{card.title}</h3>
                    <div className="ml-2 flex-shrink-0">
                      {card.icon}
                    </div>
                  </div>
                </div>
                <div className={`${card.borderColor} h-2 w-full`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/logistics'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-8 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Logistics
          </button>
        </div>
      </div>
    </div>
  )
} 