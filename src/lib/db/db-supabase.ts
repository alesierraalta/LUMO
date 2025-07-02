// Environment detection optimized for Choreo
const isProduction = process.env.NODE_ENV === 'production' || 
                    !!process.env.BUILD_ID || 
                    process.env.CHOREO_ENVIRONMENT === 'Production'; 