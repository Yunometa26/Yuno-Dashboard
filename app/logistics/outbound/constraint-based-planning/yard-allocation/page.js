'use client'

import { Warehouse } from 'lucide-react'

export default function YardAllocationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673]">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-12 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Warehouse className="h-12 w-12 text-white" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                      Yard Allocation
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="rounded-lg shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-12 text-center">
            <Warehouse className="h-24 w-24 text-green-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">Yard Allocation Management</h3>
            <p className="text-gray-400 text-lg mb-6">
              Efficiently manage warehouse yard space and dock allocation for optimal throughput.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-green-500/20 p-4 rounded-lg border border-green-500/30">
                <h4 className="text-green-300 font-semibold mb-2">Space Optimization</h4>
                <p className="text-gray-300 text-sm">Maximize yard utilization and reduce congestion</p>
              </div>
              <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30">
                <h4 className="text-blue-300 font-semibold mb-2">Dock Scheduling</h4>
                <p className="text-gray-300 text-sm">Coordinate loading/unloading operations</p>
              </div>
              <div className="bg-orange-500/20 p-4 rounded-lg border border-orange-500/30">
                <h4 className="text-orange-300 font-semibold mb-2">Resource Planning</h4>
                <p className="text-gray-300 text-sm">Allocate equipment and personnel efficiently</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/logistics/outbound/constraint-based-planning'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-8 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Constraint Based Planning
          </button>
        </div>
      </div>
    </div>
  )
} 