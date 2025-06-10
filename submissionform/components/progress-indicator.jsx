"use client"

import { Check } from "lucide-react"

const steps = [
  { id: 1, name: "Profile" },
  { id: 2, name: "Avatar" },
  { id: 3, name: "Artwork" },
  { id: 4, name: "Contact" },
  { id: 5, name: "Success" },
]

export function ProgressIndicator({ currentStep }) {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`progress-step ${
                index < currentStep ? "completed" : index === currentStep ? "active" : "inactive"
              }`}
            >
              {index < currentStep ? <Check className="w-4 h-4" /> : step.id}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${index < currentStep ? "bg-abby-green" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        {steps.map((step) => (
          <span key={step.id} className="text-center">
            {step.name}
          </span>
        ))}
      </div>
    </div>
  )
}
