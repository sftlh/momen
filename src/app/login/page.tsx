'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState('')
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (res.ok) {
      localStorage.setItem('token', result.token)
      router.push('/dashboard')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
            MoMen
          </h1>
          <p className="text-gray-400 text-sm">Your Family Finance Manager</p>
        </div>
        <div>
          <h2 className="text-center text-2xl font-bold text-white mb-6">Welcome Back</h2>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
                />
                {errors.email && <p className="mt-1 text-red-400 text-sm">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
                />
                {errors.password && <p className="mt-1 text-red-400 text-sm">{errors.password.message}</p>}
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-red-900/50 p-4 border border-red-700">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sign In
            </button>
          </form>
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}