import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, MessageCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";

const navLinks = [
  { label: "Find Tutors", href: "/tutors" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Become a Tutor", href: "/signup?intent=tutor" },
  { label: "How It Works", href: "/#how-it-works" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <Link to="/" className="font-display text-xl font-bold text-secondary">
          Tutor<span className="text-primary">Connect</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Nepali language toggle placeholder */}
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border"
            title="नेपाली (Coming Soon)"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>EN</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/messages" className="p-2 rounded-full hover:bg-muted transition-colors">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </Link>
              <NotificationBell />
              <Link
                to={
                  profile?.role === "tutor"
                    ? "/tutor/dashboard"
                    : profile?.role === "admin"
                    ? "/admin"
                    : "/student/dashboard"
                }
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                Dashboard
              </Link>
              <Button size="sm" variant="outline" onClick={signOut}>
                Log Out
              </Button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-1">
          {user && (
            <>
              <Link to="/messages" className="p-2">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </Link>
              <NotificationBell />
            </>
          )}
          <button
            className="p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to={
                  profile?.role === "tutor"
                    ? "/tutor/dashboard"
                    : profile?.role === "admin"
                    ? "/admin"
                    : "/student/dashboard"
                }
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/messages"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Messages
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  signOut();
                  setMobileOpen(false);
                }}
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
