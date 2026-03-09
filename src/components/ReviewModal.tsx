import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REVIEW_TAGS = [
  "Patient",
  "Clear Explanations",
  "Well Prepared",
  "Engaging",
  "Flexible",
  "Expert Knowledge",
];

type Props = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string | null;
  onSubmitted: () => void;
};

const ReviewModal = ({
  open,
  onClose,
  bookingId,
  tutorId,
  tutorName,
  tutorAvatar,
  onSubmitted,
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const initials = tutorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const canSubmit = rating > 0 && comment.trim().length >= 20;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        tutor_id: tutorId,
        student_id: user.id,
        rating,
        comment: comment.trim(),
        tags: selectedTags,
      } as any);
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already reviewed", description: "You've already reviewed this session.", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Review submitted!", description: "Thank you for your feedback." });
        onSubmitted();
        onClose();
        setRating(0);
        setComment("");
        setSelectedTags([]);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Rate Your Session</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={tutorAvatar || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            How was your session with{" "}
            <span className="font-semibold text-foreground">{tutorName}</span>?
          </p>

          {/* Star rating */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= displayRating
                      ? "fill-amber-400 text-amber-400"
                      : "text-border"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-muted-foreground">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent!"}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 justify-center">
            {REVIEW_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Comment */}
          <div className="w-full space-y-1">
            <Textarea
              placeholder="Share your experience (min 20 characters)..."
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {comment.length < 20 && comment.length > 0
                  ? `${20 - comment.length} more characters needed`
                  : "\u00A0"}
              </span>
              <span>{comment.length}/500</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
