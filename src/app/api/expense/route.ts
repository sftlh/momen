import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  category: z.string().optional(),
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
    const data = expenseSchema.parse(body)

    await prisma.expense.create({
      data: {
        ...data,
        userId: decoded.userId,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json({ message: 'Expense added' })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const data = expenseSchema.parse(body)

    // Verify the expense belongs to the user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found or access denied' }, { status: 404 })
    }

    await prisma.expense.update({
      where: { id: id },
      data: {
        ...data,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json({ message: 'Expense updated successfully' })
  } catch (error) {
    console.error('Update expense error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Verify the expense belongs to the user
    const expense = await prisma.expense.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found or access denied' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}