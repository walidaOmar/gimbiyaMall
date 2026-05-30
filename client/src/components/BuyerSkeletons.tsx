import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton({ title }: { title: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BuyerDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCardSkeleton title="Total Orders" />
          <StatCardSkeleton title="Total Spent" />
          <StatCardSkeleton title="Saved Items" />
          <StatCardSkeleton title="Loyalty Points" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-slate-800">&nbsp;</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export function BuyerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-600">&nbsp;</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BuyerOrderHistorySkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export function OrderTrackingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Skeleton className="h-10 w-40 rounded-full" />

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">&nbsp;</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">&nbsp;</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">&nbsp;</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function ProductCatalogSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 space-y-6">
          <Skeleton className="h-10 w-60" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader>
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ShoppingCartSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-36" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-3 text-right">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-5 w-full" />
                ))}
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-11 w-full rounded-md" />
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-11 w-full rounded-md" />
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-5 w-full" />
                ))}
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
