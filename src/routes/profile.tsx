import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Crown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — The Rejoice Collection" },
      { name: "description", content: "Manage your account." },
    ],
  }),
});

function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please sign in.</p>
          <Link to="/login" className="text-gold hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    await refreshProfile();
    toast.success("Profile updated!");
    setSaving(false);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-4xl font-bold text-gradient-gold mb-8">Profile</h1>
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full gradient-gold flex items-center justify-center">
              <Crown className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-foreground">{profile?.full_name || "Member"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-secondary border-border" />
            </div>
            <Button className="w-full gradient-gold text-primary-foreground" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
