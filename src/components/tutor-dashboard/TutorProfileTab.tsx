import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { NEPAL_SUBJECTS, NEPAL_CITIES, ENTRANCE_EXAMS, PRICE_RANGE } from "@/lib/constants";

const ALL_SUBJECTS = NEPAL_SUBJECTS;

type Props = {
  user: any;
  profile: any;
  tutorProfile: any;
  setTutorProfile: (p: any) => void;
  refreshProfile: () => Promise<void>;
};

const TutorProfileTab = ({ user, profile, tutorProfile, setTutorProfile, refreshProfile }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(tutorProfile?.bio || "");
  const [rate, setRate] = useState(tutorProfile?.hourly_rate?.toString() || "");
  const [subjects, setSubjects] = useState<string[]>(tutorProfile?.subjects || []);
  const [sessionType, setSessionType] = useState(tutorProfile?.session_type || "online");
  const [degree, setDegree] = useState(tutorProfile?.education_degree || "");
  const [university, setUniversity] = useState(tutorProfile?.education_university || "");
  const [gradYear, setGradYear] = useState(tutorProfile?.graduation_year?.toString() || "");

  useEffect(() => {
    setName(profile?.full_name || "");
    setBio(tutorProfile?.bio || "");
    setRate(tutorProfile?.hourly_rate?.toString() || "");
    setSubjects(tutorProfile?.subjects || []);
    setSessionType(tutorProfile?.session_type || "online");
    setDegree(tutorProfile?.education_degree || "");
    setUniversity(tutorProfile?.education_university || "");
    setGradYear(tutorProfile?.graduation_year?.toString() || "");
  }, [profile, tutorProfile]);

  // Profile completeness
  const fields = [
    !!name, !!bio, !!rate, subjects.length > 0, !!sessionType,
    !!degree, !!university,
  ];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const save = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ full_name: name }).eq("user_id", user.id);
    await supabase
      .from("tutor_profiles")
      .update({
        bio: bio || null,
        hourly_rate: rate ? parseFloat(rate) : null,
        subjects,
        session_type: sessionType as any,
        education_degree: degree || null,
        education_university: university || null,
        graduation_year: gradYear ? parseInt(gradYear) : null,
      })
      .eq("id", tutorProfile.id);

    await refreshProfile();
    setTutorProfile({
      ...tutorProfile,
      bio,
      hourly_rate: parseFloat(rate),
      subjects,
      session_type: sessionType,
      education_degree: degree,
      education_university: university,
      graduation_year: gradYear ? parseInt(gradYear) : null,
    });
    setSaving(false);
    toast({ title: "Profile saved!" });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Edit Profile</h2>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/tutors/${tutorProfile.id}`)}
        >
          <Eye className="h-4 w-4" /> Preview Profile
        </Button>
      </div>

      {/* Completeness */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Profile Completeness</span>
            <span className={`text-sm font-bold ${completeness === 100 ? "text-primary" : "text-muted-foreground"}`}>
              {completeness}%
            </span>
          </div>
          <Progress value={completeness} className="h-2" />
          {completeness < 100 && (
            <p className="text-xs text-muted-foreground">
              Complete your profile to attract more students!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell students about your teaching style, experience, and approach..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Per Session Rate (रू)</label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                min={PRICE_RANGE.min}
                max={PRICE_RANGE.max}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Session Type</label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Subjects</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={subjects.includes(s)}
                    onCheckedChange={(checked) =>
                      setSubjects((prev) => checked ? [...prev, s] : prev.filter((x) => x !== s))
                    }
                  />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground mb-3">Education</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Degree</label>
                <Input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. BSc" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">University</label>
                <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. TU" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Grad Year</label>
                <Input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="2024" />
              </div>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorProfileTab;
