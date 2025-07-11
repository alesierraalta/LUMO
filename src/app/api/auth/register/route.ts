import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, name } = body
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
    
    // Determine the name to use
    let userName = name
    if (!userName && (firstName || lastName)) {
      userName = [firstName, lastName].filter(Boolean).join(' ')
    }
    // Name is optional if we can construct it from firstName/lastName
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }
    
    // Get or create default USER role
    const roles = await db.role.findMany({
      where: { name: 'USER' }
    })
    let userRole = roles[0]
    
    if (!userRole) {
      userRole = await db.role.create({
        data: {
          name: 'USER',
          description: 'Default user role'
        }
      })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user with all fields
    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: userName || '',
        firstName: firstName || userName?.split(' ')[0] || '',
        lastName: lastName || userName?.split(' ').slice(1).join(' ') || '',
        roleId: userRole.id,
        isActive: true
      },
      include: { role: true }
    })
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        roleId: newUser.roleId 
      },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    )
    
    // Return user data with consistent field names
    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        roleId: newUser.roleId,
        role: newUser.role,
        isActive: newUser.isActive
      },
      token
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}