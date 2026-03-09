import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Star, MessageCircle, Flag, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Props = { tutorProfile: any };

type ReviewItem = {
  id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  tutor_reply: string | null;
  reply_at: string | null;
  flagged: boolean;
  created_at: string;
  student_name: string;
  student_avatar: string | null;
};

const TutorReviews = ({ tutorProfile }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [tutorProfile]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("tutor_id", tutorProfile.id)
      .eq("flagged", false)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const sids = [...new Set(data.map((r: any) => r.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", sids);
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

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) *
          100
        : 0,
  }));

  const submitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          tutor_reply: replyText.trim(),
          reply_at: new Date().toISOString(),
        } as any)
        .eq("id", reviewId);
      if (error) throw error;
      toast({ title: "Reply posted!" });
      setReplyingTo(null);
      setReplyText("");
      fetchReviews();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const canEditReply = (replyAt: string | null) => {
    if (!replyAt) return true;
    const diff = Date.now() - new Date(replyAt).getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  };

  const flagReview = async (reviewId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("review_flags").insert({
        review_id: reviewId,
        flagged_by: user.id,
        reason: "Reported by tutor",
      } as any);
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already flagged" });
        } else throw error;
      } else {
        toast({ title: "Review flagged for admin review" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="font-display text-xl font-bold text-foreground">
        Reviews
      </h2>

      {/* Overall rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-5xl font-bold text-foreground">
              {avgRating.toFixed(1)}
            </p>
            <div className="flex justify-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {reviews.length} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            {ratingBreakdown.map((r) => (
              <div key={r.star} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-8">
                  {r.star}★
                </span>
                <Progress value={r.percent} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {r.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No reviews yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={r.student_avatar || undefined} />
                    <AvatarFallback className="bg-muted text-xs">
                      {(r.student_name || "S")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-medium text-foreground text-sm">
                        {r.student_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(r.created_at), "MMM d, yyyy")}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => flagReview(r.id)}
                          title="Flag review"
                        >
                          <Flag className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i <= r.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Tags */}
                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {r.comment && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {r.comment}
                      </p>
                    )}

                    {/* Existing reply */}
                    {r.tutor_reply && (
                      <div className="mt-3 ml-4 p-3 rounded-lg bg-muted/50 border-l-2 border-primary">
                        <p className="text-xs font-medium text-foreground mb-1">
                          Your Reply
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {r.tutor_reply}
                        </p>
                        {r.reply_at && canEditReply(r.reply_at) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-1 text-xs h-6 px-2"
                            onClick={() => {
                              setReplyingTo(r.id);
                              setReplyText(r.tutor_reply || "");
                            }}
                          >
                            Edit Reply
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Reply input */}
                    {replyingTo === r.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) =>
                            setReplyText(e.target.value.slice(0, 500))
                          }
                          placeholder="Write your reply..."
                          className="min-h-[80px] resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => submitReply(r.id)}
                            disabled={!replyText.trim() || saving}
                          >
                            {saving ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Post Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      !r.tutor_reply && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 gap-1 text-xs"
                          onClick={() => {
                            setReplyingTo(r.id);
                            setReplyText("");
                          }}
                        >
                          <MessageCircle className="h-3 w-3" /> Reply
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorReviews;
