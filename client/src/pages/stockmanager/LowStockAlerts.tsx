import { useState } from "react";
// import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, XCircle, Send, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";

const MOCK_ALERTS = [
  { _id: "1", name: "Indomie Noodles (Carton)",   stockQuantity: 4,  categoryId: { name: "Food & Groceries" }, soldQuantity: 320 },
  { _id: "2", name: "Dettol Soap (12-pack)",       stockQuantity: 2,  categoryId: { name: "Health & Beauty" }, soldQuantity: 180 },
  { _id: "3", name: "Peak Milk (48-pack)",          stockQuantity: 0,  categoryId: { name: "Dairy" },           soldQuantity: 95  },
  { _id: "4", name: "Sunlight Detergent 1kg",      stockQuantity: 9,  categoryId: { name: "Household" },       soldQuantity: 210 },
  { _id: "5", name: "Titus Sardines (Carton)",     stockQuantity: 3,  categoryId: { name: "Food & Groceries" }, soldQuantity: 145 },
  { _id: "6", name: "Close-Up Toothpaste 100g",    stockQuantity: 8,  categoryId: { name: "Health & Beauty" }, soldQuantity: 67  },
];

const URGENCY_OPTIONS = [
  { value: "high",   label: "High",   color: "#B71C1C", bg: "#FFEBEE" },
  { value: "medium", label: "Medium", color: "#E65100", bg: "#FFF3E0" },
  { value: "low",    label: "Low",    color: "#1B5E20", bg: "#E8F5E9" },
];

