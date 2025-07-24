// app/(admin)/admin/packages/pre-receiving/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Scan, Package, Trash2, Save, FileText, Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface ScannedItem {
  id: string
  trackingNumber: string
  scannedAt: Date
  status: 'scanned' | 'duplicate' | 'invalid'
  courierTrackingUrl?: string
}

interface IncomingShipment {
  id: string
  batchReference: string
  courierName: string
  arrivalDate: string
  totalPiecesExpected: number
  scannedItems: ScannedItem[]
  status: 'pending' | 'scanning' | 'scanned' | 'assigned'
}

interface Courier {
  id: string
  name: string
  code: string
  websiteUrl?: string
  trackingUrlTemplate?: string
  isActive: boolean
}

export default function PreReceivingPage() {
  const [currentBatch, setCurrentBatch] = useState<IncomingShipment | null>(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [selectedCourier, setSelectedCourier] = useState('')
  const [expectedPieces, setExpectedPieces] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [couriers, setCouriers] = useState<Courier[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCouriers()
  }, [])

  useEffect(() => {
    if (isScanning && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isScanning])

  const loadCouriers = async () => {
    try {
      const response = await fetch('/api/admin/master-data/couriers?limit=100')
      const data = await response.json()
      
      // Filter active couriers and sort by name
      const activeCouriers = (data.couriers || [])
        .filter((courier: Courier) => courier.isActive)
        .sort((a: Courier, b: Courier) => a.name.localeCompare(b.name))
      
      setCouriers(activeCouriers)
    } catch (error) {
      console.error('Error loading couriers:', error)
      alert('Error loading couriers. Please refresh the page.')
    }
  }

  const startNewBatch = async () => {
    if (!selectedCourier || !expectedPieces || !arrivalDate) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/incoming-shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courierId: selectedCourier,
          arrivalDate,
          totalPiecesExpected: parseInt(expectedPieces),
        }),
      })

      if (response.ok) {
        const newBatch = await response.json()
        const selectedCourierData = couriers.find(c => c.id === selectedCourier)
        
        setCurrentBatch({
          id: newBatch.id,
          batchReference: newBatch.batchReference,
          courierName: selectedCourierData?.name || 'Unknown Courier',
          arrivalDate,
          totalPiecesExpected: parseInt(expectedPieces),
          scannedItems: [],
          status: 'pending'
        })
        setIsScanning(true)
        setScannedItems([])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create batch')
      }
    } catch (error) {
      console.error('Error creating batch:', error)
      alert('Error creating batch. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingInput.trim() || !currentBatch) return

    const trackingNumber = trackingInput.trim()
    
    // Check for duplicates in current session
    const isDuplicate = scannedItems.some(item => item.trackingNumber === trackingNumber)
    
    if (isDuplicate) {
      setScannedItems(prev => [...prev, {
        id: `temp-${Date.now()}`,
        trackingNumber,
        scannedAt: new Date(),
        status: 'duplicate'
      }])
      setTrackingInput('')
      return
    }

    try {
      // Submit to API
      const response = await fetch('/api/admin/scan-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incomingShipmentId: currentBatch.id,
          trackingNumbers: [trackingNumber]
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newItem = result.items[0]
        
        setScannedItems(prev => [...prev, {
          id: newItem.id,
          trackingNumber: newItem.trackingNumber,
          scannedAt: new Date(newItem.scannedAt),
          status: 'scanned',
          courierTrackingUrl: newItem.courierTrackingUrl
        }])
      } else {
        // If API call fails, still add to local list as invalid
        setScannedItems(prev => [...prev, {
          id: `temp-${Date.now()}`,
          trackingNumber,
          scannedAt: new Date(),
          status: 'invalid'
        }])
      }
    } catch (error) {
      console.error('Error scanning tracking number:', error)
      // Add as invalid item if there's an error
      setScannedItems(prev => [...prev, {
        id: `temp-${Date.now()}`,
        trackingNumber,
        scannedAt: new Date(),
        status: 'invalid'
      }])
    }
    
    setTrackingInput('')
  }

  const removeScannedItem = (id: string) => {
    setScannedItems(prev => prev.filter(item => item.id !== id))
  }

  const completeBatch = async () => {
    if (!currentBatch) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/incoming-shipments/${currentBatch.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'scanned',
          scanCompletedAt: new Date().toISOString()
        }),
      })

      if (response.ok) {
        alert(`Batch completed successfully! Scanned ${scannedItems.filter(i => i.status === 'scanned').length} items.`)
        // Reset form
        setCurrentBatch(null)
        setIsScanning(false)
        setScannedItems([])
        resetForm()
      } else {
        throw new Error('Failed to complete batch')
      }
    } catch (error) {
      console.error('Error completing batch:', error)
      alert('Error completing batch. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedCourier('')
    setExpectedPieces('')
    setArrivalDate('')
  }

  const getStatusBadge = (status: ScannedItem['status']) => {
    switch (status) {
      case 'scanned':
        return <Badge variant="outline" className="text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Scanned</Badge>
      case 'duplicate':
        return <Badge variant="outline" className="text-yellow-700 border-yellow-300"><AlertCircle className="h-3 w-3 mr-1" />Duplicate</Badge>
      case 'invalid':
        return <Badge variant="outline" className="text-red-700 border-red-300"><AlertCircle className="h-3 w-3 mr-1" />Invalid</Badge>
      default:
        return null
    }
  }

  const validScannedCount = scannedItems.filter(item => item.status === 'scanned').length
  const duplicateCount = scannedItems.filter(item => item.status === 'duplicate').length
  const invalidCount = scannedItems.filter(item => item.status === 'invalid').length

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pre-Receiving - Bulk Scanner</h1>
        <p className="text-gray-600">
          Scan all tracking numbers from courier delivery before assigning to customers
        </p>
      </div>

      {!isScanning ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Create New Receiving Batch</span>
            </CardTitle>
            <CardDescription>
              Set up a new batch for incoming shipment scanning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Courier *
              </label>
              <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select courier" />
                </SelectTrigger>
                <SelectContent>
                  {couriers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      <RefreshCw className="h-4 w-4 inline mr-2" />
                      Loading couriers...
                    </div>
                  ) : (
                    couriers.map(courier => (
                      <SelectItem key={courier.id} value={courier.id}>
                        <div className="flex items-center space-x-2">
                          <span>{courier.name}</span>
                          <span className="text-xs text-gray-500">({courier.code})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Pieces *
              </label>
              <Input
                type="number"
                value={expectedPieces}
                onChange={(e) => setExpectedPieces(e.target.value)}
                placeholder="Enter expected number of packages"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrival Date *
              </label>
              <Input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Don't allow future dates
              />
            </div>

            <Button
              onClick={startNewBatch}
              className="w-full"
              disabled={loading || !selectedCourier || !expectedPieces || !arrivalDate}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Batch...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Start Scanning Session
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanning Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Scan className="h-5 w-5" />
                  <span>Scanning Session</span>
                </div>
                <Badge variant="outline">{currentBatch?.batchReference}</Badge>
              </CardTitle>
              <CardDescription>
                Courier: {currentBatch?.courierName} | Expected: {currentBatch?.totalPiecesExpected} pieces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan or Enter Tracking Number
                  </label>
                  <Input
                    ref={inputRef}
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter tracking number..."
                    className="font-mono"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!trackingInput.trim()}>
                  <Scan className="h-4 w-4 mr-2" />
                  Add Tracking Number
                </Button>
              </form>

              {/* Progress Stats */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{validScannedCount}</div>
                    <div className="text-xs text-gray-500">Scanned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{duplicateCount}</div>
                    <div className="text-xs text-gray-500">Duplicates</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
                    <div className="text-xs text-gray-500">Invalid</div>
                  </div>
                </div>
                <div className="mt-2 text-center text-sm text-gray-600">
                  Progress: {validScannedCount} / {currentBatch?.totalPiecesExpected || 0} expected pieces
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-2">
                <Button
                  onClick={completeBatch}
                  className="flex-1"
                  disabled={loading || validScannedCount === 0}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Complete Batch
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this scanning session?')) {
                      setCurrentBatch(null)
                      setIsScanning(false)
                      setScannedItems([])
                      resetForm()
                    }
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scanned Items List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Scanned Items</span>
                <Badge variant="secondary">{scannedItems.length}</Badge>
              </CardTitle>
              <CardDescription>
                Real-time list of scanned tracking numbers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scannedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No items scanned yet</p>
                    <p className="text-sm">Start scanning tracking numbers</p>
                  </div>
                ) : (
                  scannedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-sm font-medium">
                            {item.trackingNumber}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Scanned: {item.scannedAt.toLocaleTimeString()}
                          {item.courierTrackingUrl && (
                            <span className="ml-2">
                              <a
                                href={item.courierTrackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Track →
                              </a>
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScannedItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}