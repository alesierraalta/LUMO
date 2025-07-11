/**
 * Environment Configuration and Validation System
 * ===============================================
 * Prevents accidental cross-environment access and ensures proper environment separation
 */

export type EnvironmentType = 'development' | 'production' | 'test';

export interface EnvironmentConfig {
  // Environment identification
  NODE_ENV: string;
  APP_ENVIRONMENT: EnvironmentType;
  ENVIRONMENT_NAME: string;
  SAFETY_CHECK_ENVIRONMENT: string;
  
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Database configuration
  DATABASE_URL: string;
  
  // Security
  JWT_SECRET: string;
  NEXTAUTH_SECRET: string;
  
  // Application
  APP_NAME: string;
  APP_VERSION: string;
  PORT: string;
  NEXTAUTH_URL: string;
  
  // Safety checks
  ALLOWED_HOSTS: string;
  PRODUCTION_SAFETY_CHECK: string;
  DEVELOPMENT_MODE: string;
}

export class EnvironmentValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

export class EnvironmentConfigValidator {
  private static instance: EnvironmentConfigValidator;
  private config: EnvironmentConfig | null = null;
  private isValidated = false;

  private constructor() {}

  static getInstance(): EnvironmentConfigValidator {
    if (!EnvironmentConfigValidator.instance) {
      EnvironmentConfigValidator.instance = new EnvironmentConfigValidator();
    }
    return EnvironmentConfigValidator.instance;
  }

  /**
   * Validates and loads environment configuration
   * Throws error if validation fails
   */
  public validateAndLoad(): EnvironmentConfig {
    if (this.isValidated && this.config) {
      return this.config;
    }

    console.log('🔍 Environment Validation: Starting validation process...');
    
    const config: EnvironmentConfig = {
      NODE_ENV: process.env.NODE_ENV || '',
      APP_ENVIRONMENT: (process.env.APP_ENVIRONMENT as EnvironmentType) || 'development',
      ENVIRONMENT_NAME: process.env.ENVIRONMENT_NAME || '',
      SAFETY_CHECK_ENVIRONMENT: process.env.SAFETY_CHECK_ENVIRONMENT || '',
      
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      
      DATABASE_URL: process.env.DATABASE_URL || '',
      
      JWT_SECRET: process.env.JWT_SECRET || '',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      
      APP_NAME: process.env.APP_NAME || '',
      APP_VERSION: process.env.APP_VERSION || '',
      PORT: process.env.PORT || '3000',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
      
      ALLOWED_HOSTS: process.env.ALLOWED_HOSTS || '',
      PRODUCTION_SAFETY_CHECK: process.env.PRODUCTION_SAFETY_CHECK || '',
      DEVELOPMENT_MODE: process.env.DEVELOPMENT_MODE || 'false',
    };

    // Run validation checks
    this.validateRequiredFields(config);
    this.validateEnvironmentConsistency(config);
    this.validateProductionSafety(config);
    this.validateDevelopmentSafety(config);
    this.validateSupabaseConfiguration(config);
    this.validateSecurityConfiguration(config);

    this.config = config;
    this.isValidated = true;

    console.log('✅ Environment Validation: All checks passed');
    console.log(`🌍 Environment: ${config.ENVIRONMENT_NAME} (${config.APP_ENVIRONMENT})`);
    
    return config;
  }

