import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Mail, Lock, User, Phone, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Register — The Rejoice Collection" },
      { name: "description", content: "Create your account." },
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

function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "", middleName: "", lastName: "",
    email: "", phone: "", password: "", confirmPassword: "",
    dob: "", state: "", lga: "", homeAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!form.firstName || !form.lastName) {
      toast.error("First name and last name are required");
      return;
    }
    setLoading(true);
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
    const { error } = await signUp(form.email, form.password, fullName, {
      first_name: form.firstName,
      middle_name: form.middleName,
      last_name: form.lastName,
      phone: form.phone,
      date_of_birth: form.dob,
      state: form.state,
      lga: form.lga,
      home_address: form.homeAddress,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to verify.");
      navigate({ to: "/login" });
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(String(result.error));
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Crown className="h-10 w-10 text-gold mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join The Rejoice Collection</p>
        </div>
        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">First Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.firstName} onChange={e => set("firstName", e.target.value)} className="pl-10 bg-secondary border-border" required />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Middle Name</label>
                <Input value={form.middleName} onChange={e => set("middleName", e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Last Name *</label>
              <Input value={form.lastName} onChange={e => set("lastName", e.target.value)} className="bg-secondary border-border" required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="pl-10 bg-secondary border-border" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className="pl-10 bg-secondary border-border" required placeholder="+234..." />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} className="pl-10 bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">State</label>
                <Select value={form.state} onValueChange={v => set("state", v)}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select State" /></SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">LGA</label>
                <Input value={form.lga} onChange={e => set("lga", e.target.value)} className="bg-secondary border-border" placeholder="Local Government" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Home Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.homeAddress} onChange={e => set("homeAddress", e.target.value)} className="pl-10 bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={form.password} onChange={e => set("password", e.target.value)} className="pl-10 bg-secondary border-border" required minLength={6} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} className="pl-10 bg-secondary border-border" required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
            </div>
            <Button variant="outline" className="w-full mt-4 border-border hover:bg-secondary" onClick={handleGoogleSignIn}>
              Sign up with Google
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-gold hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
