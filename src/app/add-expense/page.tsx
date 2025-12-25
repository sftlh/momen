'use client'

import { useState, useEffect } from 'react'
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
  source: z.enum(['income', 'savings']),
  savingsCategory: z.string().optional(),
})

type ExpenseForm = z.infer<typeof expenseSchema>

interface Savings {
  id: string
  amount: number
  description: string
  category: string
  date: string
  type: string
  isEmergency: boolean
}

interface SavingsAccount {
  category: string
  bankName: string
  balance: number
  lastUpdated: Date
  goalAmount?: number
}

interface SavingsBalance {
  category: string
  balance: number
  isEmergency: boolean
  description: string
}

export default function AddExpensePage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savingsBalances, setSavingsBalances] = useState<SavingsBalance[]>([])
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      source: 'income',
    },
  })

  const selectedSource = watch('source')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (selectedSource === 'savings' && isClient) {
      fetchSavings()
    }
  }, [selectedSource, isClient])

  const fetchSavings = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Use the savings-accounts API which groups by category and bank
      const res = await fetch('/api/user/savings-accounts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const accounts = data.existingAccounts || []

      // Convert to the expected format for the dropdown
      const availableBalances: SavingsBalance[] = accounts
        .filter((account: SavingsAccount) => account.balance > 0)
        .map((account: SavingsAccount) => ({
          category: `${account.category}|||${account.bankName}`, // Use combined key for uniqueness
          balance: account.balance,
          isEmergency: account.category === 'emergency',
          description: `${account.category} (${account.bankName})`,
        }))

      setSavingsBalances(availableBalances)
    } catch (error) {
      console.error('Failed to fetch savings:', error)
    }
  }

  const onSubmit = async (data: ExpenseForm) => {
    if (!isClient) return

    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    try {
      if (data.source === 'savings') {
        if (!data.savingsCategory) {
          setError('Please select a savings category')
          return
        }

        const selectedBalance = savingsBalances.find(balance => balance.category === data.savingsCategory)
        if (!selectedBalance) {
          setError('Selected savings category not found')
          return
        }

        if (data.amount > selectedBalance.balance) {
          const [category, bankName] = data.savingsCategory.split('|||')
          setError(`Expense amount ($${data.amount}) exceeds available savings in ${category} (${bankName}) ($${selectedBalance.balance.toFixed(2)})`)
          return
        }

        // Create the expense
        const expenseRes = await fetch('/api/expense', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: data.amount,
            description: data.description,
            category: data.category,
            date: data.date,
            isRecurring: data.isRecurring,
            frequency: data.frequency,
            endDate: data.endDate,
          }),
        })

        if (!expenseRes.ok) {
          const errorData = await expenseRes.json()
          setError(errorData.error || 'Failed to create expense')
          return
        }

        // Parse category and bankName from savingsCategory
        const [category, bankName] = data.savingsCategory.split('|||')

        // Create a savings withdrawal record (new record, not updating existing)
        const savingsRes = await fetch('/api/saving', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: -Math.abs(data.amount), // Negative amount for withdrawal
            description: `Used for expense: ${data.description || 'Expense'}`,
            category: category,
            bankName: bankName,
            type: 'withdrawal',
            date: data.date,
            isEmergency: selectedBalance.isEmergency,
          }),
        })

        if (!savingsRes.ok) {
          const errorData = await savingsRes.json()
          setError(errorData.error || 'Failed to record savings withdrawal')
          return
        }

        setSuccess('Expense created successfully using savings!')
      } else {
        // Regular expense from income
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
        } else {
          const errorData = await res.json()
          setError(errorData.error || 'Failed to add expense')
          return
        }
      }

      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (error) {
      setError('An unexpected error occurred')
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
              <select
                {...register('source')}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
              >
                <option value="income" className="bg-gray-700">💰 From Income</option>
                <option value="savings" className="bg-gray-700">💸 From Savings</option>
              </select>
              {errors.source && <p className="text-red-400 text-sm mt-1">{errors.source.message}</p>}
            </div>
            {selectedSource === 'savings' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Savings from Banks</label>
                <select
                  {...register('savingsCategory')}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="" className="bg-gray-700">Choose savings account to use</option>
                  {savingsBalances.map((balance) => (
                    <option key={balance.category} value={balance.category} className="bg-gray-700">
                      {balance.description} - {Math.round(balance.balance).toLocaleString()} {balance.isEmergency ? '(Emergency)' : ''}
                    </option>
                  ))}
                </select>
                {savingsBalances.length === 0 && (
                  <p className="text-yellow-400 text-sm mt-1">No savings available. Add savings first.</p>
                )}
                {errors.savingsCategory && <p className="text-red-400 text-sm mt-1">{errors.savingsCategory.message}</p>}
              </div>
            )}
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
              {selectedSource === 'savings' ? '💸 Add Expense from Savings' : '💰 Add Expense'}
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