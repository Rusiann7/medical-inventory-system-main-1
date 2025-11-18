'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { inventoryService, requestService } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Package, 
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function PharmacistNurseDashboard() {
  const [items, setItems] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [requestForm, setRequestForm] = useState({
    quantity: '',
    department: '',
    reason: ''
  })

  // Load data from database
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadItems(), loadMyRequests()])
  }

  const loadItems = async () => {
    const { data, error } = await inventoryService.getItems()
    if (error) {
      console.error('Error loading items:', error)
      setItems([])
    } else {
      setItems(data || [])
    }
  }

  const loadMyRequests = async () => {
    // Get current user ID from session
    const userData = sessionStorage.getItem('user')
    const currentUser = userData ? JSON.parse(userData) : null
    
    if (!currentUser) {
      setMyRequests([])
      return
    }

    const { data, error } = await requestService.getRequests()
    if (error) {
      console.error('Error loading requests:', error)
      setMyRequests([])
    } else {
      // Process the data to ensure it has the required fields
      const processedRequests = (data || []).map(request => {
        // If the data comes from Supabase with joins, extract the nested data
        if (request.inventory_items && typeof request.inventory_items === 'object') {
          request.item_name = request.inventory_items.name
        }
        
        // Ensure required fields exist
        return {
          id: request.id,
          item_id: request.item_id,
          item_name: request.item_name || `Item ${request.item_id}`,
          quantity_requested: request.quantity_requested,
          status: request.status,
          request_date: request.request_date,
          department: request.department || 'Unknown',
          reason: request.reason || 'No reason provided',
          ...request
        }
      })
      
      // Filter requests for current user
      const userRequests = processedRequests.filter(req => req.requester_id === currentUser.id)
      setMyRequests(userRequests)
    }
  }

  const handleRequestItem = (item) => {
    setSelectedItem(item)
    setRequestForm({
      quantity: '',
      department: '',
      reason: ''
    })
    setIsRequestDialogOpen(true)
  }

  const handleSubmitRequest = async () => {
    if (!requestForm.quantity || !requestForm.department || !requestForm.reason) return

    // Get current user ID from session
    const userData = sessionStorage.getItem('user')
    const currentUser = userData ? JSON.parse(userData) : null

    if (!currentUser) {
      alert('User session not found. Please log in again.')
      return
    }

    const newRequest = {
      id: `REQ${String(Date.now()).slice(-6)}`, // Generate unique ID
      item_id: selectedItem.id,
      requester_id: currentUser.id,
      quantity_requested: parseInt(requestForm.quantity),
      status: 'pending',
      request_date: new Date().toISOString(),
      department: requestForm.department,
      reason: requestForm.reason
    }

    try {
      const { data, error } = await requestService.addRequest(newRequest)
      
      if (error) {
        console.error('Error submitting request:', error)
        alert('Failed to submit request. Please try again.')
        return
      }

      // Add to local state with proper formatting for display
      const displayRequest = {
        id: newRequest.id,
        item_name: selectedItem.name,
        quantity_requested: newRequest.quantity_requested,
        status: newRequest.status,
        request_date: newRequest.request_date.split('T')[0],
        department: newRequest.department,
        reason: newRequest.reason
      }
      
      setMyRequests([displayRequest, ...myRequests])
      setIsRequestDialogOpen(false)
      setSelectedItem(null)
      setRequestForm({
        quantity: '',
        department: '',
        reason: ''
      })
      
      alert('Request submitted successfully!')
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request. Please try again.')
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'medication': return 'bg-blue-100 text-blue-800'
      case 'equipment': return 'bg-green-100 text-green-800'
      case 'supplies': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRequestStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  const getStockStatus = (quantity, threshold) => {
    if (quantity < threshold) return { status: 'Low Stock', color: 'bg-red-100 text-red-800' }
    if (quantity < threshold * 1.5) return { status: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'Available', color: 'bg-green-100 text-green-800' }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingRequests = myRequests.filter(req => req.status === 'pending').length
  const approvedRequests = myRequests.filter(req => req.status === 'approved').length

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center justify-between lg:justify-start lg:space-x-4 w-full lg:w-auto">
            {/* Back to Role Selection Button */}
            <Link href="/" className="lg:flex-shrink-0">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Role Selection</span>
              </Button>
            </Link>
            {/* Title Section - Centered on mobile, left on desktop */}
            <div className="text-center lg:text-left lg:flex-1 lg:ml-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Pharmacist / Nurse Dashboard</h1>
              <p className="text-slate-600 text-sm sm:text-lg">Request supplies and manage medical inventory for patient care</p>
            </div>
          </div>
          {/* Stats on right - hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-sm text-slate-500">My Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingRequests}</p>
            </div>
          </div>
        </div>
        {/* Mobile Stats */}
        <div className="lg:hidden mt-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-sm text-slate-500">My Pending Requests</p>
            <p className="text-xl font-bold text-yellow-600">{pendingRequests}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">Total items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedRequests}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {items.filter(item => item.quantity < item.min_threshold).length}
            </div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* My Requests */}
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4 px-4 sm:px-6 pt-6">
          <CardTitle className="text-xl">My Requests</CardTitle>
          <CardDescription>
            Track your supply requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 pb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Request ID</TableHead>
                  <TableHead className="px-4">Item</TableHead>
                  <TableHead className="px-4">Quantity</TableHead>
                  <TableHead className="px-4">Department</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium px-4">{request.id}</TableCell>
                    <TableCell className="px-4">{request.item_name}</TableCell>
                    <TableCell className="px-4">{request.quantity_requested}</TableCell>
                    <TableCell className="px-4">
                      <Badge variant="outline">{request.department}</Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center space-x-2">
                        {getRequestStatusIcon(request.status)}
                        <Badge className={getRequestStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">{request.request_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Search and Browse */}
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4 px-4 sm:px-6 pt-6">
          <CardTitle className="text-xl">Available Inventory</CardTitle>
          <CardDescription>
            Search and request supplies from the available inventory
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">ID</TableHead>
                  <TableHead className="px-4">Name</TableHead>
                  <TableHead className="px-4">Category</TableHead>
                  <TableHead className="px-4">Available</TableHead>
                  <TableHead className="px-4">Unit</TableHead>
                  <TableHead className="px-4">Stock Status</TableHead>
                  <TableHead className="px-4">Expiry Date</TableHead>
                  <TableHead className="px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.quantity, item.min_threshold)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium px-4">{item.id}</TableCell>
                      <TableCell className="px-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">{item.quantity}</TableCell>
                      <TableCell className="px-4">{item.unit}</TableCell>
                      <TableCell className="px-4">
                        <Badge className={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">{item.expiry_date}</TableCell>
                      <TableCell className="px-4">
                        <Button
                          size="sm"
                          onClick={() => handleRequestItem(item)}
                          disabled={item.quantity === 0}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Request
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Item</DialogTitle>
            <DialogDescription>
              Submit a request for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={requestForm.quantity}
                onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                placeholder="Enter quantity needed"
                max={selectedItem?.quantity}
              />
              <p className="text-xs text-muted-foreground">
                Available: {selectedItem?.quantity} {selectedItem?.unit}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={requestForm.department}
                onChange={(e) => setRequestForm({ ...requestForm, department: e.target.value })}
                placeholder="e.g., pharmacy, emergency, surgery"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Request</Label>
              <Input
                id="reason"
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                placeholder="Brief description of why you need this item"
              />
            </div>
            
            <Button onClick={handleSubmitRequest} className="w-full">
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}