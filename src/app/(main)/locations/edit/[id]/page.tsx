'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Location {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: {
    inventoryItems: number;
  };
}

export default function EditLocationPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [location, setLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocation();
  }, [params.id]);

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/locations/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        const locationData = data.location;
        setLocation(locationData);
        setFormData({
          name: locationData.name,
          description: locationData.description || '',
          isActive: locationData.isActive
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch location',
          variant: 'destructive'
        });
        router.push('/locations');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch location',
        variant: 'destructive'
      });
      router.push('/locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Location name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/locations/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Location updated successfully'
        });
        router.push('/locations');
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update location',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: 'Error',
        description: 'Failed to update location',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading location...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Location</h1>
          <p className="text-muted-foreground">
            Update location details and settings
          </p>
        </div>
      </div>

      {/* Location Info */}
      {location && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Location Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Items in location:</span>
                <span className="ml-2 text-muted-foreground">
                  {location._count?.inventoryItems || 0}
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 text-muted-foreground">
                  {location.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Warehouse, Store Front, Backup Storage"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description of the location..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active Location</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Active locations can be used for inventory items. Deactivating a location won't affect existing inventory items.
              </p>
              {location && location._count && location._count.inventoryItems > 0 && !formData.isActive && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Warning: This location contains {location._count.inventoryItems} inventory items. 
                    Deactivating it will prevent new items from being assigned to this location.
                  </p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Editing Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Changes will be applied immediately after saving
          </p>
          <p className="text-sm text-muted-foreground">
            • Deactivating a location won't affect existing inventory items
          </p>
          <p className="text-sm text-muted-foreground">
            • You cannot delete a location that contains inventory items
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 