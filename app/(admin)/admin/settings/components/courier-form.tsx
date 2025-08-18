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
import { Textarea } from '@/components/ui/textarea';

const courierFormSchema = z.object({
  name: z.string().min(2, { message: 'Courier name is required' }),
  code: z.string().min(2, { message: 'Courier code is required' }),
  website: z.string().url({ message: 'Please enter a valid URL' }),
  trackingUrlTemplate: z.string().min(5, { message: 'Tracking URL template is required' }),
  isActive: z.boolean().default(true),
});

type CourierFormValues = z.infer<typeof courierFormSchema>;

interface CourierFormProps {
  onSuccess: () => void;
}

export function CourierForm({ onSuccess }: CourierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CourierFormValues>({
    resolver: zodResolver(courierFormSchema),
    defaultValues: {
      name: '',
      code: '',
      website: '',
      trackingUrlTemplate: '',
      isActive: true,
    },
  });

  async function onSubmit(values: CourierFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/master-data/couriers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          code: values.code.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create courier');
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating courier:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create courier');
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Courier Name</FormLabel>
                <FormControl>
                  <Input placeholder="FedEx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Courier Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="FEDEX" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.fedex.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trackingUrlTemplate"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Tracking URL Template</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="https://www.fedex.com/apps/fedextrack/?tracknumbers={tracking_number}" 
                    {...field} 
                    className="min-h-[80px]"
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground mt-1">
                  Use {'{tracking_number}'} as a placeholder for the tracking number
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Courier'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