  /**
   * Validates required environment variables
   */
  private validateRequiredFields(config: EnvironmentConfig): void {
    const requiredFields: (keyof EnvironmentConfig)[] = [
      'NODE_ENV',
      'APP_ENVIRONMENT',
      'ENVIRONMENT_NAME',
      'SAFETY_CHECK_ENVIRONMENT',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'APP_NAME',
      'APP_VERSION',
      'NEXTAUTH_URL'
    ];

    const missing = requiredFields.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new EnvironmentValidationError(
        `Missing required environment variables: ${missing.join(', ')}`,
        'MISSING_REQUIRED_VARS'
      );
    }
  }

  /**
   * Validates environment consistency
   */
  private validateEnvironmentConsistency(config: EnvironmentConfig): void {
    // Check if NODE_ENV matches APP_ENVIRONMENT
    if (config.NODE_ENV !== config.APP_ENVIRONMENT) {
      console.warn(`⚠️ Environment mismatch: NODE_ENV=${config.NODE_ENV}, APP_ENVIRONMENT=${config.APP_ENVIRONMENT}`);
    }

    // Check if SAFETY_CHECK_ENVIRONMENT matches APP_ENVIRONMENT
    if (config.SAFETY_CHECK_ENVIRONMENT !== config.APP_ENVIRONMENT) {
      throw new EnvironmentValidationError(
        `Environment safety check failed: SAFETY_CHECK_ENVIRONMENT=${config.SAFETY_CHECK_ENVIRONMENT} does not match APP_ENVIRONMENT=${config.APP_ENVIRONMENT}`,
        'ENVIRONMENT_MISMATCH'
      );
    }

    // Validate environment type
    if (!['development', 'production', 'test'].includes(config.APP_ENVIRONMENT)) {
      throw new EnvironmentValidationError(
        `Invalid APP_ENVIRONMENT: ${config.APP_ENVIRONMENT}. Must be 'development', 'production', or 'test'`,
        'INVALID_ENVIRONMENT'
      );
    }
  }

  /**
   * Validates production safety measures
   */
  private validateProductionSafety(config: EnvironmentConfig): void {
    if (config.APP_ENVIRONMENT === 'production') {
      // Production-specific validations
      if (config.NEXTAUTH_URL.includes('localhost')) {
        throw new EnvironmentValidationError(
          'Production environment cannot use localhost URLs',
          'PRODUCTION_LOCALHOST_ERROR'
        );
      }

      if (config.DEVELOPMENT_MODE === 'true') {
        throw new EnvironmentValidationError(
          'Production environment cannot have DEVELOPMENT_MODE=true',
          'PRODUCTION_DEV_MODE_ERROR'
        );
      }

      if (config.PRODUCTION_SAFETY_CHECK !== 'enabled') {
        throw new EnvironmentValidationError(
          'Production environment requires PRODUCTION_SAFETY_CHECK=enabled',
          'PRODUCTION_SAFETY_CHECK_ERROR'
        );
      }
    }
  }

  /**
   * Validates development safety measures
   */
  private validateDevelopmentSafety(config: EnvironmentConfig): void {
    if (config.APP_ENVIRONMENT === 'development') {
      // Development-specific validations
      if (!config.NEXTAUTH_URL.includes('localhost') && !config.NEXTAUTH_URL.includes('127.0.0.1')) {
        throw new EnvironmentValidationError(
          'Development environment should use localhost URLs',
          'DEVELOPMENT_URL_ERROR'
        );
      }

      // Check for production-like URLs in development
      if (config.NEXT_PUBLIC_SUPABASE_URL.includes('prod') || 
          config.NEXT_PUBLIC_SUPABASE_URL.includes('production')) {
        throw new EnvironmentValidationError(
          'Development environment detected production Supabase URL',
          'DEVELOPMENT_PROD_URL_ERROR'
        );
      }

      if (config.DATABASE_URL.includes('prod') || 
          config.DATABASE_URL.includes('production')) {
        throw new EnvironmentValidationError(
          'Development environment detected production database URL',
          'DEVELOPMENT_PROD_DB_ERROR'
        );
      }
    }
  }

  /**
   * Validates Supabase configuration
   */
  private validateSupabaseConfiguration(config: EnvironmentConfig): void {
    // Extract project ID from Supabase URL
    const urlMatch = config.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!urlMatch) {
      throw new EnvironmentValidationError(
        'Invalid Supabase URL format',
        'INVALID_SUPABASE_URL'
      );
    }

    const projectId = urlMatch[1];
    
    // Validate that all Supabase URLs use the same project ID
    if (!config.DATABASE_URL.includes(projectId)) {
      throw new EnvironmentValidationError(
        'Database URL project ID does not match Supabase URL project ID',
        'SUPABASE_PROJECT_MISMATCH'
      );
    }

    // Validate key format
    if (!config.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ')) {
      throw new EnvironmentValidationError(
        'Invalid Supabase anon key format',
        'INVALID_SUPABASE_ANON_KEY'
      );
    }

    if (!config.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
      throw new EnvironmentValidationError(
        'Invalid Supabase service role key format',
        'INVALID_SUPABASE_SERVICE_KEY'
      );
    }

    // Check for environment-specific project naming
    if (config.APP_ENVIRONMENT === 'development') {
      if (projectId.includes('prod') || projectId.includes('production')) {
        throw new EnvironmentValidationError(
          'Development environment should not use production Supabase project',
          'DEVELOPMENT_PROD_SUPABASE_ERROR'
        );
      }
    }
  }

  /**
   * Validates security configuration
   */
  private validateSecurityConfiguration(config: EnvironmentConfig): void {
    // Check JWT secret length
    if (config.JWT_SECRET.length < 32) {
      throw new EnvironmentValidationError(
        'JWT_SECRET must be at least 32 characters long',
        'JWT_SECRET_TOO_SHORT'
      );
    }

    // Check NextAuth secret length
    if (config.NEXTAUTH_SECRET.length < 32) {
      throw new EnvironmentValidationError(
        'NEXTAUTH_SECRET must be at least 32 characters long',
        'NEXTAUTH_SECRET_TOO_SHORT'
      );
    }

    // Ensure secrets are different between environments
    if (config.APP_ENVIRONMENT === 'production' && config.JWT_SECRET === config.NEXTAUTH_SECRET) {
      console.warn('⚠️ JWT_SECRET and NEXTAUTH_SECRET are the same - consider using different secrets');
    }
  }

  /**
   * Gets the validated configuration
   */
  public getConfig(): EnvironmentConfig {
    if (!this.isValidated || !this.config) {
      return this.validateAndLoad();
    }
    return this.config;
  }

  /**
   * Checks if current environment is development
   */
  public isDevelopment(): boolean {
    return this.getConfig().APP_ENVIRONMENT === 'development';
  }

  /**
   * Checks if current environment is production
   */
  public isProduction(): boolean {
    return this.getConfig().APP_ENVIRONMENT === 'production';
  }

  /**
   * Gets environment name for logging
   */
  public getEnvironmentName(): string {
    return this.getConfig().ENVIRONMENT_NAME;
  }
}

// Export singleton instance
export const environmentConfig = EnvironmentConfigValidator.getInstance();

// Export convenience functions
export const getEnvironmentConfig = () => environmentConfig.getConfig();
export const isDevelopment = () => environmentConfig.isDevelopment();
export const isProduction = () => environmentConfig.isProduction();
export const getEnvironmentName = () => environmentConfig.getEnvironmentName();