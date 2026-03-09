import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  Users,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  Image,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Connection = {
  id: string;
  tutor_user_id: string;
  student_id: string;
  tutor_name: string;
  student_name: string;
  monthly_rate: number;
  platform_fee: number;
  status: string;
  payment_screenshot_url: string | null;
  admin_note: string | null;
  created_at: string;
  expires_at: string;
  confirmed_at: string | null;
  subject: string;
};

type Stats = {
  connections_this_month: number;
  revenue_this_month: number;
  revenue_all_time: number;
  pending_confirmations: number;
};

const ADMIN_TABS = [
  { id: "connections", label: "Connections", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("connections");
  const [screenshotDialog, setScreenshotDialog] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [processing, setProcessing] = useState(false);

  // Settings
  const [settingsValues, setSettingsValues] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchAll();
  }, [user]);

  const invokeAdmin = async (action: string, params: any = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-connections", {
      body: { action, ...params },
    });
    if (error) throw error;
    return data;
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [conns, statsData] = await Promise.all([
        invokeAdmin("list_connections"),
        invokeAdmin("get_stats"),
      ]);
      setConnections(conns || []);
      setStats(statsData);

      // Fetch settings
      const { data: s } = await supabase.from("platform_settings").select("key, value");
      if (s) {
        const map: Record<string, string> = {};
        s.forEach((r: any) => { map[r.key] = r.value; });
        setSettingsValues(map);
      }
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleConfirm = async (id: string) => {
    setProcessing(true);
    try {
      await invokeAdmin("confirm_connection", { connection_id: id });
      toast({ title: "Connection confirmed!" });
      fetchAll();
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
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const viewScreenshot = async (path: string) => {
    try {
      const data = await invokeAdmin("get_screenshot_url", { path });
      setScreenshotUrl(data.url);
      setScreenshotDialog(path);
    } catch (err: any) {
      toast({ title: "Error loading screenshot", variant: "destructive" });
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await invokeAdmin("update_settings", { settings: settingsValues });
      toast({ title: "Settings saved!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSavingSettings(false);
  };

  const statusColor = (s: string) => {
    if (s === "confirmed") return "default";
    if (s === "payment_submitted") return "secondary";
    if (s === "expired") return "destructive";
    return "outline";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border min-h-[calc(100vh-4rem)] p-4 gap-1">
          {ADMIN_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        <main className="flex-1 p-6 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {activeTab === "connections" && (
                <div className="max-w-6xl space-y-6">
                  <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>

                  {/* Stats */}
                  {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "This Month", value: stats.connections_this_month },
                        { label: "Revenue (Month)", value: `रू ${stats.revenue_this_month.toLocaleString()}` },
                        { label: "Revenue (All Time)", value: `रू ${stats.revenue_all_time.toLocaleString()}` },
                        { label: "Pending", value: stats.pending_confirmations },
                      ].map(s => (
                        <Card key={s.label}>
                          <CardContent className="p-4">
                            <p className="text-2xl font-bold text-foreground">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Connections table */}
                  <Tabs defaultValue="pending">
                    <TabsList>
                      <TabsTrigger value="pending">
                        Pending ({connections.filter(c => c.status === "payment_submitted").length})
                      </TabsTrigger>
                      <TabsTrigger value="all">All ({connections.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-3 mt-4">
                      {connections.filter(c => c.status === "payment_submitted").length === 0 ? (
                        <Card><CardContent className="py-12 text-center text-muted-foreground">No pending confirmations</CardContent></Card>
                      ) : (
                        connections.filter(c => c.status === "payment_submitted").map(conn => (
                          <ConnectionCard
                            key={conn.id}
                            conn={conn}
                            onConfirm={() => handleConfirm(conn.id)}
                            onReject={() => { setRejectDialog(conn.id); setRejectNote(""); }}
                            onViewScreenshot={() => conn.payment_screenshot_url && viewScreenshot(conn.payment_screenshot_url)}
                            processing={processing}
                          />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="all" className="space-y-3 mt-4">
                      {connections.map(conn => (
                        <ConnectionCard
                          key={conn.id}
                          conn={conn}
                          onConfirm={conn.status === "payment_submitted" ? () => handleConfirm(conn.id) : undefined}
                          onReject={conn.status === "payment_submitted" ? () => { setRejectDialog(conn.id); setRejectNote(""); } : undefined}
                          onViewScreenshot={conn.payment_screenshot_url ? () => viewScreenshot(conn.payment_screenshot_url!) : undefined}
                          processing={processing}
                        />
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="max-w-xl space-y-6">
                  <h1 className="font-display text-2xl font-bold text-foreground">Platform Settings</h1>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      {[
                        { key: "commission_rate", label: "Commission Rate (%)", type: "number" },
                        { key: "connection_expiry_hours", label: "Connection Expiry (hours)", type: "number" },
                        { key: "esewa_number", label: "eSewa Number", type: "text" },
                        { key: "khalti_number", label: "Khalti Number", type: "text" },
                        { key: "min_monthly_rate", label: "Min Monthly Rate (रू)", type: "number" },
                        { key: "max_monthly_rate", label: "Max Monthly Rate (रू)", type: "number" },
                      ].map(field => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-sm font-medium text-foreground">{field.label}</label>
                          <Input
                            type={field.type}
                            value={settingsValues[field.key] || ""}
                            onChange={e => setSettingsValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          />
                        </div>
                      ))}
                      <Button onClick={saveSettings} disabled={savingSettings} className="w-full">
                        {savingSettings ? "Saving…" : "Save Settings"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Screenshot Dialog */}
      <Dialog open={!!screenshotDialog} onOpenChange={() => setScreenshotDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment Screenshot</DialogTitle></DialogHeader>
          {screenshotUrl ? (
            <img src={screenshotUrl} alt="Payment screenshot" className="w-full rounded-lg" />
          ) : (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject & Request Resend</DialogTitle></DialogHeader>
          <Textarea
            placeholder="Reason (e.g., screenshot unclear, amount doesn't match)..."
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? "Sending…" : "Reject & Notify Tutor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ConnectionCard = ({
  conn,
  onConfirm,
  onReject,
  onViewScreenshot,
  processing,
}: {
  conn: Connection;
  onConfirm?: () => void;
  onReject?: () => void;
  onViewScreenshot?: () => void;
  processing: boolean;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{conn.tutor_name}</p>
            <span className="text-muted-foreground">→</span>
            <p className="font-semibold text-foreground">{conn.student_name}</p>
            <Badge variant={statusColor(conn.status) as any} className="capitalize">{conn.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {conn.subject} · रू {conn.monthly_rate?.toLocaleString()}/mo · Fee: रू {conn.platform_fee?.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Created: {format(new Date(conn.created_at), "MMM d, yyyy h:mm a")}
            {conn.confirmed_at && ` · Confirmed: ${format(new Date(conn.confirmed_at), "MMM d, yyyy")}`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {onViewScreenshot && (
            <Button size="sm" variant="outline" className="gap-1" onClick={onViewScreenshot}>
              <Image className="h-3 w-3" /> View
            </Button>
          )}
          {onConfirm && (
            <Button size="sm" className="gap-1" onClick={onConfirm} disabled={processing}>
              <CheckCircle className="h-3 w-3" /> Confirm
            </Button>
          )}
          {onReject && (
            <Button size="sm" variant="destructive" className="gap-1" onClick={onReject} disabled={processing}>
              <XCircle className="h-3 w-3" /> Reject
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const statusColor = (s: string) => {
  if (s === "confirmed") return "default";
  if (s === "payment_submitted") return "secondary";
  if (s === "expired") return "destructive";
  return "outline";
};

export default AdminDashboard;
