import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TUTORS = [
  { email: "sarah.chen@demo.tutorconnect.com", name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", bio: "Passionate math educator with 8 years of experience teaching calculus, algebra, and statistics. I believe every student can excel in math with the right approach and patience.", subjects: ["Math", "Test Prep"], rate: 55, degree: "M.S. Mathematics", uni: "MIT", year: 2018, session: "online", rating: 4.9, reviews: 47, langs: ["English", "Mandarin"] },
  { email: "james.rodriguez@demo.tutorconnect.com", name: "James Rodriguez", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", bio: "Physics and engineering tutor who makes complex concepts simple. Former NASA intern with a knack for hands-on teaching.", subjects: ["Science", "Math", "Coding"], rate: 65, degree: "Ph.D. Physics", uni: "Caltech", year: 2020, session: "both", rating: 4.8, reviews: 33, langs: ["English", "Spanish"] },
  { email: "emily.watson@demo.tutorconnect.com", name: "Emily Watson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", bio: "English literature and creative writing specialist. Published author helping students find their voice through storytelling and analytical thinking.", subjects: ["English", "History"], rate: 45, degree: "M.A. English Literature", uni: "Oxford University", year: 2019, session: "online", rating: 4.7, reviews: 28, langs: ["English", "French"] },
  { email: "michael.okafor@demo.tutorconnect.com", name: "Michael Okafor", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", bio: "Full-stack developer and CS educator. I teach coding through real-world projects — from web apps to mobile games.", subjects: ["Coding", "Math"], rate: 70, degree: "B.S. Computer Science", uni: "Stanford University", year: 2017, session: "online", rating: 4.9, reviews: 62, langs: ["English"] },
  { email: "priya.sharma@demo.tutorconnect.com", name: "Priya Sharma", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", bio: "Experienced chemistry and biology tutor specializing in AP and IB exam preparation. My students consistently score 5s on AP exams.", subjects: ["Science", "Test Prep"], rate: 50, degree: "M.S. Biochemistry", uni: "Johns Hopkins", year: 2021, session: "both", rating: 4.6, reviews: 19, langs: ["English", "Hindi"] },
  { email: "david.kim@demo.tutorconnect.com", name: "David Kim", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop", bio: "Classical pianist and music theory expert with 15 years of teaching. I help students prepare for conservatory auditions and develop lifelong musical skills.", subjects: ["Music"], rate: 60, degree: "M.M. Piano Performance", uni: "Juilliard", year: 2015, session: "in_person", rating: 5.0, reviews: 41, langs: ["English", "Korean"] },
  { email: "olivia.martinez@demo.tutorconnect.com", name: "Olivia Martinez", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop", bio: "Trilingual language instructor specializing in Spanish and French. Conversational immersion approach makes learning fun and effective.", subjects: ["Languages", "English"], rate: 40, degree: "B.A. Romance Languages", uni: "UCLA", year: 2022, session: "online", rating: 4.5, reviews: 15, langs: ["English", "Spanish", "French"] },
  { email: "alex.petrov@demo.tutorconnect.com", name: "Alexander Petrov", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop", bio: "History and political science tutor with expertise in world history, US government, and international relations. I make the past come alive.", subjects: ["History", "Test Prep"], rate: 48, degree: "Ph.D. History", uni: "Yale University", year: 2019, session: "online", rating: 4.8, reviews: 25, langs: ["English", "Russian"] },
  { email: "fatima.alhassan@demo.tutorconnect.com", name: "Fatima Al-Hassan", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop", bio: "Mathematics wizard specializing in SAT/ACT prep and competition math. I've helped over 200 students improve their test scores by 150+ points.", subjects: ["Math", "Test Prep", "Science"], rate: 75, degree: "M.S. Applied Mathematics", uni: "Princeton", year: 2020, session: "both", rating: 4.9, reviews: 58, langs: ["English", "Arabic"] },
  { email: "thomas.wright@demo.tutorconnect.com", name: "Thomas Wright", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop", bio: "Data science and Python programming instructor. Industry professional at a Fortune 500 company who loves sharing practical coding knowledge.", subjects: ["Coding", "Math"], rate: 80, degree: "M.S. Data Science", uni: "Carnegie Mellon", year: 2018, session: "online", rating: 4.7, reviews: 36, langs: ["English"] },
  { email: "sofia.russo@demo.tutorconnect.com", name: "Sofia Russo", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop", bio: "Dedicated science tutor covering biology, chemistry, and environmental science. I use real experiments and visual aids to make learning memorable.", subjects: ["Science", "Math"], rate: 52, degree: "B.S. Biology", uni: "UC Berkeley", year: 2021, session: "both", rating: 4.6, reviews: 22, langs: ["English", "Italian"] },
  { email: "lucas.dubois@demo.tutorconnect.com", name: "Lucas Dubois", avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop", bio: "French native and multilingual educator teaching French, German, and Japanese. I focus on cultural immersion alongside grammar and vocabulary.", subjects: ["Languages"], rate: 42, degree: "M.A. Linguistics", uni: "Sorbonne University", year: 2020, session: "online", rating: 4.4, reviews: 12, langs: ["English", "French", "German", "Japanese"] },
];

const AVAILABILITY_TEMPLATES = [
  // Template 1: Mornings weekdays
  [{ day: 1, start: "09:00", end: "13:00" }, { day: 2, start: "09:00", end: "13:00" }, { day: 3, start: "09:00", end: "13:00" }, { day: 4, start: "09:00", end: "13:00" }, { day: 5, start: "09:00", end: "13:00" }],
  // Template 2: Afternoons + weekends
  [{ day: 1, start: "14:00", end: "19:00" }, { day: 3, start: "14:00", end: "19:00" }, { day: 5, start: "14:00", end: "19:00" }, { day: 6, start: "10:00", end: "16:00" }, { day: 0, start: "10:00", end: "16:00" }],
  // Template 3: Evenings
  [{ day: 1, start: "17:00", end: "21:00" }, { day: 2, start: "17:00", end: "21:00" }, { day: 3, start: "17:00", end: "21:00" }, { day: 4, start: "17:00", end: "21:00" }],
  // Template 4: Full day select days
  [{ day: 2, start: "08:00", end: "17:00" }, { day: 4, start: "08:00", end: "17:00" }, { day: 6, start: "09:00", end: "15:00" }],
];

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: string[] = [];

  for (let i = 0; i < TUTORS.length; i++) {
    const t = TUTORS[i];

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: t.email,
      password: "DemoTutor2026!",
      email_confirm: true,
      user_metadata: { full_name: t.name, avatar_url: t.avatar },
    });

    if (authError) {
      results.push(`❌ ${t.name}: ${authError.message}`);
      continue;
    }

    const userId = authData.user.id;

    // Update profile (auto-created by trigger)
    await supabase.from("profiles").update({ role: "tutor", avatar_url: t.avatar }).eq("user_id", userId);

    // Insert user_roles
    await supabase.from("user_roles").insert({ user_id: userId, role: "tutor" });

    // Insert tutor_profile
    const { data: tp } = await supabase.from("tutor_profiles").insert({
      user_id: userId,
      bio: t.bio,
      subjects: t.subjects,
      hourly_rate: t.rate,
      education_degree: t.degree,
      education_university: t.uni,
      graduation_year: t.year,
      session_type: t.session,
      rating: t.rating,
      review_count: t.reviews,
      languages: t.langs,
      status: "approved",
    }).select("id").single();

    if (tp) {
      // Insert availability
      const template = AVAILABILITY_TEMPLATES[i % AVAILABILITY_TEMPLATES.length];
      const availRows = template.map((slot) => ({
        tutor_id: tp.id,
        day_of_week: slot.day,
        start_time: slot.start,
        end_time: slot.end,
      }));
      await supabase.from("tutor_availability").insert(availRows);
    }

    results.push(`✅ ${t.name} (${t.subjects.join(", ")}) — $${t.rate}/hr`);
  }

  return new Response(JSON.stringify({ message: "Seeding complete", results }), {
    headers: { "Content-Type": "application/json" },
  });
});
