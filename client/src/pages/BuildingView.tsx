import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import StoreCard from '@/components/StoreCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface Store {
  _id: any;
  name: string;
  category: 'store' | 'office';
  description?: string;
  bannerImageUrl?: string;
  buildingLevel: number;
  products: any[];
}

export default function BuildingView() {
  const [, navigate] = useLocation();
  const { totalItems } = useCart();
  const [stores, setStores] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);

  const { data: storesData, isLoading } = trpc.stores.list.useQuery({ limit: 50, offset: 0 });

  useEffect(() => {
    if (storesData) {
      const storeList = storesData.filter((s: any) => s.category === 'store');
      const officeList = storesData.filter((s: any) => s.category === 'office');
      setStores(storeList);
      setOffices(officeList);
    }
  }, [storesData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div className="space-y-4">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>

          <div className="mb-16">
            <div className="mb-8">
              <Skeleton className="h-8 w-72" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
                  <div className="h-40 w-full rounded-[28px] bg-slate-200" />
                  <div className="h-6 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                  <div className="h-10 w-full rounded-2xl bg-slate-200" />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <div className="mb-8">
              <Skeleton className="h-8 w-72" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
                  <div className="h-40 w-full rounded-[28px] bg-slate-200" />
                  <div className="h-6 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                  <div className="h-10 w-full rounded-2xl bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">🏬 SMART NETWORK MALL</h1>
            <p className="text-lg text-slate-600">Real-world building + dynamic marketing pitches</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/cart')} className="relative">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </div>

        {/* Level 1: Boutique Stores */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-700 mb-8 flex items-center gap-2">
            🛍️ Level 1 · Boutique Stores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stores.map(store => (
              <StoreCard key={store._id} store={store} onClick={() => navigate(`/store/${store._id}`)} />
            ))}
          </div>
        </div>

        {/* Level 2: Offices & Creative Spaces */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-700 mb-8 flex items-center gap-2">
            🏢 Level 2 · Offices & Creative Spaces
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {offices.map(office => (
              <StoreCard key={office._id} store={office} onClick={() => navigate(`/store/${office._id}`)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}