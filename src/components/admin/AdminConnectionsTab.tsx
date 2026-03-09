import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Image, Clock, Timer } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Props = { invokeAdmin: (action: string, params?: any) => Promise<any> };

const AdminConnectionsTab = ({ invokeAdmin }: Props) => {
  const { toast } = useToast();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotDialog, setScreenshotDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await invokeAdmin("list_connections");
      setConnections(data || []);
    } catch {}
    setLoading(false);
  };

  const handleConfirm = async (id: string) => {
    setProcessing(true);
    try {
      await invokeAdmin("confirm_connection", { connection_id: id });
      toast({ title: "Connection confirmed!" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    setProcessing(true);
    try {
      await invokeAdmin("reject_connection", { connection_id: rejectDialog, note: rejectNote });
      toast({ title: "Rejection sent" });
      setRejectDialog(null);
      setRejectNote("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const handleExtend = async (id: string) => {
    setProcessing(true);
    try {
      await invokeAdmin("extend_deadline", { connection_id: id });
      toast({ title: "Deadline extended by 24 hours" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const handleExpire = async (id: string) => {
    setProcessing(true);
    try {
      await invokeAdmin("expire_connection", { connection_id: id });
      toast({ title: "Connection expired" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const viewScreenshot = async (path: string) => {
    try {
      const data = await invokeAdmin("get_screenshot_url", { path });
      setScreenshotUrl(data.url);
      setScreenshotDialog(true);
    } catch {
      toast({ title: "Error loading screenshot", variant: "destructive" });
    }
  };

  const pending = connections.filter((c) => c.status === "payment_submitted");
  const confirmed = connections.filter((c) => c.status === "confirmed");
  const expired = connections.filter((c) => c.status === "expired");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const confirmedMonth = confirmed.filter((c) => (c.confirmed_at || c.created_at) >= monthStart);
  const expiredMonth = expired.filter((c) => c.created_at >= monthStart);
  const revenueMonth = confirmedMonth.reduce((s, c) => s + Number(c.platform_fee), 0);
  const revenueAll = confirmed.reduce((s, c) => s + Number(c.platform_fee), 0);

  const statusBadge = (s: string) => {
    if (s === "confirmed") return <Badge className="bg-primary/10 text-primary border-0">Confirmed</Badge>;
    if (s === "payment_submitted") return <Badge variant="secondary">Under Review</Badge>;
    if (s === "pending") return <Badge variant="outline">Pending Screenshot</Badge>;
    if (s === "expired") return <Badge variant="destructive">Expired</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const ConnectionRow = ({ conn }: { conn: any }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground">{conn.tutor_name}</p>
              <span className="text-muted-foreground">→</span>
              <p className="font-semibold text-foreground">{conn.student_name}</p>
              {statusBadge(conn.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {conn.subject || "N/A"} · रू {conn.monthly_rate?.toLocaleString()}/mo · Fee: रू {conn.platform_fee?.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Created: {format(new Date(conn.created_at), "MMM d, yyyy h:mm a")}
              {conn.confirmed_at && ` · Confirmed: ${format(new Date(conn.confirmed_at), "MMM d, yyyy")}`}
              {conn.expires_at && conn.status !== "confirmed" && ` · Expires: ${format(new Date(conn.expires_at), "MMM d h:mm a")}`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {conn.payment_screenshot_url && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => viewScreenshot(conn.payment_screenshot_url)}>
                <Image className="h-3 w-3" /> View
              </Button>
            )}
            {conn.status === "payment_submitted" && (
              <>
                <Button size="sm" className="gap-1" onClick={() => handleConfirm(conn.id)} disabled={processing}>
                  <CheckCircle className="h-3 w-3" /> Confirm
                </Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setRejectDialog(conn.id); setRejectNote(""); }} disabled={processing}>
                  <XCircle className="h-3 w-3" /> Reject
                </Button>
              </>
            )}
            {(conn.status === "pending" || conn.status === "payment_submitted") && (
              <>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => handleExtend(conn.id)} disabled={processing}>
                  <Timer className="h-3 w-3" /> +24h
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleExpire(conn.id)} disabled={processing}>
                  <Clock className="h-3 w-3" /> Expire
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Connections</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Pending Review", value: pending.length, highlight: pending.length > 0 },
          { label: "Confirmed (Month)", value: confirmedMonth.length },
          { label: "Revenue (Month)", value: `रू ${revenueMonth.toLocaleString()}` },
          { label: "Revenue (All)", value: `रू ${revenueAll.toLocaleString()}` },
          { label: "Expired (Month)", value: expiredMonth.length },
        ].map((s) => (
          <Card key={s.label} className={s.highlight ? "border-destructive" : ""}>
            <CardContent className="p-3">
              <p className={`text-xl font-bold ${s.highlight ? "text-destructive" : "text-foreground"}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Under Review ({pending.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="all">All ({connections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No pending confirmations</CardContent></Card>
          ) : pending.map((c) => <ConnectionRow key={c.id} conn={c} />)}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-3 mt-4">
          {confirmed.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No confirmed connections yet</CardContent></Card>
          ) : confirmed.map((c) => <ConnectionRow key={c.id} conn={c} />)}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          {connections.map((c) => <ConnectionRow key={c.id} conn={c} />)}
        </TabsContent>
      </Tabs>

      {/* Screenshot Dialog */}
      <Dialog open={screenshotDialog} onOpenChange={() => setScreenshotDialog(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment Screenshot</DialogTitle></DialogHeader>
          {screenshotUrl ? (
            <img src={screenshotUrl} alt="Payment screenshot" className="w-full rounded-lg" />
          ) : (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject & Request Resend</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? "Sending…" : "Reject & Notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConnectionsTab;
