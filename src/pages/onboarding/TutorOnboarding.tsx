import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Upload, BookOpen, GraduationCap, Wallet, FileCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { NEPAL_SUBJECTS, NEPAL_CITIES, ENTRANCE_EXAMS, PRICE_RANGE, formatNPR } from "@/lib/constants";

const SESSION_TYPES = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In-Person" },
  { value: "both", label: "Both" },
] as const;

const TutorOnboarding = () => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [degree, setDegree] = useState("");
  const [university, setUniversity] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [hourlyRate, setHourlyRate] = useState([1000]);
  const [sessionType, setSessionType] = useState<string>("online");
  const [teachingCity, setTeachingCity] = useState("");
  const [entranceSpecializations, setEntranceSpecializations] = useState<string[]>([]);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCertFiles(Array.from(e.target.files));
    }
  };

  const toggleSubject = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const toggleEntrance = (exam: string) => {
    setEntranceSpecializations((prev) =>
      prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
    }

    const certUrls: string[] = [];
    for (const file of certFiles) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("certifications").upload(path, file);
      if (!error) {
        certUrls.push(path);
      }
    }

    await supabase.from("profiles").update({
      full_name: fullName,
      avatar_url: avatarUrl,
      city: teachingCity || null,
    }).eq("user_id", user.id);

    await supabase.from("tutor_profiles").insert({
      user_id: user.id,
      bio,
      subjects,
      hourly_rate: hourlyRate[0],
      session_type: sessionType as any,
      education_degree: degree,
      education_university: university,
      graduation_year: gradYear ? parseInt(gradYear) : null,
      certification_urls: certUrls,
      teaching_city: teachingCity || null,
      entrance_specializations: entranceSpecializations,
    });

    await refreshProfile();
    setLoading(false);
    toast({ title: "Application submitted!", description: "Your tutor profile is pending approval." });
    navigate("/tutor/dashboard");
  };

  const stepLabels = [
    { icon: User, label: "Profile" },
    { icon: BookOpen, label: "Subjects" },
    { icon: GraduationCap, label: "Education" },
    { icon: Wallet, label: "Rate" },
    { icon: FileCheck, label: "ID & Docs" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <a href="/" className="font-display text-2xl font-bold text-secondary">
            Tutor<span className="text-primary">Connect</span>
          </a>
          <h1 className="mt-4 font-display text-2xl font-bold">Tutor Application</h1>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2">
          {stepLabels.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              {i < stepLabels.length - 1 && <div className={`h-0.5 w-6 ${i + 1 < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {step === 1 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Your Profile</CardTitle>
                  <CardDescription>Basic info about you</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sita Sharma" />
                </div>
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="h-16 w-16 rounded-full object-cover" alt="Preview" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent">
                        <Upload className="h-4 w-4" /> Upload Photo
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Short Bio ({bio.length}/300)</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 300))}
                    placeholder="Tell students about your teaching experience and style..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teaching City / District</Label>
                  <Select value={teachingCity} onValueChange={setTeachingCity}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {NEPAL_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Subjects You Teach</CardTitle>
                  <CardDescription>Select all that apply</CardDescription>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                  {NEPAL_SUBJECTS.map((sub) => (
                    <Badge
                      key={sub}
                      variant={subjects.includes(sub) ? "default" : "outline"}
                      className="cursor-pointer text-sm px-3 py-1.5"
                      onClick={() => toggleSubject(sub)}
                    >
                      {sub}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2 pt-3">
                  <Label>Entrance Exam Specialization (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {ENTRANCE_EXAMS.filter(e => e !== "None").map((exam) => (
                      <Badge
                        key={exam}
                        variant={entranceSpecializations.includes(exam) ? "default" : "outline"}
                        className="cursor-pointer text-sm px-3 py-1.5"
                        onClick={() => toggleEntrance(exam)}
                      >
                        {exam}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Education Background</CardTitle>
                  <CardDescription>Your qualifications</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="B.Sc. in Physics" />
                </div>
                <div className="space-y-2">
                  <Label>University / College</Label>
                  <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Tribhuvan University" />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="2023" />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Rate & Session Type</CardTitle>
                  <CardDescription>Set your pricing</CardDescription>
                </CardHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Per Session Rate: {formatNPR(hourlyRate[0])}</Label>
                    <Slider
                      value={hourlyRate}
                      onValueChange={setHourlyRate}
                      min={PRICE_RANGE.min}
                      max={PRICE_RANGE.max}
                      step={100}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatNPR(PRICE_RANGE.min)}</span><span>{formatNPR(PRICE_RANGE.max)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Session Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {SESSION_TYPES.map((st) => (
                        <button
                          key={st.value}
                          onClick={() => setSessionType(st.value)}
                          className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${sessionType === st.value ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Upload Citizenship or ID</CardTitle>
                  <CardDescription>Upload your citizenship card, national ID, or relevant documents for verification</CardDescription>
                </CardHeader>
                <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload files</span>
                  <input type="file" multiple className="hidden" onChange={handleCertChange} />
                </label>
                {certFiles.length > 0 && (
                  <div className="space-y-1">
                    {certFiles.map((f, i) => (
                      <p key={i} className="text-sm text-muted-foreground">📄 {f.name}</p>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : <div />}
              {step < 5 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TutorOnboarding;
