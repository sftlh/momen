import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const savingSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string(),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  endDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const body = await request.json()
    const data = savingSchema.parse(body)

    await prisma.savings.create({
      data: {
        ...data,
        userId: decoded.userId,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json({ message: 'Saving added' })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
}