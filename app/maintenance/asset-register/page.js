'use client';
import React from 'react';
import HierarchicalFlowchart from '@/app/components/machine-maintenance/asset-register/HierarchicalFlowchart';
import Home from '@/app/components/machine-maintenance/asset-register';
import HierarchicalFlowchart2 from '@/app/components/machine-maintenance/asset-register/HierarchicalFlowchart2';

export default function MachineAnalyticsPage() {
  return (
    <div className="p-4 bg-gradient-to-br from-[#024673] to-[#5C99E3] min-h-screen">
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              {/* Left side with text content */}
              <div className="flex-1 space-y-5 align-middle text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  <span className="text-white">Asset Register Dashboard</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
        
      <div>
        <div className=" p-4 bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-xl mt-5">
          <h2 className="text-xl font-semibold mb-4 text-white">Asset Inventory</h2>
          <p className="mb-6 text-white">
            Drill down through different levels to explore machine data by Month, Asset Category and Machine Name.
          </p>
          <HierarchicalFlowchart />
        </div>
      </div>

      <div>
        <div className=" p-4 bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-xl mt-5">
          <Home />
        </div>
      </div>

        <div className=" p-4 bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-xl mt-5">
          <HierarchicalFlowchart2 />
        </div>

      <div className="mt-8 flex justify-center">
          <button 
            onClick={() => window.location.href = '/maintenance'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Maintenance
          </button>
        </div>
    </div>
  );
}