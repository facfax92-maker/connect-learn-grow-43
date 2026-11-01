import { describe, expect, it } from "vitest";
import { normalizeSubjectCategories, partitionReviews, TUTOR_STATUSES } from "@/lib/admin-rules";

describe("admin management rules", () => {
  it("supports suspending tutors without publishing them", () => {
    expect(TUTOR_STATUSES).toContain("suspended");
    expect(TUTOR_STATUSES.filter((status) => status === "approved")).toEqual(["approved"]);
  });
  it("keeps removed reviews out of the reported queue", () => {
    const result = partitionReviews([{ flagged: true, flags: [{}] }, { flagged: false, flags: [{}] }, { flagged: false, flags: [] }]);
    expect(result.reported).toEqual([{ flagged: false, flags: [{}] }]);
    expect(result.removed).toHaveLength(1);
    expect(result.published).toHaveLength(2);
  });
  it("rejects duplicate categories regardless of case", () => {
    expect(() => normalizeSubjectCategories(["Math", " math "])).toThrow("unique");
  });
  it("preserves commas inside Nepal subject names", () => {
    expect(normalizeSubjectCategories([" NEB Science (Physics, Chemistry, Biology, Math) "])).toEqual(["NEB Science (Physics, Chemistry, Biology, Math)"]);
  });
});