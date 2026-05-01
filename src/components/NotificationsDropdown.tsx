import { useEffect, useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Notif {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setItems(data as Notif[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchAll();
    const ch = supabase
      .channel("notif-dropdown")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        fetchAll,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((i) => !i.read).length;

  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };
  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  if (!user) return null;

  const typeColor = (t: string) =>
    t === "success"
      ? "border-l-green-500"
      : t === "error"
      ? "border-l-red-500"
      : t === "warning"
      ? "border-l-yellow-500"
      : "border-l-gold";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] glass-strong rounded-xl border border-border shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="font-display text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs text-gold hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            )}
            {items.map((n) => {
              const inner = (
                <div
                  className={`p-3 border-l-4 ${typeColor(n.type)} ${
                    n.read ? "bg-transparent" : "bg-secondary/40"
                  } hover:bg-secondary transition-colors cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                      {n.title || "Notification"}
                    </p>
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markOne(n.id);
                        }}
                        className="text-muted-foreground hover:text-gold"
                        aria-label="Mark read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              );
              return n.link ? (
                <Link
                  key={n.id}
                  to={n.link as any}
                  onClick={() => {
                    if (!n.read) markOne(n.id);
                    setOpen(false);
                  }}
                  className="block"
                >
                  {inner}
                </Link>
              ) : (
                <div key={n.id} onClick={() => !n.read && markOne(n.id)}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
