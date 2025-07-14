'use client';

import React, { useState, useEffect } from 'react';
import { debug, debugSystem, LogLevel, DebugEntry, ExecutionState } from '@/lib/debug-system';

interface DebugDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugDashboard({ isOpen, onClose }: DebugDashboardProps) {
  const [logs, setLogs] = useState<DebugEntry[]>([]);
  const [executions, setExecutions] = useState<ExecutionState[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'executions' | 'state'>('logs');
  const [filterLevel, setFilterLevel] = useState<LogLevel>(LogLevel.TRACE);
  const [filterModule, setFilterModule] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh debug data
  const refreshData = () => {
    setLogs(debugSystem.getLogs(filterLevel, filterModule || undefined));
    setExecutions(debugSystem.getExecutionStates());
  };

  // Auto-refresh every 1 second
  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(refreshData, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isOpen, filterLevel, filterModule]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, filterLevel, filterModule]);

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.TRACE: return 'text-gray-400';
      case LogLevel.DEBUG: return 'text-blue-400';
      case LogLevel.INFO: return 'text-green-400';
      case LogLevel.WARN: return 'text-yellow-400';
      case LogLevel.ERROR: return 'text-red-400';
      case LogLevel.FATAL: return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const activeExecutions = executions.filter(e => e.status === 'started');
  const completedExecutions = executions.filter(e => e.status !== 'started').slice(-20);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">🔧 Debug Dashboard</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto Refresh</span>
            </label>
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => {
                debugSystem.clear();
                refreshData();
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              🗑️ Clear
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 p-3 bg-gray-800 border-b border-gray-700 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Active Executions: {activeExecutions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Total Logs: {logs.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span>Errors: {logs.filter(l => l.level >= LogLevel.ERROR).length}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(['logs', 'executions', 'state'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab === 'logs' && '📄 Logs'}
              {tab === 'executions' && '⚡ Executions'}
              {tab === 'state' && '📊 State'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <label className="text-sm">Level:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(Number(e.target.value) as LogLevel)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
            >
              <option value={LogLevel.TRACE}>TRACE</option>
              <option value={LogLevel.DEBUG}>DEBUG</option>
              <option value={LogLevel.INFO}>INFO</option>
              <option value={LogLevel.WARN}>WARN</option>
              <option value={LogLevel.ERROR}>ERROR</option>
              <option value={LogLevel.FATAL}>FATAL</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Module:</label>
            <input
              type="text"
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              placeholder="Filter by module..."
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-40"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'logs' && (
            <div className="h-full overflow-auto p-4 space-y-2">
              {logs.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No logs available</div>
              ) : (
                logs.slice(-100).reverse().map((log) => (
                  <div key={log.id} className="bg-gray-800 rounded p-3 border border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
                        <span className={`text-xs font-bold ${getLevelColor(log.level)}`}>
                          {LogLevel[log.level]}
                        </span>
                        <span className="text-sm font-medium text-blue-300">{log.module}</span>
                        <span className="text-sm text-gray-300">{log.function}</span>
                      </div>
                    </div>
                    <div className="text-sm mb-2">{log.message}</div>
                    {log.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-blue-400">📊 Data</summary>
                        <pre className="mt-1 text-xs bg-gray-900 p-2 rounded overflow-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.error && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-red-400">❌ Error</summary>
                        <pre className="mt-1 text-xs bg-red-900 p-2 rounded overflow-auto">
                          {log.error.message}
                          {log.stackTrace && `\n\n${log.stackTrace}`}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'executions' && (
            <div className="h-full overflow-auto">
              <div className="p-4 space-y-4">
                {/* Active Executions */}
                {activeExecutions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-blue-400">🔄 Active Executions</h3>
                    <div className="space-y-2">
                      {activeExecutions.map((exec, index) => (
                        <div key={index} className="bg-blue-900 rounded p-3 border border-blue-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{exec.functionName}</span>
                            <span className={`text-sm ${getStatusColor(exec.status)}`}>
                              {exec.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-300">
                            Running for: {Math.round((Date.now() - exec.startTime) / 1000)}s
                          </div>
                          {Object.keys(exec.variables).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-blue-400">📋 Variables</summary>
                              <pre className="mt-1 text-xs bg-gray-900 p-2 rounded overflow-auto">
                                {JSON.stringify(exec.variables, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Executions */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-green-400">✅ Recent Completed Executions</h3>
                  <div className="space-y-2">
                    {completedExecutions.length === 0 ? (
                      <div className="text-gray-400 text-center py-4">No completed executions</div>
                    ) : (
                      completedExecutions.reverse().map((exec, index) => (
                        <div key={index} className={`rounded p-3 border ${
                          exec.status === 'completed' 
                            ? 'bg-green-900 border-green-700' 
                            : 'bg-red-900 border-red-700'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{exec.functionName}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${getStatusColor(exec.status)}`}>
                                {exec.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-300">
                                {exec.duration}ms
                              </span>
                            </div>
                          </div>
                          {exec.error && (
                            <div className="text-xs text-red-300 mt-1">
                              Error: {exec.error.message}
                            </div>
                          )}
                          {Object.keys(exec.variables).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-blue-400">📋 Variables</summary>
                              <pre className="mt-1 text-xs bg-gray-900 p-2 rounded overflow-auto">
                                {JSON.stringify(exec.variables, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'state' && (
            <div className="h-full overflow-auto p-4">
              <div className="space-y-4">
                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                  <h3 className="text-lg font-medium mb-3 text-purple-400">📊 Debug System State</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total Logs:</span>
                      <span className="ml-2 text-white">{logs.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Active Executions:</span>
                      <span className="ml-2 text-white">{activeExecutions.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Error Logs:</span>
                      <span className="ml-2 text-red-400">{logs.filter(l => l.level >= LogLevel.ERROR).length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Warning Logs:</span>
                      <span className="ml-2 text-yellow-400">{logs.filter(l => l.level === LogLevel.WARN).length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                  <h3 className="text-lg font-medium mb-3 text-purple-400">🎛️ Debug Controls</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Log Level</label>
                      <select
                        value={debugSystem.getLogLevel()}
                        onChange={(e) => debugSystem.setLogLevel(Number(e.target.value) as LogLevel)}
                        className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                      >
                        <option value={LogLevel.TRACE}>TRACE</option>
                        <option value={LogLevel.DEBUG}>DEBUG</option>
                        <option value={LogLevel.INFO}>INFO</option>
                        <option value={LogLevel.WARN}>WARN</option>
                        <option value={LogLevel.ERROR}>ERROR</option>
                        <option value={LogLevel.FATAL}>FATAL</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => debugSystem.enable()}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                      >
                        ✅ Enable Debug
                      </button>
                      <button
                        onClick={() => debugSystem.disable()}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                      >
                        ❌ Disable Debug
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Debug Dashboard Toggle Component
export function DebugToggle() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg border border-gray-600"
        title="Open Debug Dashboard"
      >
        🔧
      </button>

      <DebugDashboard isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}