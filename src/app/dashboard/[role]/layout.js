'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Home } from 'lucide-react'

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // Verify role matches the current route
    if (parsedUser.role !== params.role) {
      router.push('/')
      return
    }
  }, [router, params.role])

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    router.push('/')
  }

  const getRoleTitle = (role) => {
    switch (role) {
      case 'hospital_administrator':
        return 'Hospital Administrator'
      case 'supply_chain_officer':
        return 'Supply Chain Officer'
      case 'pharmacist_nurse':
        return 'Pharmacist / Nurse'
      default:
        return 'Dashboard'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{getRoleTitle(user.role)}</h1>
            <p className="text-slate-600">Welcome, {user.name} ({user.id})</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
