import { test as teardown } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

const authFile = 'playwright/.auth/user.json'
const adminAuthFile = 'playwright/.auth/admin.json'

teardown('cleanup auth states', async () => {
  // Remove authentication files
  try {
    await fs.unlink(authFile)
    console.log('✅ Removed user auth file')
  } catch (error) {
    // File might not exist, which is fine
  }
  
  try {
    await fs.unlink(adminAuthFile)
    console.log('✅ Removed admin auth file')
  } catch (error) {
    // File might not exist, which is fine
  }
  
  // Remove auth directory if empty
  try {
    const authDir = path.dirname(authFile)
    const files = await fs.readdir(authDir)
    if (files.length === 0) {
      await fs.rmdir(authDir)
      console.log('✅ Removed empty auth directory')
    }
  } catch (error) {
    // Directory might not exist or might not be empty, which is fine
  }
}) 