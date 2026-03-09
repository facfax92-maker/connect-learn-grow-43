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
import {
  LayoutDashboard,
  Calendar,
  Heart,
  MessageCircle,
  Star,
  Settings,
  Search,
  Clock,
  BookOpen,
  X,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type Booking = {
  id: string;
  tutor_id: string;
  date: string;
  start_time: string;
  duration: number;
  subject: string;
  status: string;
  price: number;
  tutor_name?: string;
  tutor_avatar?: string | null;
};

type Review = {
  id: string;
  tutor_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  tutor_name?: string;
};

type SavedTutor = {
  id: string;
  subjects: string[] | null;
  hourly_rate: number | null;
  rating: number | null;
  profile_name?: string;
  profile_avatar?: string | null;
};

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sessions", label: "Sessions", icon: Calendar },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

const GRADE_LEVELS = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "university", label: "University" },
  { value: "adult_learner", label: "Adult Learner" },
];

const ALL_SUBJECTS = [
  "Math",
  "Science",
  "English",
  "History",
  "Coding",
  "Music",
  "Languages",
  "Test Prep",
];

const fmtTime = (t: string) => {
  const h = parseInt(t.split(":")[0], 10);
  return `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
};

const enrichBookings = async (bookings: any[]): Promise<Booking[]> => {
  if (bookings.length === 0) return [];
  const tutorIds = [...new Set(bookings.map((b) => b.tutor_id))];
  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id, user_id")
    .in("id", tutorIds);
  const userIds = tp?.map((t: any) => t.user_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, avatar_url")
    .in("user_id", userIds);
  const tuMap = new Map(tp?.map((t: any) => [t.id, t.user_id]) || []);
  const prMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);
  return bookings.map((b) => {
    const uid = tuMap.get(b.tutor_id);
    const pr = uid ? prMap.get(uid) : null;
    return {
      ...b,
      tutor_name: pr?.full_name || "Tutor",
      tutor_avatar: pr?.avatar_url,
    };
  });
};

const StudentDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [savedTutors, setSavedTutors] = useState<SavedTutor[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [editReviewId, setEditReviewId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [settingsName, setSettingsName] = useState("");
  const [settingsGrade, setSettingsGrade] = useState("");
  const [settingsSubjects, setSettingsSubjects] = useState<string[]>([]);
  const [settingsGoals, setSettingsGoals] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSavedIds(JSON.parse(localStorage.getItem("savedTutors") || "[]"));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "overview" || activeTab === "sessions") fetchSessions();
    if (activeTab === "saved") fetchSavedTutors();
    if (activeTab === "reviews") fetchReviews();
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "messages") navigate("/messages");
  }, [activeTab, user]);

  const fetchSessions = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const [{ data: u }, { data: p }] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .eq("student_id", user.id)
        .in("status", ["confirmed", "pending_payment"])
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("bookings")
        .select("*")
        .eq("student_id", user.id)
        .in("status", ["completed", "cancelled"])
        .order("date", { ascending: false })
        .limit(20),
    ]);
    setUpcoming(await enrichBookings(u || []));
    setPast(await enrichBookings(p || []));
    const done = (p || []).filter((b) => b.status === "completed");
    setTotalCompleted(done.length);
    setTotalHours(done.reduce((s, b) => s + (b.duration || 0), 0) / 60);
  };

  const fetchSavedTutors = async () => {
    const ids = JSON.parse(localStorage.getItem("savedTutors") || "[]");
    if (ids.length === 0) {
      setSavedTutors([]);
      return;
    }
    const { data: tutors } = await supabase
      .from("tutor_profiles")
      .select("id, user_id, subjects, hourly_rate, rating")
      .in("id", ids)
      .eq("status", "approved");
    if (tutors && tutors.length > 0) {
      const uids = tutors.map((t: any) => t.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", uids);
      const pm = new Map(profs?.map((p: any) => [p.user_id, p]) || []);
      setSavedTutors(
        tutors.map((t: any) => ({
          ...t,
          profile_name: pm.get(t.user_id)?.full_name || "Tutor",
          profile_avatar: pm.get(t.user_id)?.avatar_url,
        }))
      );
    } else {
      setSavedTutors([]);
    }
  };

  const fetchReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const tids = [...new Set(data.map((r: any) => r.tutor_id))];
      const { data: tp } = await supabase
        .from("tutor_profiles")
        .select("id, user_id")
        .in("id", tids);
      const uids = tp?.map((t: any) => t.user_id) || [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", uids);
      const tuMap = new Map(tp?.map((t: any) => [t.id, t.user_id]) || []);
      const prMap = new Map(profs?.map((p: any) => [p.user_id, p]) || []);
      setMyReviews(
        data.map((r: any) => ({
          ...r,
          tutor_name:
            prMap.get(tuMap.get(r.tutor_id) || "")?.full_name || "Tutor",
        }))
      );
    } else {
      setMyReviews([]);
    }
  };

  const fetchSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setSettingsGrade(data.grade_level || "");
      setSettingsSubjects(data.subjects || []);
      setSettingsGoals(data.learning_goals || "");
    }
    setSettingsName(profile?.full_name || "");
  };

  const removeSaved = (id: string) => {
    const next = savedIds.filter((x) => x !== id);
    setSavedIds(next);
    localStorage.setItem("savedTutors", JSON.stringify(next));
    setSavedTutors((p) => p.filter((t) => t.id !== id));
  };

  const cancelBooking = async (id: string) => {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    toast({ title: "Booking cancelled" });
    fetchSessions();
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ full_name: settingsName })
      .eq("user_id", user.id);
    await supabase
      .from("student_profiles")
      .update({
        grade_level: (settingsGrade || null) as any,
        subjects: settingsSubjects,
        learning_goals: settingsGoals || null,
      })
      .eq("user_id", user.id);
    await refreshProfile();
    setSaving(false);
    toast({ title: "Settings saved!" });
  };

  const updateReview = async () => {
    if (!editReviewId) return;
    await supabase
      .from("reviews")
      .update({ rating: editRating, comment: editComment })
      .eq("id", editReviewId);
    setEditReviewId(null);
    fetchReviews();
    toast({ title: "Review updated" });
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
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              <div className="p-6 rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground">
                <h1 className="font-display text-2xl font-bold">
                  Welcome back, {profile?.full_name || "Student"}! 👋
                </h1>
                <p className="mt-1 text-secondary-foreground/80 text-sm">
                  Ready to learn something new today?
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Upcoming",
                    value: upcoming.length,
                    icon: Calendar,
                  },
                  {
                    label: "Completed",
                    value: totalCompleted,
                    icon: BookOpen,
                  },
                  {
                    label: "Saved Tutors",
                    value: savedIds.length,
                    icon: Heart,
                  },
                  {
                    label: "Hours Learned",
                    value: Math.round(totalHours * 10) / 10,
                    icon: Clock,
                  },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent">
                        <s.icon className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {s.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {upcoming.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next Session</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const s = upcoming[0];
                      return (
                        <div className="flex items-center gap-4 flex-wrap">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={s.tutor_avatar || undefined}
                            />
                            <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                              {(s.tutor_name || "T")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {s.tutor_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {s.subject} ·{" "}
                              {format(new Date(s.date), "EEE, MMM d")} at{" "}
                              {fmtTime(s.start_time)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelBooking(s.id)}
                            >
                              Cancel
                            </Button>
                            <Button size="sm">Join Session</Button>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <Link to="/tutors">
                <Button className="gap-2" size="lg">
                  <Search className="h-4 w-4" /> Find a Tutor
                </Button>
              </Link>
            </div>
          )}

          {/* SESSIONS */}
          {activeTab === "sessions" && (
            <div className="max-w-4xl">
              <h2 className="font-display text-xl font-bold mb-4 text-foreground">
                My Sessions
              </h2>
              <Tabs defaultValue="upcoming">
                <TabsList>
                  <TabsTrigger value="upcoming">
                    Upcoming ({upcoming.length})
                  </TabsTrigger>
                  <TabsTrigger value="past">
                    Past ({past.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="space-y-3 mt-4">
                  {upcoming.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          No upcoming sessions.
                        </p>
                        <Link to="/tutors">
                          <Button size="sm" className="mt-3">
                            Find a Tutor
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    upcoming.map((s) => (
                      <Card key={s.id}>
                        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={s.tutor_avatar || undefined}
                            />
                            <AvatarFallback className="bg-muted text-sm">
                              {(s.tutor_name || "T")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">
                              {s.tutor_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {s.subject} ·{" "}
                              {format(new Date(s.date), "MMM d")} ·{" "}
                              {fmtTime(s.start_time)} · {s.duration}min
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelBooking(s.id)}
                          >
                            Cancel
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
                <TabsContent value="past" className="space-y-3 mt-4">
                  {past.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No past sessions.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    past.map((s) => (
                      <Card key={s.id}>
                        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={s.tutor_avatar || undefined}
                            />
                            <AvatarFallback className="bg-muted text-sm">
                              {(s.tutor_name || "T")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">
                              {s.tutor_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {s.subject} ·{" "}
                              {format(new Date(s.date), "MMM d")} · $
                              {s.price}
                            </p>
                            <Badge
                              variant={
                                s.status === "completed"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs mt-1"
                            >
                              {s.status}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/tutors/${s.tutor_id}`)}
                          >
                            Book Again
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* SAVED TUTORS */}
          {activeTab === "saved" && (
            <div className="max-w-4xl">
              <h2 className="font-display text-xl font-bold mb-4 text-foreground">
                Saved Tutors
              </h2>
              {savedTutors.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No saved tutors yet.
                    </p>
                    <Link to="/tutors">
                      <Button size="sm" className="mt-3">
                        Browse Tutors
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedTutors.map((t) => (
                    <Card key={t.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={t.profile_avatar || undefined}
                            />
                            <AvatarFallback className="bg-accent text-xs font-bold">
                              {(t.profile_name || "T")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {t.profile_name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span>{t.rating || "New"}</span>
                              <span>· ${t.hourly_rate}/hr</span>
                            </div>
                          </div>
                        </div>
                        {t.subjects && (
                          <div className="flex flex-wrap gap-1">
                            {t.subjects.slice(0, 3).map((s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/tutors/${t.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeSaved(t.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === "reviews" && (
            <div className="max-w-4xl">
              <h2 className="font-display text-xl font-bold mb-4 text-foreground">
                My Reviews
              </h2>
              {myReviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      You haven&apos;t written any reviews yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {myReviews.map((r) => (
                    <Card key={r.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {r.tutor_name}
                            </p>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i <= r.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            {r.comment && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {r.comment}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(
                                new Date(r.created_at),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditReviewId(r.id);
                              setEditComment(r.comment || "");
                              setEditRating(r.rating);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <Dialog
                open={!!editReviewId}
                onOpenChange={() => setEditReviewId(null)}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Review</DialogTitle>
                    <DialogDescription>
                      Update your rating and comment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} onClick={() => setEditRating(i)}>
                          <Star
                            className={`h-6 w-6 ${
                              i <= editRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      placeholder="Update your review..."
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEditReviewId(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={updateReview}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-lg space-y-6">
              <h2 className="font-display text-xl font-bold text-foreground">
                Settings
              </h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Profile</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Full Name
                      </label>
                      <Input
                        value={settingsName}
                        onChange={(e) => setSettingsName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Grade Level
                      </label>
                      <Select
                        value={settingsGrade}
                        onValueChange={setSettingsGrade}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_LEVELS.map((g) => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Subjects
                      </label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {ALL_SUBJECTS.map((s) => (
                          <Badge
                            key={s}
                            variant={
                              settingsSubjects.includes(s)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer text-xs"
                            onClick={() =>
                              setSettingsSubjects((prev) =>
                                prev.includes(s)
                                  ? prev.filter((x) => x !== s)
                                  : [...prev, s]
                              )
                            }
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Learning Goals
                      </label>
                      <Textarea
                        value={settingsGoals}
                        onChange={(e) => setSettingsGoals(e.target.value)}
                        placeholder="What do you want to achieve?"
                        className="resize-none"
                      />
                    </div>
                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-destructive mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Deleting your account is permanent and cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
              <Dialog
                open={showDeleteModal}
                onOpenChange={setShowDeleteModal}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account</DialogTitle>
                    <DialogDescription>
                      Are you sure? This cannot be undone. All your data will
                      be permanently deleted.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        toast({
                          title: "Account deletion requested",
                          description:
                            "Please contact support to complete the process.",
                        });
                        setShowDeleteModal(false);
                      }}
                    >
                      Yes, Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
