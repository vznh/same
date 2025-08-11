// components/molecules/FrameContent
'use client'

import { useState } from 'react'

// Text Frame Content
export function TextFrameContent() {
  const [text, setText] = useState('This is a text frame. Click to edit!')
  const [isEditing, setIsEditing] = useState(false)
  
  return (
    <div className="w-full h-full">
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setIsEditing(false)}
          className="w-full h-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <div
          className="w-full h-full p-2 cursor-text hover:bg-gray-50 rounded"
          onClick={() => setIsEditing(true)}
        >
          {text}
        </div>
      )}
    </div>
  )
}

// Image Frame Content
export function ImageFrameContent() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">🖼️</div>
        <div className="text-sm">Image Frame</div>
        <div className="text-xs mt-1">Drag & drop an image here</div>
      </div>
    </div>
  )
}

// Browser Frame Content
export function BrowserFrameContent() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
      <div className="flex-1 bg-gray-100 rounded flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🌐</div>
          <div className="text-sm">Browser Frame</div>
          <div className="text-xs mt-1">Enter URL to browse</div>
        </div>
      </div>
    </div>
  )
}

// Custom Frame Content - Example with buttons and interactions
export function CustomFrameContent() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
      <div className="text-2xl font-bold text-gray-700">Counter: {count}</div>
      <div className="flex space-x-2">
        <button
          onClick={() => setCount(count - 1)}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          -
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          +
        </button>
      </div>
      <div className="text-xs text-gray-500 text-center">
        This frame contains custom React components
      </div>
    </div>
  )
}

// HTML Attributes Frame Content - Demonstrates hosting any HTML content
export function HTMLFrameContent() {
  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold mb-2">HTML Content Frame</h3>
      <p className="text-sm text-gray-600 mb-3">
        This frame can host any HTML content with full styling.
      </p>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>Lists and formatting</li>
        <li>Custom CSS classes</li>
        <li>Interactive elements</li>
        <li>Any React components</li>
      </ul>
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
        <strong>Note:</strong> Frames are content-agnostic containers!
      </div>
    </div>
  )
} 