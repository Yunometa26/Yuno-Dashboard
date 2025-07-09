'use client'

<<<<<<< HEAD
import { Brain } from 'lucide-react'

export default function ConstraintBasedPlanningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673]">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-12 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 align-middle text-center">
=======
import { Brain, MapPin, Warehouse } from 'lucide-react'

export default function ConstraintBasedPlanningPage() {
  const cards = [
    { 
      id: 1, 
      title: "Route Optimization", 
      icon: <MapPin className="h-8 w-8 text-blue-500" />, 
      path: "/logistics/outbound/constraint-based-planning/route-optimization",
      borderColor: "bg-blue-500"
    },
    { 
      id: 2, 
      title: "Yard Allocation", 
      icon: <Warehouse className="h-8 w-8 text-green-500" />, 
      path: "/logistics/outbound/constraint-based-planning/yard-allocation",
      borderColor: "bg-green-500"
    }
  ];

  const handleCardClick = (path) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] flex items-center justify-center">
      <div className="max-w-6xl w-full p-8">
        {/* Header Section */}
        <div className="mb-12 w-full overflow-hidden">
          <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 text-center">
>>>>>>> 7dd2666b1a66846507b7a2739126898d25c74f1e
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Brain className="h-12 w-12 text-white" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                      Constraint Based Planning
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* No Data Content */}
        <div className="rounded-lg shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-12 text-center">
            <Brain className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">No Data Available</h3>
            <p className="text-gray-400 text-lg">There is currently no data to display for this section.</p>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/logistics/outbound'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-8 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
=======
        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => window.location.href = '/logistics/outbound'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
>>>>>>> 7dd2666b1a66846507b7a2739126898d25c74f1e
          >
            Back to Outbound Logistics
          </button>
        </div>
      </div>
    </div>
  )
} 