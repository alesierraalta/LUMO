import { NextRequest, NextResponse } from 'next/server';

// Expected values for comparison
const EXPECTED_VALUES = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://ubjujxtvlubxowsphvuk.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4',
  SUPABASE_URL: 'https://ubjujxtvlubxowsphvuk.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUxMjM4NCwiZXhwIjoyMDY1MDg4Mzg0fQ.dBKGr8BqLGDSGAkCHnHI8FJQb-tTOaQ3gLHo_8rl4Eo',
  JWT_SECRET: 'pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg==',
  DATABASE_URL: 'postgresql://postgres.ubjujxtvlubxowsphvuk:Theale05042013$$@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
  NEXTAUTH_URL: 'https://lumo-1615540597.choreoapis.dev',
  NEXTAUTH_SECRET: 'pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg=='
};

// Common placeholder patterns
const PLACEHOLDER_PATTERNS = [
  /your[_-]?project[_-]?id/i,
  /your[_-]?supabase[_-]?url/i,
  /your[_-]?anon[_-]?key/i,
  /your[_-]?api[_-]?key/i,
  /placeholder/i,
  /example/i,
  /insert[_-]?here/i,
  /replace[_-]?me/i,
  /^your_/i,
  /^https:\/\/your-/i,
  /_here$/i
];

function maskSensitiveValue(key: string, value: string): string {
  if (!value) return '[NOT SET]';
  
  // Don't mask URLs completely
  if (key.includes('URL') || key.includes('url')) {
    return value;
  }
  
  // Mask keys and secrets but show enough to verify
  if (value.length > 20) {
    return `${value.substring(0, 10)}...${value.substring(value.length - 10)}`;
  } else if (value.length > 10) {
    return `${value.substring(0, 5)}...${value.substring(value.length - 5)}`;
  }
  
  return `${value.substring(0, 3)}...`;
}

function isPlaceholder(value: string): boolean {
  if (!value) return true;
  
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(value));
}

function getVariableStatus(key: string, currentValue: string, expectedValue: string) {
  if (!currentValue) {
    return { status: 'MISSING', color: '🔴', issue: 'Variable not set' };
  }
  
  if (isPlaceholder(currentValue)) {
    return { status: 'PLACEHOLDER', color: '🟡', issue: 'Contains placeholder text' };
  }
  
  if (currentValue === expectedValue) {
    return { status: 'CORRECT', color: '🟢', issue: null };
  }
  
  return { status: 'INCORRECT', color: '🟠', issue: 'Value does not match expected' };
}

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      choreoEnv: process.env.CHOREO_ENVIRONMENT || 'unknown',
      summary: {
        total: 0,
        correct: 0,
        incorrect: 0,
        placeholder: 0,
        missing: 0
      },
      variables: {},
      recommendations: []
    };

    // Check all expected variables
    for (const [key, expectedValue] of Object.entries(EXPECTED_VALUES)) {
      const currentValue = process.env[key] || '';
      const status = getVariableStatus(key, currentValue, expectedValue);
      
      results.variables[key] = {
        current: maskSensitiveValue(key, currentValue),
        currentRaw: currentValue, // For placeholder detection
        expected: maskSensitiveValue(key, expectedValue),
        status: status.status,
        indicator: status.color,
        issue: status.issue,
        isPlaceholder: isPlaceholder(currentValue),
        length: currentValue.length
      };

      results.summary.total++;
      switch (status.status) {
        case 'CORRECT': results.summary.correct++; break;
        case 'INCORRECT': results.summary.incorrect++; break;
        case 'PLACEHOLDER': results.summary.placeholder++; break;
        case 'MISSING': results.summary.missing++; break;
      }
    }

    // Generate recommendations
    if (results.summary.placeholder > 0) {
      results.recommendations.push({
        type: 'CRITICAL',
        message: `${results.summary.placeholder} variables contain placeholder text. Update these in Choreo console.`,
        action: 'Replace placeholder values with real values from PRODUCTION_ENV.txt'
      });
    }

    if (results.summary.missing > 0) {
      results.recommendations.push({
        type: 'ERROR',
        message: `${results.summary.missing} variables are missing.`,
        action: 'Add missing environment variables to Choreo console'
      });
    }

    if (results.summary.incorrect > 0) {
      results.recommendations.push({
        type: 'WARNING',
        message: `${results.summary.incorrect} variables have incorrect values.`,
        action: 'Verify and update incorrect values in Choreo console'
      });
    }

    if (results.summary.correct === results.summary.total) {
      results.recommendations.push({
        type: 'SUCCESS',
        message: 'All environment variables are correctly configured!',
        action: 'No action needed - configuration is perfect'
      });
    }

    // Add specific Choreo configuration guide
    results.choreoConfiguration = {
      title: 'Choreo Environment Variables Configuration',
      description: 'Copy these exact values to your Choreo deployment console:',
      variables: Object.entries(EXPECTED_VALUES).map(([key, value]) => ({
        name: key,
        value: value,
        description: getVariableDescription(key)
      }))
    };

    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Environment debug error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze environment configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getVariableDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL for client-side access',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key for client-side access',
    'SUPABASE_URL': 'Supabase project URL for server-side access',
    'SUPABASE_KEY': 'Supabase service role key for server-side access',
    'JWT_SECRET': 'Secret key for JWT token signing and verification',
    'DATABASE_URL': 'PostgreSQL connection string with pooler',
    'NEXTAUTH_URL': 'Base URL for NextAuth.js authentication',
    'NEXTAUTH_SECRET': 'Secret key for NextAuth.js session encryption'
  };
  
  return descriptions[key] || 'Environment variable for application configuration';
} 