// SavingsPlan component for displaying personalized savings plans
"use client";

import React, { useState } from "react";

/**
 * SavingsPlan component displays personalized savings strategies and goals
 * @returns The savings plan component
 */
const SavingsPlan: React.FC = () => {
  const [goals] = useState<Array<{
    id: number;
    description: string;
    target: number;
    current: number;
    progress: number;
  }>>([
    {
      id: 1,
      description: "Emergency Fund",
      target: 5000,
      current: 1250,
      progress: 25
    },
    {
      id: 2,
      description: "Vacation Savings",
      target: 3000,
      current: 800,
      progress: 27
    }
  ]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Savings Goals
      </h3>

      {goals.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No savings goals yet. Connect your wallet and start a conversation to create
          your first goal!
        </p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{goal.description}</h4>
                <span className="text-sm text-gray-500">
                  ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>{goal.progress}% complete</span>
                <span>${(goal.target - goal.current).toLocaleString()} remaining</span>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              ¡ <strong>AI Recommendation:</strong> Based on your current progress,
              consider increasing monthly contributions by 15% to reach your
              goals faster.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsPlan;