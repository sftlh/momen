import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const userId = decoded.userId

  const [incomes, expenses, savings, assets, spendingLimit] = await Promise.all([
    prisma.income.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.savings.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.asset.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.spendingLimit.findUnique({ where: { userId } }),
  ])

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0)
  const totalAssets = assets.reduce((sum, a) => sum + a.totalValue, 0)
  const remaining = totalIncome - totalExpenses

  return NextResponse.json({
    incomes,
    expenses,
    savings,
    assets,
    spendingLimit,
    totals: { totalIncome, totalExpenses, totalSavings, totalAssets, remaining },
  })
}