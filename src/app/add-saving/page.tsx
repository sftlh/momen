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
  bankName: z.string().optional(),
  type: z.enum(['deposit', 'withdrawal', 'transfer']),
  goalAmount: z.union([z.number(), z.string()]).optional(),
  isEmergency: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.string().optional(),
  endDate: z.string().optional(),
  accountAction: z.enum(['new', 'existing']),
  existingAccount: z.string().optional(),
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

type ExistingAccount = {
  category: string
  bankName: string
  balance: number
  lastUpdated: Date
  goalAmount?: number
}

export default function AddSavingPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [availableSavings, setAvailableSavings] = useState(0)
  const [existingAccounts, setExistingAccounts] = useState<ExistingAccount[]>([])
  const router = useRouter()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<z.infer<typeof savingSchema>>({
    resolver: zodResolver(savingSchema),
    defaultValues: {
      type: 'deposit',
      isRecurring: false,
      isEmergency: false,
      accountAction: 'new',
    },
  })

  // Fetch available savings and existing accounts when component mounts
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        // Fetch total savings for withdrawal validation
        const savingsRes = await fetch('/api/user/savings', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const savingsData = await savingsRes.json()
        const totalSavings = savingsData.savings?.reduce((sum: number, saving: SavingsData) => sum + saving.amount, 0) || 0
        setAvailableSavings(totalSavings)

        // Fetch existing accounts for the dropdown
        const accountsRes = await fetch('/api/user/savings-accounts', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const accountsData = await accountsRes.json()
        setExistingAccounts(accountsData.existingAccounts || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    fetchData()
  }, [])

  // Handle transaction type changes
  useEffect(() => {
    if (watch('type') === 'withdrawal') {
      setValue('accountAction', 'existing')
      setValue('existingAccount', undefined)
    }
  }, [watch('type'), setValue])

  const onSubmit = async (data: z.infer<typeof savingSchema>) => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    // Validate withdrawal amount
    if (data.type === 'withdrawal') {
      let maxWithdrawalAmount = availableSavings
      
      // If withdrawing from a specific account, check that account's balance
      if (data.accountAction === 'existing' && data.existingAccount) {
        const selectedAccount = existingAccounts.find(account => 
          `${account.category}|||${account.bankName}` === data.existingAccount
        )
        if (selectedAccount) {
          maxWithdrawalAmount = selectedAccount.balance
        }
      }
      
      if (data.amount > maxWithdrawalAmount) {
        setError(`Cannot withdraw more than available balance ($${maxWithdrawalAmount.toFixed(2)})`)
        return
      }
    }

    // For withdrawals, convert amount to negative
    const processedData = {
      ...data,
      amount: data.type === 'withdrawal' ? -Math.abs(data.amount) : data.amount
    }

    // If adding to existing account, parse the selected value to get category and bankName
    if (data.accountAction === 'existing' && data.existingAccount) {
      const [category, bankName] = data.existingAccount.split('|||')
      processedData.category = category
      processedData.bankName = bankName
    }

    // Handle empty goalAmount
    if (typeof data.goalAmount === 'string' && data.goalAmount.trim() === '') {
      processedData.goalAmount = undefined
    } else if (typeof data.goalAmount === 'number') {
      processedData.goalAmount = data.goalAmount
    } else {
      processedData.goalAmount = undefined
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
      
      // Refresh the balance and accounts data after successful transaction
      const token = localStorage.getItem('token')
      if (token) {
        try {
          // Refresh total savings balance
          const savingsRes = await fetch('/api/user/savings', {
            headers: { Authorization: `Bearer ${token}` },
          })
          const savingsData = await savingsRes.json()
          const totalSavings = savingsData.savings?.reduce((sum: number, saving: SavingsData) => sum + saving.amount, 0) || 0
          setAvailableSavings(totalSavings)

          // Refresh existing accounts
          const accountsRes = await fetch('/api/user/savings-accounts', {
            headers: { Authorization: `Bearer ${token}` },
          })
          const accountsData = await accountsRes.json()
          setExistingAccounts(accountsData.existingAccounts || [])
        } catch (error) {
          console.error('Failed to refresh data:', error)
        }
      }
      
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Action</label>
              <select
                {...register('accountAction')}
                onChange={(e) => {
                  setValue('accountAction', e.target.value as 'new' | 'existing')
                  if (e.target.value === 'new') {
                    setValue('existingAccount', undefined)
                  }
                }}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                {watch('type') === 'withdrawal' ? (
                  <option value="existing" className="bg-gray-700">➖ From Existing Account</option>
                ) : (
                  <>
                    <option value="new" className="bg-gray-700">🆕 Create New Savings Account</option>
                    <option value="existing" className="bg-gray-700">➕ Add to Existing Account</option>
                  </>
                )}
              </select>
            </div>
            {watch('accountAction') === 'existing' && existingAccounts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Existing Account</label>
                <select
                  {...register('existingAccount')}
                  onChange={(e) => {
                    const selectedValue = e.target.value
                    setValue('existingAccount', selectedValue)
                    
                    // Auto-set category and goal amount when selecting existing account
                    if (selectedValue && watch('type') === 'deposit') {
                      const selectedAccount = existingAccounts.find(account => 
                        `${account.category}|||${account.bankName}` === selectedValue
                      )
                      if (selectedAccount) {
                        setValue('category', selectedAccount.category)
                        if (selectedAccount.goalAmount) {
                          setValue('goalAmount', selectedAccount.goalAmount.toString())
                        }
                      }
                    }
                  }}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="" className="bg-gray-700">Choose an account...</option>
                  {existingAccounts.map((account) => (
                    <option key={`${account.category}|||${account.bankName}`} value={`${account.category}|||${account.bankName}`} className="bg-gray-700">
                      {account.category} ({account.bankName}) - {Math.round(account.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
                {errors.existingAccount && <p className="text-red-400 text-sm mt-1">{errors.existingAccount.message}</p>}
              </div>
            )}
            {watch('accountAction') === 'existing' && existingAccounts.length === 0 && (
              <div className="rounded-md bg-yellow-900/50 p-4 border border-yellow-700">
                <p className="text-yellow-300 text-sm">No existing savings accounts found. Please create a new account first.</p>
              </div>
            )}
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
                  Available balance: <span className="text-green-400 font-semibold">
                    ${(() => {
                      // Show account-specific balance if withdrawing from existing account
                      if (watch('accountAction') === 'existing' && watch('existingAccount')) {
                        const selectedAccount = existingAccounts.find(account => 
                          `${account.category}|||${account.bankName}` === watch('existingAccount')
                        )
                        return selectedAccount ? selectedAccount.balance.toFixed(2) : availableSavings.toFixed(2)
                      }
                      // Show total balance for general withdrawals
                      return availableSavings.toFixed(2)
                    })()}
                  </span>
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
            {watch('type') === 'deposit' && watch('accountAction') !== 'existing' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  {...register('category')}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  <option value="" className="bg-gray-700">Select Category</option>
                  <option value="emergency" className="bg-gray-700">🚨 Emergency Fund</option>
                  <option value="vacation" className="bg-gray-700">🏖️ Vacation/Travel</option>
                  <option value="retirement" className="bg-gray-700">🏠 Retirement</option>
                  <option value="education" className="bg-gray-700">📚 Education</option>
                  <option value="house" className="bg-gray-700">🏡 House/Car</option>
                  <option value="investment" className="bg-gray-700">📈 Investment</option>
                  <option value="business" className="bg-gray-700">💼 Business</option>
                  <option value="wedding" className="bg-gray-700">💍 Wedding</option>
                  <option value="medical" className="bg-gray-700">🏥 Medical</option>
                  <option value="general" className="bg-gray-700">💰 General</option>
                </select>
              </div>
            )}
            {watch('accountAction') === 'new' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bank Name</label>
                <input
                  {...register('bankName')}
                  type="text"
                  placeholder="Enter bank name (optional)"
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            )}
            {watch('type') === 'deposit' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Goal Amount {watch('accountAction') === 'existing' ? '(From Selected Account)' : '(Optional)'}
                </label>
                <input
                  {...register('goalAmount')}
                  type="number"
                  step="0.01"
                  placeholder={watch('accountAction') === 'existing' ? 'Auto-filled from selected account' : 'Target amount for this savings goal'}
                  readOnly={watch('accountAction') === 'existing'}
                  className={`appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                    watch('accountAction') === 'existing' ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700'
                  }`}
                />
              </div>
            )}
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