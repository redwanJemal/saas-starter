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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const currencyFormSchema = z.object({
  code: z.string().length(3, { message: 'Currency code must be exactly 3 characters' }),
  name: z.string().min(2, { message: 'Currency name is required' }),
  symbol: z.string().min(1, { message: 'Currency symbol is required' }),
  decimalPlaces: z.coerce.number().int().min(0).max(10),
  symbolPosition: z.enum(['before', 'after']),
  isActive: z.boolean().default(true),
});

type CurrencyFormValues = z.infer<typeof currencyFormSchema>;

interface CurrencyFormProps {
  onSuccess: () => void;
}

export function CurrencyForm({ onSuccess }: CurrencyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: {
      code: '',
      name: '',
      symbol: '',
      decimalPlaces: 2,
      symbolPosition: 'before',
      isActive: true,
    },
  });

  async function onSubmit(values: CurrencyFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/master-data/currencies', {
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
        throw new Error(data.error || 'Failed to create currency');
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating currency:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create currency');
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
                <FormLabel>Currency Code (ISO)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="USD" 
                    {...field} 
                    maxLength={3}
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
                <FormLabel>Currency Name</FormLabel>
                <FormControl>
                  <Input placeholder="US Dollar" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <Input placeholder="$" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="decimalPlaces"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decimal Places</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="2" 
                    {...field} 
                    min={0}
                    max={10}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symbolPosition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol Position</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="before">Before (e.g., $100)</SelectItem>
                    <SelectItem value="after">After (e.g., 100€)</SelectItem>
                  </SelectContent>
                </Select>
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
            {isSubmitting ? 'Creating...' : 'Create Currency'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
