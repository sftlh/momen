import { useRouter } from 'next/navigation'

export const handleApiError = (error: any, router: ReturnType<typeof useRouter>) => {
  if (error.status === 401 || error.message?.includes('401')) {
    localStorage.removeItem('token')
    router.push('/login')
    return true
  }
  return false
}

export const apiRequest = async (url: string, options: RequestInit = {}, router: ReturnType<typeof useRouter>) => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    throw new Error('No token found')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    router.push('/login')
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response
}