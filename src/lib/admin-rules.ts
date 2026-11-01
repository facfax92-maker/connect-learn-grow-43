export const TUTOR_STATUSES = ["pending_approval", "approved", "rejected", "suspended"] as const;

export function normalizeSubjectCategories(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Subject categories must be a list of names.");
  }
  const names = value.map((name: string) => name.trim()).filter(Boolean);
  if (names.length === 0) throw new Error("Keep at least one subject category.");
  if (names.some((name) => name.length > 100)) throw new Error("Category names must be 100 characters or fewer.");
  if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
    throw new Error("Subject categories must have unique names.");
  }
  return names;
}

export function partitionReviews<T extends { flagged?: boolean; flags?: unknown[] }>(reviews: T[]) {
  return {
    published: reviews.filter((review) => !review.flagged),
    reported: reviews.filter((review) => !review.flagged && (review.flags?.length ?? 0) > 0),
    removed: reviews.filter((review) => review.flagged),
  };
}