import { useState } from "react";
// import DashboardHeader from "@/components/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Minus, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";

const MOCK_PRODUCTS = [
  { _id: "1", name: "Indomie Noodles (Carton)",   stockQuantity: 4,   categoryId: { name: "Food & Groceries" } },
  { _id: "2", name: "Bic Ballpoint Pens (Pack)",  stockQuantity: 45,  categoryId: { name: "Stationery" } },
  { _id: "3", name: "Dettol Soap (12-pack)",      stockQuantity: 2,   categoryId: { name: "Health & Beauty" } },
  { _id: "4", name: "Peak Milk (48-pack)",         stockQuantity: 0,   categoryId: { name: "Dairy" } },
  { _id: "5", name: "Sunlight Detergent 1kg",     stockQuantity: 9,   categoryId: { name: "Household" } },
  { _id: "6", name: "Golden Penny Semolina 1kg",  stockQuantity: 88,  categoryId: { name: "Food & Groceries" } },
  { _id: "7", name: "Close-Up Toothpaste 100g",   stockQuantity: 34,  categoryId: { name: "Health & Beauty" } },
  { _id: "8", name: "Dangote Sugar 1kg",           stockQuantity: 120, categoryId: { name: "Food & Groceries" } },
];

const REASONS = [
  { value: "restock",          label: "Restock / New Delivery" },
  { value: "return",           label: "Customer Return" },
  { value: "damage",           label: "Damaged / Expired" },
  { value: "sale_adjustment",  label: "Sale Adjustment" },
  { value: "correction",       label: "Stock Count Correction" },
  { value: "other",            label: "Other" },
];

interface Adjustment {
  productId:      string;
  productName:    string;
  currentStock:   number;
  quantityChange: number;
  reason:         string;
  notes:          string;
}

