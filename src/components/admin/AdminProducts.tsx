import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Eye, EyeOff } from "lucide-react";

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", image_url: "", category: "watches", visible: true, vault: false, stock: "0", original_price: "" });

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const addProduct = async () => {
    const { error } = await supabase.from("products").insert({
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      image_url: form.image_url || null,
      category: form.category,
      visible: form.visible,
      vault: form.vault,
      stock: parseInt(form.stock),
    });
    if (error) toast.error(error.message);
    else { toast.success("Product added!"); setShowForm(false); setForm({ name: "", description: "", price: "", image_url: "", category: "watches", visible: true, vault: false, stock: "0", original_price: "" }); fetchProducts(); }
  };

  const toggleVisibility = async (id: string, visible: boolean) => {
    await supabase.from("products").update({ visible: !visible }).eq("id", id);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product deleted");
    fetchProducts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Products ({products.length})</h2>
        <Button className="gradient-gold text-primary-foreground" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-secondary border-border" />
            <Input placeholder="Price" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="bg-secondary border-border" />
            <Input placeholder="Original Price" type="number" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} className="bg-secondary border-border" />
            <Input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="bg-secondary border-border" />
            <Input placeholder="Image URL" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="bg-secondary border-border" />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground">
              {["watches", "bags", "jewelry", "accessories", "footwear", "clothes", "others"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-secondary border-border" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.vault} onChange={e => setForm({...form, vault: e.target.checked})} /> Vault Item
            </label>
          </div>
          <Button className="gradient-gold text-primary-foreground" onClick={addProduct}>Save Product</Button>
        </div>
      )}

      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {p.image_url && <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
              <div>
                <p className="font-semibold text-foreground">{p.name}</p>
                <p className="text-sm text-muted-foreground">₦{p.price} · {p.category}{p.vault ? " · 🔒 Vault" : ""}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleVisibility(p.id, p.visible)} className="p-2 rounded hover:bg-secondary">
                {p.visible ? <Eye className="h-4 w-4 text-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </button>
              <button onClick={() => deleteProduct(p.id)} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
