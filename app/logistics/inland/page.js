'use client'

import { Warehouse } from 'lucide-react'

export default function InboundLogisticsPage() {

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
                    <Warehouse className="h-12 w-12 text-white" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                      Inbound Logistics
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="rounded-lg shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'rgba(0, 31, 71, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-12 text-center">
            <Warehouse className="h-24 w-24 text-green-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">Inbound Logistics Dashboard</h3>
            <p className="text-gray-300 text-lg">Content will be implemented based on company requirements</p>
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