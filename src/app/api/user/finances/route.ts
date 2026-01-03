import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const userId = decoded.userId

  // Get current month and year
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

  const [incomes, expenses, savings, assets, spendingLimit] = await Promise.all([
    prisma.income.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.savings.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.asset.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.spendingLimit.findUnique({ where: { userId } }),
  ])

  // Calculate all-time totals
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0)
  const totalAssets = assets.reduce((sum, a) => sum + a.totalValue, 0)
  const remaining = totalIncome - totalExpenses

  // Calculate current month totals
  const currentMonthIncomes = incomes.filter(i => {
    const date = new Date(i.date)
    return date >= startOfMonth && date <= endOfMonth
  })
  const currentMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date)
    return date >= startOfMonth && date <= endOfMonth
  })
  const currentMonthSavings = savings.filter(s => {
    const date = new Date(s.date)
    return date >= startOfMonth && date <= endOfMonth
  })

  const currentMonthIncome = currentMonthIncomes.reduce((sum, i) => sum + i.amount, 0)
  const currentMonthExpense = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const currentMonthSaved = currentMonthSavings.reduce((sum, s) => sum + s.amount, 0)

  // Calculate Net Worth (Current month income - expenses + savings + all assets)
  const currentMonthNetWorth = currentMonthIncome - currentMonthExpense + currentMonthSaved + totalAssets

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const currentMonthName = monthNames[currentMonth]

  return NextResponse.json({
    incomes,
    expenses,
    savings,
    assets,
    spendingLimit,
    currentMonth: {
      name: currentMonthName,
      year: currentYear,
      income: currentMonthIncome,
      expenses: currentMonthExpense,
      savings: currentMonthSaved,
    },
    totals: { 
      totalIncome, 
      totalExpenses, 
      totalSavings, 
      totalAssets, 
      remaining,
      netWorth: currentMonthNetWorth 
    },
  })
}