import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = { invokeAdmin: (action: string, params?: any) => Promise<any> };

const AdminSettingsTab = ({ invokeAdmin }: Props) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("platform_settings").select("key, value");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setSettings(map);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const update = (key: string, value: string) => {
    setSettings((p) => ({ ...p, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await invokeAdmin("update_settings", { settings });
      toast({ title: "Settings saved!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const cities = (settings.cities_served || "").split(",").filter(Boolean);
  const subjects = (settings.subjects_offered || "").split(",").filter(Boolean);

  const addCity = () => {
    if (!newCity.trim()) return;
    const updated = [...cities, newCity.trim()].join(",");
    update("cities_served", updated);
    setNewCity("");
  };
  const removeCity = (city: string) => {
    update("cities_served", cities.filter((c) => c !== city).join(","));
  };

  const addSubject = () => {
    if (!newSubject.trim()) return;
    const updated = [...subjects, newSubject.trim()].join(",");
    update("subjects_offered", updated);
    setNewSubject("");
  };
  const removeSubject = (sub: string) => {
    update("subjects_offered", subjects.filter((s) => s !== sub).join(","));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Platform Settings</h1>

      {/* Commission */}
      <Card>
        <CardHeader><CardTitle className="text-base">Commission Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "commission_rate", label: "Finder's Fee (%)", type: "number" },
            { key: "connection_expiry_hours", label: "Connection Expiry (hours)", type: "number" },
            { key: "message_limit", label: "Message Limit Before Fee", type: "number" },
            { key: "min_monthly_rate", label: "Min Monthly Rate (रू)", type: "number" },
            { key: "max_monthly_rate", label: "Max Monthly Rate (रू)", type: "number" },
          ].map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-foreground">{f.label}</label>
              <Input type={f.type} value={settings[f.key] || ""} onChange={(e) => update(f.key, e.target.value)} className="w-32 text-right" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Platform Payment Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "esewa_number", label: "eSewa Number" },
            { key: "khalti_number", label: "Khalti Number" },
            { key: "payment_name", label: "Payment Name" },
          ].map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-sm font-medium text-foreground">{f.label}</label>
              <Input value={settings[f.key] || ""} onChange={(e) => update(f.key, e.target.value)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Notification Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Admin Email</label>
            <Input value={settings.admin_email || ""} onChange={(e) => update("admin_email", e.target.value)} />
          </div>
          {[
            { key: "sms_notifications", label: "SMS Notifications (Sparrow SMS)" },
            { key: "auto_reminder_24hr", label: "Auto-Reminder After 24hrs Pending" },
            { key: "auto_expire_connections", label: "Auto-Expire After 48hrs" },
          ].map((f) => (
            <div key={f.key} className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{f.label}</label>
              <Switch
                checked={settings[f.key] === "true"}
                onCheckedChange={(v) => update(f.key, v ? "true" : "false")}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Platform Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "platform_name", label: "Platform Name" },
            { key: "support_email", label: "Support Email" },
            { key: "support_phone", label: "Support Phone" },
          ].map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-sm font-medium text-foreground">{f.label}</label>
              <Input value={settings[f.key] || ""} onChange={(e) => update(f.key, e.target.value)} />
            </div>
          ))}

          <Separator />

          {/* Cities */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cities Served</label>
            <div className="flex flex-wrap gap-1">
              {cities.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1 pr-1">
                  {c}
                  <button onClick={() => removeCity(c)} className="hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add city..." value={newCity} onChange={(e) => setNewCity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCity()} className="flex-1" />
              <Button size="sm" variant="outline" onClick={addCity}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <Separator />

          {/* Subjects */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subjects Offered</label>
            <div className="flex flex-wrap gap-1">
              {subjects.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pr-1">
                  {s}
                  <button onClick={() => removeSubject(s)} className="hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add subject..." value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubject()} className="flex-1" />
              <Button size="sm" variant="outline" onClick={addSubject}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Maintenance Mode</label>
            <Switch
              checked={settings.maintenance_mode === "true"}
              onCheckedChange={(v) => update("maintenance_mode", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tutor Approval */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tutor Approval</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Auto-Approve Tutors</label>
              <p className="text-xs text-muted-foreground">Manual review recommended for early stage</p>
            </div>
            <Switch
              checked={settings.auto_approve_tutors === "true"}
              onCheckedChange={(v) => update("auto_approve_tutors", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full" size="lg">
        {saving ? "Saving…" : "Save All Settings"}
      </Button>
    </div>
  );
};

export default AdminSettingsTab;
