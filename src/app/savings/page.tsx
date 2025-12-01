'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TransferFromSavings from '@/components/TransferFromSavings'

interface Savings {
  id: string
  amount: number
  description: string
  category: string
  date: string
  recurring: boolean
  type: string
  goalAmount?: number
  isEmergency: boolean
}

export default function SavingsPage() {
  const [savings, setSavings] = useState<Savings[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const router = useRouter()

  // Fetch savings when filters change
  useEffect(() => {
    const fetchSavings = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (selectedMonth) params.append('month', selectedMonth)

      const url = `/api/user/savings${params.toString() ? `?${params.toString()}` : ''}`

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setSavings(data.savings || [])
      } catch (error) {
        console.error('Failed to fetch savings:', error)
        router.push('/login')
      }
    }

    if (selectedYear) {
      fetchSavings()
    }
  }, [selectedYear, selectedMonth, router])

  // Filter savings by category
  const filteredSavings = useMemo(() => {
    if (selectedCategory) {
      return savings.filter(saving => saving.category === selectedCategory)
    } else {
      return savings
    }
  }, [savings, selectedCategory])

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
    const categories = [...new Set(savings.map(saving => saving.category))]
    return categories.sort()
  }

  const handleDeleteSaving = async (savingId: string, savingDescription: string) => {
    if (!confirm(`Are you sure you want to delete the saving "${savingDescription}"? This action cannot be undone.`)) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/user/savings/${savingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        alert('Saving deleted successfully!')
        // Refresh the savings list
        const params = new URLSearchParams()
        if (selectedYear) params.append('year', selectedYear)
        if (selectedMonth) params.append('month', selectedMonth)

        const url = `/api/user/savings${params.toString() ? `?${params.toString()}` : ''}`

        const refreshRes = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await refreshRes.json()
        setSavings(data.savings || [])
      } else {
        const error = await res.json()
        alert(`Failed to delete saving: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete saving:', error)
      alert('Failed to delete saving. Please try again.')
    }
  }

  const totalAmount = filteredSavings.reduce((sum, saving) => sum + saving.amount, 0)
  const emergencySavings = filteredSavings
    .filter(saving => saving.isEmergency)
    .reduce((sum, saving) => sum + saving.amount, 0)
  const regularSavings = totalAmount - emergencySavings
  const withdrawals = filteredSavings
    .filter(saving => saving.type === 'withdrawal')
    .reduce((sum, saving) => sum + Math.abs(saving.amount), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-cyan-600 bg-clip-text text-transparent text-center">
            💾 Savings Management
          </h1>

          {/* Transfer from Savings */}
          <TransferFromSavings
            onTransfer={() => {
              // Re-fetch savings data
              const fetchSavings = async () => {
                const token = localStorage.getItem('token')
                if (!token) return

                const params = new URLSearchParams()
                if (selectedYear) params.append('year', selectedYear)
                if (selectedMonth) params.append('month', selectedMonth)

                const url = `/api/user/savings${params.toString() ? `?${params.toString()}` : ''}`

                try {
                  const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  const data = await res.json()
                  setSavings(data.savings || [])
                } catch (error) {
                  console.error('Failed to fetch savings:', error)
                }
              }
              fetchSavings()
            }}
            availableSavings={totalAmount}
          />

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

          {/* Enhanced Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 text-center">
              <p className="text-green-400 text-2xl font-bold">{formatNumber(totalAmount)}</p>
              <p className="text-gray-400 text-sm">Total Savings</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 text-center">
              <p className="text-blue-400 text-2xl font-bold">{formatNumber(emergencySavings)}</p>
              <p className="text-gray-400 text-sm">Emergency Fund</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 text-center">
              <p className="text-purple-400 text-2xl font-bold">{formatNumber(regularSavings)}</p>
              <p className="text-gray-400 text-sm">Regular Savings</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 text-center">
              <p className="text-red-400 text-2xl font-bold">{formatNumber(withdrawals)}</p>
              <p className="text-gray-400 text-sm">Used from Savings</p>
            </div>
          </div>

          {/* Savings List */}
          <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Emergency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {filteredSavings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                        No savings found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredSavings.map((saving) => (
                      <tr key={saving.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(saving.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {saving.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            saving.type === 'deposit' ? 'bg-green-900 text-green-200' :
                            saving.type === 'withdrawal' ? 'bg-red-900 text-red-200' :
                            'bg-blue-900 text-blue-200'
                          }`}>
                            {saving.type === 'deposit' ? '💰 Deposit' :
                             saving.type === 'withdrawal' ? '📤 Withdrawal' :
                             '🔄 Transfer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-900 text-blue-200">
                            {saving.category}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          saving.amount >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {saving.amount >= 0 ? '+' : ''}{formatNumber(saving.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {saving.isEmergency ? '🚨 Yes' : '❌ No'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteSaving(saving.id, saving.description)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors duration-200"
                          >
                            🗑️ Delete
                          </button>
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