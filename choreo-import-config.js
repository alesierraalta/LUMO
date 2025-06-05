
// Choreo Import Configuration
// This file contains Choreo-specific settings for the Excel importer

module.exports = {
  // File upload settings for Choreo
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ],
    tempDir: process.env.CHOREO_TEMP_DIR || '/tmp/lumo-import',
  },
  
  // Database settings
  database: {
    connectionTimeout: 30000,
    queryTimeout: 60000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // Import processing settings
  processing: {
    batchSize: 100,
    maxConcurrent: 5,
    timeout: 300000 // 5 minutes
  },
  
  // Logging settings
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableFileLogging: true,
    logDir: process.env.CHOREO_LOG_DIR || '/tmp/lumo-logs'
  }
};
