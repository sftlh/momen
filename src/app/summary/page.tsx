'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface SummaryData {
  income: number
  expenses: number
  savings: number
  assets: number
  remaining: number
  period: string
  dateRange: {
    start: string
    end: string
  }
}

interface CostComparisonData {
  totalExpenses: number
  availableFunds: number
  difference: number
  efficiency: number
}

export default function SummaryPage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [costComparison, setCostComparison] = useState<CostComparisonData | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString())
  const router = useRouter()

  // Helper function to format numbers with commas and no decimals
  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString()
  }

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (selectedMonth) params.append('month', selectedMonth)

      const url = `/api/user/summary${params.toString() ? `?${params.toString()}` : ''}`

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const summaryData = await res.json()
        setData(summaryData.summary)
        setCostComparison(summaryData.costComparison)
      } catch (error) {
        console.error('Failed to fetch summary data:', error)
        router.push('/login')
      }
    }

    if (selectedYear) {
      fetchData()
    }
  }, [selectedYear, selectedMonth, router])

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i.toString())
    }
    return years
  }

  const generateMonthOptions = () => {
    return [
      { value: '1', label: 'January' },
      { value: '2', label: 'February' },
      { value: '3', label: 'March' },
      { value: '4', label: 'April' },
      { value: '5', label: 'May' },
      { value: '6', label: 'June' },
      { value: '7', label: 'July' },
      { value: '8', label: 'August' },
      { value: '9', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ]
  }

  if (!data) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </main>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent text-center">Financial Summary</h1>

          {/* Filter Controls */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Filter Summary</h2>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => {
                  const now = new Date()
                  setSelectedYear(now.getFullYear().toString())
                  setSelectedMonth((now.getMonth() + 1).toString())
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                📅 Current Month
              </button>
              <button
                onClick={() => {
                  const now = new Date()
                  setSelectedYear(now.getFullYear().toString())
                  setSelectedMonth('')
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                📆 Current Year
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="">Select Year</option>
                  {generateYearOptions().map(year => (
                    <option key={year} value={year} className="bg-gray-700">{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Month (Optional)</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="">All Months</option>
                  {generateMonthOptions().map(month => (
                    <option key={month.value} value={month.value} className="bg-gray-700">{month.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-400">
                  Filters apply automatically when changed
                </div>
              </div>
            </div>
          </div>

          {/* Summary Display */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 flex items-center justify-center">
              📊 Summary for {data.period}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <p className="text-green-400 text-lg font-semibold">{formatNumber(data.income)}</p>
                <p className="text-gray-400 text-sm">Income</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💸</div>
                <p className="text-red-400 text-lg font-semibold">{formatNumber(data.expenses)}</p>
                <p className="text-gray-400 text-sm">Expenses</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💾</div>
                <p className="text-blue-400 text-lg font-semibold">{formatNumber(data.savings)}</p>
                <p className="text-gray-400 text-sm">Savings</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏦</div>
                <p className="text-purple-400 text-lg font-semibold">{formatNumber(data.assets)}</p>
                <p className="text-gray-400 text-sm">Assets</p>
              </div>
            </div>
            <hr className="border-gray-600 my-6" />
            <div className="text-center">
              <p className={`text-2xl font-bold ${data.remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                Net Balance: {formatNumber(data.remaining)}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {data.remaining < 0 ? '⚠️ You have overspent this period' : '✅ You are in surplus'}
              </p>
            </div>

            <hr className="border-gray-600 my-6" />
            <h3 className="text-xl font-semibold mb-4 text-orange-400 flex items-center justify-center">
              📈 Savings & Assets vs Expenses
            </h3>
            {costComparison ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                  <div className="text-center">
                    <div className="text-3xl mb-2">💸</div>
                    <p className="text-red-400 text-xl font-semibold">{formatNumber(costComparison.totalExpenses)}</p>
                    <p className="text-gray-400 text-sm">Total Expenses</p>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                  <div className="text-center">
                    <div className="text-3xl mb-2">💰</div>
                    <p className="text-green-400 text-xl font-semibold">{formatNumber(costComparison.availableFunds)}</p>
                    <p className="text-gray-400 text-sm">Available Funds</p>
                    <p className="text-xs text-gray-500 mt-1">(Savings + Assets)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                Loading cost comparison data...
              </div>
            )}
            {costComparison && (
              <div className="mt-6 text-center">
                <p className={`text-lg font-semibold ${costComparison.difference < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  Difference: {formatNumber(costComparison.difference)}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {costComparison.difference < 0
                    ? '⚠️ Expenses exceed your savings and assets'
                    : '✅ Expenses are covered by savings and assets'
                  }
                </p>
                <div className="mt-4">
                  <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        costComparison.efficiency > 100 ? 'bg-red-500' : costComparison.efficiency > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(costComparison.efficiency, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Expense Coverage: {costComparison.efficiency.toFixed(1)}%
                    {costComparison.efficiency > 100 && ' (Expenses exceed savings/assets)'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <a href="/dashboard" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}