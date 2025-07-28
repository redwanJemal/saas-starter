// app/(customer)/personal-shopping/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PersonalShoppingForm from '@/components/personal-shopping/PersonalShoppingForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewPersonalShoppingRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // Using Sonner toast directly

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/personal-shopping/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create request');
      }

      const result = await response.json();
      
      toast.success('Your personal shopping request has been submitted successfully.');

      // Redirect to the request details page
      router.push(`/dashboard/personal-shopping/requests/${result.id}`);
      
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit personal shopping request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/personal-shopping">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Personal Shopping
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        <PersonalShoppingForm 
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}