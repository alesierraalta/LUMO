'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChoreoDebugLink() {
  const router = useRouter();

  useEffect(() => {
    // If JavaScript is enabled, redirect to choreo-status automatically
    router.push('/choreo-status');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Choreo Debug Access</h1>
        
        <p className="text-gray-600 mb-4">
          If you are not redirected automatically, please click the link below:
        </p>
        
        <a 
          href="/choreo-status" 
          className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Access Choreo Debug Dashboard
        </a>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-2">About This Page</h2>
          <p className="text-sm text-gray-600">
            This page provides direct access to the Choreo deployment debug dashboard, 
            bypassing normal authentication. It's designed for deployment troubleshooting 
            and system health monitoring.
          </p>
        </div>
      </div>
    </div>
  );
} 