import { NextRequest, NextResponse } from 'next/server';

// Special direct access route to the Choreo debug dashboard
// This can be accessed via /debug and will redirect to /choreo-status
export function GET(request: NextRequest) {
  // Add special header for tracking debug access
  const headers = new Headers();
  headers.set('X-Choreo-Debug-Access', 'Direct');
  
  // Log the access (would be enhanced in a real implementation)
  console.log(`[${new Date().toISOString()}] Direct debug access request from ${request.headers.get('user-agent')}`);
  
  // Redirect to the actual dashboard
  return NextResponse.redirect(new URL('/choreo-status', request.url), {
    headers,
    status: 307 // Temporary redirect
  });
} 