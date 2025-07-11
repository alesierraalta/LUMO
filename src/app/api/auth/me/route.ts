import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db-supabase'

export async function GET(request: NextRequest) {
  try {
    // First try to get user from Supabase session
    const supabaseUser = await getCurrentUser()
    
    if (supabaseUser) {
      // Get full user data from database
      const user = await db.user.findUnique({
        where: { id: supabaseUser.id },
        include: { role: true }
      })
      
      if (user) {
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName || user.name?.split(' ')[0],
            lastName: user.lastName || user.name?.split(' ')[1],
            roleId: user.roleId,
            role: user.role,
            isActive: user.isActive
          }
        })
      }
    }
    
    // If no Supabase session, try JWT token (for backward compatibility)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key') as any
      
      // Get user from database
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true }
      })
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName || user.name?.split(' ')[0],
          lastName: user.lastName || user.name?.split(' ')[1],
          roleId: user.roleId,
          role: user.role,
          isActive: user.isActive
        }
      })
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}