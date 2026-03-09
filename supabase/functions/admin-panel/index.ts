import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!adminRole) throw new Error("Forbidden: Admin access required");

  return { supabase, user };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabase, user } = await verifyAdmin(req);
    const { action, ...params } = await req.json();

    // ── DASHBOARD STATS ──
    if (action === "get_dashboard_stats") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        { count: tutorCount },
        { count: studentCount },
        { data: allConns },
        { data: allReviews },
        { data: pendingTutors },
        { data: flaggedReviews },
      ] = await Promise.all([
        supabase.from("tutor_profiles").select("*", { count: "exact", head: true }),
        supabase.from("student_profiles").select("*", { count: "exact", head: true }),
        supabase.from("tutor_student_connections").select("status, platform_fee, created_at, confirmed_at"),
        supabase.from("reviews").select("rating"),
        supabase.from("tutor_profiles").select("id").eq("status", "pending_approval"),
        supabase.from("reviews").select("id").eq("flagged", true),
      ]);

      const confirmed = (allConns || []).filter((c: any) => c.status === "confirmed");
      const thisMonth = confirmed.filter((c: any) => (c.confirmed_at || c.created_at) >= monthStart);
      const pending = (allConns || []).filter((c: any) => c.status === "payment_submitted");
      const avgRating = (allReviews || []).length > 0
        ? (allReviews || []).reduce((s: number, r: any) => s + r.rating, 0) / (allReviews || []).length
        : 0;

      return new Response(JSON.stringify({
        total_tutors: tutorCount || 0,
        total_students: studentCount || 0,
        active_connections_month: thisMonth.length,
        revenue_month: thisMonth.reduce((s: number, c: any) => s + Number(c.platform_fee), 0),
        pending_confirmations: pending.length,
        avg_rating: Math.round(avgRating * 10) / 10,
        revenue_all_time: confirmed.reduce((s: number, c: any) => s + Number(c.platform_fee), 0),
        pending_tutors: (pendingTutors || []).length,
        flagged_reviews: (flaggedReviews || []).length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── LIST TUTORS ──
    if (action === "list_tutors") {
      const { data: tutors } = await supabase
        .from("tutor_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (tutors && tutors.length > 0) {
        const uids = tutors.map((t: any) => t.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, phone, email")
          .in("user_id", uids);
        const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

        const enriched = tutors.map((t: any) => ({
          ...t,
          full_name: pm.get(t.user_id)?.full_name || "Unknown",
          avatar_url: pm.get(t.user_id)?.avatar_url,
          phone: pm.get(t.user_id)?.phone,
          email: pm.get(t.user_id)?.email,
        }));
        return new Response(JSON.stringify(enriched), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── UPDATE TUTOR STATUS ──
    if (action === "update_tutor_status") {
      const { tutor_id, status, reason } = params;
      const { error } = await supabase
        .from("tutor_profiles")
        .update({ status })
        .eq("id", tutor_id);
      if (error) throw error;

      // Get tutor user_id for notification
      const { data: tp } = await supabase
        .from("tutor_profiles")
        .select("user_id")
        .eq("id", tutor_id)
        .single();

      if (tp) {
        const messages: Record<string, string> = {
          approved: "Congratulations! Your tutor profile has been approved. You're now visible to students.",
          rejected: `Your tutor application was not approved. ${reason || ""}`,
          suspended: `Your account has been suspended. ${reason || ""}`,
          pending_approval: "Your account has been reactivated.",
        };
        await supabase.from("notifications").insert({
          user_id: tp.user_id,
          type: `tutor_${status}`,
          message: messages[status] || `Your status has been updated to ${status}.`,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── LIST STUDENTS ──
    if (action === "list_students") {
      const { data: students } = await supabase
        .from("student_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (students && students.length > 0) {
        const uids = students.map((s: any) => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, phone, email")
          .in("user_id", uids);
        const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

        const enriched = students.map((s: any) => ({
          ...s,
          full_name: pm.get(s.user_id)?.full_name || "Unknown",
          avatar_url: pm.get(s.user_id)?.avatar_url,
          phone: pm.get(s.user_id)?.phone,
          email: pm.get(s.user_id)?.email,
        }));
        return new Response(JSON.stringify(enriched), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── LIST CONNECTIONS ──
    if (action === "list_connections") {
      const { data } = await supabase
        .from("tutor_student_connections")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const allIds = [...new Set([
          ...data.map((c: any) => c.tutor_user_id),
          ...data.map((c: any) => c.student_id),
        ])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, phone, email")
          .in("user_id", allIds);
        const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

        const enriched = data.map((c: any) => ({
          ...c,
          tutor_name: pm.get(c.tutor_user_id)?.full_name || "Tutor",
          student_name: pm.get(c.student_id)?.full_name || "Student",
        }));
        return new Response(JSON.stringify(enriched), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CONFIRM CONNECTION ──
    if (action === "confirm_connection") {
      const { connection_id } = params;
      const { data: conn, error } = await supabase
        .from("tutor_student_connections")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", connection_id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("notifications").insert([
        { user_id: conn.tutor_user_id, type: "connection_confirmed", message: "Your connection has been confirmed! Student contact details are now unlocked.", related_id: conn.id },
        { user_id: conn.student_id, type: "connection_confirmed", message: "You've been connected with your tutor! Their contact details are now available.", related_id: conn.id },
      ]);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── REJECT CONNECTION ──
    if (action === "reject_connection") {
      const { connection_id, note } = params;
      const { data: conn, error } = await supabase
        .from("tutor_student_connections")
        .update({ status: "pending", admin_note: note || "Payment screenshot rejected. Please resend." })
        .eq("id", connection_id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: conn.tutor_user_id,
        type: "connection_rejected",
        message: `Your payment screenshot was rejected. ${note || "Please upload a new one."}`,
        related_id: conn.id,
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── EXTEND DEADLINE ──
    if (action === "extend_deadline") {
      const { connection_id } = params;
      const { error } = await supabase
        .from("tutor_student_connections")
        .update({ expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
        .eq("id", connection_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── EXPIRE CONNECTION ──
    if (action === "expire_connection") {
      const { connection_id } = params;
      const { error } = await supabase
        .from("tutor_student_connections")
        .update({ status: "expired" })
        .eq("id", connection_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET SCREENSHOT URL ──
    if (action === "get_screenshot_url") {
      const { path } = params;
      const { data } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(path, 3600);
      return new Response(JSON.stringify({ url: data?.signedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── LIST REVIEWS ──
    if (action === "list_reviews") {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (reviews && reviews.length > 0) {
        const allIds = [...new Set([
          ...reviews.map((r: any) => r.student_id),
          ...reviews.map((r: any) => r.tutor_id),
        ])];

        // Get tutor profile user_ids
        const tutorProfileIds = [...new Set(reviews.map((r: any) => r.tutor_id))];
        const { data: tps } = await supabase
          .from("tutor_profiles")
          .select("id, user_id")
          .in("id", tutorProfileIds);
        const tpMap = new Map(tps?.map((t: any) => [t.id, t.user_id]) || []);

        const userIds = [...new Set([
          ...reviews.map((r: any) => r.student_id),
          ...Array.from(tpMap.values()),
        ])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

        // Get flags
        const { data: flags } = await supabase
          .from("review_flags")
          .select("review_id, reason, flagged_by, created_at");
        const flagMap = new Map<string, any[]>();
        (flags || []).forEach((f: any) => {
          if (!flagMap.has(f.review_id)) flagMap.set(f.review_id, []);
          flagMap.get(f.review_id)!.push(f);
        });

        const enriched = reviews.map((r: any) => ({
          ...r,
          student_name: pm.get(r.student_id)?.full_name || "Student",
          tutor_name: pm.get(tpMap.get(r.tutor_id) || "")?.full_name || "Tutor",
          flags: flagMap.get(r.id) || [],
        }));
        return new Response(JSON.stringify(enriched), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── MODERATE REVIEW ──
    if (action === "moderate_review") {
      const { review_id, flagged } = params;
      const { error } = await supabase
        .from("reviews")
        .update({ flagged })
        .eq("id", review_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── UPDATE SETTINGS ──
    if (action === "update_settings") {
      const { settings } = params;
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from("platform_settings")
          .update({ value: String(value), updated_at: new Date().toISOString() })
          .eq("key", key);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = err.message === "Unauthorized" ? 401 : err.message?.includes("Forbidden") ? 403 : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
