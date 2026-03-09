import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Star, Flag, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Props = { invokeAdmin: (action: string, params?: any) => Promise<any> };

const AdminReviewsTab = ({ invokeAdmin }: Props) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await invokeAdmin("list_reviews");
      setReviews(data || []);
    } catch {}
    setLoading(false);
  };

  const moderateReview = async (reviewId: string, flagged: boolean) => {
    setProcessing(true);
    try {
      await invokeAdmin("moderate_review", { review_id: reviewId, flagged });
      toast({ title: flagged ? "Review removed" : "Flag dismissed" });
      fetchReviews();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const flagged = reviews.filter((r) => r.flagged || (r.flags && r.flags.length > 0));
  const published = reviews.filter((r) => !r.flagged);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const ReviewRow = ({ review }: { review: any }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">{review.tutor_name}</span>
              <span className="text-muted-foreground text-xs">←</span>
              <span className="text-sm text-foreground">{review.student_name}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`h-3 w-3 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                ))}
              </div>
              {review.flagged && <Badge variant="destructive" className="text-xs">Removed</Badge>}
              {!review.flagged && review.flags?.length > 0 && (
                <Badge variant="outline" className="text-xs text-destructive border-destructive gap-1">
                  <Flag className="h-2.5 w-2.5" /> {review.flags.length} flag(s)
                </Badge>
              )}
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
            )}
            {review.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {review.tags.map((t: string) => <Badge key={t} variant="secondary" className="text-[10px] py-0">{t}</Badge>)}
              </div>
            )}
            {review.flags?.length > 0 && (
              <div className="text-xs text-destructive mt-1">
                Flag reason: {review.flags[0].reason}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), "MMM d, yyyy")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {!review.flagged && review.flags?.length > 0 && (
              <>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => moderateReview(review.id, true)} disabled={processing}>
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => moderateReview(review.id, false)} disabled={processing}>
                  <CheckCircle className="h-3 w-3" /> Dismiss
                </Button>
              </>
            )}
            {review.flagged && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => moderateReview(review.id, false)} disabled={processing}>
                <CheckCircle className="h-3 w-3" /> Restore
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">Reviews</h1>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({published.length})</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged ({flagged.length})
            {flagged.length > 0 && <span className="ml-1 inline-block w-2 h-2 bg-destructive rounded-full" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2 mt-4">
          {published.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No reviews yet</CardContent></Card>
          ) : published.map((r) => <ReviewRow key={r.id} review={r} />)}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-2 mt-4">
          {flagged.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No flagged reviews</CardContent></Card>
          ) : flagged.map((r) => <ReviewRow key={r.id} review={r} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReviewsTab;
