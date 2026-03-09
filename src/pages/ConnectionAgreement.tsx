import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Upload, Copy, ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type PlatformSettings = Record<string, string>;

const ConnectionAgreement = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"agree" | "payment" | "submitted" | "connected">("agree");
  const [studentName, setStudentName] = useState("");
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [monthlyRate, setMonthlyRate] = useState("");
  const [subject, setSubject] = useState("");
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingConnection, setExistingConnection] = useState<any>(null);
  const [tutorProfileId, setTutorProfileId] = useState<string | null>(null);

  const commissionRate = parseInt(settings.commission_rate || "25") / 100;
  const minRate = parseInt(settings.min_monthly_rate || "500");
  const maxRate = parseInt(settings.max_monthly_rate || "20000");
  const rate = parseInt(monthlyRate) || 0;
  const platformFee = Math.round((rate * commissionRate) / 10) * 10;

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchData();
  }, [user, conversationId]);

  const fetchData = async () => {
    if (!user || !conversationId) return;

    // Fetch platform settings
    const { data: settingsData } = await supabase
      .from("platform_settings")
      .select("key, value");
    if (settingsData) {
      const s: PlatformSettings = {};
      settingsData.forEach((r: any) => { s[r.key] = r.value; });
      setSettings(s);
    }

    // Fetch conversation to get student info
    const { data: convo } = await supabase
      .from("conversations")
      .select("student_id, tutor_id")
      .eq("id", conversationId)
      .single();

    if (!convo) { navigate("/messages"); return; }
    setStudentId(convo.student_id);
    setTutorProfileId(convo.tutor_id);

    // Get student profile
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", convo.student_id)
      .single();
    if (studentProfile) {
      setStudentName(studentProfile.full_name || "Student");
      setStudentAvatar(studentProfile.avatar_url);
    }

    // Get tutor subjects
    const { data: tp } = await supabase
      .from("tutor_profiles")
      .select("subjects, id")
      .eq("user_id", user.id)
      .single();
    if (tp) {
      setTutorSubjects(tp.subjects || []);
      setTutorProfileId(tp.id);
    }

    // Check existing connection
    const { data: existing } = await supabase
      .from("tutor_student_connections")
      .select("*")
      .eq("tutor_user_id", user.id)
      .eq("student_id", convo.student_id)
      .single();

    if (existing) {
      setExistingConnection(existing);
      setConnectionId(existing.id);
      setMonthlyRate(existing.monthly_rate?.toString() || "");
      setSubject(existing.subject || "");
      if (existing.status === "confirmed") setStep("connected");
      else if (existing.status === "payment_submitted") setStep("submitted");
      else if (existing.payment_screenshot_url) setStep("payment");
    }
  };

  const handleAgree = async () => {
    if (!user || !studentId || !tutorProfileId || rate < minRate || rate > maxRate || !subject) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("tutor_student_connections")
      .upsert({
        ...(connectionId ? { id: connectionId } : {}),
        tutor_profile_id: tutorProfileId,
        tutor_user_id: user.id,
        student_id: studentId,
        subject,
        monthly_rate: rate,
        platform_fee: platformFee,
        status: "pending",
      }, { onConflict: "tutor_user_id,student_id" })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setConnectionId(data.id);
      setStep("payment");
    }
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !connectionId) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${connectionId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    setScreenshotUrl(path);
    setUploading(false);
    toast({ title: "Screenshot uploaded!" });
  };

  const handleSubmitPayment = async () => {
    if (!connectionId || !screenshotUrl) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("tutor_student_connections")
      .update({
        payment_screenshot_url: screenshotUrl,
        status: "payment_submitted",
      })
      .eq("id", connectionId);

    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Notify admin (insert notification for all admin-role users would need service role)
    // For now, the admin checks the dashboard
    setStep("submitted");
    toast({ title: "Payment submitted for verification!" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  const initials = studentName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-lg">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/messages")}>
          <ArrowLeft className="h-4 w-4" /> Back to Messages
        </Button>

        {/* Step: Agree */}
        {step === "agree" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <h1 className="font-display text-xl font-bold text-foreground">Connect with Student</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Set the agreed monthly rate to unlock contact details
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/40">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={studentAvatar || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{studentName}</p>
                  <p className="text-xs text-muted-foreground">Contact hidden until fee is paid</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {tutorSubjects.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Agreed Monthly Rate (NPR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">रू</span>
                    <Input
                      type="number"
                      value={monthlyRate}
                      onChange={e => setMonthlyRate(e.target.value)}
                      className="pl-8"
                      placeholder={`${minRate} – ${maxRate}`}
                      min={minRate}
                      max={maxRate}
                    />
                  </div>
                  {rate > 0 && (rate < minRate || rate > maxRate) && (
                    <p className="text-xs text-destructive">
                      Rate must be between रू {minRate.toLocaleString()} and रू {maxRate.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {rate >= minRate && rate <= maxRate && (
                <div className="p-4 rounded-lg border-2 border-primary/20 bg-accent/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly rate</span>
                    <span className="font-medium text-foreground">रू {rate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">One-time platform fee ({settings.commission_rate || 25}%)</span>
                    <span className="font-bold text-primary">रू {platformFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">You keep every month</span>
                    <span className="font-bold text-foreground">रू {rate.toLocaleString()} ✅</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                disabled={!subject || rate < minRate || rate > maxRate || submitting}
                onClick={handleAgree}
              >
                {submitting ? "Processing…" : "Agree & Pay Fee"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                ⚠️ This is a one-time fee only. No further charges for this student ever.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h1 className="font-display text-xl font-bold text-foreground">One Step Away From Connecting!</h1>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-muted/40 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium text-foreground">{studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agreed Monthly Rate</span>
                  <span className="font-medium text-foreground">रू {rate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">One-time Platform Fee ({settings.commission_rate || 25}%)</span>
                  <span className="text-primary">रू {platformFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border-2 border-border space-y-3">
                <p className="text-sm font-medium text-foreground text-center">
                  Send रू {platformFee.toLocaleString()} to one of these accounts:
                </p>

                <div className="grid gap-3">
                  {settings.esewa_number && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">eSewa</p>
                        <p className="font-mono font-bold text-foreground">{settings.esewa_number}</p>
                        <p className="text-xs text-muted-foreground">Name: {settings.payment_name || "TutorConnect"}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => copyToClipboard(settings.esewa_number)}
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                  )}

                  {settings.khalti_number && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Khalti</p>
                        <p className="font-mono font-bold text-foreground">{settings.khalti_number}</p>
                        <p className="text-xs text-muted-foreground">Name: {settings.payment_name || "TutorConnect"}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => copyToClipboard(settings.khalti_number)}
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Please submit your screenshot within 48 hours to avoid expiry.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Payment Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadScreenshot}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                    file:text-sm file:font-medium file:bg-accent file:text-accent-foreground
                    hover:file:bg-accent/80 cursor-pointer"
                />
                {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
                {screenshotUrl && <p className="text-xs text-primary">✓ Screenshot ready</p>}
              </div>

              <Button
                className="w-full"
                disabled={!screenshotUrl || submitting}
                onClick={handleSubmitPayment}
              >
                {submitting ? "Submitting…" : "Submit & Unlock Student Contact"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                ⚠️ This is a one-time fee only. No further charges for this student ever.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step: Submitted / Awaiting admin */}
        {step === "submitted" && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-accent">
                  <Clock className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Payment Under Review</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  We're verifying your payment. You'll be notified once confirmed — usually within a few hours.
                </p>
              </div>
              {existingConnection?.admin_note && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-destructive">{existingConnection.admin_note}</p>
                  </div>
                </div>
              )}
              <Button variant="outline" onClick={() => navigate("/tutor/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Connected */}
        {step === "connected" && (
          <ConnectedView
            connectionId={connectionId!}
            studentId={studentId!}
            studentName={studentName}
            studentAvatar={studentAvatar}
            subject={subject || existingConnection?.subject}
            monthlyRate={rate || existingConnection?.monthly_rate}
            confirmedAt={existingConnection?.confirmed_at}
            conversationId={conversationId!}
          />
        )}
      </main>
    </div>
  );
};

const ConnectedView = ({
  connectionId, studentId, studentName, studentAvatar, subject, monthlyRate, confirmedAt, conversationId
}: {
  connectionId: string; studentId: string; studentName: string; studentAvatar: string | null;
  subject: string; monthlyRate: number; confirmedAt: string; conversationId: string;
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchContact = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("phone, email")
        .eq("user_id", studentId)
        .single();
      if (data) {
        setPhone(data.phone || "Not provided");
        setEmail(data.email || "Not provided");
      }
    };
    fetchContact();
  }, [studentId]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  const initials = studentName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="p-4 rounded-full bg-accent">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">You're Connected! ✅</h1>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/40">
          <Avatar className="h-12 w-12">
            <AvatarImage src={studentAvatar || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{studentName}</p>
            <p className="text-sm text-muted-foreground">{subject} · रू {monthlyRate?.toLocaleString()}/month</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-xs text-muted-foreground">📞 Phone</p>
              <p className="font-medium text-foreground">{phone}</p>
            </div>
            {phone !== "Not provided" && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => copy(phone)}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-xs text-muted-foreground">📧 Email</p>
              <p className="font-medium text-foreground">{email}</p>
            </div>
            {email !== "Not provided" && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => copy(email)}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
            )}
          </div>
        </div>

        {confirmedAt && (
          <p className="text-xs text-muted-foreground text-center">
            Connected since {format(new Date(confirmedAt), "MMM d, yyyy")}
          </p>
        )}

        <Button className="w-full" onClick={() => navigate(`/messages?conversation=${conversationId}`)}>
          Continue Chatting
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionAgreement;
