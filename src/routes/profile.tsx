import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Crown, MapPin, Truck } from "lucide-react";
import { useState, useEffect } from "react";
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

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    first_name: "", middle_name: "", last_name: "", full_name: "", phone: "",
    date_of_birth: "", state: "", lga: "", home_address: "",
    delivery_state: "", delivery_lga: "", delivery_landmarks: "", delivery_address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: (profile as any).first_name || "",
        middle_name: (profile as any).middle_name || "",
        last_name: (profile as any).last_name || "",
        full_name: profile.full_name || "",
        phone: (profile as any).phone || "",
        date_of_birth: (profile as any).date_of_birth || "",
        state: (profile as any).state || "",
        lga: (profile as any).lga || "",
        home_address: (profile as any).home_address || "",
        delivery_state: (profile as any).delivery_state || "",
        delivery_lga: (profile as any).delivery_lga || "",
        delivery_landmarks: (profile as any).delivery_landmarks || "",
        delivery_address: (profile as any).delivery_address || "",
      });
    }
  }, [profile]);

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

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const fullName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ");
    await supabase.from("profiles").update({
      full_name: fullName,
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      phone: form.phone,
      date_of_birth: form.date_of_birth || null,
      state: form.state,
      lga: form.lga,
      home_address: form.home_address,
      delivery_state: form.delivery_state,
      delivery_lga: form.delivery_lga,
      delivery_landmarks: form.delivery_landmarks,
      delivery_address: form.delivery_address,
    } as any).eq("user_id", user.id);
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

          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2"><User className="h-4 w-4 text-gold" /> Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">First Name</label>
                <Input value={form.first_name} onChange={e => set("first_name", e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Middle Name</label>
                <Input value={form.middle_name} onChange={e => set("middle_name", e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Last Name</label>
              <Input value={form.last_name} onChange={e => set("last_name", e.target.value)} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date of Birth</label>
              <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">State</label>
                <Select value={form.state} onValueChange={v => set("state", v)}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">LGA</label>
                <Input value={form.lga} onChange={e => set("lga", e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Home Address</label>
              <Input value={form.home_address} onChange={e => set("home_address", e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Delivery Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Delivery State</label>
                <Select value={form.delivery_state} onValueChange={v => set("delivery_state", v)}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Delivery LGA</label>
                <Input value={form.delivery_lga} onChange={e => set("delivery_lga", e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nearest Landmarks</label>
              <Input value={form.delivery_landmarks} onChange={e => set("delivery_landmarks", e.target.value)} className="bg-secondary border-border" placeholder="e.g. Near Shoprite, beside GTBank" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Delivery Address</label>
              <Input value={form.delivery_address} onChange={e => set("delivery_address", e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>

          <Button className="w-full gradient-gold text-primary-foreground" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
