import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
// import DashboardHeader from "@/components/DashboardHeader";
import { AlertTriangle, Package, Plus, Minus, Search, TrendingDown } from "lucide-react";

export default function InventoryManagement() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [threshold, setThreshold] = useState(10);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const { data: summary } = trpc.inventory.summary.useQuery();
  const { data: products, isLoading } = trpc.products.listAll.useQuery({ limit: 200, offset: 0 });
  const { data: lowStock } = trpc.inventory.lowStock.useQuery({ threshold });

  const adjustMutation = trpc.inventory.adjustStock.useMutation({
    onSuccess: (data) => {
      utils.products.list.invalidate();
      utils.products.listAll.invalidate();
      utils.inventory.lowStock.invalidate();
      toast.success(`Stock updated. New level: ${data.newStock}`);
      setAdjusting(null);
      setAdjustQty("");
      setAdjustReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdjust = (productId: string, direction: 1 | -1) => {
    const qty = parseInt(adjustQty);
    if (!qty || qty <= 0) return toast.error("Enter a valid quantity");
    if (!adjustReason) return toast.error("Please enter a reason");
    adjustMutation.mutate({ productId, quantityChange: qty * direction, reason: adjustReason as any });
  };

  const allProducts = (products as any[]) ?? [];
  const filtered = allProducts.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Inventory Management" subtitle="Monitor and adjust stock levels" /> */}
      <main className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Stock Value</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">₦{(summary?.totalStockValue ?? 0).toLocaleString()}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Items Below Threshold</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{summary?.lowStockItems ?? 0}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Products</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{summary?.activeProducts ?? 0}</p>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {(lowStock as any[])?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">{(lowStock as any[]).length} item{(lowStock as any[]).length !== 1 ? "s" : ""} below stock threshold ({threshold})</p>
              <p className="text-sm text-amber-700 mt-0.5">{(lowStock as any[]).map((p: any) => p.name).join(", ")}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-slate-600 whitespace-nowrap">Low-stock threshold:</Label>
            <Input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-20" min={1} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p: any) => {
              const isLow = (p.stockQuantity ?? 0) <= threshold;
              const isAdjustingThis = adjusting === p._id;
              return (
                <Card key={p._id} className={`border-0 shadow-sm transition-all ${isLow ? "border-l-4 border-l-amber-400" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isLow ? "bg-amber-100" : "bg-slate-100"}`}>
                          {isLow ? <TrendingDown className="w-6 h-6 text-amber-600" /> : <Package className="w-6 h-6 text-slate-500" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                          <p className="text-sm text-slate-500">{p.categoryId?.name ?? "Uncategorized"}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-bold text-slate-900">Stock: {p.stockQuantity ?? 0}</span>
                            {isLow && <Badge className="bg-amber-100 text-amber-700 text-xs">Low Stock</Badge>}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setAdjusting(isAdjustingThis ? null : p._id)}>
                        Adjust Stock
                      </Button>
                    </div>

                    {isAdjustingThis && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-slate-600">Quantity</Label>
                            <Input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="e.g. 10" className="mt-1" min={1} />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs text-slate-600">Reason</Label>
                            <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Restock, Damaged, etc." className="mt-1" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => handleAdjust(p._id, 1)} className="gap-1 bg-green-600 hover:bg-green-700">
                            <Plus className="w-3 h-3" /> Add Stock
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAdjust(p._id, -1)} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                            <Minus className="w-3 h-3" /> Remove Stock
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setAdjusting(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}