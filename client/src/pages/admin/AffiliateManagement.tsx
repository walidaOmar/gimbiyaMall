import { useState } from "react";
// import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AffiliateUser {
  id: string;
  email: string;
  name: string;
  serialNumber: string;
  status: "active" | "pending" | "inactive";
  joinDate: string;
  earnings: number;
}

export default function AffiliateManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([
    {
      id: "1",
      email: "affiliate1@example.com",
      name: "John Doe",
      serialNumber: "AFF-001",
      status: "active",
      joinDate: "2026-02-15",
      earnings: 45200,
    },
    {
      id: "2",
      email: "affiliate2@example.com",
      name: "Jane Smith",
      serialNumber: "AFF-002",
      status: "active",
      joinDate: "2026-02-20",
      earnings: 28500,
    },
    {
      id: "3",
      email: "pending@example.com",
      name: "Bob Johnson",
      serialNumber: "AFF-003",
      status: "pending",
      joinDate: "2026-03-01",
      earnings: 0,
    },
  ]);

  const handleEnableAffiliate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail || !serialNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    const existingAffiliate = affiliates.find((a) => a.email === searchEmail);
    if (existingAffiliate) {
      if (existingAffiliate.status === "active") {
        toast.error("This user is already an active affiliate");
        return;
      }
      setAffiliates(
        affiliates.map((a) =>
          a.email === searchEmail ? { ...a, status: "active" } : a
        )
      );
      toast.success(`${searchEmail} has been enabled as an affiliate`);
    } else {
      const newAffiliate: AffiliateUser = {
        id: (affiliates.length + 1).toString(),
        email: searchEmail,
        name: "New Affiliate",
        serialNumber: serialNumber,
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
        earnings: 0,
      };
      setAffiliates([...affiliates, newAffiliate]);
      toast.success(`${searchEmail} has been added as an affiliate`);
    }

    setSearchEmail("");
    setSerialNumber("");
  };

  const handleDisableAffiliate = (email: string) => {
    setAffiliates(
      affiliates.map((a) =>
        a.email === email ? { ...a, status: "inactive" } : a
      )
    );
    toast.success(`${email} has been disabled as an affiliate`);
  };

  const handleDeleteAffiliate = (id: string) => {
    setAffiliates(affiliates.filter((a) => a.id !== id));
    toast.success("Affiliate has been removed");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      inactive: "bg-slate-100 text-slate-800",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const activeCount = affiliates.filter((a) => a.status === "active").length;
  const pendingCount = affiliates.filter((a) => a.status === "pending").length;
  const totalEarnings = affiliates.reduce((sum, a) => sum + a.earnings, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/*<DashboardHeader
        title="Affiliate Management"
        subtitle="Manage affiliate users and commissions"
      />*/}

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Active Affiliates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{activeCount}</p>
              <p className="text-xs text-green-600 mt-1">Earning commissions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{pendingCount}</p>
              <p className="text-xs text-amber-600 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Commissions Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">₦{totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-slate-600 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="enable" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="enable">Enable Affiliate</TabsTrigger>
            <TabsTrigger value="list">Affiliate List</TabsTrigger>
          </TabsList>

          {/* Enable Affiliate Tab */}
          <TabsContent value="enable">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Enable New Affiliate
                </CardTitle>
                <CardDescription>
                  Convert a buyer account to an affiliate account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEnableAffiliate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Buyer Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="buyer@example.com"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">
                        Enter the email of the buyer you want to enable as an affiliate
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serial">Serial Number (Optional)</Label>
                      <Input
                        id="serial"
                        placeholder="AFF-001 or ID number"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">
                        Unique identifier for tracking
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> The user must already have a buyer account. Once enabled, they will be able to access the affiliate dashboard and start earning commissions.
                    </p>
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Enable as Affiliate
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliate List Tab */}
          <TabsContent value="list">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>All Affiliates</CardTitle>
                <CardDescription>Manage and monitor affiliate accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliates.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-slate-900">{affiliate.name}</p>
                            <Badge className={getStatusColor(affiliate.status)}>
                              {affiliate.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{affiliate.email}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Serial: {affiliate.serialNumber} • Joined: {affiliate.joinDate}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            ₦{affiliate.earnings.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-600">Earned</p>

                          <div className="flex gap-2 mt-3">
                            {affiliate.status === "active" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDisableAffiliate(affiliate.email)}
                                className="text-amber-600 hover:text-amber-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {affiliate.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEnableAffiliate({
                                  preventDefault: () => {},
                                } as any)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAffiliate(affiliate.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
