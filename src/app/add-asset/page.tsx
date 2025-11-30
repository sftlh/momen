'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const assetSchema = z.object({
  type: z.string(),
  symbol: z.string().optional(),
  quantity: z.number().positive().optional(),
  purchasePrice: z.number().positive(),
  currentPrice: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string(),
})

type AssetForm = z.infer<typeof assetSchema>

export default function AddAssetPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
  })

  const onSubmit = async (data: AssetForm) => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    const res = await fetch('/api/asset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setSuccess('Asset added successfully!')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setError('Failed to add asset')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-center text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Add Asset</h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Asset Type</label>
              <select
                {...register('type')}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              >
                <option value="" className="bg-gray-700">Select Type</option>
                <option value="stocks" className="bg-gray-700">Stocks</option>
                <option value="bonds" className="bg-gray-700">Bonds</option>
                <option value="gold" className="bg-gray-700">Gold</option>
                <option value="real-estate" className="bg-gray-700">Real Estate</option>
                <option value="crypto" className="bg-gray-700">Cryptocurrency</option>
              </select>
              {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Symbol/Ticker (Optional)</label>
              <input
                {...register('symbol')}
                type="text"
                placeholder="e.g., AAPL, BTC, GOLD"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quantity (Optional)</label>
              <input
                {...register('quantity', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Number of shares/units"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
              {errors.quantity && <p className="text-red-400 text-sm mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Price</label>
              <input
                {...register('purchasePrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Price per unit when purchased"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
              {errors.purchasePrice && <p className="text-red-400 text-sm mt-1">{errors.purchasePrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Price (Optional)</label>
              <input
                {...register('currentPrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Current market price per unit"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
              {errors.currentPrice && <p className="text-red-400 text-sm mt-1">{errors.currentPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                {...register('description')}
                type="text"
                placeholder="Enter description"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                {...register('date')}
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Asset
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="/dashboard" className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}