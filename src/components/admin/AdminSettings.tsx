import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => {
      if (data) {
        const s: Record<string, string> = {};
        data.forEach((r: any) => { s[r.key] = r.value; });
        setSettings(s);
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    for (const [key, value] of Object.entries(settings)) {
      const { data: existing } = await supabase.from("settings").select("key").eq("key", key).maybeSingle();
      if (existing) {
        await supabase.from("settings").update({ value }).eq("key", key);
      } else {
        await supabase.from("settings").insert({ key, value });
      }
    }
    toast.success("Settings saved");
    setLoading(false);
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    const fileName = `branding/logo-${Date.now()}-${logoFile.name}`;
    const { error } = await supabase.storage.from("uploads").upload(fileName, logoFile);
    if (error) { toast.error("Upload failed: " + error.message); setUploadingLogo(false); return; }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
    setSettings({ ...settings, logo_url: urlData.publicUrl });
    setUploadingLogo(false);
    setLogoFile(null);
    toast.success("Logo uploaded! Click Save to apply.");
  };

  const isMaintenance = settings.maintenance_mode === "true";

  return (
    <div className="space-y-6">
      {/* Logo / Branding */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Branding</h3>
        <div className="flex items-center gap-4">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded-lg bg-secondary p-1" />
          ) : (
            <div className="h-16 w-16 rounded-lg gradient-gold flex items-center justify-center text-primary-foreground font-bold text-xl">TRC</div>
          )}
          <div className="space-y-2">
            <Label>Logo Image</Label>
            <div className="flex gap-2">
              <input type="file" accept="image/*" className="text-xs text-muted-foreground" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
              <Button size="sm" variant="outline" onClick={uploadLogo} disabled={!logoFile || uploadingLogo}>
                <Upload className="h-3 w-3 mr-1" /> {uploadingLogo ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </div>
        <div>
          <Label>Or paste logo URL</Label>
          <Input value={settings.logo_url || ""} onChange={e => setSettings({...settings, logo_url: e.target.value})} placeholder="https://..." className="bg-secondary border-border" />
        </div>
      </div>

      {/* Bank Details */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Bank Details</h3>
        <div className="space-y-3">
          <div><Label>Bank Name</Label><Input value={settings.bank || ""} onChange={e => setSettings({...settings, bank: e.target.value})} className="bg-secondary border-border" /></div>
          <div><Label>Account Name</Label><Input value={settings.account_name || ""} onChange={e => setSettings({...settings, account_name: e.target.value})} className="bg-secondary border-border" /></div>
          <div><Label>Account Number</Label><Input value={settings.account_number || ""} onChange={e => setSettings({...settings, account_number: e.target.value})} className="bg-secondary border-border" /></div>
        </div>
      </div>

      {/* Banner */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div><Label>Banner Text</Label><Input value={settings.banner || ""} onChange={e => setSettings({...settings, banner: e.target.value})} className="bg-secondary border-border" /></div>
      </div>

      {/* Contact Information */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>WhatsApp Number</Label><Input value={settings.whatsapp || ""} onChange={e => setSettings({...settings, whatsapp: e.target.value})} placeholder="+234..." className="bg-secondary border-border" /></div>
          <div><Label>Facebook URL</Label><Input value={settings.facebook || ""} onChange={e => setSettings({...settings, facebook: e.target.value})} className="bg-secondary border-border" /></div>
          <div><Label>TikTok URL</Label><Input value={settings.tiktok || ""} onChange={e => setSettings({...settings, tiktok: e.target.value})} className="bg-secondary border-border" /></div>
          <div><Label>Instagram URL</Label><Input value={settings.instagram || ""} onChange={e => setSettings({...settings, instagram: e.target.value})} className="bg-secondary border-border" /></div>
          <div><Label>Phone Number</Label><Input value={settings.contact_phone || ""} onChange={e => setSettings({...settings, contact_phone: e.target.value})} className="bg-secondary border-border" /></div>
          <div><Label>SMS Number</Label><Input value={settings.contact_sms || ""} onChange={e => setSettings({...settings, contact_sms: e.target.value})} className="bg-secondary border-border" /></div>
          <div className="md:col-span-2"><Label>Email Address</Label><Input value={settings.contact_email || ""} onChange={e => setSettings({...settings, contact_email: e.target.value})} className="bg-secondary border-border" /></div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Maintenance Mode</h3>
        <p className="text-sm text-muted-foreground">When enabled, users see a maintenance message.</p>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${isMaintenance ? "text-orange-400" : "text-muted-foreground"}`}>
            {isMaintenance ? "⚠️ Maintenance Mode is ON" : "Maintenance Mode is OFF"}
          </span>
          <Switch checked={isMaintenance} onCheckedChange={v => setSettings({...settings, maintenance_mode: v ? "true" : "false"})} />
        </div>
      </div>

      <Button className="gradient-gold text-primary-foreground w-full py-6 text-lg" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
