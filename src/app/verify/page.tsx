'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyPage() {
  const [message, setMessage] = useState('Verifying your email...')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setMessage('Invalid verification link.')
      return
    }

    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setMessage('Email verified successfully! Redirecting to login...')
          setTimeout(() => router.push('/login'), 2000)
        } else {
          setMessage(result.error || 'Verification failed.')
        }
      })
      .catch(() => {
        setMessage('An error occurred. Please try again.')
      })
  }, [token, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
          MoMen
        </h1>
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  )
}