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
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    description: '',
    category: '',
    date: '',
    recurring: false,
  })
  const router = useRouter()
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

  const refreshIncomes = async () => {
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

  // Filter incomes by category
  const filteredIncomes = useMemo(() => {
    if (selectedCategory) {
      return incomes.filter(income => income.category === selectedCategory)
    } else {
      return incomes
    }
  }, [incomes, selectedCategory])

  const totalAmount = filteredIncomes.reduce((sum, income) => sum + income.amount, 0)

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

  const handleDeleteIncome = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record? This action cannot be undone.')) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/income?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        // Refresh the data
        refreshIncomes()
        alert('Income record deleted successfully')
      } else {
        const error = await res.json()
        alert(`Failed to delete income: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete income error:', error)
      alert('Failed to delete income record')
    }
  }

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income)
    setEditForm({
      amount: income.amount.toString(),
      description: income.description,
      category: income.category,
      date: new Date(income.date).toISOString().split('T')[0],
      recurring: income.recurring,
    })
  }

  const handleUpdateIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIncome) return

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/income?id=${editingIncome.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          description: editForm.description,
          category: editForm.category,
          date: editForm.date,
          isRecurring: editForm.recurring,
        }),
      })

      if (res.ok) {
        // Refresh the data
        refreshIncomes()
        setEditingIncome(null)
        alert('Income updated successfully')
      } else {
        const error = await res.json()
        alert(`Failed to update income: ${error.error}`)
      }
    } catch (error) {
      console.error('Update income error:', error)
      alert('Failed to update income')
    }
  }

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {filteredIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditIncome(income)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 px-3 py-1 rounded-md transition-colors duration-200"
                              title="Edit this income record"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteIncome(income.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1 rounded-md transition-colors duration-200"
                              title="Delete this income record"
                            >
                              🗑️ Delete
                            </button>
                          </div>
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

      {/* Edit Income Modal */}
      {editingIncome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">✏️ Edit Income</h3>
            <form onSubmit={handleUpdateIncome} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <div className="relative">
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-500 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:border-gray-400 shadow-lg"
                    required
                  >
                    <option value="" className="bg-gray-700 text-white">📂 Select category</option>
                    <option value="salary" className="bg-gray-700 text-white">💼 Salary</option>
                    <option value="freelance" className="bg-gray-700 text-white">💻 Freelance</option>
                    <option value="business" className="bg-gray-700 text-white">🏢 Business</option>
                    <option value="investment" className="bg-gray-700 text-white">📈 Investment</option>
                    <option value="gift" className="bg-gray-700 text-white">🎁 Gift</option>
                    <option value="other" className="bg-gray-700 text-white">📝 Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={editForm.recurring}
                  onChange={(e) => setEditForm({ ...editForm, recurring: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-600 rounded bg-gray-700"
                />
                <label htmlFor="recurring" className="ml-2 block text-sm text-gray-300">
                  Recurring income
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Update Income
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIncome(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}