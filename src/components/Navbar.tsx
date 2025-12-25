/* eslint-disable react-hooks/set-state-in-effect */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLogout = () => {
    if (!isClient) return
    localStorage.removeItem('token')
    router.push('/login')
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <nav className="bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              MoMen
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <Link href="/summary" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Summary
            </Link>
            <div className="relative group">
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                📊 Lists ▼
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link href="/income" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  💰 Income History
                </Link>
                <Link href="/expenses" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  💸 Expense History
                </Link>
                <Link href="/savings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  💾 Savings History
                </Link>
                <Link href="/assets" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  🏦 Assets Portfolio
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800 border-t border-gray-700">
            <Link
              href="/dashboard"
              onClick={closeMobileMenu}
              className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/summary"
              onClick={closeMobileMenu}
              className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              📈 Summary
            </Link>

            {/* Mobile Lists Section */}
            <div className="border-t border-gray-600 pt-2 mt-2">
              <p className="text-gray-400 text-sm font-medium px-3 py-1">📋 Lists</p>
              <Link
                href="/income"
                onClick={closeMobileMenu}
                className="text-gray-300 hover:text-white block px-6 py-2 rounded-md text-base font-medium transition-colors"
              >
                💰 Income History
              </Link>
              <Link
                href="/expenses"
                onClick={closeMobileMenu}
                className="text-gray-300 hover:text-white block px-6 py-2 rounded-md text-base font-medium transition-colors"
              >
                💸 Expense History
              </Link>
              <Link
                href="/savings"
                onClick={closeMobileMenu}
                className="text-gray-300 hover:text-white block px-6 py-2 rounded-md text-base font-medium transition-colors"
              >
                💾 Savings History
              </Link>
              <Link
                href="/assets"
                onClick={closeMobileMenu}
                className="text-gray-300 hover:text-white block px-6 py-2 rounded-md text-base font-medium transition-colors"
              >
                🏦 Assets Portfolio
              </Link>
            </div>

            <div className="border-t border-gray-600 pt-2 mt-2">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}