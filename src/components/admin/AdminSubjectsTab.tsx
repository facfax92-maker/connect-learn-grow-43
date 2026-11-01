import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Search, X, Check } from "lucide-react";
import { useSubjectCategories } from "@/hooks/use-subject-categories";
import { normalizeSubjectCategories } from "@/lib/admin-rules";
import { useToast } from "@/hooks/use-toast";

type Props = { invokeAdmin: (action: string, params?: any) => Promise<any> };

export default function AdminSubjectsTab({ invokeAdmin }: Props) {
  const { data: subjects = [], isFetching, error, refetch } = useSubjectCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (next: string[]) => {
    setSaving(true);
    try {
      const categories = normalizeSubjectCategories(next);
      await invokeAdmin("save_subject_categories", { categories });
      queryClient.setQueryData(["subject-categories"], categories);
      await queryClient.invalidateQueries({ queryKey: ["subject-categories"] });
      setName(""); setEditing(null); setRemoving(null);
      toast({ title: "Subject categories saved" });
    } catch (err) {
      toast({ title: "Unable to save categories", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3"><h1 className="font-display text-2xl font-bold">Subject Categories</h1><Badge variant="secondary">{subjects.length}</Badge>{isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>
      {error && <div className="flex items-center gap-3 text-destructive">Could not load categories.<Button variant="outline" onClick={() => refetch()}>Retry</Button></div>}
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void save([...subjects, name]); }}>
        <Input aria-label="New subject category" placeholder="New subject category" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
        <Button type="submit" disabled={saving || !name.trim()}><Plus />Add</Button>
      </form>
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search categories" placeholder="Search categories" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div className="divide-y divide-border border-y border-border">
        {subjects.filter((subject) => subject.toLowerCase().includes(search.toLowerCase())).map((subject) => (
          <div key={subject} className="flex items-center gap-2 py-3">
            {editing === subject ? <>
              <Input aria-label="Category name" className="min-w-0 flex-1" value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={100} />
              <Button size="icon" variant="outline" title="Save category" aria-label="Save category" disabled={saving || !editName.trim()} onClick={() => save(subjects.map((item) => item === subject ? editName : item))}><Check /></Button>
              <Button size="icon" variant="ghost" title="Cancel editing" aria-label="Cancel editing" onClick={() => setEditing(null)}><X /></Button>
            </> : <>
              <span className="min-w-0 flex-1 break-words text-sm font-medium">{subject}</span>
              <Button size="icon" variant="ghost" title={`Edit ${subject}`} aria-label={`Edit ${subject}`} disabled={saving} onClick={() => { setEditing(subject); setEditName(subject); }}><Pencil /></Button>
              <Button size="icon" variant="ghost" title={`Remove ${subject}`} aria-label={`Remove ${subject}`} disabled={saving || subjects.length === 1} onClick={() => setRemoving(subject)}><Trash2 className="text-destructive" /></Button>
            </>}
          </div>
        ))}
        {subjects.filter((subject) => subject.toLowerCase().includes(search.toLowerCase())).length === 0 && <p className="py-8 text-center text-muted-foreground">No matching categories</p>}
      </div>
      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove “{removing}” from available categories?</AlertDialogTitle></AlertDialogHeader>
          <p className="text-sm text-muted-foreground">Existing tutor profiles keep their assigned subjects.</p>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={() => save(subjects.filter((subject) => subject !== removing))}>Remove category</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}