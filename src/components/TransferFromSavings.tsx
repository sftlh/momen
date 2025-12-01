'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TransferFromSavingsProps {
  onTransfer: () => void
  availableSavings: number
}

export default function TransferFromSavings({ onTransfer, availableSavings }: TransferFromSavingsProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const transferAmount = parseFloat(amount)
    if (transferAmount > availableSavings) {
      setError('Amount exceeds available savings')
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/saving/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: transferAmount,
          description,
          category: category || 'Emergency Expense',
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert(`Successfully transferred $${transferAmount.toFixed(2)} from savings to expenses`)
        setAmount('')
        setDescription('')
        setCategory('')
        onTransfer() // Refresh data
      } else {
        setError(data.error || 'Transfer failed')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
        💰 Use Savings for Expenses
      </h3>
      <p className="text-yellow-700 mb-4">
        Available savings: <span className="font-bold">${availableSavings.toFixed(2)}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount to Transfer
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={availableSavings}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Transfer
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="e.g., Emergency medical expense"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (Optional)
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-400 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 hover:border-gray-300 shadow-lg"
            >
              <option value="" className="bg-gray-800 text-white">📂 Select category</option>
              <option value="Medical" className="bg-gray-800 text-white">🏥 Medical</option>
              <option value="Car Repair" className="bg-gray-800 text-white">🚗 Car Repair</option>
              <option value="Home Repair" className="bg-gray-800 text-white">🏠 Home Repair</option>
              <option value="Food" className="bg-gray-800 text-white">🍽️ Food</option>
              <option value="Transportation" className="bg-gray-800 text-white">🚇 Transportation</option>
              <option value="Other" className="bg-gray-800 text-white">📦 Other</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !amount || !description}
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Processing...' : 'Transfer from Savings'}
        </button>
      </form>
    </div>
  )
}