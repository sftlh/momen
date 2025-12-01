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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">Select category</option>
            <option value="Medical">Medical</option>
            <option value="Car Repair">Car Repair</option>
            <option value="Home Repair">Home Repair</option>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Other">Other</option>
          </select>
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