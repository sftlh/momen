'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Income {
  id: string
  amount: number
  description?: string
  date: Date
  category?: string
}

interface Expense {
  id: string
  amount: number
  description?: string
  date: Date
  category?: string
}

interface Savings {
  id: string
  amount: number
  description?: string
  date: Date
}

interface Asset {
  id: string
  type: string
  symbol?: string
  quantity?: number
  purchasePrice: number
  currentPrice?: number
  totalValue: number
  description?: string
  date: Date
  lastUpdated: Date
}

interface SpendingLimit {
  id: string
  limitAmount: number
  period: string
}

interface FinanceData {
  incomes: Income[]
  expenses: Expense[]
  savings: Savings[]
  assets: Asset[]
  spendingLimit: SpendingLimit | null
  totals: {
    totalIncome: number
    totalExpenses: number
    totalSavings: number
    totalAssets: number
    remaining: number
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const router = useRouter()

  // Helper function to format numbers with commas and no decimals
  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString()
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetch('/api/user/finances', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setData)
      .catch(() => router.push('/login'))
  }, [router])

  if (!data) return <div>Loading...</div>

  const { totals, spendingLimit, expenses } = data
  const isNearLimit = spendingLimit && totals.totalExpenses > spendingLimit.limitAmount * 0.8

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              Welcome to MoMen
            </h1>
            <p className="text-gray-400 text-lg">Your Family Finance Dashboard</p>
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-2xl border border-green-400/20 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">💰</div>
                <div className="text-green-200 text-sm font-medium">Income</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{formatNumber(totals.totalIncome)}</h2>
              <p className="text-green-200 text-sm">Total Earnings</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-2xl border border-red-400/20 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">💸</div>
                <div className="text-red-200 text-sm font-medium">Expenses</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{formatNumber(totals.totalExpenses)}</h2>
              <p className="text-red-200 text-sm">Total Spent</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-2xl border border-blue-400/20 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🏦</div>
                <div className="text-blue-200 text-sm font-medium">Savings</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{formatNumber(totals.totalSavings)}</h2>
              <p className="text-blue-200 text-sm">Saved Amount</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-2xl border border-purple-400/20 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🏠</div>
                <div className="text-purple-200 text-sm font-medium">Assets</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{formatNumber(totals.totalAssets)}</h2>
              <p className="text-purple-200 text-sm">Total Value</p>
            </div>
          </div>

          {/* Net Worth Card */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 rounded-xl shadow-2xl mb-8 hover:scale-102 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Net Worth</h2>
                <p className={`text-4xl font-bold ${totals.remaining < 0 ? 'text-red-300' : 'text-green-300'}`}>
                  {formatNumber(totals.remaining)}
                </p>
                <p className="text-indigo-200 mt-2">
                  {totals.remaining >= 0 ? '🎉 You\'re in the green!' : '⚠️ Consider reviewing expenses'}
                </p>
              </div>
              <div className="text-6xl">
                {totals.remaining >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>

          {/* Spending Limit Progress */}
          {spendingLimit && (
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">🎯</span> Spending Limit
              </h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Spent: {formatNumber(totals.totalExpenses)}</span>
                  <span>Limit: {formatNumber(spendingLimit.limitAmount)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      totals.totalExpenses / spendingLimit.limitAmount > 0.9
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : totals.totalExpenses / spendingLimit.limitAmount > 0.7
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${Math.min((totals.totalExpenses / spendingLimit.limitAmount) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-center text-gray-400 mt-2">
                  {((totals.totalExpenses / spendingLimit.limitAmount) * 100).toFixed(1)}% used
                </p>
              </div>
              {isNearLimit && (
                <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
                  <p className="text-red-300 font-semibold flex items-center">
                    <span className="mr-2">⚠️</span>
                    Warning: You&apos;re approaching your spending limit!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📈</span> Recent Income
              </h2>
              <div className="space-y-3">
                {data.incomes.slice(0, 5).map((income) => (
                  <div key={income.id} className="flex justify-between items-center p-3 bg-green-900/20 rounded-lg border border-green-500/20">
                    <div>
                      <p className="text-green-300 font-medium">{income.description || 'Income'}</p>
                      <p className="text-gray-400 text-sm">{new Date(income.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-green-400 font-bold">+{formatNumber(income.amount)}</p>
                  </div>
                ))}
                {data.incomes.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No income recorded yet</p>
                )}
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📉</span> Recent Expenses
              </h2>
              <div className="space-y-3">
                {data.expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-3 bg-red-900/20 rounded-lg border border-red-500/20">
                    <div>
                      <p className="text-red-300 font-medium">{expense.description || 'Expense'}</p>
                      <p className="text-gray-400 text-sm">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-red-400 font-bold">-{formatNumber(expense.amount)}</p>
                  </div>
                ))}
                {data.expenses.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No expenses recorded yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-2">⚡</span> Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <a href="/add-income" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-center font-medium">
                <div className="text-2xl mb-1">💰</div>
                Add Income
              </a>
              <a href="/add-expense" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-center font-medium">
                <div className="text-2xl mb-1">💸</div>
                Add Expense
              </a>
              <a href="/add-saving" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-center font-medium">
                <div className="text-2xl mb-1">🏦</div>
                Add Saving
              </a>
              <a href="/add-asset" className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-center font-medium">
                <div className="text-2xl mb-1">🏠</div>
                Add Asset
              </a>
              <a href="/set-limit" className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-center font-medium">
                <div className="text-2xl mb-1">🎯</div>
                Set Limit
              </a>
              <a href="/summary" className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg text-center font-medium">
                <div className="text-2xl mb-1">📊</div>
                View Summary
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}