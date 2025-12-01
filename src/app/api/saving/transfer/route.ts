import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const transferSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const body = await request.json()
    const { amount, description, category } = transferSchema.parse(body)

    // Calculate total savings available
    const totalSavingsResult = await prisma.savings.aggregate({
      where: { userId: decoded.userId },
      _sum: { amount: true }
    })

    const totalSavings = totalSavingsResult._sum.amount || 0

    if (totalSavings < amount) {
      return NextResponse.json({
        error: 'Insufficient savings',
        available: totalSavings
      }, { status: 400 })
    }

    // Create expense record (withdrawal from savings)
    await prisma.expense.create({
      data: {
        userId: decoded.userId,
        amount: amount,
        description: `Savings Transfer: ${description}`,
        category: category || 'Savings Transfer',
        date: new Date(),
      },
    })

    // Record the savings withdrawal
    await prisma.savings.create({
      data: {
        userId: decoded.userId,
        amount: -amount, // Negative amount for withdrawal
        description: `Transferred to expenses: ${description}`,
        category: category || 'transfer',
        type: 'withdrawal',
        date: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Successfully transferred from savings to expenses',
      transferred: amount,
      remainingSavings: totalSavings - amount
    })
  } catch (error) {
    console.error('Transfer error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 })
  }
}