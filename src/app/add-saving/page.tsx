'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const savingSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  date: z.string(),
  category: z.string().optional(),
  type: z.enum(['deposit', 'withdrawal', 'transfer']),
  goalAmount: z.number().optional(),
  isEmergency: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.string().optional(),
  endDate: z.string().optional(),
})

type SavingsData = {
  id: string
  amount: number
  description?: string
  category?: string
  date: string
  type?: string
  goalAmount?: number
  isEmergency?: boolean
}

export default function AddSavingPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [availableSavings, setAvailableSavings] = useState(0)
  const router = useRouter()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof savingSchema>>({
    resolver: zodResolver(savingSchema),
    defaultValues: {
      type: 'deposit',
      isRecurring: false,
      isEmergency: false,
    },
  })

  // Fetch available savings when component mounts
  useEffect(() => {
    const fetchAvailableSavings = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const res = await fetch('/api/user/savings', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        const totalSavings = data.savings?.reduce((sum: number, saving: SavingsData) => sum + saving.amount, 0) || 0
        setAvailableSavings(totalSavings)
      } catch (error) {
        console.error('Failed to fetch savings:', error)
      }
    }

    fetchAvailableSavings()
  }, [])

  const onSubmit = async (data: z.infer<typeof savingSchema>) => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    // Validate withdrawal amount
    if (data.type === 'withdrawal' && data.amount > availableSavings) {
      setError(`Cannot withdraw more than available savings ($${availableSavings.toFixed(2)})`)
      return
    }

    // For withdrawals, convert amount to negative
    const processedData = {
      ...data,
      amount: data.type === 'withdrawal' ? -Math.abs(data.amount) : data.amount
    }

    const res = await fetch('/api/saving', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(processedData),
    })
    if (res.ok) {
      setSuccess('Transaction saved successfully!')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setError('Failed to save transaction')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-center text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Manage Savings</h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount {watch('type') === 'withdrawal' ? '(to withdraw)' : '(to deposit)'}
              </label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder={watch('type') === 'withdrawal' ? 'Amount to withdraw from savings' : 'Amount to add to savings'}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              {watch('type') === 'withdrawal' && (
                <p className="text-sm text-gray-400 mt-1">
                  Available savings: <span className="text-green-400 font-semibold">${availableSavings.toFixed(2)}</span>
                </p>
              )}
              {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                {...register('description')}
                type="text"
                placeholder="Enter description"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                {...register('category')}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="" className="bg-gray-700">Select Category</option>
                <option value="Emergency Fund" className="bg-gray-700">🚨 Emergency Fund</option>
                <option value="Vacation" className="bg-gray-700">🏖️ Vacation</option>
                <option value="Car Purchase" className="bg-gray-700">🚗 Car Purchase</option>
                <option value="Home Down Payment" className="bg-gray-700">🏠 Home Down Payment</option>
                <option value="Education" className="bg-gray-700">📚 Education</option>
                <option value="Retirement" className="bg-gray-700">🏖️ Retirement</option>
                <option value="Investment" className="bg-gray-700">📈 Investment</option>
                <option value="General" className="bg-gray-700">💰 General Savings</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
              <select
                {...register('type')}
                defaultValue="deposit"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="deposit" className="bg-gray-700">💰 Deposit - Add money to savings</option>
                <option value="withdrawal" className="bg-gray-700">📤 Withdrawal - Remove money from savings</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Goal Amount (Optional)</label>
              <input
                {...register('goalAmount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Target amount for this savings goal"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex items-center">
              <input
                {...register('isEmergency')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-300">
                This is part of my emergency fund (should only be used in emergencies)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                {...register('date')}
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex items-center">
              <input
                {...register('isRecurring')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-300">
                Make this a recurring saving
              </label>
            </div>
            {watch('isRecurring') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                  <select
                    {...register('frequency')}
                    className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="" className="bg-gray-700">Select Frequency</option>
                    <option value="daily" className="bg-gray-700">Daily</option>
                    <option value="weekly" className="bg-gray-700">Weekly</option>
                    <option value="monthly" className="bg-gray-700">Monthly</option>
                    <option value="yearly" className="bg-gray-700">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date (Optional)</label>
                  <input
                    {...register('endDate')}
                    type="date"
                    className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </>
            )}
            {error && (
              <div className="rounded-md bg-red-900/50 p-4 border border-red-700">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-900/50 p-4 border border-green-700">
                <p className="text-green-300 text-sm">{success}</p>
              </div>
            )}
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Save Transaction
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="/dashboard" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}