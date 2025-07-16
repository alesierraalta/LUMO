import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ErrorReport {
  message: string;
  stack?: string;
  digest?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorReport = await request.json();
    
    // Log error with structured format for monitoring
    console.error('🚨 CLIENT ERROR REPORT:', {
      timestamp: errorData.timestamp,
      message: errorData.message,
      url: errorData.url,
      userAgent: errorData.userAgent,
      digest: errorData.digest,
      stack: errorData.stack?.substring(0, 500) // Truncate stack trace
    });

    // In production, you might want to send this to a monitoring service
    // like Sentry, LogRocket, or similar
    
    return NextResponse.json({ 
      success: true, 
      message: 'Error report received' 
    });
  } catch (error) {
    console.error('Failed to process error report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}