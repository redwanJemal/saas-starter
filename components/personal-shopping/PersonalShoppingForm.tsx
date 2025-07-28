// components/personal-shopping/PersonalShoppingForm.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ShoppingCart, Save } from 'lucide-react';
import { toast } from 'sonner';

interface PersonalShoppingItem {
  name: string;
  url: string;
  size: string;
  color: string;
  additional_instructions: string;
  quantity: number;
  max_budget_per_item?: number;
}

interface ShippingPreferences {
  option: string;
  preference: string;
}

interface PersonalShoppingFormProps {
  onSubmit?: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export default function PersonalShoppingForm({ 
  onSubmit, 
  initialData, 
  isLoading = false 
}: PersonalShoppingFormProps) {
  
  const [items, setItems] = useState<PersonalShoppingItem[]>(
    initialData?.items || [
      {
        name: '',
        url: '',
        size: '',
        color: '',
        additional_instructions: '',
        quantity: 1,
        max_budget_per_item: undefined,
      }
    ]
  );

  const [shipping, setShipping] = useState<ShippingPreferences>({
    option: initialData?.shipping?.option || '',
    preference: initialData?.shipping?.preference || 'send_together',
  });

  const [allowAlternateRetailers, setAllowAlternateRetailers] = useState<boolean>(
    initialData?.allow_alternate_retailers ?? true
  );

  const [specialInstructions, setSpecialInstructions] = useState<string>(
    initialData?.special_instructions || ''
  );

  const addItem = () => {
    setItems([
      ...items,
      {
        name: '',
        url: '',
        size: '',
        color: '',
        additional_instructions: '',
        quantity: 1,
        max_budget_per_item: undefined,
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PersonalShoppingItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setItems(updatedItems);
  };

  const validateForm = () => {
    // Check if at least one item has a name
    if (!items.some(item => item.name.trim())) {
      toast.error("Please add at least one item with a name");
      return false;
    }

    // Check if all items with names have valid quantities
    for (const item of items) {
      if (item.name.trim() && item.quantity < 1) {
        toast.error("All items must have a quantity of at least 1");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (action: 'SUBMIT REQUEST' | 'SAVE FOR LATER') => {
    if (!validateForm()) return;

    // Filter out empty items
    const validItems = items.filter(item => item.name.trim());

    const formData = {
      items: validItems,
      shipping,
      allow_alternate_retailers: allowAlternateRetailers,
      special_instructions: specialInstructions,
      action,
    };

    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const estimatedTotal = items.reduce((total, item) => {
    if (item.max_budget_per_item && item.quantity) {
      return total + (item.max_budget_per_item * item.quantity);
    }
    return total;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Personal Shopping Request</h1>
        <p className="text-gray-600 mt-2">
          Can't find what you're looking for? We'll help you shop from any retailer worldwide.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Items to Purchase
          </CardTitle>
          <CardDescription>
            Tell us what you'd like us to buy for you. Be as specific as possible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Item {index + 1}</Badge>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`item-name-${index}`}>Item Name *</Label>
                  <Input
                    id={`item-name-${index}`}
                    placeholder="e.g., Nike Air Jordan 1 Limited Edition"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-url-${index}`}>Product URL</Label>
                  <Input
                    id={`item-url-${index}`}
                    placeholder="https://..."
                    value={item.url}
                    onChange={(e) => updateItem(index, 'url', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-size-${index}`}>Size (if applicable)</Label>
                  <Input
                    id={`item-size-${index}`}
                    placeholder="e.g., UK 9, Medium, 32W x 34L"
                    value={item.size}
                    onChange={(e) => updateItem(index, 'size', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-color-${index}`}>Color (if applicable)</Label>
                  <Input
                    id={`item-color-${index}`}
                    placeholder="e.g., Black/Red, Navy Blue"
                    value={item.color}
                    onChange={(e) => updateItem(index, 'color', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-quantity-${index}`}>Quantity *</Label>
                  <Input
                    id={`item-quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-budget-${index}`}>Max Budget per Item (USD)</Label>
                  <Input
                    id={`item-budget-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                    value={item.max_budget_per_item || ''}
                    onChange={(e) => updateItem(index, 'max_budget_per_item', parseFloat(e.target.value) || undefined)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`item-instructions-${index}`}>Additional Instructions</Label>
                <Textarea
                  id={`item-instructions-${index}`}
                  placeholder="e.g., 'Please gift wrap', 'Must be authentic', 'Check for defects'"
                  value={item.additional_instructions}
                  onChange={(e) => updateItem(index, 'additional_instructions', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Preferences</CardTitle>
          <CardDescription>
            How would you like your items to be shipped?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shipping-option">Preferred Shipping Service</Label>
            <Input
              id="shipping-option"
              placeholder="e.g., 'First Class', 'Express', 'FREE Super Saver'"
              value={shipping.option}
              onChange={(e) => setShipping({ ...shipping, option: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-preference">Shipping Preference</Label>
            <Select
              value={shipping.preference}
              onValueChange={(value) => setShipping({ ...shipping, preference: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send_together">Send everything together</SelectItem>
                <SelectItem value="send_as_available">Send items as soon as they are available</SelectItem>
                <SelectItem value="send_by_category">Send similar items together</SelectItem>
                <SelectItem value="fastest_delivery">Prioritize fastest delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allow-alternate"
              checked={allowAlternateRetailers}
              onCheckedChange={(checked) => setAllowAlternateRetailers(checked === true)}
            />
            <Label htmlFor="allow-alternate" className="text-sm">
              Allow alternate retailers if original is unavailable or more expensive
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special-instructions">Special Instructions</Label>
            <Textarea
              id="special-instructions"
              placeholder="Any additional instructions for our shopping team..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {estimatedTotal > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Estimated Total (Items Only):</span>
              <span className="text-2xl font-bold text-green-600">
                ${estimatedTotal.toFixed(2)} USD
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              *This does not include service fees or shipping costs, which will be calculated after review.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit('SAVE FOR LATER')}
          disabled={isLoading}
          className="min-w-[150px]"
        >
          <Save className="h-4 w-4 mr-2" />
          Save for Later
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit('SUBMIT REQUEST')}
          disabled={isLoading}
          className="min-w-[150px]"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Submit Request
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>
          After submitting, our team will review your request and provide a detailed quote 
          including item costs, service fees, and shipping options within 24-48 hours.
        </p>
      </div>
    </div>
  );
}