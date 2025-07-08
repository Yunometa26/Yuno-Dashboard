"use client"
import { Truck, Package } from 'lucide-react';

export default function LogisticsPage() {
  
  const cards = [
    { 
      id: 1, 
      title: "Outbound Logistics", 
      icon: <Truck className="h-8 w-8 text-blue-500" />, 
      path: "/logistics/outbound",
      borderColor: "bg-blue-500"
    },
    { 
      id: 2, 
      title: "Inland Logistics", 
      icon: <Package className="h-8 w-8 text-green-500" />, 
      path: "/logistics/inland",
      borderColor: "bg-green-500"
    }
  ];

  const handleCardClick = (path) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] flex flex-col">
      <div className="max-w-6xl mx-auto p-6 flex-1 flex flex-col justify-center">
        {/* Header Section */}
        <div className="mb-6 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673]/30 to-[#5C99E3]/30" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    Logistics Management
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.path)}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer transform hover:-translate-y-1 hover:scale-105"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-gray-800">{card.title}</h3>
                    {card.icon}
                  </div>
                </div>
                <div className={`${card.borderColor} h-2 w-full`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-8 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 