export default function LowStockAlerts() {
  const [threshold,  setThreshold]  = useState(10);
  const [filter,     setFilter]     = useState<"all"|"out"|"low">("all");
  const [requesting, setRequesting] = useState<Record<string, { qty: string; urgency: string; notes: string }>>({});
  const [submitted,  setSubmitted]  = useState<Set<string>>(new Set());

  const alertsQuery = trpc.stockManager?.lowStockAlerts?.useQuery({ threshold }, { retry: false });
  const products    = alertsQuery?.data ?? MOCK_ALERTS;

  const utils = trpc.useContext();

  const restockMutation = trpc.stockManager?.requestRestock?.useMutation?.({
    onSuccess: () => {
      toast.success("Restock request submitted");
      alertsQuery?.refetch?.();
      utils?.stockManager?.lowStockAlerts?.invalidate?.();
      utils?.stockManager?.summary?.invalidate?.();
      utils?.inventory?.lowStock?.invalidate?.();
      utils?.inventory?.summary?.invalidate?.();
      utils?.products?.listAll?.invalidate?.();
      utils?.inventory?.recentActivity?.invalidate?.();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const displayed = products.filter((p: any) => {
    if (filter === "out") return p.stockQuantity === 0;
    if (filter === "low") return p.stockQuantity > 0 && p.stockQuantity <= threshold;
    return true;
  });

  function startRequest(productId: string) {
    setRequesting((prev) => ({ ...prev, [productId]: { qty: "50", urgency: "medium", notes: "" } }));
  }

  function cancelRequest(productId: string) {
    setRequesting((prev) => { const n = { ...prev }; delete n[productId]; return n; });
  }

  async function submitRequest(product: any) {
    const req = requesting[product._id];
    if (!req) return;
    const qty = parseInt(req.qty);
    if (!qty || qty < 1) return toast.error("Enter a valid quantity");

    try {
      if (restockMutation) {
        await restockMutation.mutateAsync({
          productId:    product._id,
          requestedQty: qty,
          urgency:      req.urgency as any,
          notes:        req.notes || undefined,
        });
      }
      toast.success(`Restock request submitted for ${product.name}`);
      setSubmitted((prev) => new Set(prev).add(product._id));
      cancelRequest(product._id);
    } catch {
      toast.error("Failed to submit request. Please try again.");
    }
  }

  const outCount = products.filter((p: any) => p.stockQuantity === 0).length;
  const lowCount = products.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= threshold).length;

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", background: "#f8f6f0", minHeight: "100vh" }}>
      {/* <DashboardHeader title="Low Stock Alerts" subtitle="Products needing restock" role="stock_manager" /> */}

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px" }}>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFEBEE", borderRadius: 8, padding: "8px 14px" }}>
            <XCircle size={16} color="#B71C1C" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#B71C1C" }}>{outCount} Out of Stock</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF3E0", borderRadius: 8, padding: "8px 14px" }}>
            <AlertTriangle size={16} color="#E65100" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#E65100" }}>{lowCount} Low Stock</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <Filter size={14} color="#64748b" />
            <span style={{ fontSize: 12, color: "#64748b" }}>Threshold:</span>
            <Input
              type="number" min={1} max={100} value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
              style={{ width: 60, height: 32, fontSize: 12, textAlign: "center", border: "1px solid #e2ddd4", borderRadius: 6 }}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[{ key: "all", label: `All (${products.length})` }, { key: "out", label: `Out of Stock (${outCount})` }, { key: "low", label: `Low (${lowCount})` }].map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key as any)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700, transition: ".15s",
              background: filter === tab.key ? "#1A1A2E" : "white",
              color: filter === tab.key ? "#C8A84B" : "#64748b",
              boxShadow: filter === tab.key ? "0 2px 8px rgba(0,0,0,.15)" : "none",
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Alerts list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.map((p: any) => {
            const isOut      = p.stockQuantity === 0;
            const isRequested= submitted.has(p._id);
            const reqForm    = requesting[p._id];

            return (
              <div key={p._id} style={{
                background: "white", borderRadius: 12, border: `1px solid ${isOut ? "#ffcdd2" : "#ffe0b2"}`,
                overflow: "hidden",
              }}>
                {/* Main row */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: isOut ? "#FFEBEE" : "#FFF3E0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isOut
                      ? <XCircle size={22} color="#B71C1C" />
                      : <AlertTriangle size={22} color="#E65100" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{(p.categoryId as any)?.name} · {p.soldQuantity ?? 0} sold</div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: isOut ? "#B71C1C" : "#E65100" }}>{p.stockQuantity}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>units left</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {isRequested
                      ? <Badge style={{ background: "#E8F5E9", color: "#1B5E20", fontWeight: 700 }}>✓ Requested</Badge>
                      : reqForm
                        ? <button onClick={() => cancelRequest(p._id)} style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                        : <Button onClick={() => startRequest(p._id)} size="sm"
                            style={{ background: "#1A1A2E", color: "#C8A84B", fontSize: 12, fontWeight: 700 }}>
                            Request Restock
                          </Button>}
                  </div>
                </div>

                {/* Restock form */}
                {reqForm && (
                  <div style={{ padding: "0 18px 16px", borderTop: "1px solid #f1ede6", paddingTop: 14, background: "#fdfaf6" }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>QTY TO REQUEST</label>
                        <Input
                          type="number" min={1} value={reqForm.qty}
                          onChange={(e) => setRequesting((prev) => ({ ...prev, [p._id]: { ...prev[p._id], qty: e.target.value } }))}
                          style={{ width: 80, height: 34, fontSize: 13, border: "1px solid #e2ddd4", borderRadius: 6 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>URGENCY</label>
                        <select
                          value={reqForm.urgency}
                          onChange={(e) => setRequesting((prev) => ({ ...prev, [p._id]: { ...prev[p._id], urgency: e.target.value } }))}
                          style={{ height: 34, fontSize: 12, border: "1px solid #e2ddd4", borderRadius: 6, padding: "0 10px", background: "white" }}
                        >
                          {URGENCY_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>NOTES (optional)</label>
                        <Input
                          placeholder="e.g. Supplier: Alhaji Musa"
                          value={reqForm.notes}
                          onChange={(e) => setRequesting((prev) => ({ ...prev, [p._id]: { ...prev[p._id], notes: e.target.value } }))}
                          style={{ height: 34, fontSize: 12, border: "1px solid #e2ddd4", borderRadius: 6 }}
                        />
                      </div>
                      <Button onClick={() => submitRequest(p)} style={{ background: "#C8A84B", color: "#1A1A2E", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 6, height: 34 }}>
                        <Send size={13} /> Submit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {displayed.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
              <AlertTriangle size={40} color="#d1cdc4" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600 }}>No alerts in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