export default function StockAdjustment() {
  const [search, setSearch]           = useState("");
  const [adjustments, setAdjustments] = useState<Record<string, Adjustment>>({});
  const [submitting, setSubmitting]   = useState(false);

  const productsQuery = trpc.stockManager?.products?.useQuery({ limit: 50, offset: 0 }, { retry: false });
  const products      = productsQuery?.data ?? MOCK_PRODUCTS;

  const utils = trpc.useContext();

  const adjustMutation = trpc.stockManager?.adjustStock?.useMutation?.({
    onSuccess: () => {
      toast.success("Adjustment applied");
      productsQuery?.refetch?.();
      utils?.stockManager?.products?.invalidate?.();
      utils?.stockManager?.summary?.invalidate?.();
      utils?.stockManager?.lowStockAlerts?.invalidate?.();
      utils?.inventory?.list?.invalidate?.();
      utils?.inventory?.lowStock?.invalidate?.();
      utils?.inventory?.summary?.invalidate?.();
      utils?.inventory?.recentActivity?.invalidate?.();
      utils?.products?.listAll?.invalidate?.();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function setChange(product: any, delta: number) {
    setAdjustments((prev) => {
      const existing = prev[product._id] ?? {
        productId: product._id, productName: product.name,
        currentStock: product.stockQuantity, quantityChange: 0,
        reason: "restock", notes: "",
      };
      return { ...prev, [product._id]: { ...existing, quantityChange: existing.quantityChange + delta } };
    });
  }

  function setField(productId: string, field: "reason" | "notes", value: string) {
    setAdjustments((prev) => {
      if (!prev[productId]) return prev;
      return { ...prev, [productId]: { ...prev[productId], [field]: value } };
    });
  }

  function removeAdjustment(productId: string) {
    setAdjustments((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }

  const pending = Object.values(adjustments).filter((a) => a.quantityChange !== 0);

  async function handleSubmit() {
    if (pending.length === 0) return toast.warning("No adjustments to submit");
    setSubmitting(true);
    try {
      for (const adj of pending) {
        if (adjustMutation) {
          await adjustMutation.mutateAsync({
            productId:      adj.productId,
            quantityChange: adj.quantityChange,
            reason:         adj.reason as any,
            notes:          adj.notes || undefined,
          });
        }
      }
      toast.success(`${pending.length} adjustment${pending.length > 1 ? "s" : ""} submitted successfully`);
      setAdjustments({});
      productsQuery?.refetch?.();
    } catch {
      toast.error("Some adjustments failed. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", background: "#f8f6f0", minHeight: "100vh" }}>
      {/* <DashboardHeader title="Stock Adjustment" subtitle="Adjust product stock levels" role="stock_manager" /> */}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* Pending adjustments panel */}
        {pending.length > 0 && (
          <div style={{
            background: "#1A1A2E", borderRadius: 12, padding: "16px 20px",
            marginBottom: 24, border: "1px solid #C8A84B44",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#C8A84B", fontWeight: 700, fontSize: 14 }}>
                Pending Adjustments ({pending.length})
              </span>
              <Button onClick={handleSubmit} disabled={submitting}
                style={{ background: "#C8A84B", color: "#1A1A2E", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <Send size={14} />
                {submitting ? "Submitting..." : "Submit All"}
              </Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pending.map((adj) => (
                <div key={adj.productId} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,.06)", borderRadius: 8, padding: "8px 14px",
                }}>
                  <span style={{ color: "white", fontSize: 13, flex: 1 }}>{adj.productName}</span>
                  <span style={{ color: adj.quantityChange > 0 ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 13, marginRight: 12 }}>
                    {adj.quantityChange > 0 ? "+" : ""}{adj.quantityChange}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 12, marginRight: 12 }}>
                    {REASONS.find((r) => r.value === adj.reason)?.label}
                  </span>
                  <button onClick={() => removeAdjustment(adj.productId)}
                    style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40, background: "white", border: "1px solid #e2ddd4", borderRadius: 10 }}
          />
        </div>

        {/* Product table */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2ddd4", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2ddd4", background: "#1A1A2E" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B" }}>
              Products ({filtered.length})
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f6f0" }}>
                {["Product", "Category", "Current Stock", "Adjust", "Reason", "Notes"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any, i: number) => {
                const adj     = adjustments[p._id];
                const pending_qty = adj?.quantityChange ?? 0;
                const newQty  = p.stockQuantity + pending_qty;

                return (
                  <tr key={p._id} style={{ borderTop: "1px solid #f1ede6", background: adj ? "#fffbf0" : i % 2 === 0 ? "white" : "#fdfaf6" }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#1A1A2E", maxWidth: 200 }}>{p.name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>{(p.categoryId as any)?.name ?? "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: p.stockQuantity === 0 ? "#B71C1C" : p.stockQuantity <= 10 ? "#E65100" : "#1A1A2E" }}>
                          {p.stockQuantity}
                        </span>
                        {pending_qty !== 0 && (
                          <span style={{ fontSize: 11, color: pending_qty > 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                            → {newQty} ({pending_qty > 0 ? "+" : ""}{pending_qty})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => setChange(p, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e2ddd4", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Minus size={13} color="#64748b" />
                        </button>
                        <span style={{ minWidth: 28, textAlign: "center", fontSize: 13, fontWeight: 700, color: pending_qty > 0 ? "#16a34a" : pending_qty < 0 ? "#dc2626" : "#94a3b8" }}>
                          {pending_qty > 0 ? "+" : ""}{pending_qty}
                        </span>
                        <button onClick={() => setChange(p, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e2ddd4", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Plus size={13} color="#64748b" />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {adj ? (
                        <select
                          value={adj.reason}
                          onChange={(e) => setField(p._id, "reason", e.target.value)}
                          style={{ fontSize: 12, border: "1px solid #e2ddd4", borderRadius: 6, padding: "4px 8px", background: "white", cursor: "pointer" }}
                        >
                          {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : <span style={{ color: "#d1cdc4", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {adj ? (
                        <Input
                          placeholder="Optional note…"
                          value={adj.notes}
                          onChange={(e) => setField(p._id, "notes", e.target.value)}
                          style={{ fontSize: 12, border: "1px solid #e2ddd4", borderRadius: 6, height: 32, minWidth: 140 }}
                        />
                      ) : <span style={{ color: "#d1cdc4", fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
