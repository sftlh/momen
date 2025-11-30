'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string(),
  category: z.string().optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.string().optional(),
  endDate: z.string().optional(),
})

type ExpenseForm = z.infer<typeof expenseSchema>

export default function AddExpensePage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
  })

  const onSubmit = async (data: ExpenseForm) => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    const res = await fetch('/api/expense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setSuccess('Expense added successfully!')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setError('Failed to add expense')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-center text-3xl font-extrabold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Add Expense</h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Enter amount"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
              />
              {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                {...register('description')}
                type="text"
                placeholder="Enter description"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                {...register('date')}
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                {...register('category')}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
              >
                <option value="" className="bg-gray-700">Select Category</option>
                <option value="food" className="bg-gray-700">🍕 Food & Dining</option>
                <option value="transport" className="bg-gray-700">🚗 Transportation</option>
                <option value="shopping" className="bg-gray-700">🛍️ Shopping</option>
                <option value="entertainment" className="bg-gray-700">🎬 Entertainment</option>
                <option value="bills" className="bg-gray-700">💡 Bills & Utilities</option>
                <option value="health" className="bg-gray-700">🏥 Health & Medical</option>
                <option value="education" className="bg-gray-700">📚 Education</option>
                <option value="other" className="bg-gray-700">📝 Other</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                {...register('isRecurring')}
                type="checkbox"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-300">
                Make this a recurring expense
              </label>
            </div>
            {watch('isRecurring') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                  <select
                    {...register('frequency')}
                    className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
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
                    className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Expense
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="/dashboard" className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}