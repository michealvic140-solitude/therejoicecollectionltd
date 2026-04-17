import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { formatNGN } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Cart — The Rejoice Collection" },
      { name: "description", content: "Review your cart items." },
    ],
  }),
});

function CartPage() {
  const { items, removeFromCart, updateQuantity, total, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please sign in to view your cart.</p>
          <Link to="/login"><Button className="gradient-gold text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/shop" search={{}} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping
        </Link>
        <h1 className="font-display text-4xl font-bold text-gradient-gold mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/shop" search={{}}><Button className="mt-4 gradient-gold text-primary-foreground">Browse Products</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{item.product?.name}</h3>
                  <p className="text-gold font-bold">{formatNGN(item.product?.price || 0)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="p-1 rounded hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="p-1 rounded hover:bg-secondary"><Plus className="h-4 w-4" /></button>
                </div>
                <p className="font-bold text-foreground w-24 text-right">{formatNGN((item.product?.price || 0) * item.quantity)}</p>
                <button onClick={() => removeFromCart(item.product_id)} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="glass-card rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                <span className="font-display text-2xl font-bold text-gold">{formatNGN(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Free shipping on orders above ₦50,000. Bank transfer with proof of payment.</p>
              <Button size="lg" className="w-full gradient-gold text-primary-foreground font-semibold text-lg" onClick={() => navigate({ to: "/checkout" })}>
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
