import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, CheckCircle, XCircle, Pause, Play, Star } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type Props = { invokeAdmin: (action: string, params?: any) => Promise<any> };

const AdminTutorsTab = ({ invokeAdmin }: Props) => {
  const { toast } = useToast();
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; tutor: any } | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [checklist, setChecklist] = useState({ id: false, profile: false, payment: false, flags: false });

  useEffect(() => { fetchTutors(); }, []);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const data = await invokeAdmin("list_tutors");
      setTutors(data || []);
    } catch (err) {
      toast({ title: "Unable to load tutors", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const updateStatus = async (tutorId: string, status: string, reason?: string) => {
    setProcessing(true);
    try {
      await invokeAdmin("update_tutor_status", { tutor_id: tutorId, status, reason });
      toast({ title: `Tutor ${status}` });
      setActionDialog(null);
      setSelectedTutor(null);
      setReason("");
      fetchTutors();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const filtered = tutors.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.full_name?.toLowerCase().includes(search.toLowerCase()) &&
        !t.subjects?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge className="bg-primary/10 text-primary border-0">Approved</Badge>;
    if (s === "pending_approval") return <Badge variant="secondary">Pending</Badge>;
    if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    if (s === "suspended") return <Badge variant="outline" className="text-destructive border-destructive">Suspended</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">Tutors</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tutors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending_approval">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No tutors found</CardContent></Card>
        ) : (
          filtered.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => { setChecklist({ id: false, profile: false, payment: false, flags: false }); setSelectedTutor(t); }}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={t.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold">
                    {(t.full_name || "T")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{t.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.subjects?.join(", ") || "No subjects"} · {t.email || "No email"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {t.rating?.toFixed(1) || "N/A"}
                    </div>
                    <div>{format(new Date(t.created_at), "MMM d, yyyy")}</div>
                  </div>
                  {statusBadge(t.status)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Tutor detail drawer */}
      <Dialog open={!!selectedTutor} onOpenChange={() => setSelectedTutor(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedTutor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedTutor.avatar_url || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground font-bold">{(selectedTutor.full_name || "T")[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedTutor.full_name}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selectedTutor.email}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Status:</span> {statusBadge(selectedTutor.status)}</div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedTutor.phone || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Rate:</span> <span className="text-foreground">रू {selectedTutor.hourly_rate || "N/A"}/hr</span></div>
                  <div><span className="text-muted-foreground">Rating:</span> <span className="text-foreground">{selectedTutor.rating?.toFixed(1) || "N/A"} ({selectedTutor.review_count || 0} reviews)</span></div>
                  <div><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{format(new Date(selectedTutor.created_at), "MMM d, yyyy")}</span></div>
                  <div><span className="text-muted-foreground">Session Type:</span> <span className="text-foreground capitalize">{selectedTutor.session_type || "N/A"}</span></div>
                </div>

                {selectedTutor.subjects?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Subjects:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTutor.subjects.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                )}

                {selectedTutor.bio && (
                  <div>
                    <span className="text-muted-foreground">Bio:</span>
                    <p className="text-foreground mt-1">{selectedTutor.bio}</p>
                  </div>
                )}

                {selectedTutor.education_university && (
                  <div>
                    <span className="text-muted-foreground">Education:</span>
                    <p className="text-foreground">{selectedTutor.education_degree} - {selectedTutor.education_university}</p>
                  </div>
                )}

                {/* Approval checklist */}
                {selectedTutor.status === "pending_approval" && (
                  <Card className="border-primary/30">
                    <CardContent className="p-4 space-y-2">
                      <p className="font-semibold text-foreground text-sm">Approval Checklist</p>
                      {[
                        { key: "id", label: "ID/Citizenship verified" },
                        { key: "profile", label: "Profile complete (photo, bio, subjects)" },
                        { key: "payment", label: "eSewa/Khalti number provided" },
                        { key: "flags", label: "No red flags in application" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-2">
                          <Checkbox
                            checked={checklist[item.key as keyof typeof checklist]}
                            onCheckedChange={(v) => setChecklist((p) => ({ ...p, [item.key]: !!v }))}
                          />
                          <span className="text-sm text-foreground">{item.label}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="flex-wrap gap-2">
                {selectedTutor.status === "pending_approval" && (
                  <>
                    <Button
                      onClick={() => updateStatus(selectedTutor.id, "approved")}
                      disabled={processing || !Object.values(checklist).every(Boolean)}
                      className="gap-1"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1"
                      onClick={() => setActionDialog({ type: "rejected", tutor: selectedTutor })}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {selectedTutor.status === "approved" && (
                  <Button
                    variant="destructive"
                    className="gap-1"
                    onClick={() => setActionDialog({ type: "suspended", tutor: selectedTutor })}
                  >
                    <Pause className="h-4 w-4" /> Suspend
                  </Button>
                )}
                {(selectedTutor.status === "suspended" || selectedTutor.status === "rejected") && (
                  <Button
                    className="gap-1"
                    onClick={() => updateStatus(selectedTutor.id, "pending_approval")}
                    disabled={processing}
                  >
                    <Play className="h-4 w-4" /> Return to review
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reason dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "rejected" ? "Reject Tutor" : "Suspend Tutor"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Provide a reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => actionDialog && updateStatus(actionDialog.tutor.id, actionDialog.type, reason)}
              disabled={processing || !reason.trim()}
            >
              {processing ? "Processing…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTutorsTab;
