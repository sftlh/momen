import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const limitSchema = z.object({
  limitAmount: z.number().positive(),
  period: z.string(),
})

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const body = await request.json()
    const data = limitSchema.parse(body)

    await prisma.spendingLimit.upsert({
      where: { userId: decoded.userId },
      update: data,
      create: { ...data, userId: decoded.userId },
    })

    return NextResponse.json({ message: 'Limit set' })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
}