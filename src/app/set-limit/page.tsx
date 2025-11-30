'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const limitSchema = z.object({
  limitAmount: z.number().positive(),
  period: z.string(),
})

type LimitForm = z.infer<typeof limitSchema>

export default function SetLimitPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<LimitForm>({
    resolver: zodResolver(limitSchema),
  })

  const onSubmit = async (data: LimitForm) => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    const res = await fetch('/api/spending-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setSuccess('Limit set successfully!')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setError('Failed to set limit')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-center text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Set Spending Limit</h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Limit Amount</label>
              <input
                {...register('limitAmount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Enter limit amount"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
              />
              {errors.limitAmount && <p className="text-red-400 text-sm mt-1">{errors.limitAmount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Period</label>
              <select
                {...register('period')}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
              >
                <option value="" className="bg-gray-700">Select Period</option>
                <option value="monthly" className="bg-gray-700">📅 Monthly</option>
                <option value="yearly" className="bg-gray-700">📆 Yearly</option>
              </select>
              {errors.period && <p className="text-red-400 text-sm mt-1">{errors.period.message}</p>}
            </div>
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Set Spending Limit
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="/dashboard" className="text-orange-400 hover:text-orange-300 font-medium transition-colors duration-200">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}