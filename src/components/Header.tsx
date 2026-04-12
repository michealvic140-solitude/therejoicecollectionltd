import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { ShoppingBag, User, Menu, X, Crown, LogOut, Shield, MessageCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, isAdmin, signOut, profile } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/" as const, label: "Home" },
    { to: "/shop" as const, label: "Shop" },
    { to: "/vault" as const, label: "Vault" },
    { to: "/chat" as const, label: "Chat" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-gold" />
            <span className="font-display text-xl font-bold text-gradient-gold">TRC</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive(link.to)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <Link to="/cart" className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                <ShoppingBag className="h-5 w-5 text-foreground" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full gradient-gold text-xs font-bold flex items-center justify-center text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link to="/admin" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Shield className="h-5 w-5 text-gold" />
                  </Link>
                )}
                <Link to="/profile" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <User className="h-5 w-5 text-foreground" />
                </Link>
                <Link to="/orders" className="p-2 rounded-lg hover:bg-secondary text-sm text-muted-foreground transition-colors hidden sm:block">
                  Orders
                </Link>
                <button onClick={signOut} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="gradient-gold text-primary-foreground font-semibold">
                  Sign In
                </Button>
              </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-secondary">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden py-4 border-t border-border space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
