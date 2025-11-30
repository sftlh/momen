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
  let periodLabel: string

  if (year && month) {
    // Filter by specific month and year
    const monthNum = parseInt(month) - 1 // JS months are 0-indexed
    startDate = new Date(parseInt(year), monthNum, 1)
    endDate = new Date(parseInt(year), monthNum + 1, 0) // Last day of month
    periodLabel = `${new Date(parseInt(year), monthNum).toLocaleString('default', { month: 'long' })} ${year}`
  } else if (year) {
    // Filter by specific year
    startDate = new Date(parseInt(year), 0, 1)
    endDate = new Date(parseInt(year), 11, 31)
    periodLabel = year
  } else {
    // Default: current month and year
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    periodLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`
  }

  const [incomes, expenses, savings, assets] = await Promise.all([
    prisma.income.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      }
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      }
    }),
    prisma.savings.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      }
    }),
    prisma.asset.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      }
    }),
  ])

  const summary = {
    income: incomes.reduce((sum, i) => sum + i.amount, 0),
    expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    savings: savings.reduce((sum, s) => sum + s.amount, 0),
    assets: assets.reduce((sum, a) => sum + a.totalValue, 0),
    remaining: 0,
    period: periodLabel,
    dateRange: { start: startDate.toISOString(), end: endDate.toISOString() }
  }
  summary.remaining = summary.income - summary.expenses

  // Cost comparison: (Savings + Assets) - Total Expenses
  const availableFunds = summary.savings + summary.assets
  const costComparison = {
    totalExpenses: summary.expenses,
    availableFunds: availableFunds,
    difference: availableFunds - summary.expenses,
    efficiency: availableFunds > 0 ? (summary.expenses / availableFunds) * 100 : 0
  }

  return NextResponse.json({ summary, costComparison })
}