'use client'

import { Users } from 'lucide-react'

export default function ResourcePlanningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#024673] via-[#024673] to-[#024673]">
      <div className="w-full px-4">
        {/* Header Section */}
        <div className="mb-12 w-full overflow-hidden">
          <div className="backdrop-blur-sm m-1 rounded-xl" style={{ backgroundColor: 'rgba(0, 31, 71, 0.8)' }}>
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 align-middle text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    Resource Library
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Workflow Image Section */}
        <div className="w-full py-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-left">Resource Library Workflow</h3>
          <div className="w-full overflow-x-auto" style={{margin: '16px 0'}}>
            <div style={{display: 'inline-block', background: '#011a36', border: '2px solid #1e293b', borderRadius: '12px', padding: '8px'}}>
              <img src="/workflow-image.png" alt="Resource Library Workflow" style={{height: '500px', width: 'auto', minWidth: '2000px', maxWidth: 'none', objectFit: 'contain', display: 'block'}} />
            </div>
          </div>
        </div>
        {/* Form and Table Example Stacked Vertically */}
        <div className="w-full py-8">
          {/* Form Example */}
          <div className="flex flex-col items-center w-full mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">Raw Materials Procurement Form Example</h3>
            <div style={{background: '#011a36', border: '2px solid #1e293b', borderRadius: '12px', padding: '2px 8px', display: 'block', width: '100%'}}>
              <img src="/procurement-form-example.png" alt="Raw Materials Procurement Form Example" style={{width: '100%', maxWidth: '900px', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto'}} />
            </div>
          </div>
          {/* Table Example */}
          <div className="flex flex-col items-center w-full">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">Stock Table Example</h3>
            <div style={{background: '#011a36', border: '2px solid #1e293b', borderRadius: '12px', padding: '8px 4px', display: 'block', width: '100%'}}>
              <img src="/stock-table-example.png" alt="Stock Table Example" style={{width: '100%', maxWidth: '900px', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto'}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 