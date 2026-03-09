import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";

type Props = { invokeAdmin: (action: string, params?: any) => Promise<any> };

const AdminStudentsTab = ({ invokeAdmin }: Props) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await invokeAdmin("list_students");
        setStudents(data || []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = students.filter((s) => {
    if (search && !s.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">Students</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No students found</CardContent></Card>
        ) : (
          filtered.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelected(s)}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={s.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold">{(s.full_name || "S")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{s.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.grade_level?.replace("_", " ") || "N/A"} · {s.email || "No email"} · Joined {format(new Date(s.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                {s.subjects?.length > 0 && (
                  <div className="hidden sm:flex flex-wrap gap-1">
                    {s.subjects.slice(0, 3).map((sub: string) => <Badge key={sub} variant="secondary" className="text-xs">{sub}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selected.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground font-bold">{(selected.full_name || "S")[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selected.full_name}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selected.email}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selected.phone || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Grade:</span> <span className="text-foreground capitalize">{selected.grade_level?.replace("_", " ") || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{format(new Date(selected.created_at), "MMM d, yyyy")}</span></div>
                </div>
                {selected.subjects?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Subjects:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selected.subjects.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {selected.learning_goals && (
                  <div>
                    <span className="text-muted-foreground">Goals:</span>
                    <p className="text-foreground mt-1">{selected.learning_goals}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudentsTab;
