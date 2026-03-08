import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Upload, BookOpen, Target, ArrowRight, ArrowLeft, Check } from "lucide-react";

const SUBJECTS = ["Math", "Science", "English", "History", "Coding", "Music", "Languages", "Test Prep"];
const GRADE_LEVELS = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "university", label: "University" },
  { value: "adult_learner", label: "Adult Learner" },
] as const;

const StudentOnboarding = () => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState("");
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

  const toggleSubject = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
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

    // Update profile
    await supabase.from("profiles").update({
      full_name: fullName,
      avatar_url: avatarUrl,
    }).eq("user_id", user.id);

    // Insert student profile
    await supabase.from("student_profiles").insert({
      user_id: user.id,
      grade_level: gradeLevel as any,
      subjects,
      learning_goals: learningGoals,
    });

    await refreshProfile();
    setLoading(false);
    toast({ title: "Welcome to TutorConnect!", description: "Your profile is set up." });
    navigate("/student/dashboard");
  };

  const steps = [
    { icon: User, label: "Profile" },
    { icon: BookOpen, label: "Grade" },
    { icon: Target, label: "Subjects" },
    { icon: Check, label: "Goals" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <a href="/" className="font-display text-2xl font-bold text-secondary">
            Tutor<span className="text-primary">Connect</span>
          </a>
          <h1 className="mt-4 font-display text-2xl font-bold">Student Setup</h1>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 ${i + 1 < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {step === 1 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Your Profile</CardTitle>
                  <CardDescription>Tell us about yourself</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
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
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Grade Level</CardTitle>
                  <CardDescription>What's your current level?</CardDescription>
                </CardHeader>
                <div className="grid grid-cols-2 gap-3">
                  {GRADE_LEVELS.map((gl) => (
                    <button
                      key={gl.value}
                      onClick={() => setGradeLevel(gl.value)}
                      className={`rounded-lg border-2 p-4 text-sm font-medium transition-all ${gradeLevel === gl.value ? "border-primary bg-accent text-foreground" : "border-border hover:border-primary/50"}`}
                    >
                      {gl.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Subjects</CardTitle>
                  <CardDescription>What do you need help with?</CardDescription>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((sub) => (
                    <Badge
                      key={sub}
                      variant={subjects.includes(sub) ? "default" : "outline"}
                      className="cursor-pointer text-sm px-4 py-2"
                      onClick={() => toggleSubject(sub)}
                    >
                      {sub}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg">Learning Goals</CardTitle>
                  <CardDescription>What do you want to achieve?</CardDescription>
                </CardHeader>
                <Textarea
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder="e.g., Improve my grades in math, prepare for SAT, learn Python..."
                  rows={4}
                />
              </>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : <div />}
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? "Saving..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentOnboarding;
