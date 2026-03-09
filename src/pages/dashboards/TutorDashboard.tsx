import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  MessageCircle,
  Star,
  Settings,
  Users,
  DollarSign,
  Plus,
  Trash2,
  UserCheck,
  Hourglass,
  Copy,
  Calculator,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Booking = {
  id: string;
  student_id: string;
  date: string;
  start_time: string;
  duration: number;
  subject: string;
  status: string;
  price: number;
  student_name?: string;
  student_avatar?: string | null;
};

type ReviewItem = {
  id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student_name?: string;
  student_avatar?: string | null;
};

type AvailSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "students", label: "My Students", icon: UserCheck },
  { id: "sessions", label: "Sessions", icon: Calendar },
  { id: "availability", label: "Availability", icon: Clock },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7;
  return { value: `${h.toString().padStart(2, "0")}:00`, label: `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}` };
});

const ALL_SUBJECTS = ["Math", "Science", "English", "History", "Coding", "Music", "Languages", "Test Prep"];

const fmtTime = (t: string) => {
  const h = parseInt(t.split(":")[0], 10);
  return `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
};

const enrichBookingsWithStudents = async (bookings: any[]): Promise<Booking[]> => {
  if (bookings.length === 0) return [];
  const sids = [...new Set(bookings.map((b: any) => b.student_id))];
  const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", sids);
  const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);
  return bookings.map((b: any) => ({
    ...b,
    student_name: pm.get(b.student_id)?.full_name || "Student",
    student_avatar: pm.get(b.student_id)?.avatar_url,
  }));
};

const TutorDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [tutorProfile, setTutorProfile] = useState<any>(null);

  // Sessions
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);

  // Availability
  const [availSlots, setAvailSlots] = useState<AvailSlot[]>([]);
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  // Reviews
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // Settings
  const [settingsName, setSettingsName] = useState("");
  const [settingsBio, setSettingsBio] = useState("");
  const [settingsRate, setSettingsRate] = useState("");
  const [settingsSubjects, setSettingsSubjects] = useState<string[]>([]);
  const [settingsSession, setSettingsSession] = useState("online");
  const [saving, setSaving] = useState(false);

  // Stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tutor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setTutorProfile(data);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !tutorProfile) return;
    if (activeTab === "overview" || activeTab === "sessions") fetchSessions();
    if (activeTab === "availability") fetchAvailability();
    if (activeTab === "reviews") fetchReviews();
    if (activeTab === "settings") loadSettings();
    if (activeTab === "messages") navigate("/messages");
  }, [activeTab, user, tutorProfile]);

  const fetchSessions = async () => {
    if (!tutorProfile) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const [{ data: u }, { data: p }] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .eq("tutor_id", tutorProfile.id)
        .in("status", ["confirmed", "pending_payment"])
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("bookings")
        .select("*")
        .eq("tutor_id", tutorProfile.id)
        .in("status", ["completed", "cancelled"])
        .order("date", { ascending: false })
        .limit(20),
    ]);
    setUpcoming(await enrichBookingsWithStudents(u || []));
    setPast(await enrichBookingsWithStudents(p || []));
    const completed = (p || []).filter((b) => b.status === "completed");
    setTotalStudents(new Set((u || []).concat(completed).map((b) => b.student_id)).size);
    setTotalEarnings(completed.reduce((s, b) => s + (b.price || 0), 0));
  };

  const fetchAvailability = async () => {
    if (!tutorProfile) return;
    const { data } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("tutor_id", tutorProfile.id)
      .order("day_of_week", { ascending: true });
    setAvailSlots((data as AvailSlot[]) || []);
  };

  const addAvailability = async () => {
    if (!tutorProfile) return;
    await supabase.from("tutor_availability").insert({
      tutor_id: tutorProfile.id,
      day_of_week: parseInt(newDay),
      start_time: newStart,
      end_time: newEnd,
    });
    toast({ title: "Availability added" });
    fetchAvailability();
  };

  const removeAvailability = async (id: string) => {
    await supabase.from("tutor_availability").delete().eq("id", id);
    toast({ title: "Slot removed" });
    fetchAvailability();
  };

  const fetchReviews = async () => {
    if (!tutorProfile) return;
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("tutor_id", tutorProfile.id)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const sids = [...new Set(data.map((r: any) => r.student_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", sids);
      const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);
      setReviews(
        data.map((r: any) => ({
          ...r,
          student_name: pm.get(r.student_id)?.full_name || "Student",
          student_avatar: pm.get(r.student_id)?.avatar_url,
        }))
      );
    } else {
      setReviews([]);
    }
  };

  const loadSettings = () => {
    setSettingsName(profile?.full_name || "");
    setSettingsBio(tutorProfile?.bio || "");
    setSettingsRate(tutorProfile?.hourly_rate?.toString() || "");
    setSettingsSubjects(tutorProfile?.subjects || []);
    setSettingsSession(tutorProfile?.session_type || "online");
  };

  const saveSettings = async () => {
    if (!user || !tutorProfile) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: settingsName }).eq("user_id", user.id);
    await supabase
      .from("tutor_profiles")
      .update({
        bio: settingsBio || null,
        hourly_rate: settingsRate ? parseFloat(settingsRate) : null,
        subjects: settingsSubjects,
        session_type: settingsSession as any,
      })
      .eq("id", tutorProfile.id);
    await refreshProfile();
    setTutorProfile({ ...tutorProfile, bio: settingsBio, hourly_rate: parseFloat(settingsRate), subjects: settingsSubjects, session_type: settingsSession });
    setSaving(false);
    toast({ title: "Settings saved!" });
  };

  const cancelBooking = async (id: string) => {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    toast({ title: "Session cancelled" });
    fetchSessions();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border min-h-[calc(100vh-4rem)] p-4 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background">
          <div className="flex">
            {TABS.slice(0, 5).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="max-w-4xl space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Welcome back, {profile?.full_name || "Tutor"}! 👋
                </h1>
                <p className="mt-1 text-muted-foreground text-sm">
                  {tutorProfile?.status === "approved"
                    ? "Your profile is live — students can find and book you."
                    : "Your profile is pending approval."}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Upcoming", value: upcoming.length, icon: Calendar },
                  { label: "Students", value: totalStudents, icon: Users },
                  { label: "Earnings", value: `$${totalEarnings}`, icon: DollarSign },
                  { label: "Rating", value: tutorProfile?.rating?.toFixed(1) || "—", icon: Star },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent">
                        <s.icon className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {upcoming.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Next Session</CardTitle></CardHeader>
                  <CardContent>
                    {(() => {
                      const s = upcoming[0];
                      return (
                        <div className="flex items-center gap-4 flex-wrap">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={s.student_avatar || undefined} />
                            <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                              {(s.student_name || "S")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{s.student_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {s.subject} · {format(new Date(s.date), "EEE, MMM d")} at {fmtTime(s.start_time)}
                            </p>
                          </div>
                          <Badge variant={s.status === "confirmed" ? "default" : "secondary"}>
                            {s.status}
                          </Badge>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* SESSIONS */}
          {activeTab === "sessions" && (
            <div className="max-w-4xl">
              <h2 className="font-display text-xl font-bold mb-4 text-foreground">My Sessions</h2>
              <Tabs defaultValue="upcoming">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
                  <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="space-y-3 mt-4">
                  {upcoming.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No upcoming sessions.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    upcoming.map((s) => (
                      <Card key={s.id}>
                        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={s.student_avatar || undefined} />
                            <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                              {(s.student_name || "S")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{s.student_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {s.subject} · {format(new Date(s.date), "EEE, MMM d")} · {fmtTime(s.start_time)} · {s.duration}min
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => cancelBooking(s.id)}>Cancel</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
                <TabsContent value="past" className="space-y-3 mt-4">
                  {past.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No past sessions yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    past.map((s) => (
                      <Card key={s.id}>
                        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={s.student_avatar || undefined} />
                            <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                              {(s.student_name || "S")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{s.student_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {s.subject} · {format(new Date(s.date), "MMM d, yyyy")} · ${s.price}
                            </p>
                          </div>
                          <Badge variant={s.status === "completed" ? "default" : "secondary"}>
                            {s.status}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* AVAILABILITY */}
          {activeTab === "availability" && (
            <div className="max-w-2xl space-y-6">
              <h2 className="font-display text-xl font-bold text-foreground">Manage Availability</h2>
              <Card>
                <CardHeader><CardTitle className="text-base">Add Time Slot</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Day</label>
                      <Select value={newDay} onValueChange={setNewDay}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAY_NAMES.map((d, i) => (
                            <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Start</label>
                      <Select value={newStart} onValueChange={setNewStart}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {HOUR_OPTIONS.map((h) => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">End</label>
                      <Select value={newEnd} onValueChange={setNewEnd}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {HOUR_OPTIONS.map((h) => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={addAvailability} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Slot
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Current Schedule</CardTitle></CardHeader>
                <CardContent>
                  {availSlots.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No availability set. Add your first time slot above.</p>
                  ) : (
                    <div className="space-y-2">
                      {availSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <span className="font-medium text-foreground">{DAY_NAMES[slot.day_of_week]}</span>
                            <span className="text-muted-foreground ml-2 text-sm">
                              {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                            </span>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removeAvailability(slot.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === "reviews" && (
            <div className="max-w-3xl space-y-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                Student Reviews ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No reviews yet. They'll appear here once students rate your sessions.</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={r.student_avatar || undefined} />
                          <AvatarFallback className="bg-muted text-xs">{(r.student_name || "S")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground text-sm">{r.student_name}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                          {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <h2 className="font-display text-xl font-bold text-foreground">Profile Settings</h2>
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
                    <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Bio</label>
                    <Textarea
                      value={settingsBio}
                      onChange={(e) => setSettingsBio(e.target.value)}
                      rows={4}
                      placeholder="Tell students about your teaching style..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Hourly Rate ($)</label>
                    <Input
                      type="number"
                      value={settingsRate}
                      onChange={(e) => setSettingsRate(e.target.value)}
                      min={5}
                      max={500}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Session Type</label>
                    <Select value={settingsSession} onValueChange={setSettingsSession}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in_person">In-Person</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Subjects</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SUBJECTS.map((s) => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={settingsSubjects.includes(s)}
                            onCheckedChange={(checked) => {
                              setSettingsSubjects((prev) =>
                                checked ? [...prev, s] : prev.filter((x) => x !== s)
                              );
                            }}
                          />
                          <span className="text-sm">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TutorDashboard;
