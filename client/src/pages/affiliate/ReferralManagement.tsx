import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
// import DashboardHeader from "@/components/DashboardHeader";
import { Link2, Copy, Share2, ExternalLink, Users } from "lucide-react";

export default function ReferralManagement() {
  const { data: linkData, isLoading } = trpc.affiliate.getReferralLink.useQuery();
  const { data: stats } = trpc.affiliate.myStats.useQuery();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!"));
  };

  const handleShare = () => {
    if (navigator.share && linkData?.url) {
      navigator.share({ title: "Shop at Gimbiya Mall", url: linkData.url });
    } else {
      handleCopy(linkData?.url ?? "");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Referral Management" subtitle="Share your link and grow your earnings" /> */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="space-y-6">
            {/* Referral Code Card */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Link2 className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Your Referral Code</h3>
                </div>
                <div className="bg-white/20 rounded-xl p-4 mb-4">
                  <p className="text-2xl font-mono font-bold tracking-widest text-center">{linkData?.code ?? "—"}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 flex items-center justify-between gap-3 mb-4">
                  <p className="text-sm truncate opacity-90">{linkData?.url ?? "—"}</p>
                  <button onClick={() => handleCopy(linkData?.url ?? "")} className="text-white/80 hover:text-white flex-shrink-0">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleShare} className="flex-1 bg-white text-blue-700 hover:bg-blue-50 gap-2">
                    <Share2 className="w-4 h-4" /> Share Link
                  </Button>
                  <Button onClick={() => handleCopy(linkData?.code ?? "")} variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10 gap-2">
                    <Copy className="w-4 h-4" /> Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 text-center">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-slate-900">{(stats as any)?.totalReferrals ?? 0}</p>
                  <p className="text-sm text-slate-500 mt-1">Total Referrals</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 text-center">
                  <span className="text-2xl">₦</span>
                  <p className="text-3xl font-bold text-slate-900">{((stats as any)?.totalEarnings ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-slate-500 mt-1">Total Earned</p>
                </CardContent>
              </Card>
            </div>

            {/* How it works */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { step: "1", title: "Share your link", desc: "Send your unique referral link to friends, family, or on social media" },
                    { step: "2", title: "They shop", desc: "When someone clicks your link and makes a purchase, it's tracked automatically" },
                    { step: "3", title: "You earn", desc: "Earn a commission on every sale made through your referral link" },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">{step}</div>
                      <div>
                        <p className="font-semibold text-slate-900">{title}</p>
                        <p className="text-sm text-slate-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}