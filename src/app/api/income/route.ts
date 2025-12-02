import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const incomeSchema = z.object({
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
    const data = incomeSchema.parse(body)

    await prisma.income.create({
      data: {
        ...data,
        userId: decoded.userId,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json({ message: 'Income added' })
  } catch (error) {
    console.error('Create income error:', error)
    return NextResponse.json({ error: 'Failed to create income' }, { status: 500 })
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
      return NextResponse.json({ error: 'Income ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const data = incomeSchema.parse(body)

    // Verify the income belongs to the user
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    })

    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found or access denied' }, { status: 404 })
    }

    await prisma.income.update({
      where: { id: id },
      data: {
        ...data,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json({ message: 'Income updated successfully' })
  } catch (error) {
    console.error('Update income error:', error)
    return NextResponse.json({ error: 'Failed to update income' }, { status: 500 })
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
      return NextResponse.json({ error: 'Income ID is required' }, { status: 400 })
    }

    // Verify the income belongs to the user
    const income = await prisma.income.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    })

    if (!income) {
      return NextResponse.json({ error: 'Income not found or access denied' }, { status: 404 })
    }

    await prisma.income.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Income deleted successfully' })
  } catch (error) {
    console.error('Delete income error:', error)
    return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 })
  }
}