import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Log the error for debugging
    console.error('Client-side error reported:', {
      timestamp: new Date().toISOString(),
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      error: body
    });
    
    // In a production environment, you might want to:
    // - Send errors to an error tracking service (Sentry, LogRocket, etc.)
    // - Store errors in a database
    // - Send alerts for critical errors
    
    return NextResponse.json({ 
      success: true, 
      message: 'Error reported successfully' 
    });
  } catch (error) {
    console.error('Error processing error report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Error reporting endpoint is active',
    timestamp: new Date().toISOString()
  });
}