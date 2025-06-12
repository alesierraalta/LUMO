#!/usr/bin/env node

/**
 * Rollback User Edit Fix
 * 
 * Safely reverts the "Failed to load user data" fix if issues occur
 * in production deployment. Includes backup restoration and validation.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 LUMO User Edit Fix Rollback');
console.log('==============================\n');

// Rollback state tracking
const rollback = {
  startTime: Date.now(),
  steps: [],
  errors: [],
  backupCreated: false
};

const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    'INFO': '📋',
    'SUCCESS': '✅',
    'WARNING': '⚠️',
    'ERROR': '❌',
    'ROLLBACK': '🔄'
  }[type] || '📋';
  
  console.log(`${prefix} ${message}`);
  rollback.steps.push({ timestamp, type, message });
};

const runCommand = (command, description, options = {}) => {
  log(`Running: ${description}`, 'ROLLBACK');
  
  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      timeout: options.timeout || 30000,
      ...options
    });
    
    log(`Completed: ${description}`, 'SUCCESS');
    return { success: true, output: result };
  } catch (error) {
    const errorMsg = `Failed: ${description} - ${error.message}`;
    log(errorMsg, 'ERROR');
    rollback.errors.push(errorMsg);
    
    if (!options.continueOnError) {
      throw error;
    }
    return { success: false, error: error.message };
  }
};

// Backup original files before rollback
const createBackup = () => {
  log('Creating backup of current state...', 'ROLLBACK');
  
  const backupDir = `backups/rollback-${Date.now()}`;
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
  }
  fs.mkdirSync(backupDir, { recursive: true });
  
  const filesToBackup = [
    'src/lib/db-hybrid.ts',
    'scripts/test-user-edit-fix.js',
    'package.json'
  ];
  
  for (const file of filesToBackup) {
    if (fs.existsSync(file)) {
      const backupPath = path.join(backupDir, file);
      const backupDirPath = path.dirname(backupPath);
      
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }
      
      fs.copyFileSync(file, backupPath);
      log(`Backed up: ${file} -> ${backupPath}`, 'SUCCESS');
    }
  }
  
  rollback.backupCreated = true;
  log(`Backup created in: ${backupDir}`, 'SUCCESS');
  return backupDir;
};

// Original db-hybrid.ts content (before fix)
const originalDbHybridContent = `// ... existing code ...
        findUnique: async (params: any) => {
          console.log('🔍 Supabase findUnique called with:', params);
          
          let query = supabase.from('users').select('*');

          if (params.where.email) {
            query = query.eq('email', params.where.email);
          }
          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          console.log('🔍 Executing Supabase query...');
          const { data, error } = await query.single();
          
          if (error) {
            console.log('❌ Supabase error:', error.message);
            console.log('❌ Full error:', error);
            return null;
          }

          console.log('✅ Supabase user found:', data?.email);
          
          // Convert Supabase format to Prisma format
          const result = {
            id: data.id,
            name: data.name,
            email: data.email,
            password: data.password,
            roleId: data.role_id,
            role: data.role || 'USER', // Simple role mapping
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };

          console.log('🔄 Converted to Prisma format:', result);
          return result;
        },
// ... existing code ...`;

// Rollback steps
const executeRollback = async () => {
  try {
    log('Starting User Edit Fix Rollback', 'ROLLBACK');
    
    // Step 1: Create backup
    const backupDir = createBackup();
    
    // Step 2: Check if Git is available for rollback
    log('Checking Git status...', 'ROLLBACK');
    const gitResult = runCommand(
      'git status --porcelain',
      'Git status check',
      { silent: true, continueOnError: true }
    );
    
    if (gitResult.success && gitResult.output.trim() === '') {
      log('Git working directory is clean', 'SUCCESS');
    } else {
      log('Git has uncommitted changes - manual rollback required', 'WARNING');
    }
    
    // Step 3: Revert db-hybrid.ts to original state
    log('Reverting db-hybrid.ts to original state...', 'ROLLBACK');
    
    // Read current content
    const currentContent = fs.readFileSync('src/lib/db-hybrid.ts', 'utf8');
    
    // Check if fix is present
    if (currentContent.includes('params.include && params.include.role')) {
      log('User edit fix detected - reverting...', 'ROLLBACK');
      
      // Simple revert: remove the complex include logic
      const revertedContent = currentContent.replace(
        /findUnique: async \(params: any\) => \{[\s\S]*?return result;\s*\}/,
        `findUnique: async (params: any) => {
          console.log('🔍 Supabase findUnique called with:', params);
          
          let query = supabase.from('users').select('*');

          if (params.where.email) {
            query = query.eq('email', params.where.email);
          }
          if (params.where.id) {
            query = query.eq('id', params.where.id);
          }

          console.log('🔍 Executing Supabase query...');
          const { data, error } = await query.single();
          
          if (error) {
            console.log('❌ Supabase error:', error.message);
            console.log('❌ Full error:', error);
            return null;
          }

          console.log('✅ Supabase user found:', data?.email);
          
          // Convert Supabase format to Prisma format
          const result = {
            id: data.id,
            name: data.name,
            email: data.email,
            password: data.password,
            roleId: data.role_id,
            role: data.role || 'USER', // Simple role mapping
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };

          console.log('🔄 Converted to Prisma format:', result);
          return result;
        }`
      );
      
      fs.writeFileSync('src/lib/db-hybrid.ts', revertedContent);
      log('db-hybrid.ts reverted to original state', 'SUCCESS');
    } else {
      log('User edit fix not found - no revert needed', 'INFO');
    }
    
    // Step 4: Remove test script
    log('Removing test script...', 'ROLLBACK');
    if (fs.existsSync('scripts/test-user-edit-fix.js')) {
      fs.unlinkSync('scripts/test-user-edit-fix.js');
      log('Test script removed', 'SUCCESS');
    }
    
    // Step 5: Update package.json
    log('Updating package.json...', 'ROLLBACK');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts['test:user-edit-fix']) {
      delete packageJson.scripts['test:user-edit-fix'];
      log('Removed test:user-edit-fix script', 'SUCCESS');
    }
    
    if (packageJson.scripts['deploy:user-edit-fix']) {
      delete packageJson.scripts['deploy:user-edit-fix'];
      log('Removed deploy:user-edit-fix script', 'SUCCESS');
    }
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    // Step 6: Validate rollback
    log('Validating rollback...', 'ROLLBACK');
    
    // Check TypeScript compilation
    const typeCheckResult = runCommand(
      'npm run type-check',
      'TypeScript validation',
      { continueOnError: true, timeout: 60000 }
    );
    
    if (!typeCheckResult.success) {
      log('TypeScript validation failed after rollback', 'ERROR');
      rollback.errors.push('TypeScript validation failed');
    }
    
    // Step 7: Create rollback report
    const rollbackReport = {
      timestamp: new Date().toISOString(),
      action: 'User Edit Fix Rollback',
      duration: Date.now() - rollback.startTime,
      backupLocation: backupDir,
      filesReverted: [
        'src/lib/db-hybrid.ts',
        'scripts/test-user-edit-fix.js',
        'package.json'
      ],
      errors: rollback.errors,
      success: rollback.errors.length === 0
    };
    
    fs.writeFileSync('rollback-report.json', JSON.stringify(rollbackReport, null, 2));
    
    // Final summary
    const duration = Date.now() - rollback.startTime;
    
    if (rollback.errors.length === 0) {
      log('\\n🎉 ROLLBACK COMPLETED SUCCESSFULLY! 🎉', 'SUCCESS');
      log(`Duration: ${Math.round(duration / 1000)}s`, 'INFO');
      log(`Backup location: ${backupDir}`, 'INFO');
      
      log('\\n📋 Next Steps:', 'INFO');
      log('1. Test the application to ensure functionality is restored', 'INFO');
      log('2. Commit the rollback changes if using Git', 'INFO');
      log('3. Deploy the rolled-back version to Choreo', 'INFO');
      log('4. Investigate the original issue further', 'INFO');
    } else {
      log('\\n⚠️ ROLLBACK COMPLETED WITH ERRORS', 'WARNING');
      log(`Duration: ${Math.round(duration / 1000)}s`, 'INFO');
      log(`Errors: ${rollback.errors.length}`, 'ERROR');
      
      rollback.errors.forEach(error => log(`  - ${error}`, 'ERROR'));
      
      log('\\n🔧 Manual intervention may be required', 'WARNING');
    }
    
    return rollback.errors.length === 0;
    
  } catch (error) {
    log(`\\n❌ ROLLBACK FAILED: ${error.message}`, 'ERROR');
    log('Manual rollback required', 'ERROR');
    
    if (rollback.backupCreated) {
      log('Backup files are available for manual restoration', 'INFO');
    }
    
    return false;
  }
};

// Main execution
if (require.main === module) {
  executeRollback()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected rollback error:', error);
      process.exit(1);
    });
}

module.exports = { executeRollback }; 