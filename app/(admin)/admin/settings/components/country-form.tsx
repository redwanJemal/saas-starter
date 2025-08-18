'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const countryFormSchema = z.object({
  code: z.string().length(2, { message: 'Country code must be exactly 2 characters' }),
  name: z.string().min(2, { message: 'Country name is required' }),
  region: z.string().optional(),
  phonePrefix: z.string().optional(),
  isActive: z.boolean().default(true),
  isShippingEnabled: z.boolean().default(true),
  requiresPostalCode: z.boolean().default(true),
  requiresStateProvince: z.boolean().default(false),
  euMember: z.boolean().default(false),
});

type CountryFormValues = z.infer<typeof countryFormSchema>;

interface CountryFormProps {
  onSuccess: () => void;
}

export function CountryForm({ onSuccess }: CountryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CountryFormValues>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: {
      code: '',
      name: '',
      region: '',
      phonePrefix: '',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: false,
      euMember: false,
    },
  });

  async function onSubmit(values: CountryFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/master-data/countries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          code: values.code.toUpperCase(),
          callingCode: values.phonePrefix,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create country');
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating country:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create country');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country Code (ISO)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="US" 
                    {...field} 
                    maxLength={2}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country Name</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input placeholder="North America" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phonePrefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Prefix</FormLabel>
                <FormControl>
                  <Input placeholder="+1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Active</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isShippingEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Shipping Enabled</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requiresPostalCode"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Requires Postal Code</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requiresStateProvince"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Requires State/Province</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="euMember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">EU Member</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Country'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
