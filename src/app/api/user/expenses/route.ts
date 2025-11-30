import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const userId = decoded.userId
  const url = new URL(request.url)
  const year = url.searchParams.get('year')
  const month = url.searchParams.get('month')

  let startDate: Date
  let endDate: Date

  if (year && month) {
    // Filter by specific month and year
    const monthNum = parseInt(month) - 1 // JS months are 0-indexed
    startDate = new Date(parseInt(year), monthNum, 1)
    endDate = new Date(parseInt(year), monthNum + 1, 0) // Last day of month
  } else if (year) {
    // Filter by specific year
    startDate = new Date(parseInt(year), 0, 1)
    endDate = new Date(parseInt(year), 11, 31)
  } else {
    // Default: current year
    const now = new Date()
    startDate = new Date(now.getFullYear(), 0, 1)
    endDate = new Date(now.getFullYear(), 11, 31)
  }

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: {
      date: 'desc'
    }
  })

  return NextResponse.json({ expenses })
}