import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import { ShoppingBag, User, Menu, X, Crown, LogOut, Shield, Bell, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!user) return;
    // Check for unread admin replies
    supabase.from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("sender", "admin")
      .is("replied_at", null)
      .then(({ count }) => setUnreadCount(count || 0));

    const channel = supabase
      .channel('header-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` }, () => {
        supabase.from("messages")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("sender", "admin")
          .is("replied_at", null)
          .then(({ count }) => setUnreadCount(count || 0));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-gold" />
            <span className="font-display text-xl font-bold text-gradient-gold">TRC</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: "/", label: "Home" },
              { to: "/shop", label: "Shop", search: {} },
              { to: "/vault", label: "Vault" },
              { to: "/support", label: "Support" },
            ].map(item => (
              <Link key={item.to} to={item.to as any} search={(item as any).search} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(item.to) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {user && (
              <>
                <Link to="/cart" className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                  <ShoppingBag className="h-5 w-5 text-foreground" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full gradient-gold text-xs font-bold flex items-center justify-center text-primary-foreground">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link to="/chat" className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                  <Bell className="h-5 w-5 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs font-bold flex items-center justify-center text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            {user ? (
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <Link to="/admin" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Shield className="h-5 w-5 text-gold" />
                  </Link>
                )}
                <Link to="/dashboard" className="p-2 rounded-lg hover:bg-secondary transition-colors hidden sm:block">
                  <LayoutDashboard className="h-5 w-5 text-foreground" />
                </Link>
                <Link to="/profile" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <User className="h-5 w-5 text-foreground" />
                </Link>
                <button onClick={signOut} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="gradient-gold text-primary-foreground font-semibold">Sign In</Button>
              </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-secondary">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden py-4 border-t border-border space-y-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActive("/") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>Home</Link>
            <Link to="/shop" search={{}} onClick={() => setMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActive("/shop") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>Shop</Link>
            <Link to="/vault" onClick={() => setMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActive("/vault") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>Vault</Link>
            <Link to="/support" onClick={() => setMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActive("/support") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>Support</Link>
            {user && (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActive("/dashboard") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>Dashboard</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActive("/orders") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>Orders</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
