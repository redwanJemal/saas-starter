// app/(admin)/admin/packages/[id]/bin-assignment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  MapPin, 
  Package as PackageIcon, 
  Warehouse,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  X
} from 'lucide-react';

interface BinLocation {
  id: string;
  binCode: string;
  zoneName: string;
  description?: string;
  maxCapacity: number;
  currentOccupancy: number;
  maxWeightKg?: number;
  dailyPremium: number;
  currency: string;
  isClimateControlled: boolean;
  isSecured: boolean;
  isAccessible: boolean;
  isActive: boolean;
}

interface PackageInfo {
  id: string;
  internalId: string;
  description: string;
  weightActualKg: number;
  status: string;
  customerName: string;
  currentBinLocation?: {
    id: string;
    binCode: string;
    zoneName: string;
    assignedAt: string;
    assignmentReason?: string;
  };
}

interface BinAssignmentHistory {
  id: string;
  binCode: string;
  zoneName: string;
  assignedAt: string;
  removedAt?: string;
  assignmentReason?: string;
  removalReason?: string;
  assignedByName?: string;
  removedByName?: string;
  notes?: string;
}

export default function BinLocationAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;

  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [binLocations, setBinLocations] = useState<BinLocation[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<BinAssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assignment form
  const [selectedBinId, setSelectedBinId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Removal form
  const [removalReason, setRemovalReason] = useState('');
  const [removalNotes, setRemovalNotes] = useState('');
  const [showRemovalForm, setShowRemovalForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [packageId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch package info and current bin assignment
      const packageResponse = await fetch(`/api/admin/packages/${packageId}/bin-assignment`);
      if (!packageResponse.ok) throw new Error('Failed to fetch package info');
      const packageData = await packageResponse.json();
      setPackageInfo(packageData.package);
      setAssignmentHistory(packageData.assignmentHistory || []);

      // Fetch available bin locations
      const binsResponse = await fetch(`/api/admin/bin-locations?warehouseId=${packageData.package.warehouseId}`);
      if (!binsResponse.ok) throw new Error('Failed to fetch bin locations');
      const binsData = await binsResponse.json();
      setBinLocations(binsData.binLocations);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBin = async () => {
    if (!selectedBinId) {
      setError('Please select a bin location');
      return;
    }

    try {
      setAssigning(true);
      setError('');

      const response = await fetch(`/api/admin/packages/${packageId}/bin-assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binId: selectedBinId,
          assignmentReason: assignmentReason || 'manual_assignment',
          notes: assignmentNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign bin');
      }

      setSuccess('Bin location assigned successfully');
      setSelectedBinId('');
      setAssignmentReason('');
      setAssignmentNotes('');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign bin');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveBin = async () => {
    if (!packageInfo?.currentBinLocation) return;

    try {
      setRemoving(true);
      setError('');

      const response = await fetch(`/api/admin/packages/${packageId}/bin-assignment`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          removalReason: removalReason || 'manual_removal',
          notes: removalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove bin assignment');
      }

      setSuccess('Bin assignment removed successfully');
      setShowRemovalForm(false);
      setRemovalReason('');
      setRemovalNotes('');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove bin assignment');
    } finally {
      setRemoving(false);
    }
  };

  const getBinAvailabilityColor = (bin: BinLocation) => {
    const occupancyPercentage = (bin.currentOccupancy / bin.maxCapacity) * 100;
    if (occupancyPercentage >= 100) return 'bg-red-100 text-red-800';
    if (occupancyPercentage >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getBinSuitability = (bin: BinLocation, packageWeight: number) => {
    const isWeightSuitable = !bin.maxWeightKg || packageWeight <= bin.maxWeightKg;
    const hasCapacity = bin.currentOccupancy < bin.maxCapacity;
    
    if (!hasCapacity) return { suitable: false, reason: 'No capacity' };
    if (!isWeightSuitable) return { suitable: false, reason: 'Weight exceeds limit' };
    return { suitable: true, reason: 'Suitable' };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push(`/admin/packages/${packageId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Package
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bin Location Assignment</h1>
            <p className="text-gray-600">{packageInfo?.internalId}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5" />
              Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-700">Package ID</p>
              <p className="font-mono">{packageInfo?.internalId}</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">Customer</p>
              <p>{packageInfo?.customerName}</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">Description</p>
              <p>{packageInfo?.description || 'No description'}</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">Weight</p>
              <p>{packageInfo?.weightActualKg.toFixed(3)} kg</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">Status</p>
              <Badge variant="outline">{packageInfo?.status.replace('_', ' ')}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Current Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Bin Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {packageInfo?.currentBinLocation ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {packageInfo.currentBinLocation.zoneName}-{packageInfo.currentBinLocation.binCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      Assigned: {new Date(packageInfo.currentBinLocation.assignedAt).toLocaleDateString()}
                    </p>
                    {packageInfo.currentBinLocation.assignmentReason && (
                      <p className="text-xs text-gray-500">
                        Reason: {packageInfo.currentBinLocation.assignmentReason.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Assigned
                  </Badge>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowRemovalForm(!showRemovalForm)}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove Assignment
                </Button>
                
                {showRemovalForm && (
                  <div className="space-y-3 pt-3 border-t">
                    <div>
                      <Label htmlFor="removalReason">Removal Reason</Label>
                      <Select value={removalReason} onValueChange={setRemovalReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shipped">Package Shipped</SelectItem>
                          <SelectItem value="moved">Moved to Different Bin</SelectItem>
                          <SelectItem value="consolidation">Consolidation</SelectItem>
                          <SelectItem value="manual_removal">Manual Removal</SelectItem>
                          <SelectItem value="error_correction">Error Correction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="removalNotes">Notes</Label>
                      <Textarea
                        id="removalNotes"
                        value={removalNotes}
                        onChange={(e) => setRemovalNotes(e.target.value)}
                        placeholder="Additional notes..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleRemoveBin} 
                        disabled={removing}
                        variant="destructive"
                        size="sm"
                      >
                        {removing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Remove
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowRemovalForm(false)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No bin location assigned</p>
                <p className="text-sm">Assign a bin location below</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignment Form */}
      {!packageInfo?.currentBinLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Assign Bin Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="binSelection">Select Bin Location</Label>
                <Select value={selectedBinId} onValueChange={setSelectedBinId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose bin location" />
                  </SelectTrigger>
                  <SelectContent>
                    {binLocations.map((bin) => {
                      const suitability = getBinSuitability(bin, packageInfo?.weightActualKg || 0);
                      return (
                        <SelectItem 
                          key={bin.id} 
                          value={bin.id}
                          disabled={!suitability.suitable}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{bin.zoneName}-{bin.binCode}</span>
                            <span className="text-xs text-gray-500">
                              {bin.currentOccupancy}/{bin.maxCapacity}
                              {!suitability.suitable && ` (${suitability.reason})`}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assignmentReason">Assignment Reason</Label>
                <Select value={assignmentReason} onValueChange={setAssignmentReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial_placement">Initial Placement</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="consolidation">Consolidation</SelectItem>
                    <SelectItem value="manual_assignment">Manual Assignment</SelectItem>
                    <SelectItem value="customer_request">Customer Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="assignmentNotes">Notes</Label>
              <Textarea
                id="assignmentNotes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Additional notes about this assignment..."
                rows={3}
              />
            </div>
            
            <Button onClick={handleAssignBin} disabled={assigning || !selectedBinId}>
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Assign Bin Location
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Bin Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Available Bin Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {binLocations.map((bin) => {
              const suitability = getBinSuitability(bin, packageInfo?.weightActualKg || 0);
              return (
                <div
                  key={bin.id}
                  className={`border rounded-lg p-4 ${
                    !suitability.suitable ? 'opacity-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{bin.zoneName}-{bin.binCode}</p>
                      <p className="text-sm text-gray-600">{bin.description}</p>
                    </div>
                    <Badge className={getBinAvailabilityColor(bin)}>
                      {bin.currentOccupancy}/{bin.maxCapacity}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    {bin.maxWeightKg && (
                      <p>Max Weight: {bin.maxWeightKg}kg</p>
                    )}
                    {bin.dailyPremium > 0 && (
                      <p>Daily Premium: {bin.currency} {bin.dailyPremium}</p>
                    )}
                    <div className="flex space-x-2">
                      {bin.isClimateControlled && <Badge variant="secondary" className="text-xs">Climate</Badge>}
                      {bin.isSecured && <Badge variant="secondary" className="text-xs">Secured</Badge>}
                    </div>
                    <p className={suitability.suitable ? 'text-green-600' : 'text-red-600'}>
                      {suitability.reason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assignment History */}
      {assignmentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Assignment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignmentHistory.map((assignment) => (
                <div key={assignment.id} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">
                        {assignment.zoneName}-{assignment.binCode}
                      </p>
                      <p className="text-sm text-gray-600">
                        Assigned: {new Date(assignment.assignedAt).toLocaleString()}
                        {assignment.assignedByName && ` by ${assignment.assignedByName}`}
                      </p>
                      {assignment.removedAt && (
                        <p className="text-sm text-gray-600">
                          Removed: {new Date(assignment.removedAt).toLocaleString()}
                          {assignment.removedByName && ` by ${assignment.removedByName}`}
                        </p>
                      )}
                    </div>
                    <Badge variant={assignment.removedAt ? "secondary" : "default"}>
                      {assignment.removedAt ? "Removed" : "Active"}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {assignment.assignmentReason && (
                      <p>Assignment reason: {assignment.assignmentReason.replace('_', ' ')}</p>
                    )}
                    {assignment.removalReason && (
                      <p>Removal reason: {assignment.removalReason.replace('_', ' ')}</p>
                    )}
                    {assignment.notes && (
                      <p className="mt-1 italic">"{assignment.notes}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}