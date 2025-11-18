'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Shield, Package, Stethoscope, Building2, ClipboardList, Users } from 'lucide-react'

const roles = [
  {
    id: 'hospital_administrator',
    title: 'Hospital Administrator',
    description: 'Oversee overall resource allocation and use the system for monitoring and decision-making.',
    icon: Shield,
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconColor: 'text-blue-600',
    features: ['View all inventory', 'Manage users', 'Generate reports', 'System monitoring']
  },
  {
    id: 'supply_chain_officer',
    title: 'Supply Chain Officer',
    description: 'Manages procurement and inventory, ensuring timely replenishment of critical supplies.',
    icon: Package,
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    iconColor: 'text-green-600',
    features: ['Add/Edit items', 'Manage inventory', 'Track supplies', 'Procurement']
  },
  {
    id: 'pharmacist_nurse',
    title: 'Pharmacist / Nurse',
    description: 'Request and use supplies efficiently with proper accountability.',
    icon: Stethoscope,
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    iconColor: 'text-purple-600',
    features: ['Request supplies', 'View inventory', 'Track requests', 'Accountability']
  }
]

export default function Home() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [userId, setUserId] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setUserId('')
    setIsDialogOpen(true)
  }

  const handleAccess = () => {
    if (!userId.trim()) return

    // Simple validation - in a real app, you'd validate against the database
    const validIds = {
      hospital_administrator: ['ADMIN001', 'ADMIN002', 'ADMIN003'],
      supply_chain_officer: ['SUPPLY001', 'SUPPLY002', 'SUPPLY003'],
      pharmacist_nurse: ['PHARM001', 'PHARM002', 'PHARM003']
    }

    if (validIds[selectedRole.id]?.includes(userId.toUpperCase())) {
      // Store user info in sessionStorage for simple state management
      sessionStorage.setItem('user', JSON.stringify({
        id: userId.toUpperCase(),
        role: selectedRole.id,
        name: `User ${userId}`
      }))
      
      router.push(`/dashboard/${selectedRole.id}`)
    } else {
      alert('Invalid ID for this role. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Welcome to Medical Inventory System</h1>
          <p className="text-lg text-slate-600">
            Please select your role to access the appropriate dashboard
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {roles.map((role) => {
            const IconComponent = role.icon
            return (
              <Card 
                key={role.id}
                className={`${role.color} border-2 cursor-pointer transition-all duration-200 hover:shadow-lg`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center mb-3">
                    <IconComponent className={`h-8 w-8 ${role.iconColor} mr-3`} />
                    <CardTitle className="text-xl text-slate-800">{role.title}</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600 leading-relaxed">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {role.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>


        {/* Access Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)}></div>
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Access {selectedRole?.title}</h2>
                <p className="text-sm text-gray-600">
                  Please enter your ID to access the {selectedRole?.title?.toLowerCase()} dashboard.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Enter your ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleAccess} className="flex-1">
                    Access Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}