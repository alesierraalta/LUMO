"use client";

import { useState } from 'react';

interface DebugLog {
  timestamp: string;
  type: 'event' | 'state' | 'error' | 'network' | 'render';
  message: string;
  data?: any;
}

interface DebugOverlayProps {
  logs: DebugLog[];
  isVisible: boolean;
  onToggle: () => void;
}

export function DebugOverlay({ logs, isVisible, onToggle }: DebugOverlayProps) {
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<number[]>([]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-red-500 text-white px-2 py-1 rounded text-xs"
        title="Press Ctrl+Shift+D to toggle"
      >
        🐛
      </button>
    );
  }

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.type === filter
  );

  const toggleExpanded = (index: number) => {
    setExpanded(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'event': return 'text-blue-600 bg-blue-50';
      case 'network': return 'text-green-600 bg-green-50';
      case 'state': return 'text-purple-600 bg-purple-50';
      case 'render': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white border-l shadow-lg z-40 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 bg-gray-100 border-b flex items-center justify-between">
        <h3 className="font-bold text-sm">Debug Console</h3>
        <div className="flex gap-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border rounded px-1"
          >
            <option value="all">All</option>
            <option value="error">Errors</option>
            <option value="event">Events</option>
            <option value="network">Network</option>
            <option value="state">State</option>
            <option value="render">Render</option>
          </select>
          <button
            onClick={onToggle}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-2 bg-gray-50 border-b text-xs">
        <div className="grid grid-cols-5 gap-1">
          {['error', 'event', 'network', 'state', 'render'].map(type => (
            <div key={type} className="text-center">
              <div className={`rounded px-1 ${getTypeColor(type)}`}>
                {logs.filter(l => l.type === type).length}
              </div>
              <div className="text-gray-500 mt-1">{type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredLogs.slice(-50).reverse().map((log, index) => (
          <div
            key={index}
            className={`text-xs border rounded p-2 cursor-pointer ${getTypeColor(log.type)}`}
            onClick={() => toggleExpanded(index)}
          >
            <div className="flex justify-between items-start">
              <span className="font-mono font-bold">{log.type.toUpperCase()}</span>
              <span className="text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-1">{log.message}</div>
            {log.data && expanded.includes(index) && (
              <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No logs for filter: {filter}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-2 bg-gray-100 border-t">
        <div className="text-xs text-gray-600 mb-2">Quick Actions:</div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              const buttons = document.querySelectorAll('button');
              console.log('All buttons:', buttons);
              alert(`Found ${buttons.length} buttons`);
            }}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
          >
            Check Buttons
          </button>
          <button
            onClick={() => {
              const fixed = document.querySelectorAll('[class*="fixed"]');
              console.log('Fixed elements:', fixed);
              alert(`Found ${fixed.length} fixed elements`);
            }}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded"
          >
            Check Fixed
          </button>
        </div>
      </div>
    </div>
  );
}