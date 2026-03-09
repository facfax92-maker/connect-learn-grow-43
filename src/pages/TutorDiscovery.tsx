import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Star, Heart, BadgeCheck, Filter, X } from "lucide-react";
import { NEPAL_SUBJECTS, NEPAL_CITIES, LANGUAGES, PRICE_RANGE, formatNPR } from "@/lib/constants";

const AVAILABILITY_OPTIONS = ["Weekdays", "Weekends", "Evenings"];
const SESSION_TYPE_OPTIONS = ["online", "in_person", "both"] as const;

type TutorWithProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  subjects: string[] | null;
  hourly_rate: number | null;
  session_type: string | null;
  rating: number | null;
  review_count: number | null;
  languages: string[] | null;
  availability: string[] | null;
  teaching_city: string | null;
  status: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

const TutorDiscovery = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<TutorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([PRICE_RANGE.min, PRICE_RANGE.max]);
  const [minRating, setMinRating] = useState("any");
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedSessionType, setSelectedSessionType] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [sortBy, setSortBy] = useState("top_rated");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [savedTutors, setSavedTutors] = useState<Set<string>>(new Set());
  const PAGE_SIZE = 12;

  const fetchTutors = async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 0 : page;

    let query = supabase
      .from("tutor_profiles")
      .select("*, profiles!tutor_profiles_user_id_fkey(full_name, avatar_url)")
      .eq("status", "approved")
      .gte("hourly_rate", priceRange[0])
      .lte("hourly_rate", priceRange[1])
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (minRating !== "any") {
      query = query.gte("rating", parseFloat(minRating));
    }

    if (selectedSessionType && (selectedSessionType === "online" || selectedSessionType === "in_person" || selectedSessionType === "both")) {
      query = query.eq("session_type", selectedSessionType);
    }

    switch (sortBy) {
      case "top_rated":
        query = query.order("rating", { ascending: false });
        break;
      case "price_low":
        query = query.order("hourly_rate", { ascending: true });
        break;
      case "price_high":
        query = query.order("hourly_rate", { ascending: false });
        break;
      case "most_reviews":
        query = query.order("review_count", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (!error && data) {
      let filtered = data as unknown as TutorWithProfile[];

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.profiles?.full_name?.toLowerCase().includes(q) ||
            t.subjects?.some((s) => s.toLowerCase().includes(q))
        );
      }
      if (selectedSubjects.length > 0) {
        filtered = filtered.filter((t) =>
          selectedSubjects.some((s) => t.subjects?.includes(s))
        );
      }
      if (selectedLanguage) {
        filtered = filtered.filter((t) => t.languages?.includes(selectedLanguage));
      }
      if (selectedCity) {
        filtered = filtered.filter((t) => t.teaching_city === selectedCity);
      }
      if (selectedAvailability.length > 0) {
        filtered = filtered.filter((t) =>
          selectedAvailability.some((a) => t.availability?.includes(a))
        );
      }

      if (reset) {
        setTutors(filtered);
        setPage(0);
      } else {
        setTutors((prev) => [...prev, ...filtered]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTutors(true);
  }, [searchQuery, selectedSubjects, priceRange, minRating, selectedAvailability, selectedSessionType, selectedLanguage, selectedCity, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSubjects([]);
    setPriceRange([PRICE_RANGE.min, PRICE_RANGE.max]);
    setMinRating("any");
    setSelectedAvailability([]);
    setSelectedSessionType("");
    setSelectedLanguage("");
    setSelectedCity("");
  };

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const toggleAvailability = (a: string) => {
    setSelectedAvailability((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const toggleSaved = (id: string) => {
    setSavedTutors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Name or subject..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Subject</label>
        <div className="flex flex-wrap gap-1.5">
          {NEPAL_SUBJECTS.slice(0, 10).map((s) => (
            <Badge
              key={s}
              variant={selectedSubjects.includes(s) ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => toggleSubject(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {/* City filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">City</label>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger><SelectValue placeholder="Any City" /></SelectTrigger>
          <SelectContent>
            {NEPAL_CITIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Rate: {formatNPR(priceRange[0])} – {formatNPR(priceRange[1])}/session</label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={PRICE_RANGE.min}
          max={PRICE_RANGE.max}
          step={100}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Minimum Rating</label>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="3">3★+</SelectItem>
            <SelectItem value="4">4★+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Availability</label>
        <div className="space-y-2">
          {AVAILABILITY_OPTIONS.map((a) => (
            <label key={a} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={selectedAvailability.includes(a)} onCheckedChange={() => toggleAvailability(a)} />
              <span className="text-sm">{a}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Session Type</label>
        <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="in_person">In-Person</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Language</label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Find Your Perfect Tutor</h1>
            <p className="text-muted-foreground">Browse verified tutors across Nepal</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top_rated">Top Rated</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="most_reviews">Most Reviews</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24 rounded-lg border border-border bg-card p-4">
              <FiltersContent />
            </div>
          </aside>

          {showMobileFilters && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
              <div className="fixed inset-y-0 left-0 w-80 bg-card border-r border-border p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Filters</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <FiltersContent />
              </div>
            </div>
          )}

          <div className="flex-1">
            {tutors.length === 0 && !loading && (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No tutors found matching your criteria.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((tutor) => {
                const name = tutor.profiles?.full_name || "Tutor";
                const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                const displaySubjects = tutor.subjects?.slice(0, 3) || [];
                const extraCount = (tutor.subjects?.length || 0) - 3;
                const bioSnippet = tutor.bio ? (tutor.bio.length > 80 ? tutor.bio.slice(0, 80) + "…" : tutor.bio) : "";

                return (
                  <Card key={tutor.id} className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/tutors/${tutor.id}`)}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={tutor.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-accent text-accent-foreground font-medium">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-foreground">{name}</h3>
                              {tutor.status === "approved" && (
                                <BadgeCheck className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span>{tutor.rating || "N/A"}</span>
                              <span>·</span>
                              <span>{tutor.review_count || 0} reviews</span>
                            </div>
                            {tutor.teaching_city && (
                              <p className="text-xs text-muted-foreground">{tutor.teaching_city}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSaved(tutor.id); }}
                          className="p-1.5 rounded-full hover:bg-muted transition-colors"
                        >
                          <Heart className={`h-5 w-5 ${savedTutors.has(tutor.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {displaySubjects.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {extraCount > 0 && (
                          <Badge variant="outline" className="text-xs">+{extraCount} more</Badge>
                        )}
                      </div>

                      {bioSnippet && <p className="text-sm text-muted-foreground">{bioSnippet}</p>}

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-lg font-bold text-foreground">रू {tutor.hourly_rate?.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/session</span></span>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/tutors/${tutor.id}`); }}>View Profile</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {hasMore && tutors.length > 0 && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={() => { setPage((p) => p + 1); fetchTutors(); }}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TutorDiscovery;
