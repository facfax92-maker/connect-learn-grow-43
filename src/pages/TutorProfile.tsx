import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Star, BadgeCheck, Heart, MapPin,
  ChevronLeft, ChevronRight, MessageCircle,
  GraduationCap, Video, Flag,
} from "lucide-react";
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  isSameDay, isBefore, startOfDay,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

type TutorData = {
  id: string;
  user_id: string;
  bio: string | null;
  subjects: string[] | null;
  hourly_rate: number | null;
  session_type: string | null;
  education_degree: string | null;
  education_university: string | null;
  graduation_year: number | null;
  certification_urls: string[] | null;
  languages: string[] | null;
  rating: number | null;
  review_count: number | null;
  status: string;
};

type ProfileData = {
  full_name: string | null;
  avatar_url: string | null;
};

type ReviewWithProfile = {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  tutor_reply: string | null;
  reply_at: string | null;
  flagged: boolean;
  created_at: string;
  student_id: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
};

type AvailabilitySlot = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type BookedSlot = {
  slot_date: string;
  slot_time: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const REVIEWS_PER_PAGE = 5;

const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  const startHour = parseInt(startTime.split(":")[0], 10);
  const endHour = parseInt(endTime.split(":")[0], 10);
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return slots;
};

const formatTime = (time: string): string => {
  const hour = parseInt(time.split(":")[0], 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}${ampm}`;
};

const StarRow = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) => {
  const cls = size === "sm" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
};

const TutorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);

  const enrichReviews = async (rawReviews: any[]) => {
    if (rawReviews.length === 0) return [] as ReviewWithProfile[];
    const ids = [...new Set(rawReviews.map((r) => r.student_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", ids);
    const pm = new Map((profilesData || []).map((p) => [p.user_id, p]));
    return rawReviews.map((r) => ({
      ...r,
      tags: r.tags || [],
      tutor_reply: r.tutor_reply || null,
      reply_at: r.reply_at || null,
      flagged: r.flagged || false,
      reviewer_name: pm.get(r.student_id)?.full_name ?? null,
      reviewer_avatar: pm.get(r.student_id)?.avatar_url ?? null,
    })) as ReviewWithProfile[];
  };

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: tutorData }, { data: reviewData, count }] = await Promise.all([
        supabase.from("tutor_profiles").select("*").eq("id", id).single(),
        supabase
          .from("reviews")
          .select("*", { count: "exact" })
          .eq("tutor_id", id)
          .order("created_at", { ascending: false })
          .range(0, REVIEWS_PER_PAGE - 1),
      ]);

      if (tutorData) {
        setTutor(tutorData as TutorData);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", tutorData.user_id)
          .single();
        if (profileData) setProfile(profileData as ProfileData);
      }

      if (reviewData && reviewData.length > 0) {
        const enriched = await enrichReviews(reviewData);
        setReviews(enriched);
        setReviewsOffset(REVIEWS_PER_PAGE);
      }
      setTotalReviews(count || 0);

      const { data: availData } = await supabase
        .from("tutor_availability")
        .select("day_of_week, start_time, end_time")
        .eq("tutor_id", id);
      if (availData) setAvailability(availData as AvailabilitySlot[]);

      setLoading(false);
    };
    fetchAll();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const weekEnd = addDays(currentWeekStart, 7);
    (supabase.rpc as unknown as (fn: string, args: object) => Promise<{ data: BookedSlot[] | null }>)(
      "get_tutor_booked_slots",
      {
        p_tutor_id: id,
        p_date_start: format(currentWeekStart, "yyyy-MM-dd"),
        p_date_end: format(weekEnd, "yyyy-MM-dd"),
      }
    ).then(({ data }) => {
      if (data) setBookedSlots(data);
    });
  }, [id, currentWeekStart]);

  const loadMoreReviews = async () => {
    if (!id) return;
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*")
      .eq("tutor_id", id)
      .order("created_at", { ascending: false })
      .range(reviewsOffset, reviewsOffset + REVIEWS_PER_PAGE - 1);
    if (reviewData && reviewData.length > 0) {
      const enriched = await enrichReviews(reviewData);
      setReviews((prev) => [...prev, ...enriched]);
      setReviewsOffset((o) => o + REVIEWS_PER_PAGE);
    }
  };

  const getSlotsForDay = (date: Date): string[] => {
    const dow = date.getDay();
    const dayAvail = availability.filter((a) => a.day_of_week === dow);
    const slots = new Set<string>();
    dayAvail.forEach((a) => generateTimeSlots(a.start_time, a.end_time).forEach((s) => slots.add(s)));
    return Array.from(slots).sort();
  };

  const isSlotBooked = (date: Date, time: string): boolean => {
    const ds = format(date, "yyyy-MM-dd");
    return bookedSlots.some(
      (b) => b.slot_date === ds && (b.slot_time || "").startsWith(time)
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const today = startOfDay(new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-xl text-muted-foreground">Tutor not found.</p>
          <Button onClick={() => navigate("/tutors")}>Browse Tutors</Button>
        </div>
      </div>
    );
  }

  const name = profile?.full_name || "Tutor";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex gap-8 lg:flex-row flex-col">
          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Header card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-5 flex-wrap sm:flex-nowrap">
                  <Avatar className="h-24 w-24 shrink-0 border-4 border-border shadow">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-2xl font-bold text-foreground">{name}</h1>
                      {tutor.status === "approved" && (
                        <span className="inline-flex items-center gap-1 bg-accent rounded-full px-2 py-0.5">
                          <BadgeCheck className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium text-primary">Verified</span>
                        </span>
                      )}
                    </div>
                    {tutor.subjects && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tutor.subjects.map((s) => (
                          <Badge key={s} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <StarRow rating={tutor.rating || 0} />
                      <span className="font-semibold text-sm text-foreground">
                        {tutor.rating?.toFixed(1) || "New"}
                      </span>
                      <span className="text-muted-foreground text-sm">({totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>
                        {tutor.session_type === "online"
                          ? "Online Only"
                          : tutor.session_type === "in_person"
                          ? "In-Person"
                          : "Online & In-Person"}
                      </span>
                    </div>
                    {tutor.languages && tutor.languages.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Teaches in:{" "}
                        <span className="font-medium text-foreground">{tutor.languages.join(", ")}</span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            {tutor.bio && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-3 text-foreground">About Me</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{tutor.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Subjects & Expertise */}
            {tutor.subjects && tutor.subjects.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-4 text-foreground">Subjects & Expertise</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tutor.subjects.map((subject) => (
                      <div
                        key={subject}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                      >
                        <span className="font-medium text-foreground">{subject}</span>
                        <Badge variant="outline" className="text-xs shrink-0">Advanced</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {(tutor.education_university || tutor.education_degree) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-4 text-foreground">Education & Credentials</h2>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-accent shrink-0">
                      <GraduationCap className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      {tutor.education_degree && (
                        <p className="font-semibold text-foreground">{tutor.education_degree}</p>
                      )}
                      {tutor.education_university && (
                        <p className="text-muted-foreground">{tutor.education_university}</p>
                      )}
                      {tutor.graduation_year && (
                        <p className="text-sm text-muted-foreground">Class of {tutor.graduation_year}</p>
                      )}
                    </div>
                  </div>
                  {tutor.certification_urls && tutor.certification_urls.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2 text-muted-foreground">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {tutor.certification_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <Badge
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              Certificate {i + 1} ↗
                            </Badge>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Video intro */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 text-foreground">Video Introduction</h2>
                <div className="flex flex-col items-center justify-center h-48 rounded-lg border-2 border-dashed border-border bg-muted/30 gap-3">
                  <Video className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">No intro video yet</p>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 text-foreground">
                  Reviews ({totalReviews})
                </h2>

                {totalReviews > 0 && reviews.length > 0 && (
                  <div className="flex gap-6 items-center mb-6 p-4 rounded-lg bg-muted/30">
                    <div className="text-center shrink-0">
                      <div className="text-4xl font-bold text-foreground">{tutor.rating?.toFixed(1)}</div>
                      <StarRow rating={tutor.rating || 0} size="xs" />
                      <div className="text-xs text-muted-foreground mt-1">Overall</div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {ratingBreakdown.map(({ star, count }) => (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-right text-muted-foreground">{star}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                          <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{
                                width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-muted-foreground w-4">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {reviews.length === 0 && (
                    <p className="text-muted-foreground text-center py-10">No reviews yet.</p>
                  )}
                  {reviews.map((review) => {
                    const rName = review.reviewer_name || "Student";
                    const rInit = rName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={review.id} className="p-4 rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={review.reviewer_avatar || undefined} />
                            <AvatarFallback className="bg-muted text-xs font-medium">{rInit}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-foreground text-sm">{rName}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {format(new Date(review.created_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            <StarRow rating={review.rating} size="xs" />
                            {review.comment && (
                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {reviews.length < totalReviews && (
                  <Button variant="outline" className="w-full mt-4" onClick={loadMoreReviews}>
                    Show More Reviews ({totalReviews - reviews.length} remaining)
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN (sticky sidebar) ── */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-4">
              <Card className="shadow-sm">
                <CardContent className="p-5 space-y-4">
                  {/* Rate & save */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold text-foreground">${tutor.hourly_rate}</span>
                      <span className="text-muted-foreground text-sm">/hr</span>
                    </div>
                    <button
                      onClick={() => setSaved((s) => !s)}
                      className="p-2 rounded-full hover:bg-muted transition-colors"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          saved ? "fill-destructive text-destructive" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(tutor.session_type === "online" || tutor.session_type === "both") && (
                      <Badge variant="secondary" className="text-xs">🌐 Online</Badge>
                    )}
                    {(tutor.session_type === "in_person" || tutor.session_type === "both") && (
                      <Badge variant="secondary" className="text-xs">📍 In-Person</Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Weekly availability calendar */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">Availability</h3>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setCurrentWeekStart((d) => subWeeks(d, 1))}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <span className="text-[10px] text-muted-foreground px-0.5 whitespace-nowrap">
                          {format(currentWeekStart, "MMM d")}–{format(addDays(currentWeekStart, 6), "d")}
                        </span>
                        <button
                          onClick={() => setCurrentWeekStart((d) => addWeeks(d, 1))}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5">
                      {weekDays.map((day, i) => {
                        const slots = getSlotsForDay(day);
                        const isToday = isSameDay(day, new Date());
                        const isPast = isBefore(startOfDay(day), today);
                        return (
                          <div key={i} className="flex flex-col items-center gap-0.5">
                            <span
                              className={`text-[10px] font-medium ${
                                isToday ? "text-primary" : "text-muted-foreground"
                              }`}
                            >
                              {DAYS[day.getDay()]}
                            </span>
                            <span
                              className={`text-[11px] font-bold pb-0.5 ${
                                isToday ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {format(day, "d")}
                            </span>
                            {slots.length === 0 ? (
                              <span className="text-[9px] text-muted-foreground py-1">–</span>
                            ) : (
                              <>
                                {slots.slice(0, 5).map((time) => {
                                  const booked = isSlotBooked(day, time);
                                  const selected =
                                    selectedSlot !== null &&
                                    isSameDay(selectedSlot.date, day) &&
                                    selectedSlot.time === time;
                                  const disabled = booked || isPast;
                                  return (
                                    <button
                                      key={time}
                                      disabled={disabled}
                                      onClick={() =>
                                        setSelectedSlot(selected ? null : { date: day, time })
                                      }
                                      className={`w-full text-[9px] leading-none py-1 rounded transition-colors ${
                                        selected
                                          ? "bg-primary text-primary-foreground"
                                          : disabled
                                          ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                          : "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                                      }`}
                                    >
                                      {formatTime(time)}
                                    </button>
                                  );
                                })}
                                {slots.length > 5 && (
                                  <span className="text-[9px] text-muted-foreground">
                                    +{slots.length - 5}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selectedSlot && (
                      <div className="mt-3 p-2 rounded-lg bg-accent text-accent-foreground text-xs text-center font-medium">
                        {format(selectedSlot.date, "EEE, MMM d")} ·{" "}
                        {(() => {
                          const h = parseInt(selectedSlot.time.split(":")[0], 10);
                          return `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
                        })()}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!user) { navigate("/login"); return; }
                      navigate(`/book/${tutor.id}`, {
                        state: {
                          tutorName: name,
                          tutorAvatar: profile?.avatar_url,
                          hourlyRate: tutor.hourly_rate,
                          subjects: tutor.subjects,
                          sessionType: tutor.session_type,
                          selectedDate: selectedSlot
                            ? format(selectedSlot.date, "yyyy-MM-dd")
                            : undefined,
                          selectedTime: selectedSlot?.time,
                        },
                      });
                    }}
                  >
                    {selectedSlot ? "Book This Session" : "Book a Session"}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={async () => {
                      if (!user) { navigate("/login"); return; }
                      const { data: convId } = await supabase.rpc(
                        "get_or_create_conversation" as any,
                        { p_student_id: user.id, p_tutor_id: tutor.user_id }
                      );
                      if (convId) navigate(`/messages?conversation=${convId}`);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message Tutor
                  </Button>
                </CardContent>
              </Card>

              {/* Cancellation policy */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 text-foreground">Cancellation Policy</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✅ Free cancellation 24+ hours before</li>
                    <li>⚠️ 50% refund within 24 hours</li>
                    <li>❌ No refund after session starts</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TutorProfile;
