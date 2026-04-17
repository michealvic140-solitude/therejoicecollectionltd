import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShoppingBag, Upload, Copy, CheckCircle2, Truck, Store, Banknote } from "lucide-react";
import { toast } from "sonner";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — The Rejoice Collection" },
      { name: "description", content: "Complete your purchase securely." },
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

function CheckoutPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [delivery, setDelivery] = useState({
    address: "", state: "", city: "", landmarks: "", pickup_location: "",
  });
  const [bankSettings, setBankSettings] = useState<Record<string, string>>({});
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").in("key", ["bank_name", "bank_account_number", "bank_account_name", "shipping_fee"]).then(({ data }) => {
      const m: Record<string, string> = {};
      data?.forEach((r: any) => { m[r.key] = r.value; });
      setBankSettings(m);
    });
  }, []);

  useEffect(() => {
    if (profile) {
      setDelivery({
        address: (profile as any).delivery_address || (profile as any).home_address || "",
        state: (profile as any).delivery_state || (profile as any).state || "",
        city: (profile as any).delivery_lga || (profile as any).lga || "",
        landmarks: (profile as any).delivery_landmarks || "",
        pickup_location: "",
      });
    }
  }, [profile]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please sign in to checkout.</p>
          <Link to="/login"><Button className="gradient-gold text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link to="/shop" search={{}}><Button className="gradient-gold text-primary-foreground">Browse Products</Button></Link>
        </div>
      </div>
    );
  }

  const shippingFee = deliveryMethod === "delivery" ? Math.max(0, Number(bankSettings.shipping_fee || 0)) : 0;
  const grandTotal = total + (total >= 50000 ? 0 : shippingFee);
  const freeShipping = total >= 50000 && deliveryMethod === "delivery";

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const validateStep1 = () => {
    if (deliveryMethod === "delivery") {
      if (!delivery.address || !delivery.state || !delivery.city) {
        toast.error("Please fill in all delivery details");
        return false;
      }
    } else {
      if (!delivery.pickup_location) {
        toast.error("Please select a pickup location");
        return false;
      }
    }
    return true;
  };

  const placeOrder = async () => {
    if (!proofFile && !reference.trim()) {
      toast.error("Please upload payment proof or enter a transaction reference");
      return;
    }
    setSubmitting(true);
    try {
      // Upload proof if provided
      let proofUrl: string | null = null;
      if (proofFile) {
        const path = `payments/${user.id}/${Date.now()}-${proofFile.name}`;
        const { error: upErr } = await supabase.storage.from("uploads").upload(path, proofFile);
        if (upErr) throw upErr;
        proofUrl = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
      }

      // Create order
      const orderItems = items.map(i => ({
        product_id: i.product_id,
        name: i.product?.name,
        quantity: i.quantity,
        price: i.product?.price,
        image_url: i.product?.image_url,
      }));

      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        user_id: user.id,
        user_name: profile?.full_name || user.email,
        total: grandTotal,
        status: "pending",
        items: orderItems,
        payment_method: "bank_transfer",
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === "delivery" ? delivery.address : "",
        delivery_state: deliveryMethod === "delivery" ? delivery.state : "",
        delivery_city: deliveryMethod === "delivery" ? delivery.city : "",
        pickup_location: deliveryMethod === "pickup" ? delivery.pickup_location : "",
        screenshot_url: proofUrl,
      }).select().single();
      if (orderErr) throw orderErr;

      // Create payment record
      const { error: payErr } = await supabase.from("payments").insert({
        user_id: user.id,
        order_id: order.id,
        amount: grandTotal,
        method: "bank_transfer",
        status: "pending",
        reference: reference.trim() || null,
        proof_url: proofUrl,
      });
      if (payErr) throw payErr;

      // Initial order tracking
      await supabase.from("order_tracking").insert({
        order_id: order.id,
        status: "Order Placed",
        description: "Awaiting payment verification",
      });

      // Notify user
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Order Placed",
        message: `Your order #${order.id.slice(0, 8)} for ${formatNGN(grandTotal)} is awaiting payment review.`,
        type: "order",
        link: "/orders",
      });

      await clearCart();
      toast.success("Order placed! Admin will review your payment shortly.");
      navigate({ to: "/orders" });
    } catch (e: any) {
      toast.error(e.message || "Failed to place order");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/cart" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
        </Link>
        <h1 className="font-display text-4xl font-bold text-gradient-gold mb-2">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>{s}</div>
              <span className={step >= s ? "text-foreground" : "text-muted-foreground"}>
                {s === 1 ? "Delivery" : s === 2 ? "Payment" : "Confirm"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Delivery */}
        {step === 1 && (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Delivery Method</h2>
            <RadioGroup value={deliveryMethod} onValueChange={(v: any) => setDeliveryMethod(v)} className="grid grid-cols-2 gap-4">
              <label className={`glass-card rounded-xl p-4 cursor-pointer flex items-center gap-3 border ${deliveryMethod === "delivery" ? "border-gold" : "border-transparent"}`}>
                <RadioGroupItem value="delivery" />
                <Truck className="h-5 w-5 text-gold" />
                <div><div className="font-semibold">Home Delivery</div><div className="text-xs text-muted-foreground">Nationwide</div></div>
              </label>
              <label className={`glass-card rounded-xl p-4 cursor-pointer flex items-center gap-3 border ${deliveryMethod === "pickup" ? "border-gold" : "border-transparent"}`}>
                <RadioGroupItem value="pickup" />
                <Store className="h-5 w-5 text-gold" />
                <div><div className="font-semibold">Store Pickup</div><div className="text-xs text-muted-foreground">Free</div></div>
              </label>
            </RadioGroup>

            {deliveryMethod === "delivery" ? (
              <div className="space-y-4">
                <div>
                  <Label>State *</Label>
                  <Select value={delivery.state} onValueChange={v => setDelivery({...delivery, state: v})}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{NIGERIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>LGA / City *</Label>
                  <Input value={delivery.city} onChange={e => setDelivery({...delivery, city: e.target.value})} className="bg-secondary border-border" placeholder="e.g. Ikeja" />
                </div>
                <div>
                  <Label>Full Delivery Address *</Label>
                  <Textarea value={delivery.address} onChange={e => setDelivery({...delivery, address: e.target.value})} className="bg-secondary border-border" placeholder="House number, street, area" />
                </div>
                <div>
                  <Label>Nearest Landmark</Label>
                  <Input value={delivery.landmarks} onChange={e => setDelivery({...delivery, landmarks: e.target.value})} className="bg-secondary border-border" placeholder="e.g. Beside GTBank" />
                </div>
              </div>
            ) : (
              <div>
                <Label>Pickup Location *</Label>
                <Select value={delivery.pickup_location} onValueChange={v => setDelivery({...delivery, pickup_location: v})}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select pickup point" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lagos - Lekki Showroom">Lagos — Lekki Showroom</SelectItem>
                    <SelectItem value="Abuja - Wuse Office">Abuja — Wuse Office</SelectItem>
                    <SelectItem value="Port Harcourt - GRA">Port Harcourt — GRA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button size="lg" className="w-full gradient-gold text-primary-foreground" onClick={() => { if (validateStep1()) setStep(2); }}>
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Banknote className="h-6 w-6 text-gold" /> Bank Transfer
            </h2>
            <p className="text-sm text-muted-foreground">
              Transfer <span className="text-gold font-bold">{formatNGN(grandTotal)}</span> to the account below, then upload proof of payment.
            </p>

            {bankSettings.bank_name ? (
              <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                <Row label="Bank" value={bankSettings.bank_name} onCopy={() => copy(bankSettings.bank_name)} />
                <Row label="Account Number" value={bankSettings.bank_account_number || ""} onCopy={() => copy(bankSettings.bank_account_number || "")} highlight />
                <Row label="Account Name" value={bankSettings.bank_account_name || ""} onCopy={() => copy(bankSettings.bank_account_name || "")} />
                <Row label="Amount" value={formatNGN(grandTotal)} onCopy={() => copy(String(grandTotal))} highlight />
              </div>
            ) : (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
                Bank details not configured yet. Please contact support via the chat or AI Concierge.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Transaction Reference (optional)</Label>
                <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. TRF/123456789" className="bg-secondary border-border" />
              </div>
              <div>
                <Label>Upload Payment Proof (screenshot/receipt) *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="file" accept="image/*,application/pdf" onChange={e => setProofFile(e.target.files?.[0] || null)} className="text-sm text-muted-foreground" />
                  {proofFile && <CheckCircle2 className="h-4 w-4 text-gold" />}
                </div>
                {proofFile && <p className="text-xs text-muted-foreground mt-1">{proofFile.name}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" className="flex-1 gradient-gold text-primary-foreground" onClick={() => setStep(3)}>
                Review Order
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Review & Confirm</h2>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Items</h3>
              {items.map(i => (
                <div key={i.id} className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span>{i.product?.name} × {i.quantity}</span>
                  <span className="font-semibold">{formatNGN((i.product?.price || 0) * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNGN(total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{freeShipping ? <span className="text-gold">FREE</span> : formatNGN(shippingFee)}</span></div>
              <div className="flex justify-between text-lg pt-2 border-t border-border"><span className="font-semibold">Total</span><span className="font-display text-2xl font-bold text-gold">{formatNGN(grandTotal)}</span></div>
            </div>

            <div className="text-sm space-y-1">
              <h3 className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">Delivery</h3>
              {deliveryMethod === "delivery" ? (
                <p>{delivery.address}, {delivery.city}, {delivery.state}{delivery.landmarks && ` (Landmark: ${delivery.landmarks})`}</p>
              ) : (
                <p>Pickup at {delivery.pickup_location}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>Back</Button>
              <Button size="lg" className="flex-1 gradient-gold text-primary-foreground" onClick={placeOrder} disabled={submitting}>
                {submitting ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, onCopy, highlight }: { label: string; value: string; onCopy: () => void; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono ${highlight ? "text-gold font-bold text-lg" : "text-foreground"}`}>{value || "—"}</span>
        {value && <button onClick={onCopy} className="p-1 hover:text-gold text-muted-foreground"><Copy className="h-3 w-3" /></button>}
      </div>
    </div>
  );
}
