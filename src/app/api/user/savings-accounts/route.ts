import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const userId = decoded.userId

  try {
    // Get all savings records for the user
    const savings = await prisma.savings.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    })

    // Group by category and bank, calculate balances and get latest goal amount
    const savingsByCategoryAndBank = savings.reduce((acc: Record<string, { balance: number, category: string, bankName: string, lastUpdated: Date, goalAmount?: number }>, saving) => {
      const category = saving.category || 'General'
      const bankName = saving.bankName || 'Unknown Bank'
      const key = `${category}|||${bankName}`

      if (!acc[key]) {
        acc[key] = {
          balance: 0,
          category,
          bankName,
          lastUpdated: saving.date,
          goalAmount: saving.goalAmount || undefined
        }
      }
      acc[key].balance += saving.amount
      if (saving.date > acc[key].lastUpdated) {
        acc[key].lastUpdated = saving.date
        // Update goal amount if this is a more recent record with a goal amount
        if (saving.goalAmount) {
          acc[key].goalAmount = saving.goalAmount
        }
      }
      return acc
    }, {})

    // Convert to array and filter out zero or negative balances
    const existingAccounts = Object.values(savingsByCategoryAndBank)
      .filter(account => account.balance > 0)
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())

    return NextResponse.json({ existingAccounts })
  } catch (error) {
    console.error('Failed to fetch savings accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch savings accounts' }, { status: 500 })
  }
}