# Simple P6001 Fix Strategy

## Problem
P6001 Prisma error: "URL must start with protocol prisma://" occurs when build-time Prisma client expects Prisma Accelerate but runtime uses direct PostgreSQL.

## Minimal Fix Approach

### 1. Conditional Client Creation
```typescript
// lib/prisma-simple.ts
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Production: Handle both protocols gracefully
  try {
    prisma = new PrismaClient()
  } catch (error) {
    if (error.message?.includes('prisma://')) {
      // Fallback to direct connection
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL?.replace('prisma://', 'postgresql://')
          }
        }
      })
    } else {
      throw error
    }
  }
} else {
  prisma = new PrismaClient()
}

export default prisma
```

### 2. Environment Detection
```javascript
// scripts/simple-p6001-fix.js
const fs = require('fs')
const path = require('path')

const schemaPath = path.join(__dirname, '../prisma/schema.prisma')
const schema = fs.readFileSync(schemaPath, 'utf8')

// Check if using Accelerate format
if (process.env.DATABASE_URL?.startsWith('prisma://')) {
  console.log('✅ Accelerate URL detected - no fix needed')
} else if (schema.includes('url = env("DATABASE_URL")')) {
  console.log('✅ Direct PostgreSQL - compatible schema')
} else {
  console.log('⚠️ Schema may need adjustment for direct connection')
}
```

### 3. Safe Deployment Pattern
1. **No build process changes**
2. **No complex runtime scripts**  
3. **Simple client wrapper only**
4. **Graceful fallback handling**

## Implementation Steps (After Service Recovery)
1. Create simple prisma wrapper
2. Update imports to use wrapper
3. Test locally
4. Deploy single small change
5. Monitor specific to P6001 errors only

This approach prioritizes **service stability** over comprehensive error handling. 