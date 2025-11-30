import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { getBaseUrl } from '@/lib/urls'
import { z, ZodError } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = registerSchema.parse(body)

    // Check database connection
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({ error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' }, { status: 500 })
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const verificationToken = Math.random().toString(36).substring(2)
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, verificationToken },
    })

    // Send verification email
    try {
      const baseUrl = getBaseUrl()
      const verificationLink = `${baseUrl}/verify?token=${verificationToken}`
      await sendEmail(
        email,
        'Verify Your Email - MoMen',
        `<p>Welcome ${username}!</p><p>Please verify your email by clicking the link: <a href="${verificationLink}">Verify Email</a></p>`
      )
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Continue with registration even if email fails
    }

    return NextResponse.json({ message: 'User registered successfully. Please check your email for verification.' })
  } catch (error) {
    console.error('Registration error:', error)
    if (error instanceof ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }
    return NextResponse.json({
      error: 'Invalid input',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 400 })
  }
}