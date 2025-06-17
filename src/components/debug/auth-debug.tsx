'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthDebugStats {
  totalCalls: number;
  lastCallTime?: number;
  callHistory: Array<{
    id: number;
    timestamp: number;
    duration?: number;
    success: boolean;
  }>;
}

export const AuthDebugPanel = () => {
  const [stats, setStats] = useState<AuthDebugStats>({
    totalCalls: 0,
    callHistory: []
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Monitor console logs for auth API calls
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('[Auth API Call')) {
        const callMatch = message.match(/\[Auth API Call #(\d+)\]/);
        const durationMatch = message.match(/completed in (\d+)ms/);
        
        if (callMatch) {
          const callId = parseInt(callMatch[1]);
          
          setStats(prev => {
            const newHistory = [...prev.callHistory];
            const existingIndex = newHistory.findIndex(call => call.id === callId);
            
            if (existingIndex >= 0) {
              // Update existing call
              if (durationMatch) {
                newHistory[existingIndex].duration = parseInt(durationMatch[1]);
                newHistory[existingIndex].success = message.includes('✅');
              }
            } else {
              // New call
              newHistory.push({
                id: callId,
                timestamp: Date.now(),
                success: message.includes('✅')
              });
            }
            
            return {
              totalCalls: Math.max(prev.totalCalls, callId),
              lastCallTime: Date.now(),
              callHistory: newHistory.slice(-10) // Keep last 10 calls
            };
          });
        }
      }
      
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
        >
          🐛 Auth Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex justify-between items-center">
            🐛 Auth API Debug
            <Button 
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div className="flex justify-between">
            <span>Total API Calls:</span>
            <span className={stats.totalCalls > 5 ? "text-red-600 font-bold" : "text-green-600"}>
              {stats.totalCalls}
            </span>
          </div>
          
          {stats.lastCallTime && (
            <div className="flex justify-between">
              <span>Last Call:</span>
              <span>{new Date(stats.lastCallTime).toLocaleTimeString()}</span>
            </div>
          )}
          
          <div className="border-t pt-2">
            <div className="font-semibold mb-1">Recent Calls:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {stats.callHistory.length === 0 ? (
                <div className="text-gray-500">No calls detected</div>
              ) : (
                stats.callHistory.map((call, index) => (
                  <div key={call.id} className="flex justify-between text-xs">
                    <span>#{call.id}</span>
                    <span className={call.success ? "text-green-600" : "text-red-600"}>
                      {call.duration ? `${call.duration}ms` : 'pending'}
                      {call.success ? ' ✅' : ' ❌'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {stats.totalCalls > 3 && (
            <div className="bg-red-100 border border-red-300 rounded p-2 text-red-700">
              ⚠️ Multiple API calls detected! This may slow down your app.
            </div>
          )}
          
          <Button 
            onClick={() => setStats({ totalCalls: 0, callHistory: [] })}
            variant="outline"
            size="sm"
            className="w-full h-6 text-xs"
          >
            Reset Stats
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 