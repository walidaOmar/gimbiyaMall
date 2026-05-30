import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
// import DashboardHeader from "@/components/DashboardHeader";
import { Plus, Tag, Trash2, Edit2 } from "lucide-react";

export default function CategoryManagement() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories, isLoading } = trpc.categories.list.useQuery();

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Category created!"); setShowForm(false); setName(""); setDescription(""); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Category deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) return toast.error("Category name is required");
    createMutation.mutate({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Category Management" subtitle="Organise your products into categories" /> */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600">{(categories as any[])?.length ?? 0} categories</p>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        </div>

        {showForm && (
          <Card className="border-0 shadow-md mb-6">
            <CardHeader><CardTitle className="text-base">New Category</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electronics" className="mt-1" /></div>
              <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="mt-1" /></div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>Create Category</Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setName(""); setDescription(""); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="space-y-3">
            {!(categories as any[])?.length ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No categories yet. Add one above.</p>
                </CardContent>
              </Card>
            ) : (categories as any[]).map((cat: any) => (
              <Card key={cat._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{cat.name}</p>
                        {cat.description && <p className="text-sm text-slate-500">{cat.description}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">{cat.productCount ?? 0} products</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate({ id: cat._id, isActive: false }); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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