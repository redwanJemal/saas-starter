// app/(dashboard)/page.tsx
import { Button } from '@/components/ui/button';
import { ArrowRight, Package, Globe, Shield, Truck, Calculator } from 'lucide-react';
import { Terminal } from './terminal';
import Link from 'next/link';

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
                Get your own US, UK, and EU shipping addresses. We'll forward your packages to anywhere in the world with fast, reliable service and competitive rates.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/sign-up">
                    <Button size="lg" variant="default" className="w-full sm:w-auto text-lg rounded-full bg-orange-500 hover:bg-orange-600">
                      Get Your Address Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/calculator">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg rounded-full border-orange-500 text-orange-600 hover:bg-orange-50">
                      <Calculator className="mr-2 h-5 w-5" />
                      Calculate Shipping Cost
                    </Button>
                  </Link>
                </div>
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
                  Secure & Reliable
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Your packages are safe with us. Full insurance coverage and real-time tracking for complete peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Transparent Pricing, No Hidden Fees
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
              Calculate your shipping costs upfront with our real-time rate calculator. What you see is what you pay.
            </p>
            <div className="mt-8">
              <Link href="/calculator">
                <Button size="lg" variant="default" className="text-lg rounded-full bg-orange-500 hover:bg-orange-600">
                  <Calculator className="mr-2 h-5 w-5" />
                  Try Our Shipping Calculator
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                How Package Forwarding Works
              </h2>
              <div className="mt-8 space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white">
                      <span className="text-sm font-medium">1</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Get Your Address</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Sign up and receive personal shipping addresses in the US, UK, and EU instantly.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white">
                      <span className="text-sm font-medium">2</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Shop Online</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Use your new address to shop from any online store. We'll receive your packages.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white">
                      <span className="text-sm font-medium">3</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">We Forward</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Choose your shipping option and we'll send your packages anywhere in the world.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="bg-gray-50 rounded-lg p-8">
                <div className="text-center">
                  <Truck className="mx-auto h-12 w-12 text-orange-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Real-Time Tracking</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Track your shipments in real-time from our warehouse to your doorstep.
                  </p>
                </div>
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
              <Link href="/sign-up">
                <Button size="lg" variant="default" className="text-lg rounded-full bg-orange-500 hover:bg-orange-600">
                  Sign Up Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}