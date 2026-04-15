import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Building2 } from "lucide-react";

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => {
      if (data) {
        const s: Record<string, string> = {};
        data.forEach((r: any) => { s[r.key] = r.value; });
        setSettings(s);
      }
    });
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success(`${key} updated!`);
  };

  const fields = [
    { key: "store_name", label: "Store Name" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "contact_phone", label: "Phone" },
    { key: "contact_email", label: "Email" },
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
  ];

  const bankFields = [
    { key: "bank_name", label: "Bank Name" },
    { key: "bank_account_number", label: "Account Number" },
    { key: "bank_account_name", label: "Account Name" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Settings</h2>
      
      {/* Bank Details Section */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-5 w-5 text-gold" />
          <h3 className="font-display text-lg font-semibold text-foreground">Bank Details (Payment)</h3>
        </div>
        <p className="text-sm text-muted-foreground">Users will see these bank details when making payments. The AI Concierge also shares these details with users who ask how to pay.</p>
        {bankFields.map(f => (
          <div key={f.key} className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground w-40">{f.label}</label>
            <Input
              value={settings[f.key] || ""}
              onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
              className="flex-1 bg-secondary border-border"
              placeholder={f.label}
            />
            <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={() => saveSetting(f.key, settings[f.key] || "")}>
              <Save className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* General Settings */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">General</h3>
        {fields.map(f => (
          <div key={f.key} className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground w-32">{f.label}</label>
            <Input
              value={settings[f.key] || ""}
              onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
              className="flex-1 bg-secondary border-border"
            />
            <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={() => saveSetting(f.key, settings[f.key] || "")}>
              <Save className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <label className="text-sm text-muted-foreground w-32">Maintenance Mode</label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.maintenance_mode === "true"}
              onChange={e => {
                const val = e.target.checked ? "true" : "false";
                setSettings({ ...settings, maintenance_mode: val });
                saveSetting("maintenance_mode", val);
              }}
            />
            <span className="text-sm text-foreground">Enable</span>
          </label>
        </div>
      </div>
    </div>
  );
}
