import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Paperclip,
  ArrowLeft,
  Search,
  Image,
  FileText,
  Check,
  CheckCheck,
  MessageCircle,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

type Conversation = {
  id: string;
  student_id: string;
  tutor_id: string;
  last_message_at: string;
  other_name?: string;
  other_avatar?: string | null;
  last_message?: string;
  last_message_sender_id?: string;
  unread_count?: number;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  is_read: boolean;
  created_at: string;
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialConvoId = searchParams.get("conversation");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(
    initialConvoId
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});
  const [messageLimitReached, setMessageLimitReached] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      const { data: convos } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (!convos || convos.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get tutor profile IDs (for conversations where user is student)
      const tutorProfileIds = convos
        .filter((c: any) => c.student_id === user.id)
        .map((c: any) => c.tutor_id);
      const studentUserIds = convos
        .filter((c: any) => c.student_id !== user.id)
        .map((c: any) => c.student_id);

      // Fetch tutor user_ids
      const tutorUserMap = new Map<string, string>();
      if (tutorProfileIds.length > 0) {
        const { data: tp } = await supabase
          .from("tutor_profiles")
          .select("id, user_id")
          .in("id", tutorProfileIds);
        tp?.forEach((t: any) => tutorUserMap.set(t.id, t.user_id));
      }

      // Fetch all profiles
      const allUserIds = [
        ...Array.from(tutorUserMap.values()),
        ...studentUserIds,
      ];
      const profileMap = new Map<
        string,
        { full_name: string | null; avatar_url: string | null }
      >();
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", allUserIds);
        profiles?.forEach((p: any) => profileMap.set(p.user_id, p));
      }

      // Fetch last messages
      const convoIds = convos.map((c: any) => c.id);
      const { data: recentMsgs } = await supabase
        .from("messages")
        .select("conversation_id, content, sender_id, created_at")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false })
        .limit(200);

      const lastMsgMap = new Map<string, any>();
      recentMsgs?.forEach((m: any) => {
        if (!lastMsgMap.has(m.conversation_id))
          lastMsgMap.set(m.conversation_id, m);
      });

      // Fetch unread counts
      const { data: unreadMsgs } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convoIds)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      const unreadMap = new Map<string, number>();
      unreadMsgs?.forEach((m: any) => {
        unreadMap.set(
          m.conversation_id,
          (unreadMap.get(m.conversation_id) || 0) + 1
        );
      });

      // Enrich
      const enriched: Conversation[] = convos.map((c: any) => {
        const otherUserId =
          c.student_id === user.id
            ? tutorUserMap.get(c.tutor_id) || ""
            : c.student_id;
        const otherProfile = profileMap.get(otherUserId);
        const lastMsg = lastMsgMap.get(c.id);
        return {
          ...c,
          other_name: otherProfile?.full_name || "User",
          other_avatar: otherProfile?.avatar_url,
          last_message: lastMsg?.content || "",
          last_message_sender_id: lastMsg?.sender_id,
          unread_count: unreadMap.get(c.id) || 0,
        };
      });

      setConversations(enriched);
      setLoading(false);

      if (!activeConvoId && enriched.length > 0) {
        setActiveConvoId(enriched[0].id);
      }
    };

    fetchConversations();
  }, [user]);

  // Fetch messages for active conversation + realtime
  useEffect(() => {
    if (!activeConvoId || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvoId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);

      // Mark as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", activeConvoId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvoId ? { ...c, unread_count: 0 } : c
        )
      );
    };
    fetchMessages();

    const channel = supabase
      .channel(`msgs:${activeConvoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvoId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
          if (msg.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", msg.id)
              .then();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvoId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvoId, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvoId || !user || sending) return;
    if (newMessage.length > 2000) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConvoId,
      sender_id: user.id,
      content,
    });

    if (!error) {
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConvoId);

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeConvoId
            ? {
                ...c,
                last_message: content,
                last_message_at: new Date().toISOString(),
                last_message_sender_id: user.id,
              }
            : c
        );
        return updated.sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() -
            new Date(a.last_message_at).getTime()
        );
      });
    }
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvoId || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(path, file);
    if (uploadError) return;

    const {
      data: { publicUrl },
    } = supabase.storage.from("message-attachments").getPublicUrl(path);

    await supabase.from("messages").insert({
      conversation_id: activeConvoId,
      sender_id: user.id,
      content: file.name,
      file_url: publicUrl,
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeConvoId);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fmtMsgTime = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const fmtConvoTime = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const filtered = conversations.filter(
    (c) =>
      !searchQuery ||
      c.other_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const showChat = !!activeConvoId;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="h-[calc(100vh-4rem)] pt-16 flex">
        {/* Conversations sidebar */}
        <div
          className={`${
            showChat ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 border-r border-border shrink-0`}
        >
          <div className="p-4 border-b border-border space-y-3">
            <h2 className="font-display text-lg font-bold text-foreground">
              Messages
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No conversations yet.
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Visit a tutor profile to start chatting.
                </p>
              </div>
            ) : (
              filtered.map((convo) => {
                const isActive = convo.id === activeConvoId;
                const initials = (convo.other_name || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const preview = convo.last_message
                  ? convo.last_message_sender_id === user.id
                    ? `You: ${convo.last_message}`
                    : convo.last_message
                  : "Start a conversation";
                return (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConvoId(convo.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                      isActive ? "bg-accent" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={convo.other_avatar || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate text-foreground">
                          {convo.other_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {fmtConvoTime(convo.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs truncate ${
                            convo.unread_count
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {preview.length > 40
                            ? preview.slice(0, 40) + "…"
                            : preview}
                        </p>
                        {(convo.unread_count || 0) > 0 && (
                          <Badge className="h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] px-1.5 bg-primary text-primary-foreground">
                            {convo.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat thread */}
        <div
          className={`${
            showChat ? "flex" : "hidden md:flex"
          } flex-1 flex-col min-w-0`}
        >
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
                <button
                  className="md:hidden p-1 rounded hover:bg-muted"
                  onClick={() => setActiveConvoId(null)}
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activeConvo.other_avatar || undefined} />
                  <AvatarFallback className="bg-muted text-xs font-medium">
                    {(activeConvo.other_name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm text-foreground">
                  {activeConvo.other_name}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-sm">
                      No messages yet. Say hi! 👋
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user.id;
                  const isLastMine =
                    isMine &&
                    (i === messages.length - 1 ||
                      messages[i + 1]?.sender_id !== user.id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="max-w-[75%] group">
                        {msg.file_url ? (
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <a
                              href={msg.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 underline"
                            >
                              {msg.file_url.match(
                                /\.(jpg|jpeg|png|gif|webp)/i
                              ) ? (
                                <Image className="h-4 w-4 shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 shrink-0" />
                              )}
                              <span className="text-sm truncate">
                                {msg.content}
                              </span>
                            </a>
                          </div>
                        ) : (
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                        )}
                        <div
                          className={`flex items-center gap-1 mt-0.5 ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {fmtMsgTime(msg.created_at)}
                          </span>
                          {isLastMine &&
                            (msg.is_read ? (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            ) : (
                              <Check className="h-3 w-3 text-muted-foreground" />
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border shrink-0">
                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 mb-0.5"
                  >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) =>
                        setNewMessage(e.target.value.slice(0, 2000))
                      }
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
                      style={{ minHeight: "40px" }}
                    />
                    {newMessage.length > 1900 && (
                      <span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
                        {newMessage.length}/2000
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    className="rounded-xl h-10 w-10 shrink-0 mb-0.5"
                    disabled={!newMessage.trim() || sending}
                    onClick={sendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <MessageCircle className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-lg text-muted-foreground">
                Select a conversation
              </p>
              <p className="text-sm text-muted-foreground/70">
                Choose from the sidebar or message a tutor from their profile
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
