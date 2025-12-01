import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const savingSchema = z.object({
  amount: z.number(),
  description: z.string().optional(),
  date: z.string(),
  category: z.string().optional(),
  type: z.enum(['deposit', 'withdrawal', 'transfer']).default('deposit'),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  endDate: z.string().optional(),
  goalAmount: z.number().optional(),
  isEmergency: z.boolean().optional(),
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

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Saving ID is required' }, { status: 400 })
    }

    // Verify the saving belongs to the user
    const saving = await prisma.savings.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    })

    if (!saving) {
      return NextResponse.json({ error: 'Saving not found or access denied' }, { status: 404 })
    }

    await prisma.savings.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Saving deleted successfully' })
  } catch (error) {
    console.error('Delete saving error:', error)
    return NextResponse.json({ error: 'Failed to delete saving' }, { status: 500 })
  }
}