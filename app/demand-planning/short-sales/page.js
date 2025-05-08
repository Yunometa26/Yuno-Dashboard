'use client'
import ShortfallCalculator from "@/app/components/demand-planning/short-sales/shortfall";

export default function HomePage() {
  return (
    // Main Content with Scrolling
    <main
      className="flex-1 overflow-y-auto p-4"
      style={{
        background: 'linear-gradient(135deg, #024673 0%, #5C99E3 50%, #756CE5 100%)',
      }}
    >
      <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  {/* Left side with text content */}
                  <div className="flex-1 space-y-5 align-middle text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                      <span className="text-white">Short Sales</span>
                    </h2>
                  </div>
                </div>
              </div>
            </div>
      <ShortfallCalculator />

      <div className="mt-8 flex justify-center">
          <button 
            onClick={() => window.location.href = '/demand-planning'}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Demand Planning
          </button>
        </div>

    </main>
  );
}

