// app/(admin)/admin/packages/assignment/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Scan, UserCheck, Package, Search, AlertCircle, CheckCircle, Users, Clock } from 'lucide-react'

interface UnassignedItem {
  id: string
  trackingNumber: string
  courierName: string
  scannedAt: Date
  batchReference: string
  status: 'unassigned' | 'assigned'
  courierTrackingUrl?: string
}

interface Customer {
  id: string
  customerId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  suiteCode: string
  warehouseId: string
}

interface ExpectedPackage {
  id: string
  customerId: string
  retailerName: string
  expectedTrackingNo: string
  expectedDate: Date
  status: 'pending'
}

export default function AssignmentPage() {
  const [unassignedItems, setUnassignedItems] = useState<UnassignedItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [expectedPackages, setExpectedPackages] = useState<ExpectedPackage[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<UnassignedItem | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load unassigned tracking items from API
      const unassignedResponse = await fetch('/api/admin/scan-tracking?assignment_status=unassigned')
      const unassignedData = await unassignedResponse.json()
      
      // Load customers from API
      const customersResponse = await fetch('/api/admin/customers')
      const customersData = await customersResponse.json()
      
      // Load expected packages from API
      const expectedResponse = await fetch('/api/admin/expected-packages')
      const expectedData = await expectedResponse.json()

      // Transform the API data to match our interface
      const transformedUnassigned = unassignedData.items?.map((item: any) => ({
        id: item.id,
        trackingNumber: item.trackingNumber,
        courierName: item.courierName || 'Unknown Courier',
        scannedAt: new Date(item.scannedAt),
        batchReference: item.batchReference || 'N/A',
        status: item.assignmentStatus === 'assigned' ? 'assigned' : 'unassigned',
        courierTrackingUrl: item.courierTrackingUrl
      })) || []

      const transformedCustomers = customersData.customers?.map((customer: any) => ({
        id: customer.id,
        customerId: customer.customerCode || customer.id,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        suiteCode: customer.suiteCode || '',
        warehouseId: customer.warehouseId || ''
      })) || []

      setUnassignedItems(transformedUnassigned)
      setCustomers(transformedCustomers)
      setExpectedPackages(expectedData.packages || [])
    } catch (error) {
      console.error('Error loading data:', error)
      // Show error message to user
      alert('Error loading data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const assignPackageToCustomer = async (itemId: string, customerId: string) => {
    setAssigning(true)
    try {
      const response = await fetch('/api/admin/assign-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments: [{
            itemId,
            customerProfileId: customerId
          }]
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update local state
        setUnassignedItems(prev => 
            prev.map(item => 
              item.id === itemId 
                ? { ...item, status: 'assigned' as const } 
                : item
            ).filter(item => item.status === 'unassigned')
          )

        alert('Package assigned successfully!')
        setSelectedItem(null)
        setSelectedCustomer(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign package')
      }
    } catch (error) {
      console.error('Error assigning package:', error)
      alert('Error assigning package. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const sendCustomerNotification = async (customerId: string, itemId: string) => {
    try {
      await fetch('/api/admin/notifications/package-arrived', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          itemId
        }),
      })
    } catch (error) {
      console.error('Error sending notification:', error)
      // Don't fail the assignment if notification fails
    }
  }

  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.suiteCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getItemStatusBadge = (status: UnassignedItem['status']) => {
    switch (status) {
      case 'unassigned':
        return <Badge variant="outline" className="text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Unassigned</Badge>
      case 'assigned':
        return <Badge variant="outline" className="text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Assigned</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Package Assignment</h1>
          <p className="text-gray-600">Loading assignment data...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Package Assignment</h1>
        <p className="text-gray-600">
          Assign scanned tracking numbers to customer accounts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Unassigned Tracking Numbers</span>
              <Badge variant="secondary">{unassignedItems.length}</Badge>
            </CardTitle>
            <CardDescription>
              Click on a tracking number to start the assignment process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unassignedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No unassigned packages found</p>
                  <p className="text-sm">All packages have been assigned</p>
                </div>
              ) : (
                unassignedItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedItem?.id === item.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-medium">
                        {item.trackingNumber}
                      </span>
                      {getItemStatusBadge(item.status)}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Courier: {item.courierName}</span>
                        <span>Batch: {item.batchReference}</span>
                      </div>
                      <span>Scanned: {item.scannedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Assignment Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Assign to Customer</span>
            </CardTitle>
            <CardDescription>
              {selectedItem 
                ? `Assigning tracking number: ${selectedItem.trackingNumber}`
                : 'Select a tracking number to begin assignment'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedItem ? (
              <div className="space-y-4">
                {/* Search Customers */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search customers by name, email, or suite code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Customer List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No customers found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  ) : (
                    filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCustomer?.id === customer.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.email}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-gray-600">
                              {customer.suiteCode}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {customer.customerId}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Assignment Actions */}
                {selectedCustomer && (
                  <div className="pt-4 border-t">
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm text-blue-900 mb-1">Assignment Summary</h4>
                      <p className="text-xs text-blue-700">
                        Tracking: <span className="font-mono">{selectedItem.trackingNumber}</span><br />
                        Customer: {selectedCustomer.firstName} {selectedCustomer.lastName} ({selectedCustomer.suiteCode})
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => assignPackageToCustomer(selectedItem.id, selectedCustomer.id)}
                        className="flex-1"
                        disabled={assigning}
                      >
                        {assigning ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Assign Package
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedCustomer(null)
                          setSearchTerm('')
                        }}
                        disabled={assigning}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Item to Assign</h3>
                <p>Choose an unassigned tracking number from the left panel to begin the assignment process.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}