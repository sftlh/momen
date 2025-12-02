'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Asset {
  id: string
  symbol?: string
  type: string
  quantity: number
  purchasePrice: number
  currentPrice: number
  totalValue: number
  date: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    type: '',
    quantity: 0,
    purchasePrice: 0,
    currentPrice: 0,
    date: ''
  })
  const router = useRouter()

  // Fetch assets when filters change
  useEffect(() => {
    const fetchAssets = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (selectedMonth) params.append('month', selectedMonth)

      const url = `/api/user/assets${params.toString() ? `?${params.toString()}` : ''}`

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setAssets(data.assets || [])
      } catch (error) {
        console.error('Failed to fetch assets:', error)
        router.push('/login')
      }
    }

    if (selectedYear) {
      fetchAssets()
    }
  }, [selectedYear, selectedMonth, router])

  // Filter assets by type
  const filteredAssets = useMemo(() => {
    if (selectedType) {
      return assets.filter(asset => asset.type === selectedType)
    } else {
      return assets
    }
  }, [assets, selectedType])

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

  const getUniqueTypes = () => {
    const types = [...new Set(assets.map(asset => asset.type))]
    return types.sort()
  }

  const handleDeleteAsset = async (assetId: string, assetName: string) => {
    if (!confirm(`Are you sure you want to delete the asset "${assetName}"? This action cannot be undone.`)) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/user/assets/${assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        alert('Asset deleted successfully!')
        // Refresh the assets list
        const params = new URLSearchParams()
        if (selectedYear) params.append('year', selectedYear)
        if (selectedMonth) params.append('month', selectedMonth)

        const url = `/api/user/assets${params.toString() ? `?${params.toString()}` : ''}`

        const refreshRes = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await refreshRes.json()
        setAssets(data.assets || [])
      } else {
        const error = await res.json()
        alert(`Failed to delete asset: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete asset:', error)
      alert('Failed to delete asset. Please try again.')
    }
  }

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setEditForm({
      name: asset.symbol || '',
      type: asset.type,
      quantity: asset.quantity,
      purchasePrice: asset.purchasePrice,
      currentPrice: asset.currentPrice,
      date: asset.date.split('T')[0] // Format for date input
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAsset) return

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/user/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: editForm.type,
          symbol: editForm.name || undefined,
          quantity: editForm.quantity,
          purchasePrice: editForm.purchasePrice,
          currentPrice: editForm.currentPrice,
          date: editForm.date,
        }),
      })

      if (res.ok) {
        alert('Asset updated successfully!')
        setIsEditModalOpen(false)
        setEditingAsset(null)
        // Refresh the assets list
        const params = new URLSearchParams()
        if (selectedYear) params.append('year', selectedYear)
        if (selectedMonth) params.append('month', selectedMonth)

        const url = `/api/user/assets${params.toString() ? `?${params.toString()}` : ''}`

        const refreshRes = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await refreshRes.json()
        setAssets(data.assets || [])
      } else {
        const error = await res.json()
        alert(`Failed to update asset: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update asset:', error)
      alert('Failed to update asset. Please try again.')
    }
  }

  const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.totalValue, 0)
  const totalPurchaseValue = filteredAssets.reduce((sum, asset) => sum + (asset.purchasePrice * asset.quantity), 0)
  const totalGainLoss = totalValue - totalPurchaseValue

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent text-center">
            🏦 Assets Portfolio
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Asset Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="">All Types</option>
                  {getUniqueTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
              <div className="text-center">
                <p className="text-purple-400 text-xl font-bold">{formatNumber(totalValue)}</p>
                <p className="text-gray-400 text-sm">Total Current Value</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
              <div className="text-center">
                <p className="text-blue-400 text-xl font-bold">{formatNumber(totalPurchaseValue)}</p>
                <p className="text-gray-400 text-sm">Total Purchase Value</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
              <div className="text-center">
                <p className={`text-xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatNumber(totalGainLoss)}
                </p>
                <p className="text-gray-400 text-sm">Total Gain/Loss</p>
              </div>
            </div>
          </div>

          {/* Assets List */}
          <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Purchase Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Current Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Gain/Loss</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-400">
                        No assets found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => {
                      const purchaseValue = asset.purchasePrice * asset.quantity
                      const gainLoss = asset.totalValue - purchaseValue
                      const gainLossPercent = purchaseValue > 0 ? ((gainLoss / purchaseValue) * 100) : 0

                      return (
                        <tr key={asset.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(asset.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                            {asset.symbol || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-900 text-purple-200">
                              {asset.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {asset.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">
                            {formatNumber(asset.purchasePrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400">
                            {formatNumber(asset.currentPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400 font-semibold">
                            {formatNumber(asset.totalValue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col">
                              <span className={`font-semibold ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatNumber(gainLoss)}
                              </span>
                              <span className={`text-xs ${gainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                ({gainLossPercent.toFixed(1)}%)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditAsset(asset)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors duration-200"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAsset(asset.id, asset.symbol || 'this asset')}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors duration-200"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
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

      {/* Edit Asset Modal */}
      {isEditModalOpen && editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">✏️</span> Edit Asset
            </h3>
            <form onSubmit={handleUpdateAsset}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <span className="mr-2">📅</span> Date
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <span className="mr-2">🏷️</span> Symbol/Ticker
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="e.g., AAPL, BTC, GOLD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <span className="mr-2">📊</span> Type
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-500 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 hover:border-gray-400 shadow-lg"
                      required
                    >
                      <option value="" className="bg-gray-700 text-white">📂 Select type</option>
                      <option value="stocks" className="bg-gray-700 text-white">📈 Stocks</option>
                      <option value="bonds" className="bg-gray-700 text-white">📊 Bonds</option>
                      <option value="gold" className="bg-gray-700 text-white">🥇 Gold</option>
                      <option value="real-estate" className="bg-gray-700 text-white">🏠 Real Estate</option>
                      <option value="crypto" className="bg-gray-700 text-white">₿ Cryptocurrency</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <span className="mr-2">🔢</span> Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <span className="mr-2">💰</span> Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.purchasePrice}
                    onChange={(e) => setEditForm({ ...editForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <span className="mr-2">📈</span> Current Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.currentPrice}
                    onChange={(e) => setEditForm({ ...editForm, currentPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  <span className="mr-2">💾</span> Update Asset
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}