'use client';

import React from "react";
import { Timer, TrendingDown, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ContinuousMonitoringPage() {
  const router = useRouter();
  const monitoringCards = [
    {
      id: 1,
      title: "Cycle Time",
      icon: <Timer className="h-8 w-8 text-blue-500" />,
      path: "/efficiency-metrics/continuous-monitoring/cycle-time",
      borderColor: "bg-blue-500"
    },
    {
      id: 2,
      title: "Deviation",
      icon: <TrendingDown className="h-8 w-8 text-red-500" />,
      path: "/efficiency-metrics/continuous-monitoring/deviation",
      borderColor: "bg-red-500"
    },
    {
      id: 3,
      title: "OPE",
      icon: <BarChart2 className="h-8 w-8 text-green-500" />,
      path: "/efficiency-metrics/continuous-monitoring/ope",
      borderColor: "bg-green-500"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#024673] to-[#5C99E3] flex items-center justify-center">
      <div className="max-w-4xl w-full p-8">
        {/* Header Card */}
        <div className="mb-8 w-full overflow-hidden">
          <div className="bg-opacity-15 backdrop-blur-sm m-1 rounded-xl bg-gradient-to-r from-[#024673] to-[#5C99E3]">
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1 space-y-5 align-middle text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    Continuous Monitoring
                  </h2>
                  <p className="text-white text-lg">Monitor key metrics for operational excellence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {monitoringCards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer transform hover:-translate-y-1"
              onClick={() => card.path && router.push(card.path)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">{card.title}</h3>
                  {card.icon}
                </div>
                {card.description && <p className="text-gray-600 mt-2">{card.description}</p>}
              </div>
              <div className={`${card.borderColor} h-2 w-full`}></div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => window.location.href = "/"}
            className="bg-gradient-to-r from-[#024673] to-[#5C99E3] hover:from-[#023d63] hover:to-[#4b88d2] text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
