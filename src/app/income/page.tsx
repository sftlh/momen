'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Income {
  id: string
  amount: number
  description: string
  category: string
  date: string
  recurring: boolean
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const router = useRouter()

  // Fetch incomes when filters change
  useEffect(() => {
    const fetchIncomes = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (selectedMonth) params.append('month', selectedMonth)

      const url = `/api/user/incomes${params.toString() ? `?${params.toString()}` : ''}`

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setIncomes(data.incomes || [])
      } catch (error) {
        console.error('Failed to fetch incomes:', error)
        router.push('/login')
      }
    }

    if (selectedYear) {
      fetchIncomes()
    }
  }, [selectedYear, selectedMonth, router])

  // Filter incomes by category
  const filteredIncomes = useMemo(() => {
    if (selectedCategory) {
      return incomes.filter(income => income.category === selectedCategory)
    } else {
      return incomes
    }
  }, [incomes, selectedCategory])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

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
      { value: '', label: 'All Months' },
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

  const getUniqueCategories = () => {
    const categories = [...new Set(incomes.map(income => income.category))]
    return categories.sort()
  }

  const totalAmount = filteredIncomes.reduce((sum, income) => sum + income.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-green-400 to-blue-600 bg-clip-text text-transparent text-center">
            💰 Income History
          </h1>

          {/* Filters */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-600">
            <div className="flex flex-wrap gap-4 mb-4">
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
                  {generateYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  {generateMonthOptions().map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="">All Categories</option>
                  {getUniqueCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-600">
            <div className="text-center">
              <p className="text-green-400 text-2xl font-bold">{formatNumber(totalAmount)}</p>
              <p className="text-gray-400 text-sm">Total Income ({filteredIncomes.length} transactions)</p>
            </div>
          </div>

          {/* Income List */}
          <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Recurring</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {filteredIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                        No income found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredIncomes.map((income) => (
                      <tr key={income.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(income.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {income.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-200">
                            {income.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-semibold">
                          {formatNumber(income.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {income.recurring ? '🔄 Yes' : '❌ No'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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