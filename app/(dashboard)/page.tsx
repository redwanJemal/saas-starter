import { Button } from '@/components/ui/button';
import { ArrowRight, Package, Globe, Shield, Truck } from 'lucide-react';
import { Terminal } from './terminal';

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Global Package Forwarding
                <span className="block text-orange-500">Shop Anywhere, Ship Everywhere</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Get your own US, UK, and EU shipping addresses. We'll forward your packages 
                to anywhere in the world with fast, reliable service and competitive rates.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Button
                  size="lg"
                  variant="default"
                  className="text-lg rounded-full bg-orange-500 hover:bg-orange-600"
                >
                  Get Your Address Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Package className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  US, UK & EU Addresses
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Get your own personal shipping addresses in multiple countries. Shop locally and save on international shipping fees.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Globe className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Worldwide Shipping
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  We deliver to over 220 countries and territories worldwide with reliable tracking and insurance options.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Package Protection
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  All packages are handled with care and insured against loss or damage. Track your shipments in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to shop globally?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Sign up today and get your personal addresses within minutes. Access exclusive deals from retailers worldwide and have your packages forwarded to your doorstep.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <Button
                size="lg"
                variant="default"
                className="text-lg rounded-full bg-orange-500 hover:bg-orange-600"
              >
                Sign Up Now
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
