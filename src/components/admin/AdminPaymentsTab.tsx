import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download } from "lucide-react";
import { format } from "date-fns";

type Props = { invokeAdmin: (action: string, params?: any) => Promise<any> };

const AdminPaymentsTab = ({ invokeAdmin }: Props) => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await invokeAdmin("list_connections");
        setConnections((data || []).filter((c: any) => c.status === "confirmed"));
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const total = connections.reduce((s, c) => s + Number(c.platform_fee), 0);
  const thisMonth = connections.filter((c) => (c.confirmed_at || c.created_at) >= monthStart);
  const monthRevenue = thisMonth.reduce((s, c) => s + Number(c.platform_fee), 0);
  const thisWeek = connections.filter((c) => (c.confirmed_at || c.created_at) >= weekStart);
  const weekRevenue = thisWeek.reduce((s, c) => s + Number(c.platform_fee), 0);
  const avgFee = connections.length > 0 ? Math.round(total / connections.length) : 0;

  const exportCsv = () => {
    const header = "Tutor,Student,Monthly Rate,Fee Paid,Date Confirmed\n";
    const rows = connections.map((c) =>
      `"${c.tutor_name}","${c.student_name}",${c.monthly_rate},${c.platform_fee},"${c.confirmed_at ? format(new Date(c.confirmed_at), "yyyy-MM-dd") : "N/A"}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${format(now, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Payments</h1>
        <Button variant="outline" className="gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: `रू ${total.toLocaleString()}` },
          { label: "This Month", value: `रू ${monthRevenue.toLocaleString()}` },
          { label: "This Week", value: `रू ${weekRevenue.toLocaleString()}` },
          { label: "Avg Fee/Connection", value: `रू ${avgFee.toLocaleString()}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        {connections.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No payments yet</CardContent></Card>
        ) : (
          connections.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{c.tutor_name} → {c.student_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.subject || "N/A"} · Monthly: रू {c.monthly_rate?.toLocaleString()} · Fee: रू {c.platform_fee?.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm shrink-0">
                  <p className="font-semibold text-foreground">रू {c.platform_fee?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.confirmed_at ? format(new Date(c.confirmed_at), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsTab;
