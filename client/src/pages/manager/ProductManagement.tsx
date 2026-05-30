import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
// import DashboardHeader from "@/components/DashboardHeader";
import { Plus, Search, Edit2, Trash2, Package, ToggleLeft, ToggleRight } from "lucide-react";

export default function ProductManagement() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", categoryId: "", costPrice: "", baseSalePrice: "", commissionPercent: "10", stockQuantity: "0" });

  const { data: products, isLoading } = trpc.products.listAll.useQuery({ limit: 100, offset: 0 });
  const { data: categories } = trpc.categories.list.useQuery();

  const allProducts = (products as any[]) ?? [];
  const activeProductsCount = allProducts.filter((p) => p.isActive).length;
  const inactiveProductsCount = allProducts.filter((p) => !p.isActive).length;

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); utils.products.listAll.invalidate(); toast.success("Product created!"); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); utils.products.listAll.invalidate(); toast.success("Product updated!"); setShowForm(false); setEditId(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); utils.products.listAll.invalidate(); toast.success("Product removed"); },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); utils.products.listAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ name: "", description: "", categoryId: "", costPrice: "", baseSalePrice: "", commissionPercent: "10", stockQuantity: "0" });

  const handleSubmit = () => {
    if (!form.name || !form.categoryId || !form.baseSalePrice) return toast.error("Fill all required fields");
    const payload = { name: form.name, description: form.description, categoryId: form.categoryId, costPrice: Number(form.costPrice), baseSalePrice: Number(form.baseSalePrice), commissionPercent: Number(form.commissionPercent), stockQuantity: Number(form.stockQuantity) };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const startEdit = (p: any) => {
    setEditId(p._id);
    setForm({ name: p.name, description: p.description ?? "", categoryId: p.categoryId?._id ?? p.categoryId ?? "", costPrice: p.costPrice?.toString() ?? "", baseSalePrice: p.baseSalePrice?.toString() ?? "", commissionPercent: p.commissionPercent?.toString() ?? "10", stockQuantity: p.stockQuantity?.toString() ?? "0" });
    setShowForm(true);
  };

  const filtered = (products as any[] ?? []).filter((p: any) => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Product Management" subtitle="Add, edit, and manage your store's products" /> */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Products</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{allProducts.length}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Products</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{activeProductsCount}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inactive Products</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{inactiveProductsCount}</p>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditId(null); resetForm(); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>

        {showForm && (
          <Card className="border-0 shadow-md mb-6">
            <CardHeader><CardTitle>{editId ? "Edit Product" : "New Product"}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
                <div><Label>Category *</Label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white">
                    <option value="">Select category...</option>
                    {(categories as any[] ?? []).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div><Label>Cost Price (₦)</Label><Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="mt-1" /></div>
                <div><Label>Base Sale Price (₦) *</Label><Input type="number" value={form.baseSalePrice} onChange={(e) => setForm({ ...form, baseSalePrice: e.target.value })} className="mt-1" /></div>
                <div><Label>Commission (%)</Label><Input type="number" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} className="mt-1" /></div>
                <div><Label>Stock Quantity</Label><Input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="mt-1" /></div>
                <div className="md:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{editId ? "Update" : "Create"} Product</Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.length === 0 ? (
              <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center"><Package className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No products found</p></CardContent></Card>
            ) : filtered.map((p: any) => (
              <Card key={p._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                        <p className="text-sm text-slate-500">{p.categoryId?.name ?? "Uncategorized"} • Stock: {p.stockQuantity ?? 0}</p>
                        <p className="text-sm font-medium text-blue-600">₦{(p.finalPrice ?? p.baseSalePrice ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(p)}><Edit2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleMutation.mutate({ id: p._id, isActive: !p.isActive })}>
                        {p.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate({ id: p._id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}