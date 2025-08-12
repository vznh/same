// components/molecules/PatternBackground
'use client'

export default function PatternBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none bg-gray-100"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(0, 0, 0, 0.25) 2px, transparent 2px)
        `,
        backgroundSize: '50px 50px',
        backgroundPosition: '0 0',
        width: '100%',
        height: '100%',
      }}
    />
  )
} 