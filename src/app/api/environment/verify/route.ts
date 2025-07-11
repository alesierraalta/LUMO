import { NextRequest, NextResponse } from 'next/server';
import { environmentConfig, EnvironmentValidationError } from '@/lib/environment-config';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Environment Verification: Starting comprehensive check...');
    
    // Validate environment configuration
    let config;
    let validationResult = { success: false, error: null };
    
    try {
      config = environmentConfig.validateAndLoad();
      validationResult = { success: true, error: null };
    } catch (error) {
      validationResult = { 
        success: false, 
        error: error instanceof EnvironmentValidationError ? {
          message: error.message,
          code: error.code
        } : { message: 'Unknown validation error', code: 'UNKNOWN' }
      };
    }
    
    // Environment safety checks
    const safetyChecks = {
      environmentType: config?.APP_ENVIRONMENT || 'unknown',
      environmentName: config?.ENVIRONMENT_NAME || 'unknown',
      isDevelopment: config?.APP_ENVIRONMENT === 'development',
      isProduction: config?.APP_ENVIRONMENT === 'production',
      
      // URL safety checks
      urlSafety: {
        supabaseUrl: config?.NEXT_PUBLIC_SUPABASE_URL || '',
        containsProduction: (config?.NEXT_PUBLIC_SUPABASE_URL || '').includes('prod'),
        containsDevelopment: (config?.NEXT_PUBLIC_SUPABASE_URL || '').includes('dev'),
        isLocalhost: (config?.NEXTAUTH_URL || '').includes('localhost'),
        authUrl: config?.NEXTAUTH_URL || ''
      },
      
      // Database safety checks
      databaseSafety: {
        databaseUrl: config?.DATABASE_URL ? config.DATABASE_URL.substring(0, 50) + '...' : '',
        containsProduction: (config?.DATABASE_URL || '').includes('prod'),
        containsDevelopment: (config?.DATABASE_URL || '').includes('dev'),
        projectId: config?.DATABASE_URL ? extractProjectId(config.DATABASE_URL) : ''
      },
      
      // Security checks
      securityChecks: {
        hasJwtSecret: !!(config?.JWT_SECRET),
        hasNextAuthSecret: !!(config?.NEXTAUTH_SECRET),
        secretsAreDifferent: config?.JWT_SECRET !== config?.NEXTAUTH_SECRET,
        jwtSecretLength: config?.JWT_SECRET?.length || 0,
        nextAuthSecretLength: config?.NEXTAUTH_SECRET?.length || 0,
        developmentMode: config?.DEVELOPMENT_MODE === 'true',
        productionSafetyCheck: config?.PRODUCTION_SAFETY_CHECK === 'enabled'
      }
    };
    
    // Risk assessment
    const riskAssessment = assessEnvironmentRisks(safetyChecks, config);
    
    // Generate recommendations
    const recommendations = generateRecommendations(safetyChecks, riskAssessment, config);
    
    console.log('🔍 Environment Verification: Check completed');
    console.log('  - Environment:', safetyChecks.environmentName);
    console.log('  - Validation:', validationResult.success ? 'PASSED' : 'FAILED');
    console.log('  - Risk Level:', riskAssessment.riskLevel);
    
    return NextResponse.json({
      success: true,
      environment: {
        validation: validationResult,
        safety: safetyChecks,
        risks: riskAssessment,
        recommendations: recommendations,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Environment Verification Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Environment verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function extractProjectId(databaseUrl: string): string {
  const match = databaseUrl.match(/postgres\.([^:]+):/);
  return match ? match[1] : '';
}

function assessEnvironmentRisks(safetyChecks: any, config: any): any {
  const risks = [];
  let riskLevel = 'LOW';
  
  // Critical risks
  if (safetyChecks.isDevelopment && safetyChecks.urlSafety.containsProduction) {
    risks.push({
      level: 'CRITICAL',
      category: 'ENVIRONMENT_MISMATCH',
      message: 'Development environment is using production Supabase URL',
      impact: 'Could accidentally access production data'
    });
    riskLevel = 'CRITICAL';
  }
  
  if (safetyChecks.isDevelopment && safetyChecks.databaseSafety.containsProduction) {
    risks.push({
      level: 'CRITICAL',
      category: 'DATABASE_MISMATCH',
      message: 'Development environment is using production database',
      impact: 'Could accidentally modify production data'
    });
    riskLevel = 'CRITICAL';
  }
  
  if (safetyChecks.isProduction && safetyChecks.urlSafety.isLocalhost) {
    risks.push({
      level: 'CRITICAL',
      category: 'PRODUCTION_LOCALHOST',
      message: 'Production environment is configured for localhost',
      impact: 'Production deployment will fail'
    });
    riskLevel = 'CRITICAL';
  }
  
  // High risks
  if (safetyChecks.isProduction && safetyChecks.securityChecks.developmentMode) {
    risks.push({
      level: 'HIGH',
      category: 'PRODUCTION_DEV_MODE',
      message: 'Production environment has development mode enabled',
      impact: 'Security vulnerabilities and performance issues'
    });
    if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
  }
  
  if (!safetyChecks.securityChecks.secretsAreDifferent) {
    risks.push({
      level: 'HIGH',
      category: 'DUPLICATE_SECRETS',
      message: 'JWT_SECRET and NEXTAUTH_SECRET are identical',
      impact: 'Reduced security if one secret is compromised'
    });
    if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
  }
  
  // Medium risks
  if (safetyChecks.securityChecks.jwtSecretLength < 64) {
    risks.push({
      level: 'MEDIUM',
      category: 'WEAK_SECRET',
      message: 'JWT_SECRET is shorter than recommended 64 characters',
      impact: 'Potentially easier to brute force'
    });
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
  }
  
  if (safetyChecks.securityChecks.nextAuthSecretLength < 64) {
    risks.push({
      level: 'MEDIUM',
      category: 'WEAK_SECRET',
      message: 'NEXTAUTH_SECRET is shorter than recommended 64 characters',
      impact: 'Potentially easier to brute force'
    });
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
  }
  
  return {
    riskLevel,
    riskCount: risks.length,
    risks,
    summary: `${risks.length} risk${risks.length !== 1 ? 's' : ''} identified (${riskLevel} level)`
  };
}

function generateRecommendations(safetyChecks: any, riskAssessment: any, config: any): any {
  const recommendations = [];
  
  // Critical recommendations
  if (riskAssessment.riskLevel === 'CRITICAL') {
    recommendations.push({
      priority: 'IMMEDIATE',
      category: 'SECURITY',
      action: 'Stop application and fix environment configuration',
      reason: 'Critical security risks detected'
    });
  }
  
  // Environment-specific recommendations
  if (safetyChecks.isDevelopment) {
    recommendations.push({
      priority: 'HIGH',
      category: 'DEVELOPMENT',
      action: 'Ensure you are using a separate Supabase project for development',
      reason: 'Prevent accidental production data access'
    });
    
    recommendations.push({
      priority: 'MEDIUM',
      category: 'DEVELOPMENT',
      action: 'Use test data only in development environment',
      reason: 'Maintain clean separation between environments'
    });
  }
  
  if (safetyChecks.isProduction) {
    recommendations.push({
      priority: 'HIGH',
      category: 'PRODUCTION',
      action: 'Verify all production credentials are properly configured',
      reason: 'Ensure production deployment stability'
    });
    
    recommendations.push({
      priority: 'HIGH',
      category: 'PRODUCTION',
      action: 'Enable production safety checks',
      reason: 'Additional security validation for production'
    });
  }
  
  // Security recommendations
  if (!safetyChecks.securityChecks.secretsAreDifferent) {
    recommendations.push({
      priority: 'HIGH',
      category: 'SECURITY',
      action: 'Generate different secrets for JWT_SECRET and NEXTAUTH_SECRET',
      reason: 'Improve security isolation'
    });
  }
  
  // General recommendations
  recommendations.push({
    priority: 'MEDIUM',
    category: 'MONITORING',
    action: 'Regularly verify environment configuration',
    reason: 'Catch configuration drift early'
  });
  
  return {
    recommendationCount: recommendations.length,
    recommendations,
    nextSteps: recommendations.filter(r => r.priority === 'IMMEDIATE' || r.priority === 'HIGH')
  };
}