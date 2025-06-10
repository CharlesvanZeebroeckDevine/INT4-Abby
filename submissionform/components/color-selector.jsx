"use client"

import { Check } from "lucide-react"

const colors = [
  { name: "Green", value: "#01A569" },
  { name: "Yellow", value: "#FFBF50" },
  { name: "Purple", value: "#BA7CD1" },
  { name: "Blue", value: "#608FFF" },
  { name: "Red", value: "#FF5F02" },
  { name: "Black", value: "#000000" },
]

export function ColorSelector({ selectedColor, onColorSelect }) {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
      {colors.map((color) => (
        <button
          key={color.value}
          onClick={() => onColorSelect(color.value)}
          className={`w-16 h-16 rounded-full border-4 transition-all duration-200 ${
            selectedColor === color.value ? "border-gray-800 scale-110" : "border-gray-200 hover:border-gray-400"
          }`}
          style={{ backgroundColor: color.value }}
          aria-label={`Select ${color.name} color`}
        >
          {selectedColor === color.value && <Check className="w-6 h-6 text-white mx-auto" />}
        </button>
      ))}
    </div>
  )
}
